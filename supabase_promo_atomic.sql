-- ============================================
-- دالة ذرية لاستخدام كود الخصم (Atomic Promo Code Usage)
-- تحل مشكلة Race Conditions عند استخدام أكواد الخصم
-- ============================================

-- تستبدل الدالة القديمة increment_promo_uses بدالة شاملة
-- تقوم بـ: فحص الحد الأقصى + تنظيف الاستخدامات القديمة + التسجيل + تحديث العداد
-- كل ذلك في معاملة واحدة مع قفل الصف (FOR UPDATE)

CREATE OR REPLACE FUNCTION try_use_promo_code(
    p_promo_id UUID,
    p_user_id UUID,
    p_payment_id UUID,
    p_original_amount NUMERIC,
    p_discount_amount NUMERIC,
    p_final_amount NUMERIC
) RETURNS JSONB AS $$
DECLARE
    v_current_uses INT;
    v_max_uses INT;
    v_completed_count INT;
    v_old_incomplete INT;
BEGIN
    -- 1. قفل صف كود الخصم لمنع التعديل المتزامن
    SELECT current_uses, max_uses INTO v_current_uses, v_max_uses
    FROM promo_codes WHERE id = p_promo_id FOR UPDATE;

    IF NOT FOUND THEN
        RETURN jsonb_build_object('success', false, 'error', 'promo_not_found');
    END IF;

    -- 2. التحقق من أن المستخدم لم يستخدم الكود في دفع مكتمل
    SELECT COUNT(*) INTO v_completed_count
    FROM promo_code_uses pcu
    JOIN payments p ON p.id = pcu.payment_id
    WHERE pcu.promo_code_id = p_promo_id
      AND pcu.user_id = p_user_id
      AND p.status IN ('paid', 'completed', 'success');

    IF v_completed_count > 0 THEN
        RETURN jsonb_build_object('success', false, 'error', 'already_used');
    END IF;

    -- 3. حذف الاستخدامات القديمة غير المكتملة لهذا المستخدم
    --    (لتجنب انتهاك UNIQUE constraint وتصحيح العداد)
    WITH deleted AS (
        DELETE FROM promo_code_uses
        WHERE promo_code_id = p_promo_id
          AND user_id = p_user_id
        RETURNING id
    )
    SELECT COUNT(*) INTO v_old_incomplete FROM deleted;

    -- 4. تصحيح العداد بعد حذف السجلات القديمة
    v_current_uses := GREATEST(0, v_current_uses - v_old_incomplete);

    -- 5. فحص الحد الأقصى للاستخدام
    IF v_max_uses IS NOT NULL AND v_current_uses >= v_max_uses THEN
        -- تحديث العداد المصحح حتى لو لم ننجح
        UPDATE promo_codes SET current_uses = v_current_uses WHERE id = p_promo_id;
        RETURN jsonb_build_object('success', false, 'error', 'max_uses_reached');
    END IF;

    -- 6. تسجيل الاستخدام الجديد
    INSERT INTO promo_code_uses (promo_code_id, user_id, payment_id, original_amount, discount_amount, final_amount)
    VALUES (p_promo_id, p_user_id, p_payment_id, p_original_amount, p_discount_amount, p_final_amount);

    -- 7. تحديث العداد (+1 للاستخدام الجديد)
    UPDATE promo_codes SET current_uses = v_current_uses + 1 WHERE id = p_promo_id;

    RETURN jsonb_build_object('success', true);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- منح صلاحية التنفيذ
GRANT EXECUTE ON FUNCTION try_use_promo_code(UUID, UUID, UUID, NUMERIC, NUMERIC, NUMERIC) TO service_role;
