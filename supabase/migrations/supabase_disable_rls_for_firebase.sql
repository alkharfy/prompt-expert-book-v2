-- ============================================
-- Disable RLS for Firebase Migration
-- ============================================
-- Since Firebase Auth doesn't provide Supabase-compatible JWTs,
-- we disable RLS and enforce security at API level instead.
--
-- Run this in Supabase SQL Editor: https://supabase.com/dashboard/project/pqqaupbkamtfjweajkjo/sql
--
-- ⚠️ IMPORTANT: This migration MUST be run AFTER all API routes have
-- been updated with proper authentication checks!
-- ============================================

-- Disable RLS on user-facing tables
-- (API routes will validate authentication before queries)
ALTER TABLE users DISABLE ROW LEVEL SECURITY;
ALTER TABLE devices DISABLE ROW LEVEL SECURITY;
ALTER TABLE sessions DISABLE ROW LEVEL SECURITY;
ALTER TABLE reading_progress DISABLE ROW LEVEL SECURITY;
ALTER TABLE bookmarks DISABLE ROW LEVEL SECURITY;
ALTER TABLE exercise_progress DISABLE ROW LEVEL SECURITY;
ALTER TABLE user_exercise_stats DISABLE ROW LEVEL SECURITY;
ALTER TABLE chat_messages DISABLE ROW LEVEL SECURITY;
ALTER TABLE chat_ratings DISABLE ROW LEVEL SECURITY;
ALTER TABLE user_gamification DISABLE ROW LEVEL SECURITY;
ALTER TABLE user_badges DISABLE ROW LEVEL SECURITY;
ALTER TABLE points_history DISABLE ROW LEVEL SECURITY;
ALTER TABLE certificates DISABLE ROW LEVEL SECURITY;

-- Keep RLS enabled for admin-only tables
-- (these are accessed via service_role which bypasses RLS anyway)
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_audit_log ENABLE ROW LEVEL SECURITY;

-- Revoke direct access from anon/authenticated roles
-- (Force all access through API routes with service_role)
REVOKE ALL ON users FROM anon, authenticated;
REVOKE ALL ON devices FROM anon, authenticated;
REVOKE ALL ON sessions FROM anon, authenticated;
REVOKE ALL ON reading_progress FROM anon, authenticated;
REVOKE ALL ON bookmarks FROM anon, authenticated;
REVOKE ALL ON exercise_progress FROM anon, authenticated;
REVOKE ALL ON user_exercise_stats FROM anon, authenticated;
REVOKE ALL ON chat_messages FROM anon, authenticated;
REVOKE ALL ON chat_ratings FROM anon, authenticated;
REVOKE ALL ON user_gamification FROM anon, authenticated;
REVOKE ALL ON user_badges FROM anon, authenticated;
REVOKE ALL ON points_history FROM anon, authenticated;
REVOKE ALL ON certificates FROM anon, authenticated;

-- Grant access only to service_role (used by API routes)
GRANT ALL ON users TO service_role;
GRANT ALL ON devices TO service_role;
GRANT ALL ON sessions TO service_role;
GRANT ALL ON reading_progress TO service_role;
GRANT ALL ON bookmarks TO service_role;
GRANT ALL ON exercise_progress TO service_role;
GRANT ALL ON user_exercise_stats TO service_role;
GRANT ALL ON chat_messages TO service_role;
GRANT ALL ON chat_ratings TO service_role;
GRANT ALL ON user_gamification TO service_role;
GRANT ALL ON user_badges TO service_role;
GRANT ALL ON points_history TO service_role;
GRANT ALL ON certificates TO service_role;

-- Verify RLS status for key tables
SELECT
    tablename,
    rowsecurity AS rls_enabled
FROM pg_tables
WHERE schemaname = 'public'
  AND tablename IN (
    'users',
    'sessions',
    'subscriptions',
    'reading_progress',
    'chat_messages'
  )
ORDER BY tablename;

-- Show example of security model
/*
New Security Model:

BEFORE (Supabase Auth + RLS):
Client → Supabase (anon key) → RLS checks auth.uid() → Returns filtered data

AFTER (Firebase Auth + API-level security):
Client → API Route → Validate Firebase token → Supabase (service_role) → Returns filtered data

Example API Route pattern:
```typescript
export async function GET(request: NextRequest) {
  // 1. Authenticate
  const userId = await getAuthenticatedUserId(request)
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // 2. Query with explicit user_id filter
  const { data } = await supabase
    .from('reading_progress')
    .select('*')
    .eq('user_id', userId)  // ← CRITICAL: Always filter by authenticated user

  return NextResponse.json(data)
}
```
*/
