-- =====================================================
-- المرحلة 3: تفضيلات وسجل الإيميلات
-- يجب تشغيل هذا في Supabase Dashboard > SQL Editor
-- =====================================================

-- جدول تفضيلات الإيميل
CREATE TABLE IF NOT EXISTS email_preferences (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE UNIQUE,
    
    -- تفضيلات الإرسال
    reminders_enabled BOOLEAN DEFAULT TRUE,
    reminder_frequency TEXT DEFAULT 'smart'
        CHECK (reminder_frequency IN ('daily', 'every_3_days', 'weekly', 'smart')),
    preferred_time TEXT DEFAULT '18:00',
    timezone TEXT DEFAULT 'Africa/Cairo',
    
    -- إيميلات محددة
    streak_reminders BOOLEAN DEFAULT TRUE,
    mission_reminders BOOLEAN DEFAULT TRUE,
    milestone_notifications BOOLEAN DEFAULT TRUE,
    weekly_recap BOOLEAN DEFAULT TRUE,
    
    -- تتبع
    last_email_sent_at TIMESTAMPTZ,
    total_emails_sent INTEGER DEFAULT 0,
    unsubscribe_token TEXT DEFAULT gen_random_uuid()::text,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- سجل الإيميلات المرسلة
CREATE TABLE IF NOT EXISTS email_log (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    email_type TEXT NOT NULL,
    subject TEXT NOT NULL,
    template_id TEXT,
    status TEXT DEFAULT 'sent'
        CHECK (status IN ('sent', 'failed', 'bounced')),
    sent_at TIMESTAMPTZ DEFAULT NOW()
);

-- فهارس
CREATE INDEX IF NOT EXISTS idx_email_prefs_user ON email_preferences(user_id);
CREATE INDEX IF NOT EXISTS idx_email_prefs_token ON email_preferences(unsubscribe_token);
CREATE INDEX IF NOT EXISTS idx_email_log_user ON email_log(user_id, sent_at DESC);

-- RLS
ALTER TABLE email_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_log ENABLE ROW LEVEL SECURITY;

-- سياسات email_preferences
CREATE POLICY "email_prefs_select" ON email_preferences
    FOR SELECT USING (true);
CREATE POLICY "email_prefs_insert" ON email_preferences
    FOR INSERT WITH CHECK (true);
CREATE POLICY "email_prefs_update" ON email_preferences
    FOR UPDATE USING (true);

-- سياسات email_log
CREATE POLICY "email_log_select" ON email_log
    FOR SELECT USING (true);
CREATE POLICY "email_log_insert" ON email_log
    FOR INSERT WITH CHECK (true);
