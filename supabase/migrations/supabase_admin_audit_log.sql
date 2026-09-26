-- ============================================
-- Admin Audit Log — Stage 5
-- ============================================
-- تتبع جميع الإجراءات الإدارية على الاشتراكات
-- ============================================

-- 1) إنشاء الجدول
CREATE TABLE IF NOT EXISTS admin_audit_log (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,

    -- الإجراء
    action TEXT NOT NULL CHECK (action IN ('extend', 'cancel', 'create', 'refund', 'update')),

    -- معرّف الإدارة
    admin_user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,

    -- الاشتراك المتأثر
    subscription_id UUID REFERENCES subscriptions(id) ON DELETE SET NULL,

    -- المستخدم المتأثر
    target_user_id UUID REFERENCES users(id) ON DELETE SET NULL,

    -- التفاصيل (JSONB للمرونة)
    details JSONB DEFAULT '{}'::jsonb,

    -- السبب (اختياري)
    reason TEXT,

    -- IP Address
    ip_address TEXT,

    -- تاريخ الإنشاء
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- 2) Indexes للبحث السريع
-- ============================================

CREATE INDEX IF NOT EXISTS idx_admin_audit_log_admin_user_id
    ON admin_audit_log(admin_user_id);

CREATE INDEX IF NOT EXISTS idx_admin_audit_log_subscription_id
    ON admin_audit_log(subscription_id);

CREATE INDEX IF NOT EXISTS idx_admin_audit_log_created_at
    ON admin_audit_log(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_admin_audit_log_action
    ON admin_audit_log(action);

-- ============================================
-- 3) RLS Policies
-- ============================================

ALTER TABLE admin_audit_log ENABLE ROW LEVEL SECURITY;

-- Admins can view all audit logs
DROP POLICY IF EXISTS "admins_view_audit_log" ON admin_audit_log;
CREATE POLICY "admins_view_audit_log"
    ON admin_audit_log FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM users
            WHERE users.id = auth.uid()::text
            AND users.is_admin = TRUE
        )
    );

-- Service role can insert audit logs
DROP POLICY IF EXISTS "service_insert_audit_log" ON admin_audit_log;
CREATE POLICY "service_insert_audit_log"
    ON admin_audit_log FOR INSERT
    WITH CHECK (true);

-- ============================================
-- 4) Grant Permissions
-- ============================================

GRANT SELECT ON admin_audit_log TO authenticated;
GRANT INSERT ON admin_audit_log TO service_role;
GRANT ALL ON admin_audit_log TO service_role;

-- ============================================
-- 5) Helper Function: Log Admin Action
-- ============================================

CREATE OR REPLACE FUNCTION log_admin_action(
    p_action TEXT,
    p_admin_user_id UUID,
    p_subscription_id UUID DEFAULT NULL,
    p_target_user_id UUID DEFAULT NULL,
    p_details JSONB DEFAULT '{}'::jsonb,
    p_reason TEXT DEFAULT NULL,
    p_ip_address TEXT DEFAULT NULL
) RETURNS UUID AS $$
DECLARE
    new_log_id UUID;
BEGIN
    INSERT INTO admin_audit_log (
        action,
        admin_user_id,
        subscription_id,
        target_user_id,
        details,
        reason,
        ip_address
    ) VALUES (
        p_action,
        p_admin_user_id,
        p_subscription_id,
        p_target_user_id,
        p_details,
        p_reason,
        p_ip_address
    ) RETURNING id INTO new_log_id;

    RETURN new_log_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- 6) Sample Usage (for testing)
-- ============================================

-- Test insert (replace with real admin user ID)
-- SELECT log_admin_action(
--     'extend',
--     'your-admin-user-uuid',
--     'subscription-uuid',
--     'target-user-uuid',
--     '{"days_added": 30, "old_expiry": "2026-01-01", "new_expiry": "2026-01-31"}'::jsonb,
--     'Customer requested extension',
--     '127.0.0.1'
-- );
