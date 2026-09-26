-- ============================================
-- جدول المكافآت المطالب بها (User Claimed Rewards)
-- يستبدل localStorage لمنع التلاعب عبر DevTools
-- ============================================

CREATE TABLE IF NOT EXISTS user_claimed_rewards (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    reward_id TEXT NOT NULL,
    claimed_at TIMESTAMPTZ DEFAULT NOW(),

    -- منع تكرار المطالبة بنفس المكافأة
    UNIQUE(user_id, reward_id)
);

-- ============================================
-- الفهارس
-- ============================================

CREATE INDEX IF NOT EXISTS idx_claimed_rewards_user ON user_claimed_rewards(user_id);

-- ============================================
-- سياسات أمان RLS
-- ============================================

ALTER TABLE user_claimed_rewards ENABLE ROW LEVEL SECURITY;

-- المستخدم يقرأ مكافآته فقط
CREATE POLICY "users_read_own_claimed_rewards"
    ON user_claimed_rewards FOR SELECT
    USING (user_id = auth.uid());

-- الإدراج عبر service_role فقط (من API)
CREATE POLICY "service_manage_claimed_rewards"
    ON user_claimed_rewards FOR ALL
    USING (true)
    WITH CHECK (true);

-- ============================================
-- منح الصلاحيات
-- ============================================

GRANT SELECT ON user_claimed_rewards TO authenticated;
GRANT ALL ON user_claimed_rewards TO service_role;
