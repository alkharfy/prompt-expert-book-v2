-- Onboarding v2 — before/after comparison (READ-ONLY; counts only).
-- GA4 events for the same funnel: onboarding_view / _answer / _skip / _complete / _save_error /
-- _first_check / _plan / _start, and try_copy (intro p1). All carry version: 2.
-- Note: paid_within_30d counts payments.status='success' only; some older activations
-- were never marked success (see Kashier reconciliation), so treat it as a lower bound.

-- READ-ONLY before/after comparison for the onboarding rebuild. Counts only (no names/emails/ids).
-- Run AFTER the onboarding migration is applied (it reads the new columns).
-- 1) Put the real go-live time of the new onboarding in onboarding_live.
-- 2) Only accounts at least 7 days old are counted, so every cohort had the same week to read.
WITH params AS (
  SELECT timestamptz '2026-10-15 15:16+00' AS content_live,     -- new homepage/intro/ch.1 went live
         timestamptz '2026-10-20 00:00+00' AS onboarding_live   -- << replace with the real deploy time
),
cohort AS (
  SELECT u.id, u.created_at,
         CASE WHEN u.created_at < p.content_live    THEN '0_old_content_old_onboarding'
              WHEN u.created_at < p.onboarding_live THEN '1_new_content_old_onboarding'
              ELSE                                      '2_new_onboarding' END AS cohort
  FROM public.users u CROSS JOIN params p
  WHERE u.created_at >= p.content_live - interval '60 days'
    AND u.created_at <= now() - interval '7 days'
)
SELECT c.cohort,
       count(*)                                                                  AS signups,
       count(*) FILTER (WHERE rp.current_page >= 7)                              AS reached_chapter_1,      -- global 7 = ch.1 p.1
       count(*) FILTER (WHERE rp.current_page > 1)                               AS moved_past_page_1,      -- inflated by routing (p3 / next); secondary
       count(*) FILTER (WHERE rp.last_read_time >= c.created_at + interval '1 day') AS came_back_after_day_1,
       count(*) FILTER (WHERE pr.onboarding_status = 'completed')                AS onboarding_completed,
       count(*) FILTER (WHERE pr.onboarding_status = 'skipped')                  AS onboarding_skipped,
       count(*) FILTER (WHERE ps.user_id IS NOT NULL)                            AS has_active_plan,
       count(*) FILTER (WHERE pay.user_id IS NOT NULL)                           AS paid_within_30d
FROM cohort c
LEFT JOIN public.reading_progress rp            ON rp.user_id::text = c.id::text
LEFT JOIN public.user_learning_preferences pr   ON pr.user_id::text = c.id::text
LEFT JOIN public.learning_plan_summary ps       ON ps.user_id = c.id::text AND ps.is_active
LEFT JOIN LATERAL (
  SELECT x.user_id FROM public.payments x
  WHERE x.user_id::text = c.id::text AND x.status = 'success'
    AND x.created_at < c.created_at + interval '30 days'
  LIMIT 1
) pay ON true
GROUP BY c.cohort
ORDER BY c.cohort;

-- Distribution of answers in the new flow (counts only):
-- SELECT profession, ai_level, daily_minutes, onboarding_status, count(*)
-- FROM public.user_learning_preferences WHERE onboarding_version = 2 GROUP BY 1,2,3,4 ORDER BY 5 DESC;
