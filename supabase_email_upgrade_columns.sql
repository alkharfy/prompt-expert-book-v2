-- Add upgrade_emails column to email_preferences
-- Allows users to opt out of upgrade drip emails

ALTER TABLE email_preferences 
ADD COLUMN IF NOT EXISTS upgrade_emails BOOLEAN DEFAULT TRUE;

-- Add cart_recovery_emails column for abandoned cart emails
ALTER TABLE email_preferences 
ADD COLUMN IF NOT EXISTS cart_recovery_emails BOOLEAN DEFAULT TRUE;
