-- Match existing, implemented features to src/lib/features.ts and checkout.
-- Safe to rerun; no new features and no existing entitlement is removed.
INSERT INTO public.plan_features (plan_id, feature_key, is_enabled) VALUES
  ('basic', 'exercises', true),
  ('pro', 'tools', true),
  ('pro', 'resources', true),
  ('vip', 'resources', true),
  ('vip', 'ai_updates', true)
ON CONFLICT (plan_id, feature_key) DO UPDATE SET is_enabled = EXCLUDED.is_enabled;
