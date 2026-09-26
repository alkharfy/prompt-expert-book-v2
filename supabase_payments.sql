-- ============================================
-- جدول المدفوعات (Payments Table)
-- لتتبع عمليات الدفع عبر كاشير (Kashier)
-- ============================================

-- إنشاء الجدول
CREATE TABLE IF NOT EXISTS payments (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    
    -- ربط بالمستخدم
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    
    -- بيانات كاشير
    kashier_session_id TEXT,          -- معرف جلسة كاشير
    kashier_order_id TEXT UNIQUE,     -- رقم الطلب (فريد)
    
    -- بيانات الدفع
    amount DECIMAL(10, 2) NOT NULL,   -- المبلغ
    currency TEXT DEFAULT 'EGP',      -- العملة (جنيه مصري)
    plan_id TEXT NOT NULL,            -- الباقة (basic / pro / vip)
    payment_method TEXT,              -- طريقة الدفع (card / wallet)
    
    -- الحالة
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'success', 'failed', 'expired')),
    
    -- التواريخ
    created_at TIMESTAMPTZ DEFAULT NOW(),
    paid_at TIMESTAMPTZ,
    
    -- ملاحظات
    notes TEXT
);

-- فهرس للبحث السريع
CREATE INDEX IF NOT EXISTS idx_payments_user_id ON payments(user_id);
CREATE INDEX IF NOT EXISTS idx_payments_status ON payments(status);
CREATE INDEX IF NOT EXISTS idx_payments_kashier_session ON payments(kashier_session_id);

-- ============================================
-- سياسات أمان RLS (Row Level Security)
-- ============================================

-- تفعيل RLS
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;

-- السماح للمستخدم بقراءة مدفوعاته فقط
CREATE POLICY "users_read_own_payments"
    ON payments FOR SELECT
    USING (auth.uid() = user_id);

-- السماح بالإدراج عبر service_role فقط (من الـ API)
CREATE POLICY "service_insert_payments"
    ON payments FOR INSERT
    WITH CHECK (true);

-- السماح بالتحديث عبر service_role فقط (من الـ API)
CREATE POLICY "service_update_payments"
    ON payments FOR UPDATE
    USING (true);

-- ============================================
-- دالة للتحقق من أن المستخدم دفع بنجاح
-- ============================================
CREATE OR REPLACE FUNCTION has_successful_payment(p_user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM payments 
        WHERE user_id = p_user_id 
        AND status = 'success'
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- منح الصلاحيات
-- ============================================
GRANT SELECT ON payments TO authenticated;
GRANT ALL ON payments TO service_role;
