-- ============================================
-- Price Reconciliation — Stage 4
-- ============================================
-- تحديث الأسعار في site_settings لتطابق الكود
-- Stage 3 Report ذكر تعارض الأسعار:
--   - الكود: 299 / 499 / 999
--   - DB seed: 299 / 699 / 1499
-- ============================================
-- DECISION: تحديث DB seed لمطابقة أسعار الكود
-- ============================================

UPDATE site_settings
SET value = jsonb_set(
    jsonb_set(
        value,
        '{1, price}',  -- pro plan (index 1)
        '499'
    ),
    '{2, price}',  -- vip plan (index 2)
    '999'
)
WHERE key = 'pricing_plans';

-- ============================================
-- Verification — عرض الأسعار الجديدة
-- ============================================

SELECT
    key,
    jsonb_pretty(value) AS pricing_plans
FROM site_settings
WHERE key = 'pricing_plans';
