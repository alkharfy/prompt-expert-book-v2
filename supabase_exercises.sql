-- =====================================================
-- جدول تقدم التمارين - Exercise Progress Table
-- يحفظ تقدم كل مستخدم في التمارين والاختبارات
-- =====================================================

-- جدول التمارين المكتملة
CREATE TABLE IF NOT EXISTS exercise_progress (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    
    -- معرف التمرين (مثل: quiz-section-1-1, fill-section-2-3, prompt-section-3-1)
    exercise_id VARCHAR(100) NOT NULL,
    
    -- نوع التمرين
    exercise_type VARCHAR(50) NOT NULL CHECK (exercise_type IN ('quiz', 'fill_blank', 'prompt_builder')),
    
    -- القسم الذي ينتمي إليه التمرين
    section_id VARCHAR(50) NOT NULL,
    
    -- هل تم إكمال التمرين؟
    is_completed BOOLEAN DEFAULT FALSE,
    
    -- النتيجة (للاختبارات: الإجابة الصحيحة أم لا)
    is_correct BOOLEAN DEFAULT NULL,
    
    -- إجابة المستخدم (نص)
    user_answer TEXT,
    
    -- النقاط المكتسبة
    points_earned INTEGER DEFAULT 0,
    
    -- عدد المحاولات
    attempts INTEGER DEFAULT 1,
    
    -- تاريخ أول محاولة
    first_attempt_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- تاريخ آخر محاولة
    last_attempt_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- تاريخ الإكمال الناجح
    completed_at TIMESTAMP WITH TIME ZONE,
    
    -- منع التكرار: كل مستخدم له سجل واحد لكل تمرين
    UNIQUE(user_id, exercise_id)
);

-- فهرس للبحث السريع
CREATE INDEX IF NOT EXISTS idx_exercise_progress_user ON exercise_progress(user_id);
CREATE INDEX IF NOT EXISTS idx_exercise_progress_section ON exercise_progress(section_id);
CREATE INDEX IF NOT EXISTS idx_exercise_progress_type ON exercise_progress(exercise_type);

-- جدول إحصائيات المستخدم الإجمالية
CREATE TABLE IF NOT EXISTS user_exercise_stats (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE UNIQUE,
    
    -- إجمالي التمارين المكتملة
    total_completed INTEGER DEFAULT 0,
    
    -- إجمالي الإجابات الصحيحة
    total_correct INTEGER DEFAULT 0,
    
    -- إجمالي النقاط
    total_points INTEGER DEFAULT 0,
    
    -- عدد تمارين كل نوع
    quizzes_completed INTEGER DEFAULT 0,
    fill_blanks_completed INTEGER DEFAULT 0,
    prompt_builders_completed INTEGER DEFAULT 0,
    
    -- آخر تمرين تم إكماله
    last_exercise_at TIMESTAMP WITH TIME ZONE,
    
    -- تاريخ التحديث
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- Row Level Security (RLS)
-- =====================================================

ALTER TABLE exercise_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_exercise_stats ENABLE ROW LEVEL SECURITY;

-- سياسة: المستخدم يرى تمارينه فقط
-- ملاحظة: يستخدم المشروع نظام auth مخصص وليس Supabase Auth
-- لذلك نضيف fallback للسماح بالوصول عبر anon key مع التحقق في الكود
DROP POLICY IF EXISTS "Users can view own exercise progress" ON exercise_progress;
CREATE POLICY "Users can view own exercise progress" ON exercise_progress
    FOR SELECT USING (true);

DROP POLICY IF EXISTS "Users can insert own exercise progress" ON exercise_progress;
CREATE POLICY "Users can insert own exercise progress" ON exercise_progress
    FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Users can update own exercise progress" ON exercise_progress;
CREATE POLICY "Users can update own exercise progress" ON exercise_progress
    FOR UPDATE USING (true);

-- سياسة: المستخدم يرى إحصائياته فقط
DROP POLICY IF EXISTS "Users can view own stats" ON user_exercise_stats;
CREATE POLICY "Users can view own stats" ON user_exercise_stats
    FOR SELECT USING (true);

DROP POLICY IF EXISTS "Users can insert own stats" ON user_exercise_stats;
CREATE POLICY "Users can insert own stats" ON user_exercise_stats
    FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Users can update own stats" ON user_exercise_stats;
CREATE POLICY "Users can update own stats" ON user_exercise_stats
    FOR UPDATE USING (true);

-- =====================================================
-- Function لتحديث الإحصائيات تلقائياً
-- =====================================================

CREATE OR REPLACE FUNCTION update_user_exercise_stats()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO user_exercise_stats (user_id, total_completed, total_correct, total_points, 
                                      quizzes_completed, fill_blanks_completed, prompt_builders_completed,
                                      last_exercise_at, updated_at)
    VALUES (NEW.user_id, 
            CASE WHEN NEW.is_completed THEN 1 ELSE 0 END,
            CASE WHEN NEW.is_correct THEN 1 ELSE 0 END,
            NEW.points_earned,
            CASE WHEN NEW.exercise_type = 'quiz' AND NEW.is_completed THEN 1 ELSE 0 END,
            CASE WHEN NEW.exercise_type = 'fill_blank' AND NEW.is_completed THEN 1 ELSE 0 END,
            CASE WHEN NEW.exercise_type = 'prompt_builder' AND NEW.is_completed THEN 1 ELSE 0 END,
            NOW(),
            NOW())
    ON CONFLICT (user_id) DO UPDATE SET
        total_completed = user_exercise_stats.total_completed + 
            CASE WHEN NEW.is_completed AND NOT COALESCE(OLD.is_completed, FALSE) THEN 1 ELSE 0 END,
        total_correct = user_exercise_stats.total_correct + 
            CASE WHEN NEW.is_correct AND NOT COALESCE(OLD.is_correct, FALSE) THEN 1 ELSE 0 END,
        total_points = user_exercise_stats.total_points + (NEW.points_earned - COALESCE(OLD.points_earned, 0)),
        quizzes_completed = user_exercise_stats.quizzes_completed + 
            CASE WHEN NEW.exercise_type = 'quiz' AND NEW.is_completed AND NOT COALESCE(OLD.is_completed, FALSE) THEN 1 ELSE 0 END,
        fill_blanks_completed = user_exercise_stats.fill_blanks_completed + 
            CASE WHEN NEW.exercise_type = 'fill_blank' AND NEW.is_completed AND NOT COALESCE(OLD.is_completed, FALSE) THEN 1 ELSE 0 END,
        prompt_builders_completed = user_exercise_stats.prompt_builders_completed + 
            CASE WHEN NEW.exercise_type = 'prompt_builder' AND NEW.is_completed AND NOT COALESCE(OLD.is_completed, FALSE) THEN 1 ELSE 0 END,
        last_exercise_at = NOW(),
        updated_at = NOW();
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger لتحديث الإحصائيات
DROP TRIGGER IF EXISTS trigger_update_exercise_stats ON exercise_progress;
CREATE TRIGGER trigger_update_exercise_stats
    AFTER INSERT OR UPDATE ON exercise_progress
    FOR EACH ROW
    EXECUTE FUNCTION update_user_exercise_stats();
