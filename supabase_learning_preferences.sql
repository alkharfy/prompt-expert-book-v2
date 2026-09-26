-- ============================================
-- جدول تفضيلات التعلم — المرحلة 2
-- ============================================

CREATE TABLE IF NOT EXISTS user_learning_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  
  learning_goal TEXT NOT NULL 
    CHECK (learning_goal IN ('professional','entrepreneurship','career-change','curiosity')),
  specialization TEXT NOT NULL 
    CHECK (specialization IN ('programming','ecommerce','design','marketing','general')),
  learning_path TEXT NOT NULL 
    CHECK (learning_path IN ('quick','intermediate','comprehensive')),
  learning_duration TEXT NOT NULL 
    CHECK (learning_duration IN ('1week','2weeks','1month','2months','flexible')),
  
  plan_start_date DATE DEFAULT CURRENT_DATE,
  is_active BOOLEAN DEFAULT true,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(user_id)
);

-- ============================================
-- سياسات أمنية (RLS)
-- ============================================

ALTER TABLE user_learning_preferences ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own preferences"
  ON user_learning_preferences FOR ALL
  USING (auth.uid()::text = user_id::text);

-- ============================================
-- الفهارس
-- ============================================

CREATE INDEX IF NOT EXISTS idx_learning_prefs_user ON user_learning_preferences(user_id);

-- ============================================
-- تحديث تلقائي لـ updated_at
-- ============================================

CREATE OR REPLACE FUNCTION update_learning_preferences_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_learning_preferences ON user_learning_preferences;
CREATE TRIGGER trigger_update_learning_preferences
  BEFORE UPDATE ON user_learning_preferences
  FOR EACH ROW
  EXECUTE FUNCTION update_learning_preferences_updated_at();

-- ============================================
-- إعطاء المستخدمين الحاليين القيم الافتراضية
-- ============================================

INSERT INTO user_learning_preferences (user_id, learning_goal, specialization, learning_path, learning_duration)
SELECT id, 'curiosity', 'general', 'comprehensive', 'flexible'
FROM users
WHERE id NOT IN (SELECT user_id FROM user_learning_preferences)
ON CONFLICT (user_id) DO NOTHING;
