-- Add is_trusted column to devices table
ALTER TABLE devices ADD COLUMN IF NOT EXISTS is_trusted BOOLEAN DEFAULT false;

-- Verify
SELECT column_name, data_type, column_default
FROM information_schema.columns
WHERE table_name = 'devices' AND column_name = 'is_trusted';
