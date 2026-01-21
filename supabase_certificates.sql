-- =====================================================
-- جدول شهادات المستخدمين - User Certificates Table
-- =====================================================
-- يخزن معلومات شهادات الإتمام للمستخدمين

CREATE TABLE IF NOT EXISTS user_certificates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    certificate_id VARCHAR(50) UNIQUE NOT NULL,
    issued_at TIMESTAMPTZ DEFAULT NOW(),
    total_points INTEGER DEFAULT 0,
    completed_exercises INTEGER DEFAULT 0,
    reading_time_minutes INTEGER DEFAULT 0,
    
    -- التأكد من أن كل مستخدم له شهادة واحدة فقط
    UNIQUE(user_id)
);

-- =====================================================
-- جدول إنجازات المستخدمين - User Achievements Table
-- =====================================================
-- يتتبع الإنجازات التي فتحها كل مستخدم

CREATE TABLE IF NOT EXISTS user_achievements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    achievement_id VARCHAR(50) NOT NULL,
    unlocked_at TIMESTAMPTZ DEFAULT NOW(),
    points_awarded INTEGER DEFAULT 0,
    
    -- التأكد من عدم تكرار نفس الإنجاز للمستخدم
    UNIQUE(user_id, achievement_id)
);

-- =====================================================
-- الفهارس - Indexes
-- =====================================================

CREATE INDEX IF NOT EXISTS idx_user_certificates_user 
ON user_certificates(user_id);

CREATE INDEX IF NOT EXISTS idx_user_certificates_cert_id 
ON user_certificates(certificate_id);

CREATE INDEX IF NOT EXISTS idx_user_achievements_user 
ON user_achievements(user_id);

CREATE INDEX IF NOT EXISTS idx_user_achievements_achievement 
ON user_achievements(achievement_id);

-- =====================================================
-- RLS Policies - سياسات الأمان
-- =====================================================

ALTER TABLE user_certificates ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_achievements ENABLE ROW LEVEL SECURITY;

-- ملاحظة: يستخدم المشروع نظام auth مخصص وليس Supabase Auth
-- لذلك نسمح بالوصول عبر anon key مع التحقق من user_id في الكود

-- سياسات جدول الشهادات
DROP POLICY IF EXISTS "Users can view own certificates" ON user_certificates;
CREATE POLICY "Users can view own certificates"
ON user_certificates FOR SELECT
USING (true);

DROP POLICY IF EXISTS "Users can insert own certificates" ON user_certificates;
CREATE POLICY "Users can insert own certificates"
ON user_certificates FOR INSERT
WITH CHECK (true);

-- سياسات جدول الإنجازات
DROP POLICY IF EXISTS "Users can view own achievements" ON user_achievements;
CREATE POLICY "Users can view own achievements"
ON user_achievements FOR SELECT
USING (true);

DROP POLICY IF EXISTS "Users can insert own achievements" ON user_achievements;
CREATE POLICY "Users can insert own achievements"
ON user_achievements FOR INSERT
WITH CHECK (true);

-- =====================================================
-- دالة التحقق من الإنجازات وفتحها
-- Check and Unlock Achievements Function
-- =====================================================

CREATE OR REPLACE FUNCTION check_and_unlock_achievements(p_user_id UUID)
RETURNS TABLE (
    achievement_id VARCHAR(50),
    points_awarded INTEGER,
    newly_unlocked BOOLEAN
) AS $$
DECLARE
    v_completed_chapters INTEGER;
    v_completed_exercises INTEGER;
    v_current_streak INTEGER;
    v_total_points INTEGER;
    v_bookmarks_count INTEGER;
BEGIN
    -- جلب إحصائيات المستخدم
    -- completed_chapters هو array في reading_progress
    SELECT COALESCE(array_length(completed_chapters, 1), 0) INTO v_completed_chapters
    FROM reading_progress
    WHERE user_id = p_user_id;
    
    SELECT COUNT(*) INTO v_completed_exercises
    FROM exercise_progress
    WHERE user_id = p_user_id AND is_completed = true;
    
    SELECT COALESCE(current_streak, 0), COALESCE(total_points, 0)
    INTO v_current_streak, v_total_points
    FROM user_gamification
    WHERE user_id = p_user_id;
    
    -- جلب عدد الإشارات المرجعية من reading_progress.bookmarks
    SELECT COALESCE(jsonb_array_length(bookmarks::jsonb), 0) INTO v_bookmarks_count
    FROM reading_progress
    WHERE user_id = p_user_id;
    
    -- إرجاع الإنجازات المؤهلة
    RETURN QUERY
    WITH achievement_checks AS (
        -- إنجازات القراءة
        SELECT 'first_chapter'::VARCHAR(50) AS ach_id, 50 AS points, v_completed_chapters >= 1 AS qualified
        UNION ALL
        SELECT 'three_chapters', 100, v_completed_chapters >= 3
        UNION ALL
        SELECT 'half_book', 200, v_completed_chapters >= 5
        UNION ALL
        SELECT 'full_book', 500, v_completed_chapters >= 9
        
        -- إنجازات التمارين
        UNION ALL
        SELECT 'first_exercise', 30, v_completed_exercises >= 1
        UNION ALL
        SELECT 'five_exercises', 100, v_completed_exercises >= 5
        UNION ALL
        SELECT 'ten_exercises', 200, v_completed_exercises >= 10
        UNION ALL
        SELECT 'twenty_exercises', 400, v_completed_exercises >= 20
        UNION ALL
        SELECT 'all_exercises', 600, v_completed_exercises >= 30
        
        -- إنجازات الـ Streak
        UNION ALL
        SELECT 'streak_3', 50, v_current_streak >= 3
        UNION ALL
        SELECT 'streak_7', 150, v_current_streak >= 7
        UNION ALL
        SELECT 'streak_14', 300, v_current_streak >= 14
        UNION ALL
        SELECT 'streak_30', 500, v_current_streak >= 30
        UNION ALL
        SELECT 'streak_100', 1000, v_current_streak >= 100
        
        -- إنجازات النقاط
        UNION ALL
        SELECT 'points_500', 50, v_total_points >= 500
        UNION ALL
        SELECT 'points_1000', 100, v_total_points >= 1000
        UNION ALL
        SELECT 'points_5000', 250, v_total_points >= 5000
        
        -- إنجازات خاصة
        UNION ALL
        SELECT 'bookmarks_10', 75, v_bookmarks_count >= 10
    )
    SELECT 
        ac.ach_id,
        ac.points,
        NOT EXISTS (
            SELECT 1 FROM user_achievements ua 
            WHERE ua.user_id = p_user_id AND ua.achievement_id = ac.ach_id
        ) AS newly_unlocked
    FROM achievement_checks ac
    WHERE ac.qualified = true;
    
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- دالة فتح إنجاز جديد
-- Unlock Achievement Function
-- =====================================================

CREATE OR REPLACE FUNCTION unlock_achievement(
    p_user_id UUID,
    p_achievement_id VARCHAR(50),
    p_points INTEGER
)
RETURNS BOOLEAN AS $$
DECLARE
    v_already_unlocked BOOLEAN;
BEGIN
    -- التحقق من أن الإنجاز غير مفتوح مسبقاً
    SELECT EXISTS (
        SELECT 1 FROM user_achievements
        WHERE user_id = p_user_id AND achievement_id = p_achievement_id
    ) INTO v_already_unlocked;
    
    IF v_already_unlocked THEN
        RETURN FALSE;
    END IF;
    
    -- إضافة الإنجاز
    INSERT INTO user_achievements (user_id, achievement_id, points_awarded)
    VALUES (p_user_id, p_achievement_id, p_points);
    
    -- إضافة النقاط للمستخدم
    UPDATE user_gamification
    SET total_points = total_points + p_points
    WHERE user_id = p_user_id;
    
    -- تسجيل في سجل النقاط
    INSERT INTO points_history (user_id, points, action_type, action_details)
    VALUES (p_user_id, p_points, 'achievement', jsonb_build_object('achievement_id', p_achievement_id, 'description', 'فتح إنجاز: ' || p_achievement_id));
    
    RETURN TRUE;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- دالة إنشاء شهادة
-- Generate Certificate Function
-- =====================================================

CREATE OR REPLACE FUNCTION generate_certificate(p_user_id UUID)
RETURNS VARCHAR(50) AS $$
DECLARE
    v_cert_id VARCHAR(50);
    v_completed_chapters INTEGER;
    v_total_points INTEGER;
    v_completed_exercises INTEGER;
BEGIN
    -- التحقق من إتمام الكتاب
    -- completed_chapters هو array في reading_progress
    SELECT COALESCE(array_length(completed_chapters, 1), 0) INTO v_completed_chapters
    FROM reading_progress
    WHERE user_id = p_user_id;
    
    IF v_completed_chapters < 9 THEN
        RAISE EXCEPTION 'لم تكتمل قراءة الكتاب بعد';
    END IF;
    
    -- التحقق من وجود شهادة سابقة
    SELECT certificate_id INTO v_cert_id
    FROM user_certificates
    WHERE user_id = p_user_id;
    
    IF v_cert_id IS NOT NULL THEN
        RETURN v_cert_id;
    END IF;
    
    -- إنشاء رقم شهادة جديد
    v_cert_id := 'CERT-' || UPPER(TO_CHAR(NOW(), 'YYYYMMDD')) || '-' || 
                 UPPER(SUBSTRING(p_user_id::TEXT, 1, 8));
    
    -- جلب الإحصائيات
    SELECT COALESCE(total_points, 0) INTO v_total_points
    FROM user_gamification WHERE user_id = p_user_id;
    
    SELECT COUNT(*) INTO v_completed_exercises
    FROM exercise_progress WHERE user_id = p_user_id AND is_completed = true;
    
    -- إنشاء الشهادة
    INSERT INTO user_certificates (user_id, certificate_id, total_points, completed_exercises)
    VALUES (p_user_id, v_cert_id, v_total_points, v_completed_exercises);
    
    -- فتح إنجاز الشهادة الأولى
    PERFORM unlock_achievement(p_user_id, 'first_certificate', 500);
    
    RETURN v_cert_id;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- View لعرض إنجازات المستخدمين
-- User Achievements View
-- =====================================================

CREATE OR REPLACE VIEW user_achievements_summary AS
SELECT 
    ua.user_id,
    u.full_name as user_name,
    COUNT(*) as total_achievements,
    SUM(ua.points_awarded) as total_achievement_points,
    MAX(ua.unlocked_at) as last_achievement_date
FROM user_achievements ua
JOIN users u ON ua.user_id = u.id
GROUP BY ua.user_id, u.full_name;

-- =====================================================
-- Trigger لفحص الإنجازات عند تحديث التقدم
-- =====================================================

CREATE OR REPLACE FUNCTION trigger_check_achievements()
RETURNS TRIGGER AS $$
BEGIN
    -- فحص وفتح الإنجازات الجديدة
    PERFORM check_and_unlock_achievements(NEW.user_id);
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- تطبيق الـ Trigger على جداول مختلفة
DROP TRIGGER IF EXISTS check_achievements_on_progress ON reading_progress;
CREATE TRIGGER check_achievements_on_progress
    AFTER INSERT OR UPDATE ON reading_progress
    FOR EACH ROW
    EXECUTE FUNCTION trigger_check_achievements();

DROP TRIGGER IF EXISTS check_achievements_on_exercises ON exercise_progress;
CREATE TRIGGER check_achievements_on_exercises
    AFTER INSERT OR UPDATE ON exercise_progress
    FOR EACH ROW
    EXECUTE FUNCTION trigger_check_achievements();
