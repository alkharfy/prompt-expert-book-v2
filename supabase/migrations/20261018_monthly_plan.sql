-- ============================================
-- Monthly plan: 100 EGP for 30 days (owner decision 2026-10-18)
-- Same content as basic (levels, exercises, templates, grader); no live lectures, no certificate.
--
-- ⚠️ ORDER MATTERS: run this only AFTER the code that knows 'monthly' is live on Vercel.
-- The old code rejects any plan row it doesn't know, so the price list would break.
--
-- Safe to re-run.
-- ============================================

BEGIN;

-- 1) Let the plan columns accept 'monthly' (drop the old CHECKs whatever their names are)
DO $$
DECLARE r record;
BEGIN
  FOR r IN
    SELECT con.conname, rel.relname
    FROM pg_constraint con
    JOIN pg_class rel ON rel.oid = con.conrelid
    JOIN pg_namespace nsp ON nsp.oid = rel.relnamespace
    WHERE nsp.nspname = 'public'
      AND con.contype = 'c'
      AND rel.relname IN ('subscriptions', 'plan_features', 'users')
      AND pg_get_constraintdef(con.oid) ILIKE '%''basic''%'
      AND (pg_get_constraintdef(con.oid) ILIKE '%plan_id%' OR pg_get_constraintdef(con.oid) ILIKE '%current_plan%')
  LOOP
    EXECUTE format('ALTER TABLE public.%I DROP CONSTRAINT %I', r.relname, r.conname);
  END LOOP;
END $$;

ALTER TABLE public.subscriptions
  ADD CONSTRAINT subscriptions_plan_id_check CHECK (plan_id IN ('monthly', 'basic', 'pro', 'vip'));
ALTER TABLE public.plan_features
  ADD CONSTRAINT plan_features_plan_id_check CHECK (plan_id IN ('monthly', 'basic', 'pro', 'vip'));
ALTER TABLE public.users
  ADD CONSTRAINT users_current_plan_check CHECK (current_plan IS NULL OR current_plan IN ('monthly', 'basic', 'pro', 'vip'));

-- 2) Its features (must match PLAN_FEATURES.monthly in src/lib/features.ts)
INSERT INTO public.plan_features (plan_id, feature_key, is_enabled) VALUES
  ('monthly', 'reading', true),
  ('monthly', 'bookmarks', true),
  ('monthly', 'library', true),
  ('monthly', 'progress_tracking', true),
  ('monthly', 'exercises', true)
ON CONFLICT (plan_id, feature_key) DO UPDATE SET is_enabled = EXCLUDED.is_enabled;

-- 3) The price row the site reads (card text comes from the code)
INSERT INTO public.plans (id, name, name_ar, price, features, features_ar, is_active, display_order)
VALUES ('monthly', 'Monthly', 'الشهري', 100, '[]'::jsonb, '[]'::jsonb, true, 0)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  name_ar = EXCLUDED.name_ar,
  price = EXCLUDED.price,
  is_active = true,
  display_order = 0,
  updated_at = NOW();

COMMIT;

-- Check:
--   SELECT id, price, is_active, display_order FROM plans ORDER BY display_order;   -- monthly 100 first
--   SELECT feature_key FROM plan_features WHERE plan_id = 'monthly';                 -- 5 rows
