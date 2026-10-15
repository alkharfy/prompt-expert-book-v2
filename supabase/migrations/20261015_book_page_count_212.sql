-- Review and apply separately, AFTER the intro/chapter-1 content update is deployed.
-- NOT run against production. Safe to rerun.
--
-- The intro now has 3 real pages (was 6) and chapter 1 has 10 (was 17), so the book
-- has 212 real pages. The pricing cards read their feature text from public.plans,
-- so the old "222 صفحة" claim must be updated here; the code-side count
-- (BOOK_PAGES_DISPLAY) is already derived from the section registry.
BEGIN;

UPDATE public.plans
SET features_ar = REPLACE(features_ar::text, '222 صفحة تعليمية', '212 صفحة تعليمية')::jsonb,
    updated_at = NOW()
WHERE features_ar::text LIKE '%222 صفحة تعليمية%';

COMMIT;
