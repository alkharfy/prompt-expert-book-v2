-- ============================================
-- تحديث دالة update_user_streak لإضافة FOR UPDATE
-- لمنع Race Conditions عند تحديث الـ Streak
-- ============================================

-- الدالة الأصلية لا تستخدم FOR UPDATE مما يسمح لطلبين متزامنين
-- بقراءة نفس القيمة وتحديثها بشكل خاطئ

CREATE OR REPLACE FUNCTION update_user_streak(p_user_id UUID)
RETURNS VOID AS $$
DECLARE
    v_last_activity DATE;
    v_current_streak INTEGER;
    v_longest_streak INTEGER;
    v_today DATE := CURRENT_DATE;
BEGIN
    -- قفل الصف لمنع التعديل المتزامن (FOR UPDATE)
    SELECT last_activity_date, current_streak, longest_streak
    INTO v_last_activity, v_current_streak, v_longest_streak
    FROM user_gamification
    WHERE user_id = p_user_id
    FOR UPDATE;

    -- إذا لم يوجد سجل، أنشئ واحداً
    IF NOT FOUND THEN
        INSERT INTO user_gamification (user_id, current_streak, longest_streak, last_activity_date)
        VALUES (p_user_id, 1, 1, v_today)
        ON CONFLICT (user_id) DO NOTHING;

        -- إذا فشل INSERT بسبب تزامن، أعد المحاولة بقراءة مقفلة
        IF NOT FOUND THEN
            SELECT last_activity_date, current_streak, longest_streak
            INTO v_last_activity, v_current_streak, v_longest_streak
            FROM user_gamification
            WHERE user_id = p_user_id
            FOR UPDATE;
        ELSE
            RETURN;
        END IF;
    END IF;

    -- تحديث بناءً على آخر نشاط
    IF v_last_activity = v_today THEN
        -- نفس اليوم، لا تغيير
        RETURN;
    ELSIF v_last_activity = v_today - 1 THEN
        -- يوم أمس، زد الـ streak
        v_current_streak := v_current_streak + 1;
    ELSE
        -- انقطاع، ابدأ من جديد
        v_current_streak := 1;
    END IF;

    v_longest_streak := GREATEST(v_longest_streak, v_current_streak);

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
