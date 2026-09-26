-- =====================================================
-- Learning Plan Tasks — جدول مهام خطة التعلم الشخصية
-- المرحلة 5: الجدول الزمني الذكي
-- =====================================================

-- جدول المهام اليومية للخطة
CREATE TABLE IF NOT EXISTS learning_plan_tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL,
  
  task_date DATE NOT NULL,
  task_type TEXT NOT NULL CHECK (task_type IN ('reading', 'exercise', 'review', 'celebration')),
  
  -- للقراءة
  section_id TEXT,
  start_page INT,
  end_page INT,
  
  -- للتمارين  
  exercise_id TEXT,
  
  -- وصف المهمة
  title_ar TEXT NOT NULL,
  description_ar TEXT,
  
  -- الحالة
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'skipped', 'postponed')),
  completed_at TIMESTAMPTZ,
  
  -- metadata
  day_number INT NOT NULL DEFAULT 1,
  estimated_minutes INT DEFAULT 15,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Unique constraint via index (COALESCE not allowed in table-level UNIQUE)
CREATE UNIQUE INDEX IF NOT EXISTS uq_plan_tasks_user_date_type 
  ON learning_plan_tasks(user_id, task_date, task_type, COALESCE(section_id, ''), COALESCE(exercise_id, ''));

-- Indexes
CREATE INDEX IF NOT EXISTS idx_plan_tasks_user_date ON learning_plan_tasks(user_id, task_date);
CREATE INDEX IF NOT EXISTS idx_plan_tasks_user_status ON learning_plan_tasks(user_id, status);
CREATE INDEX IF NOT EXISTS idx_plan_tasks_user_pending ON learning_plan_tasks(user_id, task_date) WHERE status = 'pending';

-- RLS
ALTER TABLE learning_plan_tasks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own plan tasks"
  ON learning_plan_tasks FOR SELECT
  USING (user_id = current_setting('request.jwt.claim.sub', true));

CREATE POLICY "Users can update own plan tasks"
  ON learning_plan_tasks FOR UPDATE
  USING (user_id = current_setting('request.jwt.claim.sub', true));

-- Service role can do everything (for API routes)
CREATE POLICY "Service role full access on learning_plan_tasks"
  ON learning_plan_tasks FOR ALL
  USING (true)
  WITH CHECK (true);

-- جدول ملخص الخطة (metadata)
CREATE TABLE IF NOT EXISTS learning_plan_summary (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL UNIQUE,
  
  learning_path TEXT NOT NULL,
  learning_duration TEXT NOT NULL,
  
  total_days INT NOT NULL,
  total_reading_tasks INT NOT NULL DEFAULT 0,
  total_exercise_tasks INT NOT NULL DEFAULT 0,
  
  start_date DATE NOT NULL,
  expected_end_date DATE NOT NULL,
  
  completed_days INT DEFAULT 0,
  skipped_days INT DEFAULT 0,
  
  is_active BOOLEAN DEFAULT true,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_plan_summary_user ON learning_plan_summary(user_id);

ALTER TABLE learning_plan_summary ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own plan summary"
  ON learning_plan_summary FOR SELECT
  USING (user_id = current_setting('request.jwt.claim.sub', true));

CREATE POLICY "Service role full access on learning_plan_summary"
  ON learning_plan_summary FOR ALL
  USING (true)
  WITH CHECK (true);
