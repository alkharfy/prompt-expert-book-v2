-- Review and apply separately before/with deployment. This migration was NOT
-- run against production. It preserves prices, subscription terms, payments,
-- and all previously issued certificates. Safe to rerun.
BEGIN;

UPDATE public.plans SET
    name_ar = 'الأساسية',
    features = '["reading", "bookmarks", "library", "progress_tracking", "exercises"]'::jsonb,
    features_ar = '["222 صفحة تعليمية تشمل الملاحق", "95 قالب برومبت قابل للتعديل", "45 تمرينًا تفاعليًا", "تتبع التقدم والإشارات المرجعية", "وصول لمدة سنة؛ التحديثات المتاحة مشمولة خلال الاشتراك"]'::jsonb,
    updated_at = NOW()
WHERE id = 'basic';

UPDATE public.plans SET
    name_ar = 'المتقدمة',
    features = '["reading", "bookmarks", "library", "progress_tracking", "exercises", "gamification", "leaderboard", "certificate", "tools"]'::jsonb,
    features_ar = '["كل مميزات الأساسية", "أدوات البرومبت؛ تشخيص AI حتى 10 مرات خلال 24 ساعة", "الإنجازات ولوحة المتصدرين", "شهادة إتمام قراءة من PromptMaster وفق متطلباتها", "وصول لمدة سنة؛ التحديثات المتاحة مشمولة خلال الاشتراك"]'::jsonb,
    updated_at = NOW()
WHERE id = 'pro';

UPDATE public.plans SET
    name_ar = 'VIP',
    features = '["reading", "bookmarks", "library", "progress_tracking", "exercises", "gamification", "leaderboard", "certificate", "tools", "chat"]'::jsonb,
    features_ar = '["كل مميزات المتقدمة", "المحادثة الذكية حتى 30 رسالة خلال 24 ساعة", "وصول لمدة سنة؛ التحديثات المتاحة مشمولة خلال الاشتراك"]'::jsonb,
    updated_at = NOW()
WHERE id = 'vip';

-- Disable stale permissions for the known tiers, then restore the complete
-- canonical matrix. Public pages are not exclusive paid entitlements.
UPDATE public.plan_features SET is_enabled = false
WHERE plan_id IN ('basic', 'pro', 'vip');

-- Keep implemented paid permissions in sync with the canonical feature matrix.
INSERT INTO public.plan_features (plan_id, feature_key, is_enabled) VALUES
    ('basic', 'reading', true),
    ('basic', 'bookmarks', true),
    ('basic', 'library', true),
    ('basic', 'progress_tracking', true),
    ('basic', 'exercises', true),
    ('pro', 'reading', true),
    ('pro', 'bookmarks', true),
    ('pro', 'library', true),
    ('pro', 'progress_tracking', true),
    ('pro', 'exercises', true),
    ('pro', 'gamification', true),
    ('pro', 'leaderboard', true),
    ('pro', 'tools', true),
    ('pro', 'certificate', true),
    ('vip', 'reading', true),
    ('vip', 'bookmarks', true),
    ('vip', 'library', true),
    ('vip', 'progress_tracking', true),
    ('vip', 'exercises', true),
    ('vip', 'gamification', true),
    ('vip', 'leaderboard', true),
    ('vip', 'tools', true),
    ('vip', 'certificate', true),
    ('vip', 'chat', true)
ON CONFLICT (plan_id, feature_key) DO UPDATE SET is_enabled = EXCLUDED.is_enabled;

COMMIT;
