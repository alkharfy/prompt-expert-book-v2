-- ============================================
-- دوال الاشتراكات (Subscription Functions)
-- Stage 1 — Subscription Migration
-- ============================================
-- IDEMPOTENCY: Uses CREATE OR REPLACE — safe to re-run.
-- Both functions are SECURITY DEFINER to bypass RLS.
-- ============================================

-- ============================================
-- 1) get_user_plan
-- ─ تُرجع الباقة الحالية النشطة وغير المنتهية للمستخدم
-- ─ Returns the user's current active + non-expired subscription
-- ============================================
CREATE OR REPLACE FUNCTION get_user_plan(p_user_id UUID)
RETURNS TABLE (
    plan_id   TEXT,
    expires_at TIMESTAMPTZ,
    status    TEXT
)
AS $$
BEGIN
    RETURN QUERY
    SELECT
        s.plan_id,
        s.expires_at,
        s.status
    FROM subscriptions s
    WHERE s.user_id  = p_user_id
      AND s.status   = 'active'
      AND s.expires_at > NOW()
    ORDER BY s.created_at DESC
    LIMIT 1;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- 2) user_has_feature
-- ─ تتحقق إذا كان المستخدم يملك ميزة معينة حسب باقته
-- ─ Checks if user has access to a specific feature based on plan
-- ============================================
CREATE OR REPLACE FUNCTION user_has_feature(p_user_id UUID, p_feature TEXT)
RETURNS BOOLEAN
AS $$
DECLARE
    v_plan_id TEXT;
BEGIN
    -- 1. الحصول على الباقة النشطة
    SELECT s.plan_id INTO v_plan_id
    FROM subscriptions s
    WHERE s.user_id    = p_user_id
      AND s.status     = 'active'
      AND s.expires_at > NOW()
    ORDER BY s.created_at DESC
    LIMIT 1;

    -- 2. لا يوجد اشتراك نشط → لا ميزات
    IF v_plan_id IS NULL THEN
        RETURN FALSE;
    END IF;

    -- 3. التحقق من وجود الميزة في جدول plan_features
    RETURN EXISTS (
        SELECT 1
        FROM plan_features pf
        WHERE pf.plan_id     = v_plan_id
          AND pf.feature_key = p_feature
          AND pf.is_enabled  = true
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- منح صلاحيات التنفيذ
-- ============================================
GRANT EXECUTE ON FUNCTION get_user_plan(UUID)        TO authenticated;
GRANT EXECUTE ON FUNCTION get_user_plan(UUID)        TO service_role;
GRANT EXECUTE ON FUNCTION user_has_feature(UUID, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION user_has_feature(UUID, TEXT) TO service_role;
