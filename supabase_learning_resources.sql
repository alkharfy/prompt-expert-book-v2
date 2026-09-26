-- =============================================
-- المرحلة 6: مكتبة المصادر + AI Changelog
-- =============================================

-- 1. جدول المصادر التعليمية
CREATE TABLE IF NOT EXISTS learning_resources (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  title_ar TEXT NOT NULL,
  title_en TEXT,
  description_ar TEXT NOT NULL,
  url TEXT NOT NULL,
  thumbnail_url TEXT,
  
  -- التصنيف
  category TEXT NOT NULL 
    CHECK (category IN ('tool','course','article','video','template','book','community')),
  specialization TEXT[] DEFAULT '{general}',
  level TEXT DEFAULT 'beginner' 
    CHECK (level IN ('beginner','intermediate','advanced')),
  related_sections TEXT[],
  
  -- الحالة
  is_active BOOLEAN DEFAULT true,
  is_free BOOLEAN DEFAULT true,
  language TEXT DEFAULT 'ar' CHECK (language IN ('ar','en','both')),
  
  -- نظام Freshness
  content_date DATE,
  ai_model_version TEXT,
  is_model_specific BOOLEAN DEFAULT false,
  freshness_status TEXT DEFAULT 'fresh'
    CHECK (freshness_status IN ('fresh','aging','outdated','evergreen')),
  
  last_verified_at TIMESTAMPTZ DEFAULT NOW(),
  added_by TEXT DEFAULT 'admin',
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. مفضلات المصادر
CREATE TABLE IF NOT EXISTS user_saved_resources (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL,
  resource_id UUID NOT NULL REFERENCES learning_resources(id) ON DELETE CASCADE,
  saved_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, resource_id)
);

-- 3. تحديثات AI (Changelog)
CREATE TABLE IF NOT EXISTS ai_changelog (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title_ar TEXT NOT NULL,
  content_ar TEXT NOT NULL,
  category TEXT DEFAULT 'update'
    CHECK (category IN ('update','new_model','new_tool','tip','breaking')),
  importance TEXT DEFAULT 'normal'
    CHECK (importance IN ('low','normal','high','critical')),
  source_url TEXT,
  published_at DATE DEFAULT CURRENT_DATE,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- Indexes
-- =============================================
CREATE INDEX IF NOT EXISTS idx_resources_category ON learning_resources(category);
CREATE INDEX IF NOT EXISTS idx_resources_specialization ON learning_resources USING GIN(specialization);
CREATE INDEX IF NOT EXISTS idx_resources_level ON learning_resources(level);
CREATE INDEX IF NOT EXISTS idx_resources_active ON learning_resources(is_active);
CREATE INDEX IF NOT EXISTS idx_saved_resources_user ON user_saved_resources(user_id);
CREATE INDEX IF NOT EXISTS idx_ai_changelog_published ON ai_changelog(published_at DESC);

-- =============================================
-- RLS
-- =============================================
ALTER TABLE learning_resources ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_saved_resources ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_changelog ENABLE ROW LEVEL SECURITY;

-- المصادر: الكل يقدر يقرأ المصادر النشطة
CREATE POLICY "Anyone can read active resources" 
  ON learning_resources FOR SELECT USING (is_active = true);

-- المصادر: service role full access
CREATE POLICY "Service role full access on resources"
  ON learning_resources FOR ALL
  USING (current_setting('role') = 'service_role');

-- مفضلات: المستخدم يقدر يدير مفضلاته
CREATE POLICY "Users read own saved resources"
  ON user_saved_resources FOR SELECT USING (true);

CREATE POLICY "Users insert own saved resources"
  ON user_saved_resources FOR INSERT WITH CHECK (true);

CREATE POLICY "Users delete own saved resources"
  ON user_saved_resources FOR DELETE USING (true);

-- service role full access on saved
CREATE POLICY "Service role full access on saved resources"
  ON user_saved_resources FOR ALL
  USING (current_setting('role') = 'service_role');

-- AI Changelog: الكل يقدر يقرأ
CREATE POLICY "Anyone can read active changelog"
  ON ai_changelog FOR SELECT USING (is_active = true);

CREATE POLICY "Service role full access on changelog"
  ON ai_changelog FOR ALL
  USING (current_setting('role') = 'service_role');
