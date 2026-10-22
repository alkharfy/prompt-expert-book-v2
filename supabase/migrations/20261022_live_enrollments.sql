-- ============================================
-- «تحدّي ٣ أيام لايف» enrollments (owner decision 2026-10-22)
-- A separate paid product: one cohort a month on the 10th. It is NOT a subscription:
-- paying for it never touches subscriptions or users.current_plan / is_active.
-- The payment row lives in `payments` with plan_id = 'live' and notes 'live:<cohort>|wa:<number>'.
--
-- Run this BEFORE the first live sale (the activation code writes here). Safe to re-run.
-- ============================================

BEGIN;

-- 1) payments.plan_id must accept 'live' (drop an old plan CHECK if one exists)
DO $$
DECLARE r record;
BEGIN
  FOR r IN
    SELECT con.conname
    FROM pg_constraint con
    JOIN pg_class rel ON rel.oid = con.conrelid
    JOIN pg_namespace nsp ON nsp.oid = rel.relnamespace
    WHERE nsp.nspname = 'public' AND rel.relname = 'payments' AND con.contype = 'c'
      AND pg_get_constraintdef(con.oid) ILIKE '%plan_id%'
  LOOP
    EXECUTE format('ALTER TABLE public.payments DROP CONSTRAINT %I', r.conname);
  END LOOP;
END $$;

-- 2) One row per paid seat
CREATE TABLE IF NOT EXISTS public.live_enrollments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  cohort_id text NOT NULL,            -- e.g. '2026-11' (starts on the 10th)
  payment_id uuid NOT NULL UNIQUE REFERENCES public.payments(id),
  amount numeric NOT NULL,
  whatsapp text,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, cohort_id)
);

CREATE INDEX IF NOT EXISTS live_enrollments_cohort_idx ON public.live_enrollments (cohort_id);

-- Server-only table: the service role writes and reads it; no browser access.
ALTER TABLE public.live_enrollments ENABLE ROW LEVEL SECURITY;

COMMIT;

-- Who is in the next cohort (for sending the Zoom/Meet link and the WhatsApp group):
-- SELECT e.cohort_id, u.full_name, u.email, e.whatsapp, e.amount, e.created_at
-- FROM live_enrollments e JOIN users u ON u.id = e.user_id
-- WHERE e.cohort_id = '2026-11' ORDER BY e.created_at;
