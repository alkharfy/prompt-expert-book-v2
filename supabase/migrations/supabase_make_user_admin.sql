-- ============================================
-- Make User Admin
-- ============================================
-- يجعل مستخدم معين admin (تشغيل مرة واحدة فقط)
--
-- INSTRUCTIONS:
-- 1. افتح Supabase Dashboard → SQL Editor
-- 2. استبدل 'your-email@example.com' ببريدك الإلكتروني الفعلي
-- 3. شغّل الـ query
-- 4. تحقق من النتيجة — يجب أن يظهر "Admin user created"
--
-- ملاحظة: إذا كان العمود is_admin موجوداً بالفعل، سيتم تحديثه فقط.
-- ============================================

-- التحقق من وجود عمود is_admin (إضافته إذا لم يكن موجوداً)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_schema = 'public'
          AND table_name = 'users'
          AND column_name = 'is_admin'
    ) THEN
        ALTER TABLE users ADD COLUMN is_admin BOOLEAN DEFAULT FALSE;
        RAISE NOTICE 'Column is_admin added to users table';
    ELSE
        RAISE NOTICE 'Column is_admin already exists';
    END IF;
END $$;

-- إنشاء index على is_admin (للبحث السريع)
CREATE INDEX IF NOT EXISTS idx_users_is_admin ON users(is_admin) WHERE is_admin = TRUE;

-- جعل المستخدم admin
-- ⚠️ استبدل البريد الإلكتروني أدناه ببريدك الفعلي
UPDATE users
SET is_admin = TRUE
WHERE email = 'your-email@example.com'; -- 🔴 غيّر البريد الإلكتروني هنا

-- التحقق من النتيجة
DO $$
DECLARE
    admin_count INT;
BEGIN
    SELECT COUNT(*) INTO admin_count FROM users WHERE is_admin = TRUE;
    RAISE NOTICE 'Total admin users: %', admin_count;
END $$;

-- عرض جميع المستخدمين الـ admin
SELECT
    id,
    email,
    full_name,
    is_admin,
    created_at
FROM users
WHERE is_admin = TRUE;
