-- Add is_admin column to users table
ALTER TABLE users ADD COLUMN IF NOT EXISTS is_admin BOOLEAN DEFAULT false;

-- Create index for fast admin lookups
CREATE INDEX IF NOT EXISTS idx_users_is_admin ON users(is_admin) WHERE is_admin = true;

-- Verify
SELECT column_name, data_type, column_default
FROM information_schema.columns
WHERE table_name = 'users' AND column_name = 'is_admin';
