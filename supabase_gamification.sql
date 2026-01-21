-- =====================================================
-- نظام الـ Gamification - Gamification System
-- النقاط، المستويات، الشارات، Streak، لوحة المتصدرين
-- =====================================================

-- =====================================================
-- 1. جدول ملف اللاعب (User Gamification Profile)
-- =====================================================

CREATE TABLE IF NOT EXISTS user_gamification (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE UNIQUE,
    
    -- النقاط والمستوى
    total_points INTEGER DEFAULT 0,
    current_level INTEGER DEFAULT 1,
    points_to_next_level INTEGER DEFAULT 100,
    
    -- Streak (التتابع اليومي)
    current_streak INTEGER DEFAULT 0,
    longest_streak INTEGER DEFAULT 0,
    last_activity_date DATE DEFAULT CURRENT_DATE,
    
    -- إحصائيات
    total_reading_time_minutes INTEGER DEFAULT 0,
    pages_read INTEGER DEFAULT 0,
    chapters_completed INTEGER DEFAULT 0,
    exercises_completed INTEGER DEFAULT 0,
    quizzes_passed INTEGER DEFAULT 0,
    
    -- تواريخ
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- فهرس للترتيب السريع في لوحة المتصدرين
CREATE INDEX IF NOT EXISTS idx_gamification_points ON user_gamification(total_points DESC);
CREATE INDEX IF NOT EXISTS idx_gamification_level ON user_gamification(current_level DESC);
CREATE INDEX IF NOT EXISTS idx_gamification_streak ON user_gamification(current_streak DESC);

-- =====================================================
-- 2. جدول الشارات المتاحة (Available Badges)
-- =====================================================

CREATE TABLE IF NOT EXISTS badges (
    id VARCHAR(50) PRIMARY KEY,
    name_ar VARCHAR(100) NOT NULL,
    name_en VARCHAR(100) NOT NULL,
    description_ar TEXT NOT NULL,
    description_en TEXT,
    icon VARCHAR(10) NOT NULL, -- Emoji
    category VARCHAR(50) NOT NULL, -- reading, exercises, streak, special
    points_reward INTEGER DEFAULT 0,
    requirement_type VARCHAR(50) NOT NULL, -- pages_read, exercises_done, streak_days, etc.
    requirement_value INTEGER NOT NULL,
    rarity VARCHAR(20) DEFAULT 'common', -- common, uncommon, rare, epic, legendary
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- 3. جدول شارات المستخدم (User Badges)
-- =====================================================

CREATE TABLE IF NOT EXISTS user_badges (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    badge_id VARCHAR(50) NOT NULL REFERENCES badges(id) ON DELETE CASCADE,
    earned_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    is_featured BOOLEAN DEFAULT FALSE, -- الشارة المعروضة في الملف الشخصي
    
    UNIQUE(user_id, badge_id)
);

CREATE INDEX IF NOT EXISTS idx_user_badges_user ON user_badges(user_id);
CREATE INDEX IF NOT EXISTS idx_user_badges_featured ON user_badges(user_id, is_featured) WHERE is_featured = TRUE;

-- =====================================================
-- 4. جدول سجل النقاط (Points History)
-- =====================================================

CREATE TABLE IF NOT EXISTS points_history (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    points INTEGER NOT NULL,
    action_type VARCHAR(50) NOT NULL, -- exercise_complete, page_read, streak_bonus, badge_earned, etc.
    action_details JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_points_history_user ON points_history(user_id);
CREATE INDEX IF NOT EXISTS idx_points_history_date ON points_history(created_at DESC);

-- =====================================================
-- 5. Row Level Security (RLS)
-- =====================================================

ALTER TABLE user_gamification ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_badges ENABLE ROW LEVEL SECURITY;
ALTER TABLE points_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE badges ENABLE ROW LEVEL SECURITY;

-- ملاحظة: يستخدم المشروع نظام auth مخصص وليس Supabase Auth
-- لذلك نسمح بالوصول عبر anon key مع التحقق من user_id في الكود

-- سياسات user_gamification
DROP POLICY IF EXISTS "Users can view own gamification" ON user_gamification;
CREATE POLICY "Users can view own gamification" ON user_gamification
    FOR SELECT USING (true);
DROP POLICY IF EXISTS "Users can insert own gamification" ON user_gamification;
CREATE POLICY "Users can insert own gamification" ON user_gamification
    FOR INSERT WITH CHECK (true);
DROP POLICY IF EXISTS "Users can update own gamification" ON user_gamification;
CREATE POLICY "Users can update own gamification" ON user_gamification
    FOR UPDATE USING (true);

-- سياسات user_badges
DROP POLICY IF EXISTS "Users can view own badges" ON user_badges;
CREATE POLICY "Users can view own badges" ON user_badges
    FOR SELECT USING (true);
DROP POLICY IF EXISTS "Users can insert own badges" ON user_badges;
CREATE POLICY "Users can insert own badges" ON user_badges
    FOR INSERT WITH CHECK (true);
DROP POLICY IF EXISTS "Users can update own badges" ON user_badges;
CREATE POLICY "Users can update own badges" ON user_badges
    FOR UPDATE USING (true);

-- سياسات points_history
DROP POLICY IF EXISTS "Users can view own points history" ON points_history;
CREATE POLICY "Users can view own points history" ON points_history
    FOR SELECT USING (true);
DROP POLICY IF EXISTS "Users can insert own points" ON points_history;
CREATE POLICY "Users can insert own points" ON points_history
    FOR INSERT WITH CHECK (true);

-- سياسة الشارات (الكل يمكنه رؤيتها)
DROP POLICY IF EXISTS "Anyone can view badges" ON badges;
CREATE POLICY "Anyone can view badges" ON badges
    FOR SELECT USING (is_active = TRUE);

-- =====================================================
-- 6. View للوحة المتصدرين (Leaderboard View)
-- =====================================================

CREATE OR REPLACE VIEW leaderboard AS
SELECT 
    ug.user_id,
    u.full_name,
    ug.total_points,
    ug.current_level,
    ug.current_streak,
    ug.chapters_completed,
    ug.exercises_completed,
    (SELECT COUNT(*) FROM user_badges ub WHERE ub.user_id = ug.user_id) as badges_count,
    RANK() OVER (ORDER BY ug.total_points DESC) as rank
FROM user_gamification ug
JOIN users u ON u.id = ug.user_id
WHERE u.is_active = TRUE
ORDER BY ug.total_points DESC;

-- =====================================================
-- 7. إدراج الشارات الأساسية
-- =====================================================

INSERT INTO badges (id, name_ar, name_en, description_ar, icon, category, points_reward, requirement_type, requirement_value, rarity) VALUES
-- شارات القراءة
('first_page', 'القارئ المبتدئ', 'First Page', 'قرأت أول صفحة في الكتاب', '📖', 'reading', 10, 'pages_read', 1, 'common'),
('reader_10', 'قارئ نشط', 'Active Reader', 'قرأت 10 صفحات', '📚', 'reading', 25, 'pages_read', 10, 'common'),
('reader_25', 'محب القراءة', 'Book Lover', 'قرأت 25 صفحة', '📕', 'reading', 50, 'pages_read', 25, 'uncommon'),
('reader_50', 'قارئ متمرس', 'Avid Reader', 'قرأت 50 صفحة', '📗', 'reading', 100, 'pages_read', 50, 'rare'),
('book_complete', 'أنهيت الكتاب', 'Book Complete', 'أكملت قراءة الكتاب كاملاً', '🏆', 'reading', 500, 'pages_read', 100, 'legendary'),

-- شارات الفصول
('chapter_1', 'الخطوة الأولى', 'First Step', 'أكملت الفصل الأول', '1️⃣', 'reading', 30, 'chapters_completed', 1, 'common'),
('chapter_3', 'في الطريق', 'On Track', 'أكملت 3 فصول', '3️⃣', 'reading', 75, 'chapters_completed', 3, 'uncommon'),
('chapter_6', 'نصف الطريق', 'Halfway There', 'أكملت 6 فصول', '🌗', 'reading', 150, 'chapters_completed', 6, 'rare'),
('all_chapters', 'خبير البرومبتات', 'Prompt Expert', 'أكملت جميع الفصول', '🎓', 'reading', 300, 'chapters_completed', 9, 'epic'),

-- شارات التمارين
('first_exercise', 'المتدرب', 'Trainee', 'أكملت أول تمرين', '✏️', 'exercises', 15, 'exercises_completed', 1, 'common'),
('exercises_5', 'مجتهد', 'Hard Worker', 'أكملت 5 تمارين', '💪', 'exercises', 40, 'exercises_completed', 5, 'common'),
('exercises_10', 'متفوق', 'High Achiever', 'أكملت 10 تمارين', '⭐', 'exercises', 80, 'exercises_completed', 10, 'uncommon'),
('exercises_20', 'محترف', 'Professional', 'أكملت 20 تمرين', '🌟', 'exercises', 150, 'exercises_completed', 20, 'rare'),
('all_exercises', 'أسطورة التمارين', 'Exercise Legend', 'أكملت جميع التمارين', '👑', 'exercises', 400, 'exercises_completed', 30, 'legendary'),

-- شارات الاختبارات
('quiz_ace', 'عبقري', 'Genius', 'حصلت على 100% في اختبار', '🧠', 'exercises', 50, 'perfect_quizzes', 1, 'uncommon'),
('quiz_master', 'سيد الاختبارات', 'Quiz Master', 'نجحت في 10 اختبارات', '🎯', 'exercises', 100, 'quizzes_passed', 10, 'rare'),

-- شارات Streak
('streak_3', 'ثابت', 'Consistent', '3 أيام متتالية من التعلم', '🔥', 'streak', 30, 'streak_days', 3, 'common'),
('streak_7', 'أسبوع كامل', 'Week Warrior', '7 أيام متتالية', '🔥', 'streak', 70, 'streak_days', 7, 'uncommon'),
('streak_14', 'أسبوعان', 'Two Weeks Strong', '14 يوم متتالي', '🔥', 'streak', 140, 'streak_days', 14, 'rare'),
('streak_30', 'شهر كامل', 'Monthly Master', '30 يوم متتالي', '🔥', 'streak', 300, 'streak_days', 30, 'epic'),
('streak_100', 'أسطوري', 'Legendary', '100 يوم متتالي', '💎', 'streak', 1000, 'streak_days', 100, 'legendary'),

-- شارات النقاط
('points_100', 'جامع النقاط', 'Point Collector', 'جمعت 100 نقطة', '💰', 'special', 0, 'total_points', 100, 'common'),
('points_500', 'ثري', 'Wealthy', 'جمعت 500 نقطة', '💎', 'special', 0, 'total_points', 500, 'uncommon'),
('points_1000', 'ملياردير', 'Billionaire', 'جمعت 1000 نقطة', '🏦', 'special', 0, 'total_points', 1000, 'rare'),
('points_5000', 'إمبراطور النقاط', 'Point Emperor', 'جمعت 5000 نقطة', '👸', 'special', 0, 'total_points', 5000, 'legendary'),

-- شارات خاصة
('early_bird', 'الطائر المبكر', 'Early Bird', 'تعلمت قبل الساعة 7 صباحاً', '🌅', 'special', 25, 'early_login', 1, 'uncommon'),
('night_owl', 'بومة الليل', 'Night Owl', 'تعلمت بعد منتصف الليل', '🦉', 'special', 25, 'late_login', 1, 'uncommon'),
('weekend_warrior', 'محارب الإجازة', 'Weekend Warrior', 'تعلمت في نهاية الأسبوع', '🎉', 'special', 20, 'weekend_login', 1, 'common')

ON CONFLICT (id) DO NOTHING;

-- =====================================================
-- 8. Function لتحديث Streak
-- =====================================================

CREATE OR REPLACE FUNCTION update_user_streak(p_user_id UUID)
RETURNS VOID AS $$
DECLARE
    v_last_activity DATE;
    v_current_streak INTEGER;
    v_longest_streak INTEGER;
    v_today DATE := CURRENT_DATE;
BEGIN
    -- جلب بيانات المستخدم
    SELECT last_activity_date, current_streak, longest_streak
    INTO v_last_activity, v_current_streak, v_longest_streak
    FROM user_gamification
    WHERE user_id = p_user_id;
    
    -- إذا لم يوجد سجل، أنشئ واحداً
    IF NOT FOUND THEN
        INSERT INTO user_gamification (user_id, current_streak, last_activity_date)
        VALUES (p_user_id, 1, v_today);
        RETURN;
    END IF;
    
    -- تحديث بناءً على آخر نشاط
    IF v_last_activity = v_today THEN
        -- نفس اليوم، لا تغيير
        RETURN;
    ELSIF v_last_activity = v_today - 1 THEN
        -- يوم أمس، زد الـ streak
        v_current_streak := v_current_streak + 1;
        IF v_current_streak > v_longest_streak THEN
            v_longest_streak := v_current_streak;
        END IF;
    ELSE
        -- انقطاع، ابدأ من جديد
        v_current_streak := 1;
    END IF;
    
    -- تحديث السجل
    UPDATE user_gamification
    SET 
        current_streak = v_current_streak,
        longest_streak = v_longest_streak,
        last_activity_date = v_today,
        updated_at = NOW()
    WHERE user_id = p_user_id;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- 9. Function لإضافة نقاط
-- =====================================================

CREATE OR REPLACE FUNCTION add_points(
    p_user_id UUID,
    p_points INTEGER,
    p_action_type VARCHAR(50),
    p_action_details JSONB DEFAULT NULL
)
RETURNS INTEGER AS $$
DECLARE
    v_new_total INTEGER;
    v_current_level INTEGER;
    v_new_level INTEGER;
BEGIN
    -- تأكد من وجود سجل
    INSERT INTO user_gamification (user_id)
    VALUES (p_user_id)
    ON CONFLICT (user_id) DO NOTHING;
    
    -- أضف النقاط
    UPDATE user_gamification
    SET 
        total_points = total_points + p_points,
        updated_at = NOW()
    WHERE user_id = p_user_id
    RETURNING total_points, current_level INTO v_new_total, v_current_level;
    
    -- احسب المستوى الجديد (كل 100 نقطة = مستوى)
    v_new_level := GREATEST(1, FLOOR(v_new_total / 100) + 1);
    
    -- حدث المستوى إذا تغير
    IF v_new_level > v_current_level THEN
        UPDATE user_gamification
        SET 
            current_level = v_new_level,
            points_to_next_level = (v_new_level * 100) - v_new_total
        WHERE user_id = p_user_id;
    ELSE
        UPDATE user_gamification
        SET points_to_next_level = (v_current_level * 100) - v_new_total
        WHERE user_id = p_user_id;
    END IF;
    
    -- سجل في التاريخ
    INSERT INTO points_history (user_id, points, action_type, action_details)
    VALUES (p_user_id, p_points, p_action_type, p_action_details);
    
    -- حدث الـ streak
    PERFORM update_user_streak(p_user_id);
    
    RETURN v_new_total;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- 10. Function للتحقق من الشارات الجديدة
-- =====================================================

CREATE OR REPLACE FUNCTION check_and_award_badges(p_user_id UUID)
RETURNS TABLE(badge_id VARCHAR(50), badge_name VARCHAR(100), badge_icon VARCHAR(10), points_reward INTEGER) AS $$
BEGIN
    RETURN QUERY
    WITH user_stats AS (
        SELECT 
            ug.total_points,
            ug.current_streak,
            ug.longest_streak,
            ug.pages_read,
            ug.chapters_completed,
            ug.exercises_completed,
            ug.quizzes_passed
        FROM user_gamification ug
        WHERE ug.user_id = p_user_id
    ),
    eligible_badges AS (
        SELECT b.id, b.name_ar, b.icon, b.points_reward
        FROM badges b, user_stats us
        WHERE b.is_active = TRUE
        AND NOT EXISTS (
            SELECT 1 FROM user_badges ub 
            WHERE ub.user_id = p_user_id AND ub.badge_id = b.id
        )
        AND (
            (b.requirement_type = 'pages_read' AND us.pages_read >= b.requirement_value)
            OR (b.requirement_type = 'chapters_completed' AND us.chapters_completed >= b.requirement_value)
            OR (b.requirement_type = 'exercises_completed' AND us.exercises_completed >= b.requirement_value)
            OR (b.requirement_type = 'streak_days' AND us.current_streak >= b.requirement_value)
            OR (b.requirement_type = 'total_points' AND us.total_points >= b.requirement_value)
            OR (b.requirement_type = 'quizzes_passed' AND us.quizzes_passed >= b.requirement_value)
        )
    )
    INSERT INTO user_badges (user_id, badge_id)
    SELECT p_user_id, eb.id
    FROM eligible_badges eb
    RETURNING user_badges.badge_id, 
              (SELECT name_ar FROM badges WHERE id = user_badges.badge_id),
              (SELECT icon FROM badges WHERE id = user_badges.badge_id),
              (SELECT badges.points_reward FROM badges WHERE id = user_badges.badge_id);
END;
$$ LANGUAGE plpgsql;
