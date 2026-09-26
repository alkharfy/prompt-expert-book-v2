-- ============================================
-- 2026-06-16 — Align ALL price sources to the real ladder 99 / 199 / 399
-- ============================================
-- Decision: pricing is admin-controlled, so the `plans` table is the single
-- source of truth. create-session and /api/promo/validate both read price from
-- it. This migration makes the live DB match the intended prices and fixes the
-- AI56 "5 EGP" promo so it actually charges 5 (it was charging ~1).
--
-- DEPLOY ORDER (important): run this migration in Supabase BEFORE deploying the
-- code change that makes create-session read price from `plans`. Until the rows
-- below are applied, the table still holds the old 299/499/999 values.
-- Run in: https://supabase.com/dashboard/project/_/sql
-- ============================================

-- 1) Real plan prices (admin can change these later from the dashboard)
UPDATE plans SET price = 99,  updated_at = NOW() WHERE id = 'basic';
UPDATE plans SET price = 199, updated_at = NOW() WHERE id = 'pro';
UPDATE plans SET price = 399, updated_at = NOW() WHERE id = 'vip';

-- 2) Fix the landing pricing_plans blob if a site_settings row exists (it uses
--    ON CONFLICT DO NOTHING elsewhere, so it never self-corrects). jsonb_set per
--    plan index; guarded so it is a no-op when the row/array is absent.
UPDATE site_settings
SET value = jsonb_set(
              jsonb_set(
                jsonb_set(value, '{0,price}', '99'::jsonb, false),
                '{1,price}', '199'::jsonb, false),
              '{2,price}', '399'::jsonb, false),
    updated_at = NOW()
WHERE key = 'pricing_plans'
  AND jsonb_typeof(value) = 'array'
  AND jsonb_array_length(value) >= 3;

-- 3) Allow a new "fixed_final" discount type (target final price, computed
--    dynamically against whatever the current plan price is).
ALTER TABLE promo_codes DROP CONSTRAINT IF EXISTS promo_codes_discount_type_check;
ALTER TABLE promo_codes ADD CONSTRAINT promo_codes_discount_type_check
    CHECK (discount_type IN ('percentage', 'fixed', 'fixed_final'));

-- 4) AI56 = the "full book for 5 EGP" ad offer. Make it a fixed_final=5 so it
--    always lands at exactly 5 EGP for basic, regardless of the admin price.
UPDATE promo_codes
SET discount_type = 'fixed_final',
    discount_value = 5,
    max_discount = NULL,
    allowed_plans = ARRAY['basic'],
    is_active = true
WHERE code = 'AI56';

-- Verify (run manually):
--   SELECT id, price FROM plans WHERE id IN ('basic','pro','vip');      -- 99/199/399
--   SELECT code, discount_type, discount_value FROM promo_codes WHERE code='AI56'; -- fixed_final / 5
