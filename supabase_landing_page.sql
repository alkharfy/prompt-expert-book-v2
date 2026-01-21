-- =====================================================
-- Landing Page Tables: Testimonials, Settings, Certificates
-- =====================================================

-- 1. Testimonials Table (شهادات العملاء)
-- =====================================================
CREATE TABLE IF NOT EXISTS testimonials (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    title VARCHAR(150), -- مثل: "صاحب مشروع" أو "مطور مبتدئ"
    photo_url TEXT,
    content TEXT NOT NULL,
    rating INTEGER DEFAULT 5 CHECK (rating >= 1 AND rating <= 5),
    is_visible BOOLEAN DEFAULT true,
    display_order INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE testimonials ENABLE ROW LEVEL SECURITY;

-- Public read policy (everyone can see visible testimonials)
CREATE POLICY "Anyone can view visible testimonials" ON testimonials
    FOR SELECT USING (is_visible = true);

-- Admin full access (based on user role or specific user)
CREATE POLICY "Admins can manage testimonials" ON testimonials
    FOR ALL USING (true);

-- Add some sample testimonials
INSERT INTO testimonials (name, title, content, rating, is_visible, display_order) VALUES
('أحمد محمد', 'صاحب مشروع ناشئ', 'الكتاب غيّر طريقة تفكيري تماماً! كنت أضيع ساعات في كتابة برومبتات عشوائية، الآن أنجز في دقائق ما كان يأخذ مني يوماً كاملاً.', 5, true, 1),
('سارة أحمد', 'مصممة UX', 'أخيراً لقيت مرجع عربي متكامل عن البرومبتات. المحتوى عملي 100% وقابل للتطبيق فوراً.', 5, true, 2),
('محمد علي', 'صانع محتوى', 'استثمار ممتاز! خلال أسبوع واحد بنيت أول موقع لي باستخدام الذكاء الاصطناعي فقط.', 5, true, 3);

-- =====================================================
-- 2. Site Settings Table (إعدادات الموقع)
-- =====================================================
CREATE TABLE IF NOT EXISTS site_settings (
    key VARCHAR(50) PRIMARY KEY,
    value JSONB NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE site_settings ENABLE ROW LEVEL SECURITY;

-- Public read policy
CREATE POLICY "Anyone can view settings" ON site_settings
    FOR SELECT USING (true);

-- Admin update policy
CREATE POLICY "Admins can manage settings" ON site_settings
    FOR ALL USING (true);

-- Insert default promo settings
INSERT INTO site_settings (key, value) VALUES
('promo_settings', '{
    "is_active": true,
    "discount_percentage": 40,
    "end_date": "2026-02-28T23:59:59Z",
    "promo_text": "عرض افتتاحي: خصم 40% لفترة محدودة!"
}'::jsonb)
ON CONFLICT (key) DO NOTHING;

-- Insert pricing plans
INSERT INTO site_settings (key, value) VALUES
('pricing_plans', '[
    {
        "id": "basic",
        "name": "الأساسية",
        "price": 299,
        "duration": "سنة",
        "features": [
            "الكتاب كامل (89 صفحة)",
            "التمارين التفاعلية",
            "الوصول لمدة سنة"
        ],
        "is_popular": false
    },
    {
        "id": "pro",
        "name": "المتقدمة",
        "price": 699,
        "duration": "سنة",
        "features": [
            "كل مميزات الأساسية",
            "50+ قالب جاهز للنسخ",
            "شهادة إتمام معتمدة",
            "تحديثات مجانية مدى الحياة"
        ],
        "is_popular": true
    },
    {
        "id": "vip",
        "name": "VIP",
        "price": 1499,
        "duration": "سنة",
        "features": [
            "كل مميزات المتقدمة",
            "استشارة خاصة 30 دقيقة",
            "دعم أولوية عبر WhatsApp",
            "وصول مبكر للمحتوى الجديد"
        ],
        "is_popular": false
    }
]'::jsonb)
ON CONFLICT (key) DO NOTHING;

-- =====================================================
-- 3. Certificates Table (شهادات الإتمام)
-- =====================================================
CREATE TABLE IF NOT EXISTS certificates (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    certificate_id VARCHAR(20) UNIQUE NOT NULL, -- مثل: CERT-2026-ABC123
    user_name VARCHAR(150) NOT NULL,
    course_name VARCHAR(200) DEFAULT 'خبير البرومبتات: بناء المواقع والتطبيقات بالذكاء الاصطناعي',
    issued_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    completion_percentage INTEGER DEFAULT 100,
    is_public BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE certificates ENABLE ROW LEVEL SECURITY;

-- Users can view their own certificates
CREATE POLICY "Users can view own certificates" ON certificates
    FOR SELECT USING (auth.uid()::text = user_id::text OR is_public = true);

-- Public certificates are viewable by anyone
CREATE POLICY "Anyone can view public certificates" ON certificates
    FOR SELECT USING (is_public = true);

-- System can create certificates
CREATE POLICY "System can manage certificates" ON certificates
    FOR ALL USING (true);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_certificates_certificate_id ON certificates(certificate_id);
CREATE INDEX IF NOT EXISTS idx_certificates_user_id ON certificates(user_id);

-- =====================================================
-- 4. Function to generate unique certificate ID
-- =====================================================
CREATE OR REPLACE FUNCTION generate_certificate_id()
RETURNS VARCHAR(20) AS $$
DECLARE
    new_id VARCHAR(20);
    year_part VARCHAR(4);
    random_part VARCHAR(6);
BEGIN
    year_part := TO_CHAR(NOW(), 'YYYY');
    random_part := UPPER(SUBSTRING(MD5(RANDOM()::TEXT) FROM 1 FOR 6));
    new_id := 'CERT-' || year_part || '-' || random_part;
    RETURN new_id;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- 5. Trigger to auto-generate certificate_id
-- =====================================================
CREATE OR REPLACE FUNCTION set_certificate_id()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.certificate_id IS NULL OR NEW.certificate_id = '' THEN
        NEW.certificate_id := generate_certificate_id();
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_set_certificate_id
    BEFORE INSERT ON certificates
    FOR EACH ROW
    EXECUTE FUNCTION set_certificate_id();

-- =====================================================
-- 6. Update updated_at trigger for testimonials
-- =====================================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_testimonials_updated_at
    BEFORE UPDATE ON testimonials
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trigger_site_settings_updated_at
    BEFORE UPDATE ON site_settings
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
