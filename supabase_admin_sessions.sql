-- =====================================================
-- جدول جلسات الأدمن (Admin Sessions)
-- =====================================================
-- هذا الجدول يستبدل التخزين في الذاكرة (Map) بتخزين دائم
-- يعمل بشكل صحيح مع Serverless و multiple instances

-- إنشاء الجدول
CREATE TABLE IF NOT EXISTS admin_sessions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    token TEXT NOT NULL UNIQUE,
    ip_address TEXT,
    user_agent TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    last_activity TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    expires_at TIMESTAMPTZ NOT NULL
);

-- فهرس للبحث السريع بالتوكن
CREATE INDEX IF NOT EXISTS idx_admin_sessions_token ON admin_sessions(token);

-- فهرس لتنظيف الجلسات المنتهية
CREATE INDEX IF NOT EXISTS idx_admin_sessions_expires_at ON admin_sessions(expires_at);

-- =====================================================
-- دالة تنظيف الجلسات المنتهية تلقائياً
-- =====================================================
CREATE OR REPLACE FUNCTION cleanup_expired_admin_sessions()
RETURNS void AS $$
BEGIN
    DELETE FROM admin_sessions 
    WHERE expires_at < NOW() 
       OR last_activity < NOW() - INTERVAL '30 minutes';
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- سياسات RLS (Row Level Security)
-- =====================================================
-- ملاحظة: هذا الجدول للخادم فقط، لذا نستخدم service_role

ALTER TABLE admin_sessions ENABLE ROW LEVEL SECURITY;

-- سياسة للسماح بجميع العمليات من service_role فقط
CREATE POLICY "Service role full access on admin_sessions"
ON admin_sessions
FOR ALL
USING (auth.role() = 'service_role');

-- =====================================================
-- تنظيف الجلسات المنتهية (يمكن تشغيله كـ Cron Job)
-- =====================================================
-- يمكنك إعداد pg_cron لتشغيل هذه الدالة كل 5 دقائق:
-- SELECT cron.schedule('cleanup-admin-sessions', '*/5 * * * *', 'SELECT cleanup_expired_admin_sessions()');

-- =====================================================
-- منح الصلاحيات
-- =====================================================
GRANT ALL ON admin_sessions TO service_role;
GRANT USAGE ON SCHEMA public TO service_role;
