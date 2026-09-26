-- Payment Intents — tracks users who visit payment page but don't complete
-- Used for abandoned cart email recovery

CREATE TABLE IF NOT EXISTS payment_intents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    selected_plan TEXT NOT NULL,
    visited_at TIMESTAMPTZ DEFAULT NOW(),
    completed BOOLEAN DEFAULT FALSE,
    reminder_sent_count INTEGER DEFAULT 0,
    last_reminder_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for cron queries (incomplete intents, ordered by visit time)
CREATE INDEX IF NOT EXISTS idx_payment_intents_pending 
    ON payment_intents(user_id, completed, visited_at DESC);

-- RLS
ALTER TABLE payment_intents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own intents" ON payment_intents
    FOR SELECT USING (auth.uid()::text = user_id::text);

CREATE POLICY "Service role full access on payment_intents" ON payment_intents
    FOR ALL USING (true) WITH CHECK (true);
