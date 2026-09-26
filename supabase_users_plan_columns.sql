-- ============================================
-- إضافة أعمدة الباقة إلى جدول المستخدمين
-- (Add plan columns to users table)
-- Stage 1 — Subscription Migration
-- ============================================
-- IDEMPOTENCY: Uses DO $$ block with IF NOT EXISTS column check.
-- Safe to re-run multiple times — skips if columns already exist.
-- ============================================

-- إضافة عمود current_plan
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public'
          AND table_name   = 'users'
          AND column_name  = 'current_plan'
    ) THEN
        ALTER TABLE users
            ADD COLUMN current_plan TEXT DEFAULT NULL
            CHECK (current_plan IS NULL OR current_plan IN ('basic', 'pro', 'vip'));

        RAISE NOTICE 'Column current_plan added to users table.';
    ELSE
        RAISE NOTICE 'Column current_plan already exists — skipping.';
    END IF;
END;
$$;

-- إضافة عمود plan_expires_at
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public'
          AND table_name   = 'users'
          AND column_name  = 'plan_expires_at'
    ) THEN
        ALTER TABLE users
            ADD COLUMN plan_expires_at TIMESTAMPTZ DEFAULT NULL;

        RAISE NOTICE 'Column plan_expires_at added to users table.';
    ELSE
        RAISE NOTICE 'Column plan_expires_at already exists — skipping.';
    END IF;
END;
$$;

-- ============================================
-- فهرس للبحث السريع بالباقة الحالية
-- ============================================
CREATE INDEX IF NOT EXISTS idx_users_current_plan
    ON users(current_plan)
    WHERE current_plan IS NOT NULL;
