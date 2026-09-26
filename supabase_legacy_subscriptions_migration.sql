-- ============================================
-- هجرة الاشتراكات القديمة (Legacy Subscriptions Migration)
-- Stage 1 — Subscription Migration
-- ============================================
--
-- PURPOSE:
--   For each user with a successful payment but NO active subscription,
--   create a subscription row and update users.current_plan / plan_expires_at.
--
-- PREREQUISITES (must be run BEFORE this script):
--   1. supabase_subscriptions.sql      — subscriptions table exists
--   2. supabase_plan_features.sql      — plan_features table exists
--   3. supabase_users_plan_columns.sql — users.current_plan & plan_expires_at exist
--   4. supabase_subscription_functions.sql — helper functions exist
--
-- IDEMPOTENCY:
--   - Uses NOT EXISTS checks to skip users who already have an active subscription.
--   - Uses NOT EXISTS on payment_id to avoid duplicate subscription rows.
--   - Safe to re-run multiple times — will only process unprocessed payments.
--
-- FALLBACK LOGIC:
--   - plan_id from payments.plan_id (should be 'basic', 'pro', or 'vip')
--   - If payments.plan_id is NULL or empty → defaults to 'basic' (safest fallback)
--   - expires_at = paid_at + 365 days (if paid_at exists), else created_at + 365 days, else NOW() + 365 days
--
-- ⚠️ WARNING: Review the output of the DRY-RUN query below before executing.
-- ============================================

-- ============================================
-- DRY-RUN: Preview what will be migrated (SELECT only — no changes)
-- Uncomment this block to preview before running the migration.
-- ============================================
/*
SELECT
    p.user_id,
    p.id AS payment_id,
    p.plan_id AS raw_plan_id,
    CASE
        WHEN p.plan_id IN ('basic', 'pro', 'vip') THEN p.plan_id
        ELSE 'basic'
    END AS resolved_plan_id,
    p.paid_at,
    p.created_at AS payment_created_at,
    COALESCE(p.paid_at, p.created_at, NOW()) + INTERVAL '365 days' AS computed_expires_at,
    CASE
        WHEN EXISTS (
            SELECT 1 FROM subscriptions sub
            WHERE sub.user_id = p.user_id AND sub.status = 'active'
        ) THEN 'SKIP — already has active subscription'
        WHEN EXISTS (
            SELECT 1 FROM subscriptions sub
            WHERE sub.payment_id = p.id
        ) THEN 'SKIP — payment already linked to subscription'
        ELSE 'WILL MIGRATE'
    END AS action
FROM payments p
WHERE p.status = 'success'
ORDER BY p.paid_at DESC NULLS LAST;
*/

-- ============================================
-- STEP 1: Insert subscription rows for unprocessed successful payments
-- ============================================

INSERT INTO subscriptions (
    user_id,
    plan_id,
    payment_id,
    status,
    starts_at,
    expires_at,
    created_at,
    updated_at
)
SELECT
    p.user_id,
    -- Resolve plan_id: use payment's plan_id if valid, otherwise fallback to 'basic'
    CASE
        WHEN p.plan_id IN ('basic', 'pro', 'vip') THEN p.plan_id
        ELSE 'basic'
    END AS plan_id,
    p.id AS payment_id,
    'active' AS status,
    COALESCE(p.paid_at, p.created_at, NOW()) AS starts_at,
    COALESCE(p.paid_at, p.created_at, NOW()) + INTERVAL '365 days' AS expires_at,
    NOW() AS created_at,
    NOW() AS updated_at
FROM payments p
WHERE p.status = 'success'
  -- Skip: user already has an active subscription
  AND NOT EXISTS (
      SELECT 1 FROM subscriptions sub
      WHERE sub.user_id = p.user_id
        AND sub.status = 'active'
  )
  -- Skip: this payment is already linked to a subscription
  AND NOT EXISTS (
      SELECT 1 FROM subscriptions sub
      WHERE sub.payment_id = p.id
  );

-- ============================================
-- STEP 2: Update users.current_plan and plan_expires_at
-- Only for users who now have an active subscription but stale user columns.
-- ============================================

UPDATE users u
SET
    current_plan    = sub.plan_id,
    plan_expires_at = sub.expires_at
FROM subscriptions sub
WHERE sub.user_id    = u.id
  AND sub.status     = 'active'
  AND sub.expires_at > NOW()
  AND (
      u.current_plan IS DISTINCT FROM sub.plan_id
      OR u.plan_expires_at IS DISTINCT FROM sub.expires_at
  );

-- ============================================
-- STEP 3: Report results
-- ============================================

-- عرض ملخص الهجرة (Migration Summary)
DO $$
DECLARE
    v_total_subs  INTEGER;
    v_active_subs INTEGER;
    v_users_with_plan INTEGER;
BEGIN
    SELECT COUNT(*) INTO v_total_subs FROM subscriptions;
    SELECT COUNT(*) INTO v_active_subs FROM subscriptions WHERE status = 'active' AND expires_at > NOW();
    SELECT COUNT(*) INTO v_users_with_plan FROM users WHERE current_plan IS NOT NULL;

    RAISE NOTICE '══════════════════════════════════════════';
    RAISE NOTICE '  Legacy Migration Summary';
    RAISE NOTICE '══════════════════════════════════════════';
    RAISE NOTICE '  Total subscriptions:       %', v_total_subs;
    RAISE NOTICE '  Active subscriptions:      %', v_active_subs;
    RAISE NOTICE '  Users with current_plan:   %', v_users_with_plan;
    RAISE NOTICE '══════════════════════════════════════════';
END;
$$;
