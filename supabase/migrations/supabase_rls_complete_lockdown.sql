-- ============================================================
-- Complete RLS Lockdown for Firebase Auth Architecture
-- ============================================================
-- This project uses Firebase Auth + service_role key.
-- All Supabase access goes through API routes (server-side).
-- Therefore, anon/authenticated roles must have ZERO direct access.
--
-- The previous migration (supabase_disable_rls_for_firebase.sql)
-- covered core tables but missed several newer tables.
-- This migration closes those gaps.
--
-- Run in Supabase SQL Editor:
-- https://supabase.com/dashboard/project/YOUR_PROJECT_ID/sql
-- ============================================================

-- ─── 1 & 2. Revoke anon/authenticated + Grant service_role ────────────
-- Uses IF EXISTS to safely skip tables that don't exist in this database.

DO $$
DECLARE
    tbl TEXT;
    target_tables TEXT[] := ARRAY[
        -- Auth & Users
        'users',
        'sessions',
        'devices',
        'verification_codes',
        -- Reading & Progress
        'reading_progress',
        'exercise_progress',
        'user_exercise_stats',
        'certificates',
        -- Gamification
        'user_gamification',
        'points_history',
        'badges',
        'user_badges',
        'user_claimed_rewards',
        'user_daily_missions',
        'mission_templates',
        'leaderboard',
        -- Chat
        'chat_messages',
        'chat_ratings',
        -- Notes
        'user_notes',
        -- Email
        'email_preferences',
        'email_log',
        -- Payments & Subscriptions
        'payments',
        'subscriptions',
        'plans',
        'plan_features',
        -- Promo
        'promo_codes',
        'promo_code_uses',
        -- Referrals
        'referrals',
        -- Admin
        'admin_sessions',
        'admin_audit_log',
        -- Other
        'testimonials',
        'site_settings',
        'user_certificates',
        'user_achievements',
        'user_profiles'
    ];
BEGIN
    FOREACH tbl IN ARRAY target_tables
    LOOP
        IF EXISTS (
            SELECT 1 FROM information_schema.tables
            WHERE table_name = tbl AND table_schema = 'public'
        ) THEN
            EXECUTE format('REVOKE ALL ON %I FROM anon, authenticated', tbl);
            EXECUTE format('GRANT ALL ON %I TO service_role', tbl);
            RAISE NOTICE 'Locked table: %', tbl;
        ELSE
            RAISE NOTICE 'Skipped (not found): %', tbl;
        END IF;
    END LOOP;
END $$;

-- ─── 3. Fix is_admin() function ─────────────────────────────────────
-- The old is_admin() references auth.uid() which returns NULL with Firebase.
-- Replace with a version that always returns false (admin checks happen in API routes).

CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
    -- With Firebase Auth, admin checks are done at API route level.
    -- This function exists only for backward compatibility with RLS policies.
    SELECT false;
$$;

-- ─── 4. Verification — list all tables and their access ──────────────

SELECT
    t.tablename,
    t.rowsecurity AS rls_enabled,
    COALESCE(
        string_agg(
            DISTINCT g.grantee || ':' || g.privilege_type,
            ', '
        ) FILTER (WHERE g.grantee IN ('anon', 'authenticated')),
        'NONE'
    ) AS anon_auth_privileges
FROM pg_tables t
LEFT JOIN information_schema.role_table_grants g
    ON g.table_name = t.tablename
    AND g.table_schema = 'public'
WHERE t.schemaname = 'public'
GROUP BY t.tablename, t.rowsecurity
ORDER BY t.tablename;
