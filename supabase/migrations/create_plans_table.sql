-- ============================================
-- Create Plans Table for Dynamic Pricing
-- ============================================
-- This table stores subscription plan information including prices
-- Allows admin to change prices without code deployment
-- Run this in Supabase SQL Editor: https://supabase.com/dashboard/project/pqqaupbkamtfjweajkjo/sql

-- Create plans table
CREATE TABLE IF NOT EXISTS plans (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  name_ar TEXT NOT NULL,
  price INTEGER NOT NULL CHECK (price >= 0),
  currency TEXT NOT NULL DEFAULT 'EGP',
  features JSONB NOT NULL DEFAULT '[]'::jsonb,
  features_ar JSONB NOT NULL DEFAULT '[]'::jsonb,
  is_active BOOLEAN DEFAULT true,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create index for active plans
CREATE INDEX IF NOT EXISTS idx_plans_active ON plans(is_active, display_order);

-- Add comment
COMMENT ON TABLE plans IS 'Subscription plans with dynamic pricing - manageable from admin dashboard';

-- Insert default plans (current prices)
INSERT INTO plans (id, name, name_ar, price, features, features_ar, display_order) VALUES
(
  'basic',
  'Basic',
  'الأساسية',
  99,
  '["Full book access (188+ pages)", "Interactive exercises", "1-year access"]'::jsonb,
  '["الكتاب كامل (188+ صفحة)", "التمارين التفاعلية", "الوصول لمدة سنة"]'::jsonb,
  1
),
(
  'pro',
  'Pro',
  'المتقدمة',
  199,
  '["All Basic features", "95 ready-to-use templates", "Completion certificate", "Lifetime free updates"]'::jsonb,
  '["كل مميزات الأساسية", "95 قالب جاهز للنسخ", "شهادة إتمام معتمدة", "تحديثات مجانية مدى الحياة"]'::jsonb,
  2
),
(
  'vip',
  'VIP',
  'VIP',
  399,
  '["All Pro features", "30-minute private consultation", "Priority WhatsApp support", "Early access to new content"]'::jsonb,
  '["كل مميزات المتقدمة", "استشارة خاصة 30 دقيقة", "دعم أولوية عبر WhatsApp", "وصول مبكر للمحتوى الجديد"]'::jsonb,
  3
)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  name_ar = EXCLUDED.name_ar,
  price = EXCLUDED.price,
  features = EXCLUDED.features,
  features_ar = EXCLUDED.features_ar,
  display_order = EXCLUDED.display_order,
  updated_at = NOW();

-- Create function to auto-update updated_at
CREATE OR REPLACE FUNCTION update_plans_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for auto-updating updated_at
DROP TRIGGER IF EXISTS plans_updated_at_trigger ON plans;
CREATE TRIGGER plans_updated_at_trigger
  BEFORE UPDATE ON plans
  FOR EACH ROW
  EXECUTE FUNCTION update_plans_updated_at();

-- Grant permissions (for API access with service_role)
GRANT ALL ON plans TO service_role;
GRANT SELECT ON plans TO anon, authenticated;

-- Verify data
SELECT id, name_ar, price, is_active FROM plans ORDER BY display_order;
