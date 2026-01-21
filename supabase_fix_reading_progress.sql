-- =====================================================
-- إصلاح شامل لجدول reading_progress
-- =====================================================
-- هذا الملف يصلح مشكلة HTTP 400 عند حفظ التقدم
-- المشكلة: عمود user_id يحتاج UNIQUE constraint لتعمل upsert

-- 1. التحقق من بنية الجدول الحالية
-- SELECT column_name, data_type, is_nullable 
-- FROM information_schema.columns 
-- WHERE table_name = 'reading_progress';

-- 2. حذف الجدول القديم وإعادة إنشائه بشكل صحيح
-- ⚠️ تحذير: هذا سيحذف البيانات الموجودة! 
-- إذا كان لديك بيانات مهمة، استخدم القسم البديل أدناه

DROP TABLE IF EXISTS reading_progress CASCADE;

CREATE TABLE reading_progress (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL UNIQUE,  -- ⚠️ UNIQUE مطلوب لـ upsert!
    current_page INTEGER DEFAULT 1,
    total_pages INTEGER DEFAULT 89,
    bookmarks JSONB DEFAULT '[]'::jsonb,
    completed_chapters JSONB DEFAULT '[]'::jsonb,
    completion_percentage INTEGER DEFAULT 0,
    last_read_time TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Foreign key للمستخدم (اختياري إذا كان جدول users موجود)
    CONSTRAINT fk_user FOREIGN KEY (user_id) 
        REFERENCES users(id) ON DELETE CASCADE
);

-- 3. إنشاء فهرس للبحث السريع
CREATE INDEX idx_reading_progress_user_id ON reading_progress(user_id);

-- 4. تفعيل RLS
ALTER TABLE reading_progress ENABLE ROW LEVEL SECURITY;

-- 5. حذف السياسات القديمة
DROP POLICY IF EXISTS "Users can read own progress" ON reading_progress;
DROP POLICY IF EXISTS "Users can insert own progress" ON reading_progress;
DROP POLICY IF EXISTS "Users can update own progress" ON reading_progress;
DROP POLICY IF EXISTS "Users can delete own progress" ON reading_progress;

-- 6. إنشاء سياسات RLS جديدة
-- السماح بالقراءة للمستخدم أو service_role
CREATE POLICY "Users can read own progress" ON reading_progress
    FOR SELECT
    USING (
        auth.uid()::text = user_id::text 
        OR auth.role() = 'service_role'
    );

-- السماح بالإدراج للمستخدم أو service_role
CREATE POLICY "Users can insert own progress" ON reading_progress
    FOR INSERT
    WITH CHECK (
        auth.uid()::text = user_id::text 
        OR auth.role() = 'service_role'
    );

-- السماح بالتحديث للمستخدم أو service_role
CREATE POLICY "Users can update own progress" ON reading_progress
    FOR UPDATE
    USING (
        auth.uid()::text = user_id::text 
        OR auth.role() = 'service_role'
    );

-- السماح بالحذف للمستخدم أو service_role
CREATE POLICY "Users can delete own progress" ON reading_progress
    FOR DELETE
    USING (
        auth.uid()::text = user_id::text 
        OR auth.role() = 'service_role'
    );

-- 7. منح الصلاحيات
GRANT ALL ON reading_progress TO authenticated;
GRANT ALL ON reading_progress TO service_role;
GRANT ALL ON reading_progress TO anon;

-- 8. Trigger لتحديث updated_at تلقائياً
CREATE OR REPLACE FUNCTION update_reading_progress_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_reading_progress_timestamp ON reading_progress;
CREATE TRIGGER update_reading_progress_timestamp
    BEFORE UPDATE ON reading_progress
    FOR EACH ROW
    EXECUTE FUNCTION update_reading_progress_timestamp();

-- =====================================================
-- البديل: إذا كان لديك بيانات ولا تريد حذفها
-- استخدم هذا بدلاً من DROP TABLE
-- =====================================================

-- إضافة UNIQUE constraint إذا لم يكن موجوداً
-- ALTER TABLE reading_progress 
--     ADD CONSTRAINT reading_progress_user_id_unique UNIQUE (user_id);

-- إضافة الأعمدة المفقودة
-- ALTER TABLE reading_progress ADD COLUMN IF NOT EXISTS completed_chapters JSONB DEFAULT '[]'::jsonb;
-- ALTER TABLE reading_progress ADD COLUMN IF NOT EXISTS last_read_time TIMESTAMPTZ DEFAULT NOW();
-- ALTER TABLE reading_progress ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- =====================================================
-- اختبار الجدول
-- =====================================================
-- INSERT INTO reading_progress (user_id, current_page) 
-- VALUES ('test-user-id', 5)
-- ON CONFLICT (user_id) DO UPDATE SET current_page = 5;
