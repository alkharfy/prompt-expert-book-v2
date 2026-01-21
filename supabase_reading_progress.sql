-- =====================================================
-- سياسات RLS لجدول reading_progress
-- =====================================================
-- هذا الملف يصلح مشكلة عدم حفظ التقدم والإشارات المرجعية
-- يجب تشغيله في Supabase SQL Editor

-- تفعيل RLS على الجدول (إذا لم يكن مفعلاً)
ALTER TABLE reading_progress ENABLE ROW LEVEL SECURITY;

-- حذف السياسات القديمة إن وجدت
DROP POLICY IF EXISTS "Users can read own progress" ON reading_progress;
DROP POLICY IF EXISTS "Users can insert own progress" ON reading_progress;
DROP POLICY IF EXISTS "Users can update own progress" ON reading_progress;
DROP POLICY IF EXISTS "Users can delete own progress" ON reading_progress;
DROP POLICY IF EXISTS "Service role full access on reading_progress" ON reading_progress;

-- =====================================================
-- سياسة القراءة: المستخدم يقرأ تقدمه فقط
-- =====================================================
CREATE POLICY "Users can read own progress" ON reading_progress
    FOR SELECT
    USING (
        auth.uid()::text = user_id::text 
        OR auth.role() = 'service_role'
    );

-- =====================================================
-- سياسة الإدراج: المستخدم يُنشئ سجل تقدمه فقط
-- =====================================================
CREATE POLICY "Users can insert own progress" ON reading_progress
    FOR INSERT
    WITH CHECK (
        auth.uid()::text = user_id::text 
        OR auth.role() = 'service_role'
    );

-- =====================================================
-- سياسة التحديث: المستخدم يُحدّث تقدمه فقط
-- =====================================================
CREATE POLICY "Users can update own progress" ON reading_progress
    FOR UPDATE
    USING (
        auth.uid()::text = user_id::text 
        OR auth.role() = 'service_role'
    );

-- =====================================================
-- سياسة الحذف: المستخدم يحذف تقدمه فقط (نادراً ما يُستخدم)
-- =====================================================
CREATE POLICY "Users can delete own progress" ON reading_progress
    FOR DELETE
    USING (
        auth.uid()::text = user_id::text 
        OR auth.role() = 'service_role'
    );

-- =====================================================
-- منح الصلاحيات
-- =====================================================
GRANT ALL ON reading_progress TO authenticated;
GRANT ALL ON reading_progress TO service_role;

-- =====================================================
-- إضافة عمود completed_chapters إذا لم يكن موجوداً
-- =====================================================
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'reading_progress' 
        AND column_name = 'completed_chapters'
    ) THEN
        ALTER TABLE reading_progress 
        ADD COLUMN completed_chapters JSONB DEFAULT '[]'::jsonb;
    END IF;
END $$;

-- =====================================================
-- التحقق من البنية الصحيحة للجدول
-- =====================================================
-- يمكنك تشغيل هذا للتحقق:
-- SELECT column_name, data_type FROM information_schema.columns 
-- WHERE table_name = 'reading_progress';
