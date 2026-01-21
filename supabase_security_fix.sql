-- =====================================
-- إصلاح سياسات الأمان (RLS Policies)
-- =====================================

-- 1. إنشاء دالة للتحقق من صلاحيات Admin
-- ملاحظة: هذا المشروع يستخدم نظام مصادقة مخصص (session-based)
-- لذا سنستخدم سياسات مبسطة تعتمد على الـ API
CREATE OR REPLACE FUNCTION is_admin()
RETURNS boolean AS $$
BEGIN
    -- في نظام المصادقة المخصص، التحقق يتم عبر API
    -- هذه الدالة للاستخدام المستقبلي مع Supabase Auth
    RETURN false;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. إضافة عمود role لجدول users إذا لم يكن موجوداً
ALTER TABLE users ADD COLUMN IF NOT EXISTS role VARCHAR(20) DEFAULT 'user';

-- 3. تحديث RLS لجدول testimonials
-- ================================================
-- إضافة عمود is_visible إذا لم يكن موجوداً
ALTER TABLE testimonials ADD COLUMN IF NOT EXISTS is_visible BOOLEAN DEFAULT true;

DROP POLICY IF EXISTS "testimonials_select_policy" ON testimonials;
DROP POLICY IF EXISTS "testimonials_insert_policy" ON testimonials;
DROP POLICY IF EXISTS "testimonials_update_policy" ON testimonials;
DROP POLICY IF EXISTS "testimonials_delete_policy" ON testimonials;
DROP POLICY IF EXISTS "Allow all to read testimonials" ON testimonials;
DROP POLICY IF EXISTS "Allow admins to modify testimonials" ON testimonials;
DROP POLICY IF EXISTS "Public can read published testimonials" ON testimonials;

-- السماح للجميع بقراءة الشهادات المنشورة فقط
CREATE POLICY "Public can read published testimonials"
ON testimonials FOR SELECT
USING (is_visible = true);

-- السماح للـ Admin بقراءة جميع الشهادات
CREATE POLICY "Admin can read all testimonials"
ON testimonials FOR SELECT
USING (is_admin());

-- السماح للـ Admin فقط بإضافة شهادات
CREATE POLICY "Admin can insert testimonials"
ON testimonials FOR INSERT
WITH CHECK (is_admin());

-- السماح للـ Admin فقط بتحديث الشهادات
CREATE POLICY "Admin can update testimonials"
ON testimonials FOR UPDATE
USING (is_admin());

-- السماح للـ Admin فقط بحذف الشهادات
CREATE POLICY "Admin can delete testimonials"
ON testimonials FOR DELETE
USING (is_admin());

-- 4. تحديث RLS لجدول site_settings
-- ================================================
DROP POLICY IF EXISTS "site_settings_select_policy" ON site_settings;
DROP POLICY IF EXISTS "site_settings_update_policy" ON site_settings;
DROP POLICY IF EXISTS "Allow all to read site_settings" ON site_settings;
DROP POLICY IF EXISTS "Allow admins to modify site_settings" ON site_settings;

-- السماح للجميع بقراءة الإعدادات العامة
CREATE POLICY "Public can read site settings"
ON site_settings FOR SELECT
USING (true);

-- السماح للـ Admin فقط بتحديث الإعدادات
CREATE POLICY "Admin can update site settings"
ON site_settings FOR UPDATE
USING (is_admin());

-- السماح للـ Admin فقط بإضافة إعدادات
CREATE POLICY "Admin can insert site settings"
ON site_settings FOR INSERT
WITH CHECK (is_admin());

-- 5. تحديث RLS لجدول certificates
-- ================================================
-- إضافة عمود is_visible إذا لم يكن موجوداً
ALTER TABLE certificates ADD COLUMN IF NOT EXISTS is_visible BOOLEAN DEFAULT true;
ALTER TABLE certificates ADD COLUMN IF NOT EXISTS user_id TEXT;

DROP POLICY IF EXISTS "certificates_select_policy" ON certificates;
DROP POLICY IF EXISTS "certificates_insert_policy" ON certificates;
DROP POLICY IF EXISTS "certificates_update_policy" ON certificates;
DROP POLICY IF EXISTS "Allow all to read certificates" ON certificates;
DROP POLICY IF EXISTS "Allow users to manage their certificates" ON certificates;

-- السماح بقراءة الشهادات (التحقق يتم عبر API)
CREATE POLICY "Allow read certificates"
ON certificates FOR SELECT
USING (true);

-- السماح بإدارة الشهادات (التحقق من الصلاحيات يتم عبر API)
CREATE POLICY "Allow manage certificates"
ON certificates FOR ALL
USING (true);

-- 6. تحديث RLS لجدول users
-- ================================================
DROP POLICY IF EXISTS "Users can view own data" ON users;
DROP POLICY IF EXISTS "Users can update own data" ON users;

-- السماح بقراءة بيانات المستخدمين (التحقق يتم عبر API)
CREATE POLICY "Allow read users"
ON users FOR SELECT
USING (true);

-- السماح بتحديث بيانات المستخدمين (التحقق يتم عبر API)
CREATE POLICY "Allow update users"
ON users FOR UPDATE
USING (true);

-- السماح بإضافة مستخدمين جدد
CREATE POLICY "Allow insert users"
ON users FOR INSERT
WITH CHECK (true);

-- 7. تحديث RLS لجدول verification_codes
-- ================================================
DROP POLICY IF EXISTS "Allow all to read verification_codes" ON verification_codes;
DROP POLICY IF EXISTS "Allow all to modify verification_codes" ON verification_codes;

-- السماح للنظام بإدارة أكواد التحقق
CREATE POLICY "System can manage verification codes"
ON verification_codes FOR ALL
USING (true);  -- يمكن تقييده أكثر حسب نظام المصادقة

-- 8. تأكيد تفعيل RLS على جميع الجداول
-- ================================================
ALTER TABLE testimonials ENABLE ROW LEVEL SECURITY;
ALTER TABLE site_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE certificates ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE verification_codes ENABLE ROW LEVEL SECURITY;

-- 9. إنشاء مستخدم admin افتراضي (اختياري)
-- ================================================
-- UPDATE users SET role = 'admin' WHERE email = 'your-admin-email@example.com';

-- ملاحظة مهمة:
-- =====================================
-- 1. يجب تنفيذ هذا الملف في Supabase SQL Editor
-- 2. تأكد من تحديث email الـ admin في الأمر الأخير
-- 3. يمكنك إضافة admin يدوياً من خلال:
--    UPDATE users SET role = 'admin' WHERE email = 'admin@example.com';
