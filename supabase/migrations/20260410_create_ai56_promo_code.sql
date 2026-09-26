-- Create the AI56 promo code for the Meta ad campaign
-- Discount: 294 EGP off (299 → 5 EGP) on the basic plan
-- This is a temporary promotional code for the Facebook ad campaign

INSERT INTO promo_codes (
    code,
    discount_type,
    discount_value,
    max_discount,
    is_active,
    allowed_plans,
    max_uses,
    current_uses,
    starts_at,
    expires_at,
    description
) VALUES (
    'AI56',
    'fixed',
    294,
    294,
    true,
    ARRAY['basic'],
    10000,
    0,
    NOW(),
    NOW() + INTERVAL '90 days',
    'حملة إعلانية ميتا — الكتاب الكامل بـ 5 ج.م'
)
ON CONFLICT (code) DO UPDATE SET
    discount_value = 294,
    is_active = true,
    allowed_plans = ARRAY['basic'],
    expires_at = NOW() + INTERVAL '90 days',
    description = 'حملة إعلانية ميتا — الكتاب الكامل بـ 5 ج.م';
