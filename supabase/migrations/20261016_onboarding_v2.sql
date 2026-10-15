-- Onboarding v2 (profession / AI level / minutes per day).
-- Apply to production BEFORE deploying the onboarding-v2 code. NOT run yet.
-- Additive and safe to rerun: no existing row or value is changed or removed.
--
-- * New nullable answer columns, each with a CHECK. NULL = "not answered"
--   (legacy readers are never given an invented level or time).
-- * learning_goal stops being asked, so it may be NULL. No code reads its value.
-- * The legacy CHECKs on specialization / learning_path / learning_duration stay;
--   v2 rows still write values from those lists so older code keeps working.
-- Rollback: redeploy the previous code. These columns are harmless to it.
BEGIN;

ALTER TABLE public.user_learning_preferences
  ADD COLUMN IF NOT EXISTS profession         text,
  ADD COLUMN IF NOT EXISTS ai_level           text,
  ADD COLUMN IF NOT EXISTS daily_minutes      smallint,
  ADD COLUMN IF NOT EXISTS onboarding_status  text,
  ADD COLUMN IF NOT EXISTS onboarding_version smallint,
  ADD COLUMN IF NOT EXISTS onboarded_at       timestamptz;

ALTER TABLE public.user_learning_preferences
  ALTER COLUMN learning_goal DROP NOT NULL;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint
                 WHERE conname = 'user_learning_preferences_profession_check'
                   AND conrelid = 'public.user_learning_preferences'::regclass) THEN
    ALTER TABLE public.user_learning_preferences
      ADD CONSTRAINT user_learning_preferences_profession_check
      CHECK (profession IS NULL OR profession IN (
        'accounting', 'hr_admin', 'teacher', 'marketing_business',
        'sales_service', 'student_jobseeker', 'programmer', 'other'));
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_constraint
                 WHERE conname = 'user_learning_preferences_ai_level_check'
                   AND conrelid = 'public.user_learning_preferences'::regclass) THEN
    ALTER TABLE public.user_learning_preferences
      ADD CONSTRAINT user_learning_preferences_ai_level_check
      CHECK (ai_level IS NULL OR ai_level IN ('new', 'some', 'daily'));
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_constraint
                 WHERE conname = 'user_learning_preferences_daily_minutes_check'
                   AND conrelid = 'public.user_learning_preferences'::regclass) THEN
    ALTER TABLE public.user_learning_preferences
      ADD CONSTRAINT user_learning_preferences_daily_minutes_check
      CHECK (daily_minutes IS NULL OR daily_minutes IN (10, 20, 30));
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_constraint
                 WHERE conname = 'user_learning_preferences_onboarding_status_check'
                   AND conrelid = 'public.user_learning_preferences'::regclass) THEN
    ALTER TABLE public.user_learning_preferences
      ADD CONSTRAINT user_learning_preferences_onboarding_status_check
      CHECK (onboarding_status IS NULL OR onboarding_status IN ('completed', 'skipped'));
  END IF;
END $$;

COMMIT;

-- Verify (read-only):
-- SELECT conname, pg_get_constraintdef(oid) FROM pg_constraint
-- WHERE conrelid = 'public.user_learning_preferences'::regclass ORDER BY conname;
