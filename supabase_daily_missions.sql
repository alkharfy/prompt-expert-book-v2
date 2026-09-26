-- =====================================================
-- المرحلة 2: جدول المهام اليومية (Daily Missions)
-- يجب تنفيذ هذا الملف في Supabase Dashboard → SQL Editor
-- =====================================================

-- تعريف أنواع المهام المتاحة (Template)
CREATE TABLE IF NOT EXISTS mission_templates (
    id TEXT PRIMARY KEY,                -- مثال: 'read_pages', 'complete_exercise', 'add_note'
    title_ar TEXT NOT NULL,             -- مثال: 'اقرأ {target} صفحات'
    description_ar TEXT NOT NULL,
    icon TEXT NOT NULL,                 -- مثال: '📖', '✏️', '📝'
    category TEXT NOT NULL              -- 'reading', 'exercises', 'notes', 'tools', 'streak'
        CHECK (category IN ('reading', 'exercises', 'notes', 'tools', 'streak', 'social')),
    
    -- نطاق الهدف العشوائي
    min_target INTEGER NOT NULL,        -- أقل هدف (مثل: 2 صفحات)
    max_target INTEGER NOT NULL,        -- أقصى هدف (مثل: 5 صفحات)
    
    -- المكافأة
    base_points INTEGER NOT NULL,       -- النقاط الأساسية
    bonus_multiplier DECIMAL DEFAULT 1.0, -- مضاعف المكافأة (للمهام الصعبة)
    
    -- شروط التفعيل
    requires_plan TEXT DEFAULT NULL,     -- null = مجاني, 'basic'/'pro'/'vip'
    min_level INTEGER DEFAULT 1,         -- الحد الأدنى لمستوى المستخدم
    
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- المهام اليومية المعيّنة لكل مستخدم
CREATE TABLE IF NOT EXISTS user_daily_missions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    mission_template_id TEXT NOT NULL REFERENCES mission_templates(id),
    
    -- تاريخ المهمة (يتغير يومياً)
    mission_date DATE NOT NULL DEFAULT CURRENT_DATE,
    
    -- الهدف والتقدم
    target_value INTEGER NOT NULL,      -- الهدف العشوائي المُولَّد (مثل: 3 صفحات)
    current_value INTEGER DEFAULT 0,    -- التقدم الحالي
    
    -- الحالة
    status TEXT DEFAULT 'active' 
        CHECK (status IN ('active', 'completed', 'expired', 'skipped')),
    
    -- مكافأة
    points_earned INTEGER DEFAULT 0,
    completed_at TIMESTAMPTZ,
    
    -- ترتيب المهمة (1, 2, 3 — ثلاث مهام في اليوم)
    slot_number INTEGER NOT NULL CHECK (slot_number BETWEEN 1 AND 3),
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- كل مستخدم عنده 3 مهام في اليوم بالضبط
    UNIQUE(user_id, mission_date, slot_number)
);

-- فهارس
CREATE INDEX IF NOT EXISTS idx_user_daily_missions_user_date ON user_daily_missions(user_id, mission_date);
CREATE INDEX IF NOT EXISTS idx_user_daily_missions_status ON user_daily_missions(status);

-- RLS
ALTER TABLE user_daily_missions ENABLE ROW LEVEL SECURITY;
ALTER TABLE mission_templates ENABLE ROW LEVEL SECURITY;

-- السياسات: الكل يقدر يقرأ القوالب
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'missions_templates_read') THEN
        CREATE POLICY "missions_templates_read" ON mission_templates
            FOR SELECT USING (TRUE);
    END IF;
END $$;

-- بيانات المهام الأولية (Seed Data)
INSERT INTO mission_templates (id, title_ar, description_ar, icon, category, min_target, max_target, base_points) VALUES
-- مهام القراءة
('read_pages',      'اقرأ {target} صفحات',           'أكمل قراءة عدد من الصفحات اليوم',         '📖', 'reading',   2, 5,  20),
('read_section',    'ابدأ فصل جديد',                  'افتح واقرأ أول صفحة من فصل لسه ما بدأته',  '📚', 'reading',   1, 1,  30),
('reread_page',     'راجع صفحة قرأتها قبل كده',       'ارجع لصفحة سبق قراءتها وراجعها',          '🔄', 'reading',   1, 1,  15),

-- مهام التمارين
('complete_quiz',     'أجب على {target} سؤال',        'أكمل أسئلة اختيار من متعدد',               '✏️', 'exercises', 1, 3,  25),
('complete_exercise', 'أنهِ {target} تمرين',           'أكمل أي نوع من التمارين',                  '🎯', 'exercises', 1, 2,  25),
('perfect_score',     'احصل على إجابة صحيحة من أول مرة', 'أجب صح على سؤال من أول محاولة',         '⭐', 'exercises', 1, 1,  35),

-- مهام الملاحظات
('add_notes',       'أضف {target} ملاحظات',           'ظلل نص أو اكتب ملاحظة جديدة',             '📝', 'notes',     1, 3,  20),
('highlight_text',  'ظلل {target} نصوص مفيدة',        'ظلل أجزاء مهمة من المحتوى',                '🖍️', 'notes',     2, 4,  15),

-- مهام الأدوات
('use_tool',        'استخدم أداة من صندوق الأدوات',   'جرب المولد أو المحلل أو المقارن',           '🛠️', 'tools',     1, 1,  25),
('try_chat',        'اسأل المساعد الذكي سؤال',       'استخدم الشات الذكي واسأل سؤال عن المحتوى',  '💬', 'tools',     1, 1,  20),

-- مهام الـ Streak
('maintain_streak', 'حافظ على سلسلتك 🔥',            'سجل نشاط اليوم للحفاظ على streak',          '🔥', 'streak',    1, 1,  15),
('bookmark_page',   'احفظ {target} إشارات مرجعية',    'احفظ صفحات مهمة للرجوع إليها لاحقاً',       '🔖', 'reading',   1, 2,  15)
ON CONFLICT (id) DO NOTHING;
