-- ============================================
-- 20261022_live_enrollments.sql dropped every CHECK on payments.plan_id so 'live' could be
-- stored, which left the column open to any value. Put the check back with the real list:
-- the four subscription plans (src/types/subscription.ts PLAN_DURATION_DAYS) + 'live'.
-- Existing rows on 2026-10-23: pro / basic / vip only, so validation passes. Safe to re-run.
-- ============================================

BEGIN;

ALTER TABLE public.payments DROP CONSTRAINT IF EXISTS payments_plan_id_check;
ALTER TABLE public.payments
  ADD CONSTRAINT payments_plan_id_check
  CHECK (plan_id IN ('monthly', 'basic', 'pro', 'vip', 'live'));

COMMIT;
