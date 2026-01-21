-- إصلاح جدول reading_progress لإضافة الأعمدة الناقصة
-- يجب تشغيل هذا في Supabase SQL Editor

-- 1. إضافة عمود last_read_time إذا لم يكن موجوداً
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'reading_progress' AND column_name = 'last_read_time'
    ) THEN
        ALTER TABLE reading_progress ADD COLUMN last_read_time TIMESTAMPTZ DEFAULT NOW();
    END IF;
END $$;

-- 2. إضافة عمود completed_chapters إذا لم يكن موجوداً
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'reading_progress' AND column_name = 'completed_chapters'
    ) THEN
        ALTER TABLE reading_progress ADD COLUMN completed_chapters TEXT[] DEFAULT '{}';
    END IF;
END $$;

-- 3. التأكد من وجود UNIQUE constraint على user_id
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'reading_progress_user_id_key' 
        AND conrelid = 'reading_progress'::regclass
    ) THEN
        -- إضافة UNIQUE constraint
        ALTER TABLE reading_progress ADD CONSTRAINT reading_progress_user_id_key UNIQUE (user_id);
    END IF;
EXCEPTION WHEN duplicate_object THEN
    -- تجاهل إذا كان موجوداً بالفعل
    NULL;
END $$;

-- 4. التحقق من البنية النهائية
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'reading_progress'
ORDER BY ordinal_position;

-- 5. التحقق من القيود
SELECT conname, contype
FROM pg_constraint 
WHERE conrelid = 'reading_progress'::regclass;
