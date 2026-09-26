-- Lead Magnet Subscribers table
-- Stores emails from lead magnet form (landing page modal)

CREATE TABLE IF NOT EXISTS lead_magnet_subscribers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email TEXT NOT NULL UNIQUE,
    source TEXT DEFAULT 'landing_modal',
    subscribed_at TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for quick lookups
CREATE INDEX IF NOT EXISTS idx_lead_magnet_email ON lead_magnet_subscribers(email);

-- RLS: Only service role can insert/read (no client access needed)
ALTER TABLE lead_magnet_subscribers ENABLE ROW LEVEL SECURITY;

-- No public policies — API route uses service_role key
