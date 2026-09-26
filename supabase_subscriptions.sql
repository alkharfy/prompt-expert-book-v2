-- ============================================
-- جدول الاشتراكات (Subscriptions Table)
-- لتتبع اشتراكات المستخدمين في الباقات
-- Stage 1 — Subscription Migration
-- ============================================
-- IDEMPOTENCY: Uses IF NOT EXISTS / IF NOT EXISTS for all DDL.
-- Safe to re-run multiple times.
-- ============================================

-- 1) إنشاء الجدول
CREATE TABLE IF NOT EXISTS subscriptions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,

    -- ربط بالمستخدم
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,

    -- الباقة
    plan_id TEXT NOT NULL CHECK (plan_id IN ('basic', 'pro', 'vip')),

    -- ربط بالدفعة (اختياري — قد يكون اشتراك يدوي من الأدمن)
    payment_id UUID REFERENCES payments(id),

    -- حالة الاشتراك
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'expired', 'cancelled', 'upgraded')),

    -- فترة الاشتراك
    starts_at TIMESTAMPTZ DEFAULT NOW(),
    expires_at TIMESTAMPTZ NOT NULL,

    -- ترقية: ربط بالاشتراك السابق الذي تمت ترقيته
    upgraded_from UUID REFERENCES subscriptions(id),

    -- التواريخ
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- 2) الفهارس (Indexes)
-- ============================================

-- فهرس البحث بالمستخدم
CREATE INDEX IF NOT EXISTS idx_subscriptions_user
    ON subscriptions(user_id);

-- فهرس البحث بالحالة
CREATE INDEX IF NOT EXISTS idx_subscriptions_status
    ON subscriptions(status);

-- فهرس البحث بتاريخ الانتهاء
CREATE INDEX IF NOT EXISTS idx_subscriptions_expires
    ON subscriptions(expires_at);

-- فهرس فريد جزئي: مستخدم واحد = اشتراك نشط واحد فقط
-- ملاحظة: CREATE UNIQUE INDEX IF NOT EXISTS لضمان التكرار الآمن
CREATE UNIQUE INDEX IF NOT EXISTS idx_subscriptions_one_active_per_user
    ON subscriptions(user_id)
    WHERE status = 'active';

-- ============================================
-- 3) سياسات أمان RLS (Row Level Security)
-- ============================================

-- تفعيل RLS
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;

-- حذف السياسات القديمة إن وُجدت (لضمان التكرار الآمن)
DROP POLICY IF EXISTS "users_read_own_subscription" ON subscriptions;
DROP POLICY IF EXISTS "service_manage_subscriptions" ON subscriptions;

-- السماح لأي مستخدم بقراءة اشتراكه
-- ملاحظة: USING(true) لأن التطبيق يستخدم service_role key
-- وليس anon key — السياسة placeholder وستُشدّد لاحقاً
CREATE POLICY "users_read_own_subscription"
    ON subscriptions FOR SELECT
    USING (true);

-- السماح بالإدارة الكاملة عبر service_role
CREATE POLICY "service_manage_subscriptions"
    ON subscriptions FOR ALL
    USING (true);

-- ============================================
-- 4) تحديث updated_at تلقائياً
-- ============================================

-- دالة مساعدة لتحديث updated_at (قد تكون موجودة مسبقاً)
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- حذف الـ trigger إن وُجد ثم إعادة إنشائه
DROP TRIGGER IF EXISTS set_subscriptions_updated_at ON subscriptions;
CREATE TRIGGER set_subscriptions_updated_at
    BEFORE UPDATE ON subscriptions
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- 5) منح الصلاحيات
-- ============================================
GRANT SELECT ON subscriptions TO authenticated;
GRANT ALL ON subscriptions TO service_role;
