-- Review and apply with the server award changes. NOT run on production.
-- No scores, progress, claims or historical certificates are reset/deleted.
-- The indexes intentionally fail if historical duplicates exist: review such
-- records before deployment instead of silently deleting a customer's data.
BEGIN;

CREATE UNIQUE INDEX IF NOT EXISTS exercise_progress_user_exercise_once
    ON public.exercise_progress (user_id, exercise_id);
CREATE UNIQUE INDEX IF NOT EXISTS user_claimed_rewards_user_reward_once
    ON public.user_claimed_rewards (user_id, reward_id);

-- The old trigger also increments stats on insertion. The atomic completion
-- function now owns that work; retaining both would double-count new attempts.
DROP TRIGGER IF EXISTS trigger_update_exercise_stats ON public.exercise_progress;

REVOKE ALL ON public.exercise_progress, public.user_exercise_stats,
    public.user_gamification, public.points_history, public.user_claimed_rewards
    FROM PUBLIC, anon, authenticated;
GRANT ALL ON public.exercise_progress, public.user_exercise_stats,
    public.user_gamification, public.points_history, public.user_claimed_rewards TO service_role;

-- Each caller below inserts the unique activity and invokes this helper in
-- the same transaction. The functions deliberately have no exception fallback:
-- any stats/history/XP failure rolls the activity insert back too.
CREATE OR REPLACE FUNCTION public.apply_learning_award(
    p_user_id UUID, p_points INTEGER, p_exercise_type TEXT,
    p_is_correct BOOLEAN, p_action_type TEXT, p_details JSONB
) RETURNS VOID
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp AS $$
DECLARE
    v_exercise_count INTEGER := CASE WHEN p_exercise_type IS NULL THEN 0 ELSE 1 END;
BEGIN
    IF p_user_id IS NULL OR p_points IS NULL OR p_points < 0 OR p_points > 1000 THEN
        RAISE EXCEPTION 'Invalid award';
    END IF;
    IF p_exercise_type IS NOT NULL THEN
        INSERT INTO public.user_exercise_stats (
            user_id, total_completed, total_correct, total_points,
            quizzes_completed, fill_blanks_completed, prompt_builders_completed,
            last_exercise_at, updated_at
        ) VALUES (
            p_user_id, 1, CASE WHEN p_is_correct IS TRUE THEN 1 ELSE 0 END, p_points,
            CASE WHEN p_exercise_type = 'quiz' THEN 1 ELSE 0 END,
            CASE WHEN p_exercise_type = 'fill_blank' THEN 1 ELSE 0 END,
            CASE WHEN p_exercise_type = 'prompt_builder' THEN 1 ELSE 0 END, NOW(), NOW()
        ) ON CONFLICT (user_id) DO UPDATE SET
            total_completed = COALESCE(user_exercise_stats.total_completed, 0) + 1,
            total_correct = COALESCE(user_exercise_stats.total_correct, 0) + EXCLUDED.total_correct,
            total_points = COALESCE(user_exercise_stats.total_points, 0) + EXCLUDED.total_points,
            quizzes_completed = COALESCE(user_exercise_stats.quizzes_completed, 0) + EXCLUDED.quizzes_completed,
            fill_blanks_completed = COALESCE(user_exercise_stats.fill_blanks_completed, 0) + EXCLUDED.fill_blanks_completed,
            prompt_builders_completed = COALESCE(user_exercise_stats.prompt_builders_completed, 0) + EXCLUDED.prompt_builders_completed,
            last_exercise_at = NOW(), updated_at = NOW();
    END IF;

    INSERT INTO public.user_gamification (
        user_id, total_points, current_level, points_to_next_level,
        current_streak, longest_streak, last_activity_date, exercises_completed, updated_at
    ) VALUES (
        p_user_id, p_points, LEAST(p_points / 100 + 1, 10), 100 - (p_points % 100),
        1, 1, CURRENT_DATE, v_exercise_count, NOW()
    ) ON CONFLICT (user_id) DO UPDATE SET
        total_points = COALESCE(user_gamification.total_points, 0) + EXCLUDED.total_points,
        current_level = LEAST((COALESCE(user_gamification.total_points, 0) + EXCLUDED.total_points) / 100 + 1, 10),
        points_to_next_level = 100 - ((COALESCE(user_gamification.total_points, 0) + EXCLUDED.total_points) % 100),
        current_streak = CASE
            WHEN user_gamification.last_activity_date = CURRENT_DATE THEN GREATEST(COALESCE(user_gamification.current_streak, 0), 1)
            WHEN user_gamification.last_activity_date = CURRENT_DATE - 1 THEN COALESCE(user_gamification.current_streak, 0) + 1
            ELSE 1 END,
        longest_streak = GREATEST(COALESCE(user_gamification.longest_streak, 0), CASE
            WHEN user_gamification.last_activity_date = CURRENT_DATE THEN GREATEST(COALESCE(user_gamification.current_streak, 0), 1)
            WHEN user_gamification.last_activity_date = CURRENT_DATE - 1 THEN COALESCE(user_gamification.current_streak, 0) + 1
            ELSE 1 END),
        last_activity_date = CURRENT_DATE,
        exercises_completed = COALESCE(user_gamification.exercises_completed, 0) + EXCLUDED.exercises_completed,
        updated_at = NOW();

    INSERT INTO public.points_history (user_id, points, action_type, action_details)
    VALUES (p_user_id, p_points, p_action_type, COALESCE(p_details, '{}'::jsonb) || jsonb_build_object('timestamp', NOW()));
END $$;

CREATE OR REPLACE FUNCTION public.complete_learning_exercise(p_user_id UUID, p_exercise JSONB)
RETURNS JSONB LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp AS $$
DECLARE
    v_record public.exercise_progress%ROWTYPE;
    v_id TEXT := p_exercise->>'exercise_id';
    v_type TEXT := p_exercise->>'exercise_type';
    v_section TEXT := p_exercise->>'section_id';
    v_answer TEXT := p_exercise->>'user_answer';
    v_correct BOOLEAN := (p_exercise->>'is_correct')::boolean;
    v_points INTEGER := (p_exercise->>'points_earned')::integer;
BEGIN
    IF p_user_id IS NULL OR v_id IS NULL OR length(v_id) NOT BETWEEN 1 AND 100
        OR v_type IS NULL OR v_type NOT IN ('quiz', 'fill_blank', 'prompt_builder')
        OR v_section IS NULL OR length(v_section) NOT BETWEEN 1 AND 100
        OR v_answer IS NULL OR length(v_answer) > 20000
        OR v_points IS NULL OR v_points NOT BETWEEN 0 AND 100
        OR (v_type = 'prompt_builder' AND v_correct IS NOT NULL)
        OR (v_type IN ('quiz', 'fill_blank') AND v_correct IS NULL) THEN
        RAISE EXCEPTION 'Invalid exercise';
    END IF;
    INSERT INTO public.exercise_progress (
        user_id, exercise_id, exercise_type, section_id, user_answer,
        is_completed, is_correct, points_earned, completed_at, last_attempt_at
    ) VALUES (
        p_user_id, v_id, v_type, v_section, v_answer, true, v_correct, v_points, NOW(), NOW()
    ) ON CONFLICT (user_id, exercise_id) DO NOTHING RETURNING * INTO v_record;
    IF NOT FOUND THEN
        SELECT * INTO v_record FROM public.exercise_progress
            WHERE user_id = p_user_id AND exercise_id = v_id FOR UPDATE;
        IF v_record.is_completed IS TRUE THEN
            RETURN jsonb_build_object('alreadyCompleted', true, 'record', to_jsonb(v_record));
        END IF;
        -- An older uncompleted draft can transition once, under the row lock.
        -- Preserve its identity/creation history; new grading comes from the server.
        UPDATE public.exercise_progress SET exercise_type = v_type, section_id = v_section,
            user_answer = v_answer, is_completed = true, is_correct = v_correct,
            points_earned = v_points, completed_at = NOW(), last_attempt_at = NOW()
            WHERE user_id = p_user_id AND exercise_id = v_id AND is_completed IS DISTINCT FROM true
            RETURNING * INTO v_record;
        IF NOT FOUND THEN RAISE EXCEPTION 'Exercise draft could not be completed'; END IF;
    END IF;
    PERFORM public.apply_learning_award(p_user_id, v_points, v_type, v_correct,
        'exercise_complete', jsonb_build_object('exercise_id', v_id));
    RETURN jsonb_build_object('alreadyCompleted', false, 'record', to_jsonb(v_record));
END $$;

CREATE OR REPLACE FUNCTION public.claim_learning_reward(p_user_id UUID, p_reward_id TEXT, p_points INTEGER)
RETURNS JSONB LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp AS $$
DECLARE v_claim UUID;
BEGIN
    IF p_user_id IS NULL OR p_reward_id IS NULL OR length(p_reward_id) NOT BETWEEN 1 AND 100
        OR p_points IS NULL OR p_points NOT BETWEEN 0 AND 1000 THEN
        RAISE EXCEPTION 'Invalid reward';
    END IF;
    INSERT INTO public.user_claimed_rewards (user_id, reward_id)
    VALUES (p_user_id, p_reward_id)
    ON CONFLICT (user_id, reward_id) DO NOTHING RETURNING id INTO v_claim;
    IF NOT FOUND THEN RETURN jsonb_build_object('alreadyClaimed', true, 'pointsEarned', 0); END IF;
    PERFORM public.apply_learning_award(p_user_id, p_points, NULL, NULL,
        'mission_complete', jsonb_build_object('reward_id', p_reward_id));
    RETURN jsonb_build_object('alreadyClaimed', false, 'pointsEarned', p_points);
END $$;

-- Server notes/reading/missions still use the earlier RPC. Preserve its return
-- contract while counting only actual exercise events as exercises.
CREATE OR REPLACE FUNCTION public.update_gamification_atomic(
    p_user_id UUID, p_points_earned INTEGER, p_action_type TEXT DEFAULT 'exercise_complete'
) RETURNS TABLE(new_total_points INTEGER, new_level INTEGER, new_streak INTEGER, new_longest_streak INTEGER)
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp AS $$
DECLARE v_exercise_count INTEGER := CASE WHEN p_action_type = 'exercise_complete' THEN 1 ELSE 0 END;
BEGIN
    INSERT INTO public.user_gamification (
        user_id, total_points, current_level, points_to_next_level,
        current_streak, longest_streak, last_activity_date, exercises_completed, updated_at
    ) VALUES (
        p_user_id, p_points_earned, LEAST(p_points_earned / 100 + 1, 10), 100 - (p_points_earned % 100),
        1, 1, CURRENT_DATE, v_exercise_count, NOW()
    ) ON CONFLICT (user_id) DO UPDATE SET
        total_points = COALESCE(user_gamification.total_points, 0) + EXCLUDED.total_points,
        current_level = LEAST((COALESCE(user_gamification.total_points, 0) + EXCLUDED.total_points) / 100 + 1, 10),
        points_to_next_level = 100 - ((COALESCE(user_gamification.total_points, 0) + EXCLUDED.total_points) % 100),
        current_streak = CASE
            WHEN user_gamification.last_activity_date = CURRENT_DATE THEN GREATEST(COALESCE(user_gamification.current_streak, 0), 1)
            WHEN user_gamification.last_activity_date = CURRENT_DATE - 1 THEN COALESCE(user_gamification.current_streak, 0) + 1
            ELSE 1 END,
        longest_streak = GREATEST(COALESCE(user_gamification.longest_streak, 0), CASE
            WHEN user_gamification.last_activity_date = CURRENT_DATE THEN GREATEST(COALESCE(user_gamification.current_streak, 0), 1)
            WHEN user_gamification.last_activity_date = CURRENT_DATE - 1 THEN COALESCE(user_gamification.current_streak, 0) + 1
            ELSE 1 END),
        last_activity_date = CURRENT_DATE,
        exercises_completed = COALESCE(user_gamification.exercises_completed, 0) + EXCLUDED.exercises_completed,
        updated_at = NOW();
    RETURN QUERY SELECT g.total_points, g.current_level, g.current_streak, g.longest_streak
        FROM public.user_gamification AS g WHERE g.user_id = p_user_id;
END $$;

REVOKE EXECUTE ON FUNCTION public.apply_learning_award(UUID, INTEGER, TEXT, BOOLEAN, TEXT, JSONB),
    public.complete_learning_exercise(UUID, JSONB), public.claim_learning_reward(UUID, TEXT, INTEGER)
    FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.apply_learning_award(UUID, INTEGER, TEXT, BOOLEAN, TEXT, JSONB),
    public.complete_learning_exercise(UUID, JSONB), public.claim_learning_reward(UUID, TEXT, INTEGER) TO service_role;

-- Revoking a role's explicit grant is insufficient while PUBLIC can execute a
-- SECURITY DEFINER function. Server calls retain their explicit permission.
DO $$
DECLARE
    target_signature TEXT;
    target_function REGPROCEDURE;
BEGIN
    FOREACH target_signature IN ARRAY ARRAY[
        'public.update_exercise_stats_atomic(uuid,text,boolean,integer)',
        'public.update_gamification_atomic(uuid,integer,text)',
        'public.increment_email_sent(uuid)'
    ] LOOP
        target_function := to_regprocedure(target_signature);
        IF target_function IS NOT NULL THEN
            EXECUTE format('REVOKE EXECUTE ON FUNCTION %s FROM PUBLIC, anon, authenticated', target_function);
            EXECUTE format('GRANT EXECUTE ON FUNCTION %s TO service_role', target_function);
        END IF;
    END LOOP;
END $$;

COMMIT;
