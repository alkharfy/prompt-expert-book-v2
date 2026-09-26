-- =====================================================
-- المرحلة 1: جدول ملاحظات وتظليل المستخدم
-- =====================================================

CREATE TABLE IF NOT EXISTS user_notes (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    
    -- ربط بالمستخدم
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    
    -- موقع الملاحظة في الكتاب
    section_id TEXT NOT NULL,          -- مثال: 'section-1', 'intro', 'appendix'
    page_number INTEGER NOT NULL,       -- رقم الصفحة داخل القسم
    
    -- بيانات التظليل
    highlighted_text TEXT,              -- النص المظلل (null لو ملاحظة بدون تظليل)
    
    -- بيانات موقع التظليل في الصفحة (لإعادة رسمه)
    text_start_offset INTEGER,          -- بداية التظليل في النص
    text_end_offset INTEGER,            -- نهاية التظليل في النص
    content_block_index INTEGER,        -- رقم الـ contentBlock اللي فيه التظليل
    
    -- الملاحظة
    note_text TEXT,                     -- نص الملاحظة (null لو تظليل بدون ملاحظة)
    
    -- تنسيق
    highlight_color TEXT DEFAULT 'orange'  
        CHECK (highlight_color IN ('orange', 'yellow', 'green', 'blue', 'purple')),
    
    -- تتبع
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- فهارس
CREATE INDEX idx_user_notes_user ON user_notes(user_id);
CREATE INDEX idx_user_notes_section ON user_notes(user_id, section_id, page_number);
CREATE INDEX idx_user_notes_created ON user_notes(created_at DESC);

-- RLS
ALTER TABLE user_notes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "user_notes_select" ON user_notes
    FOR SELECT USING (auth.uid()::text = user_id::text);

CREATE POLICY "user_notes_insert" ON user_notes
    FOR INSERT WITH CHECK (auth.uid()::text = user_id::text);

CREATE POLICY "user_notes_update" ON user_notes
    FOR UPDATE USING (auth.uid()::text = user_id::text);

CREATE POLICY "user_notes_delete" ON user_notes
    FOR DELETE USING (auth.uid()::text = user_id::text);

-- Trigger لتحديث updated_at تلقائياً
CREATE OR REPLACE FUNCTION update_user_notes_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_user_notes_updated
    BEFORE UPDATE ON user_notes
    FOR EACH ROW
    EXECUTE FUNCTION update_user_notes_timestamp();
