-- ============================================
-- جدول ميزات الباقات (Plan Features Table)
-- يحدد الميزات المتاحة لكل باقة
-- Stage 1 — Subscription Migration
-- ============================================
-- IDEMPOTENCY: Uses IF NOT EXISTS for DDL.
-- Seed uses ON CONFLICT DO NOTHING — safe to re-run.
-- ============================================

-- 1) إنشاء الجدول
CREATE TABLE IF NOT EXISTS plan_features (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,

    -- الباقة
    plan_id TEXT NOT NULL CHECK (plan_id IN ('basic', 'pro', 'vip')),

    -- مفتاح الميزة
    feature_key TEXT NOT NULL,

    -- هل الميزة مفعّلة
    is_enabled BOOLEAN DEFAULT true,

    -- كل باقة + ميزة فريدة
    UNIQUE (plan_id, feature_key)
);

-- ============================================
-- 2) سياسات أمان RLS
-- ============================================

ALTER TABLE plan_features ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anyone_read_plan_features" ON plan_features;
CREATE POLICY "anyone_read_plan_features"
    ON plan_features FOR SELECT
    USING (true);

DROP POLICY IF EXISTS "service_manage_plan_features" ON plan_features;
CREATE POLICY "service_manage_plan_features"
    ON plan_features FOR ALL
    USING (true);

-- ============================================
-- 3) منح الصلاحيات
-- ============================================
GRANT SELECT ON plan_features TO authenticated;
GRANT SELECT ON plan_features TO anon;
GRANT ALL ON plan_features TO service_role;

-- ============================================
-- 4) بذر البيانات (Seed) — Idempotent via ON CONFLICT DO NOTHING
-- ============================================

-- ─── Basic Plan Features ───
INSERT INTO plan_features (plan_id, feature_key, is_enabled) VALUES
    ('basic', 'reading',           true),
    ('basic', 'bookmarks',         true),
    ('basic', 'library',           true),
    ('basic', 'progress_tracking', true),
    ('basic', 'exercises',         true)
ON CONFLICT (plan_id, feature_key) DO NOTHING;

-- ─── Pro Plan Features ───
INSERT INTO plan_features (plan_id, feature_key, is_enabled) VALUES
    ('pro', 'reading',           true),
    ('pro', 'bookmarks',         true),
    ('pro', 'library',           true),
    ('pro', 'progress_tracking', true),
    ('pro', 'exercises',         true),
    ('pro', 'gamification',      true),
    ('pro', 'leaderboard',       true),
    ('pro', 'certificate',       true),
    ('pro', 'tools',             true)
ON CONFLICT (plan_id, feature_key) DO NOTHING;

-- ─── VIP Plan Features ───
INSERT INTO plan_features (plan_id, feature_key, is_enabled) VALUES
    ('vip', 'reading',           true),
    ('vip', 'bookmarks',         true),
    ('vip', 'library',           true),
    ('vip', 'progress_tracking', true),
    ('vip', 'exercises',         true),
    ('vip', 'gamification',      true),
    ('vip', 'leaderboard',       true),
    ('vip', 'certificate',       true),
    ('vip', 'tools',             true),
    ('vip', 'chat',              true)
ON CONFLICT (plan_id, feature_key) DO NOTHING;
