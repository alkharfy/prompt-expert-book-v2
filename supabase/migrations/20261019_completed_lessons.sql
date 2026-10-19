-- ============================================
-- Per-lesson progress (owner request 2026-10-19)
-- reading_progress.completed_lessons holds '<section>:<page>' for each lesson the learner
-- finished (pressed «next» at its end). The course TOC ticks exactly these lessons.
--
-- Safe to run before or after the code deploy (old code never touches the column),
-- and safe to re-run (the backfill only fills rows that are still empty).
-- ============================================

BEGIN;

ALTER TABLE reading_progress
    ADD COLUMN IF NOT EXISTS completed_lessons text[] NOT NULL DEFAULT '{}';

-- One-time backfill from what was saved until now, so nobody's TOC goes blank:
-- the lessons before the last page each learner opened in that level, whole levels
-- already marked finished, and the free intro once they moved past it.
-- Global page = section progressOffset + page (src/config/sections.ts).
WITH levels(section_id, chapter, first_page, last_slot, pages) AS (
    VALUES ('intro', '0', 1, 6, 3), ('section-1', '1', 7, 23, 9), ('section-2', '2', 24, 41, 9)
), backfill AS (
    SELECT r.user_id, array_agg(DISTINCT l.section_id || ':' || p) AS lessons
    FROM reading_progress r
    CROSS JOIN levels l
    JOIN generate_series(1, 9) AS p ON p <= l.pages
    WHERE (r.current_page BETWEEN l.first_page AND l.last_slot AND l.first_page - 1 + p < r.current_page)
       OR l.chapter = ANY (r.completed_chapters::text[])
       OR (l.section_id = 'intro' AND r.current_page > l.last_slot)
    GROUP BY r.user_id
)
UPDATE reading_progress rp
SET completed_lessons = backfill.lessons
FROM backfill
WHERE rp.user_id = backfill.user_id
  AND rp.completed_lessons = '{}';

COMMIT;
