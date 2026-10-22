-- ============================================
-- 4 old reading_progress rows (January 2026) hold bookmarks = {} instead of [].
-- The achievement trigger's jsonb_array_length() fails on them, so every progress
-- save for those readers failed. Safe to re-run: it only touches non-array rows.
-- ============================================

BEGIN;

-- Only stored data changes here: skip the row triggers while it runs, so the achievement
-- check does not fire and updated_at (the admin funnel's "last active") does not move.
ALTER TABLE reading_progress DISABLE TRIGGER USER;

UPDATE reading_progress
SET bookmarks = '[]'::jsonb
WHERE jsonb_typeof(bookmarks::jsonb) <> 'array';

ALTER TABLE reading_progress ENABLE TRIGGER USER;

COMMIT;
