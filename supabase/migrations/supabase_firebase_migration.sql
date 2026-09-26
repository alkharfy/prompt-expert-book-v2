-- ============================================
-- Firebase Auth Migration
-- ============================================
-- Adds firebase_uid column to users table for Firebase Auth integration
-- Run this in Supabase SQL Editor: https://supabase.com/dashboard/project/pqqaupbkamtfjweajkjo/sql

-- Add firebase_uid column
ALTER TABLE users ADD COLUMN IF NOT EXISTS firebase_uid TEXT UNIQUE;

-- Create index for fast lookups by firebase_uid
CREATE INDEX IF NOT EXISTS idx_users_firebase_uid ON users(firebase_uid);

-- Add comment for documentation
COMMENT ON COLUMN users.firebase_uid IS 'Firebase Authentication UID - maps Firebase Auth users to Supabase database users';

-- Verify the column was added successfully
SELECT
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'users'
  AND column_name = 'firebase_uid';

-- Show example of how the mapping will work
-- (This is just a comment for documentation)
/*
Example usage after migration:

1. User registers with Firebase Auth → gets firebase_uid
2. Insert into Supabase users table:
   INSERT INTO users (id, firebase_uid, email, ...)
   VALUES (firebase_uid, firebase_uid, email, ...);

3. User logs in → Firebase returns firebase_uid
4. Query Supabase:
   SELECT * FROM users WHERE firebase_uid = 'xxx';
*/
