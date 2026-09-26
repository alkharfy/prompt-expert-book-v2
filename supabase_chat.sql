-- =====================================================
-- Chat AI Assistant Tables
-- جداول مساعد الكتاب الذكي
-- =====================================================

-- جدول رسائل المحادثات
CREATE TABLE IF NOT EXISTS chat_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    session_id TEXT NOT NULL,
    role TEXT NOT NULL CHECK (role IN ('user', 'assistant')),
    content TEXT NOT NULL,
    model TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_chat_messages_user ON chat_messages(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_chat_messages_session ON chat_messages(session_id);

-- جدول تقييمات الردود
CREATE TABLE IF NOT EXISTS chat_ratings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    message_content TEXT NOT NULL,
    query_content TEXT NOT NULL,
    model TEXT,
    rating SMALLINT NOT NULL CHECK (rating IN (-1, 1)),
    created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_chat_ratings_user ON chat_ratings(user_id);

-- =====================================================
-- Row Level Security (RLS)
-- =====================================================

ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_ratings ENABLE ROW LEVEL SECURITY;

-- Service role has full access
CREATE POLICY "Service role full access on chat_messages"
ON chat_messages
FOR ALL
USING (auth.role() = 'service_role');

CREATE POLICY "Service role full access on chat_ratings"
ON chat_ratings
FOR ALL
USING (auth.role() = 'service_role');

-- =====================================================
-- RPC Functions
-- =====================================================

-- دالة لحساب عدد المستخدمين الفريدين بكفاءة
CREATE OR REPLACE FUNCTION count_distinct_chat_users()
RETURNS INTEGER
LANGUAGE SQL
STABLE
SECURITY DEFINER
AS $$
    SELECT COUNT(DISTINCT user_id)::INTEGER FROM chat_messages;
$$;
