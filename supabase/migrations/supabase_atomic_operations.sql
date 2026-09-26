-- ============================================================
-- Atomic Operations for Race Condition Prevention
-- ============================================================
-- These RPC functions prevent read-then-write race conditions
-- in gamification, exercise stats, and email tracking.
--
-- Run in Supabase SQL Editor
-- ============================================================

-- ─── 1. Atomic increment for email_sent counter ─────────────────────
CREATE OR REPLACE FUNCTION increment_email_sent(p_user_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    UPDATE email_preferences
    SET total_emails_sent = total_emails_sent + 1,
        last_email_sent_at = NOW(),
        updated_at = NOW()
    WHERE user_id = p_user_id;
END;
$$;

-- ─── 2. Atomic update for exercise stats ────────────────────────────
CREATE OR REPLACE FUNCTION update_exercise_stats_atomic(
    p_user_id UUID,
    p_exercise_type TEXT,
    p_is_correct BOOLEAN,
    p_points_earned INTEGER
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    INSERT INTO user_exercise_stats (
        user_id, total_completed, total_correct, total_points,
        quizzes_completed, fill_blanks_completed, prompt_builders_completed,
        last_exercise_at, updated_at
    ) VALUES (
        p_user_id, 1,
        CASE WHEN p_is_correct THEN 1 ELSE 0 END,
        p_points_earned,
        CASE WHEN p_exercise_type = 'quiz' THEN 1 ELSE 0 END,
        CASE WHEN p_exercise_type = 'fill_blank' THEN 1 ELSE 0 END,
        CASE WHEN p_exercise_type = 'prompt_builder' THEN 1 ELSE 0 END,
        NOW(), NOW()
    )
    ON CONFLICT (user_id) DO UPDATE SET
        total_completed = user_exercise_stats.total_completed + 1,
        total_correct = user_exercise_stats.total_correct + CASE WHEN p_is_correct THEN 1 ELSE 0 END,
        total_points = user_exercise_stats.total_points + p_points_earned,
        quizzes_completed = user_exercise_stats.quizzes_completed + CASE WHEN p_exercise_type = 'quiz' THEN 1 ELSE 0 END,
        fill_blanks_completed = user_exercise_stats.fill_blanks_completed + CASE WHEN p_exercise_type = 'fill_blank' THEN 1 ELSE 0 END,
        prompt_builders_completed = user_exercise_stats.prompt_builders_completed + CASE WHEN p_exercise_type = 'prompt_builder' THEN 1 ELSE 0 END,
        last_exercise_at = NOW(),
        updated_at = NOW();
END;
$$;

-- ─── 3. Atomic update for gamification points + streak ──────────────
CREATE OR REPLACE FUNCTION update_gamification_atomic(
    p_user_id UUID,
    p_points_earned INTEGER,
    p_action_type TEXT DEFAULT 'exercise_complete'
)
RETURNS TABLE(
    new_total_points INTEGER,
    new_level INTEGER,
    new_streak INTEGER,
    new_longest_streak INTEGER
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_current RECORD;
    v_today DATE := CURRENT_DATE;
    v_new_total INTEGER;
    v_new_exercises INTEGER;
    v_new_level INTEGER;
    v_new_streak INTEGER;
    v_new_longest INTEGER;
    v_diff_days INTEGER;
BEGIN
    -- Get current data with row lock
    SELECT * INTO v_current
    FROM user_gamification
    WHERE user_id = p_user_id
    FOR UPDATE;

    IF NOT FOUND THEN
        -- First time: insert
        v_new_total := p_points_earned;
        v_new_exercises := 1;
        v_new_level := LEAST(FLOOR(v_new_total / 100) + 1, 10);
        v_new_streak := 1;
        v_new_longest := 1;

        INSERT INTO user_gamification (
            user_id, total_points, current_level, points_to_next_level,
            current_streak, longest_streak, last_activity_date,
            exercises_completed, chapters_completed, total_reading_time_minutes, updated_at
        ) VALUES (
            p_user_id, v_new_total, v_new_level, 100 - (v_new_total % 100),
            v_new_streak, v_new_longest, v_today,
            v_new_exercises, 0, 0, NOW()
        );
    ELSE
        -- Existing: atomic increment
        v_new_total := v_current.total_points + p_points_earned;
        v_new_exercises := v_current.exercises_completed + 1;
        v_new_level := LEAST(FLOOR(v_new_total / 100) + 1, 10);

        -- Streak calculation
        v_diff_days := v_today - v_current.last_activity_date::date;
        IF v_diff_days = 1 THEN
            v_new_streak := v_current.current_streak + 1;
        ELSIF v_diff_days > 1 THEN
            v_new_streak := 1;
        ELSE
            v_new_streak := v_current.current_streak; -- same day
        END IF;
        v_new_longest := GREATEST(v_current.longest_streak, v_new_streak);

        UPDATE user_gamification SET
            total_points = v_new_total,
            current_level = v_new_level,
            points_to_next_level = 100 - (v_new_total % 100),
            current_streak = v_new_streak,
            longest_streak = v_new_longest,
            last_activity_date = v_today,
            exercises_completed = v_new_exercises,
            updated_at = NOW()
        WHERE user_id = p_user_id;
    END IF;

    new_total_points := v_new_total;
    new_level := v_new_level;
    new_streak := v_new_streak;
    new_longest_streak := v_new_longest;
    RETURN NEXT;
END;
$$;

-- ─── 4. Grant access to service_role ────────────────────────────────
GRANT EXECUTE ON FUNCTION increment_email_sent(UUID) TO service_role;
GRANT EXECUTE ON FUNCTION update_exercise_stats_atomic(UUID, TEXT, BOOLEAN, INTEGER) TO service_role;
GRANT EXECUTE ON FUNCTION update_gamification_atomic(UUID, INTEGER, TEXT) TO service_role;

-- Revoke from anon/authenticated (these should only be called server-side)
REVOKE EXECUTE ON FUNCTION increment_email_sent(UUID) FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION update_exercise_stats_atomic(UUID, TEXT, BOOLEAN, INTEGER) FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION update_gamification_atomic(UUID, INTEGER, TEXT) FROM anon, authenticated;
