-- ============================================
-- جدول أكواد الخصم (Promo Codes Table)
-- لإدارة أكواد الترويج والخصم على الباقات
-- ============================================

-- إنشاء الجدول
CREATE TABLE IF NOT EXISTS promo_codes (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    
    -- بيانات الكود
    code TEXT NOT NULL UNIQUE,                          -- كود الخصم (فريد)
    description TEXT,                                    -- وصف الكود
    
    -- نوع ونسبة الخصم
    discount_type TEXT NOT NULL DEFAULT 'percentage'      -- نوع الخصم
        CHECK (discount_type IN ('percentage', 'fixed')),
    discount_value DECIMAL(10, 2) NOT NULL,              -- قيمة الخصم (نسبة مئوية أو مبلغ ثابت)
    
    -- القيود
    max_uses INTEGER DEFAULT NULL,                        -- الحد الأقصى للاستخدام (NULL = غير محدود)
    current_uses INTEGER DEFAULT 0,                       -- عدد الاستخدامات الحالية
    min_amount DECIMAL(10, 2) DEFAULT 0,                 -- الحد الأدنى لمبلغ الطلب
    max_discount DECIMAL(10, 2) DEFAULT NULL,             -- الحد الأقصى للخصم (للنسبة المئوية)
    
    -- الباقات المسموح بها (NULL = كل الباقات)
    allowed_plans TEXT[] DEFAULT NULL,                    -- مثل: {'basic', 'pro', 'vip'}
    
    -- الصلاحية
    starts_at TIMESTAMPTZ DEFAULT NOW(),                  -- تاريخ بداية الكود
    expires_at TIMESTAMPTZ DEFAULT NULL,                  -- تاريخ انتهاء الكود (NULL = لا ينتهي)
    
    -- الحالة
    is_active BOOLEAN DEFAULT true,                       -- هل الكود نشط
    
    -- التواريخ
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- جدول استخدامات أكواد الخصم
-- ============================================

CREATE TABLE IF NOT EXISTS promo_code_uses (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    
    promo_code_id UUID NOT NULL REFERENCES promo_codes(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    payment_id UUID REFERENCES payments(id) ON DELETE SET NULL,
    
    -- بيانات الخصم المطبق
    original_amount DECIMAL(10, 2) NOT NULL,
    discount_amount DECIMAL(10, 2) NOT NULL,
    final_amount DECIMAL(10, 2) NOT NULL,
    
    used_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- منع استخدام نفس الكود مرتين لنفس المستخدم
    UNIQUE(promo_code_id, user_id)
);

-- ============================================
-- الفهارس
-- ============================================

CREATE INDEX IF NOT EXISTS idx_promo_codes_code ON promo_codes(code);
CREATE INDEX IF NOT EXISTS idx_promo_codes_active ON promo_codes(is_active);
CREATE INDEX IF NOT EXISTS idx_promo_code_uses_user ON promo_code_uses(user_id);
CREATE INDEX IF NOT EXISTS idx_promo_code_uses_promo ON promo_code_uses(promo_code_id);

-- ============================================
-- سياسات أمان RLS
-- ============================================

ALTER TABLE promo_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE promo_code_uses ENABLE ROW LEVEL SECURITY;

-- أكواد الخصم: القراءة للجميع (للتحقق من صلاحية الكود)
CREATE POLICY "anyone_read_active_promos"
    ON promo_codes FOR SELECT
    USING (is_active = true);

-- الإدراج والتحديث عبر service_role فقط
CREATE POLICY "service_manage_promos"
    ON promo_codes FOR ALL
    USING (true)
    WITH CHECK (true);

-- استخدامات الأكواد: المستخدم يقرأ استخداماته فقط
CREATE POLICY "users_read_own_promo_uses"
    ON promo_code_uses FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "service_manage_promo_uses"
    ON promo_code_uses FOR ALL
    USING (true)
    WITH CHECK (true);

-- ============================================
-- دالة لتحديث updated_at تلقائياً
-- ============================================

CREATE OR REPLACE FUNCTION update_promo_codes_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_promo_codes_updated_at
    BEFORE UPDATE ON promo_codes
    FOR EACH ROW
    EXECUTE FUNCTION update_promo_codes_updated_at();

-- ============================================
-- منح الصلاحيات
-- ============================================

GRANT SELECT ON promo_codes TO authenticated;
GRANT ALL ON promo_codes TO service_role;
GRANT SELECT ON promo_code_uses TO authenticated;
GRANT ALL ON promo_code_uses TO service_role;

-- ============================================
-- دالة لزيادة عداد استخدامات كود الخصم
-- ============================================

CREATE OR REPLACE FUNCTION increment_promo_uses(promo_id UUID)
RETURNS VOID AS $$
BEGIN
    UPDATE promo_codes
    SET current_uses = current_uses + 1
    WHERE id = promo_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
