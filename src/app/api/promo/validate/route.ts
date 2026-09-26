import { getUserSubscription } from '@/lib/subscription'
import { getCheckoutBasePrice } from '@/lib/payment-pricing'
import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase-admin'
import { getAuthenticatedUser } from '@/lib/auth-middleware'
import { checkRateLimitAsync, getClientIP, RATE_LIMITS } from '@/lib/rate-limit'
import { dbLogger } from '@/lib/logger'
import { applyPromoDiscount } from '@/lib/pricing'

/**
 * POST /api/promo/validate - Validate a promo code and calculate discount
 *
 * Body: { code: string, planId: string }
 * userId is extracted from cookies (not from body)
 */
export async function POST(request: NextRequest) {
    try {
        const body = await request.json()
        const { code, planId, isUpgrade } = body

        // SECURITY: Rate limit to prevent promo code brute-force
        const clientIP = getClientIP(request)
        const rateLimitResult = await checkRateLimitAsync(`promo-validate:${clientIP}`, RATE_LIMITS.PROMO_VALIDATE)
        if (!rateLimitResult.allowed) {
            return NextResponse.json(
                { valid: false, error: `تم تجاوز عدد المحاولات. حاول مجدداً بعد ${rateLimitResult.retryAfter} ثانية` },
                { status: 429 }
            )
        }

        // استخراج userId من cookies بدلاً من body لمنع الانتحال
        const userId = await getAuthenticatedUser({ skipActiveCheck: true })

        if (typeof code !== 'string' || !code.trim() || typeof planId !== 'string' || !['basic', 'pro', 'vip'].includes(planId) || isUpgrade != null && typeof isUpgrade !== 'boolean') {
            return NextResponse.json({ valid: false, error: 'بيانات ناقصة' }, { status: 400 })
        }

        const cleanCode = code.trim().toUpperCase()
        const supabase = getSupabaseAdmin()

        // 1. جلب بيانات الكود
        const { data: promo, error: promoError } = await (supabase as any)
            .from('promo_codes')
            .select('*')
            .eq('code', cleanCode)
            .eq('is_active', true)
            .single()

        if (promoError || !promo) {
            return NextResponse.json({ valid: false, error: 'كود الخصم غير صحيح أو غير نشط' })
        }

        // 2. التحقق من تاريخ الصلاحية
        const now = new Date()
        if (promo.starts_at && new Date(promo.starts_at) > now) {
            return NextResponse.json({ valid: false, error: 'كود الخصم لم يبدأ بعد' })
        }
        if (promo.expires_at && new Date(promo.expires_at) < now) {
            return NextResponse.json({ valid: false, error: 'كود الخصم منتهي الصلاحية' })
        }

        // 3. التحقق من عدد الاستخدامات (فحص أولي — الإنفاذ الذري في create-session عبر try_use_promo_code)
        if (promo.max_uses !== null && promo.current_uses >= promo.max_uses) {
            return NextResponse.json({ valid: false, error: 'تم استنفاذ عدد مرات استخدام هذا الكود' })
        }

        // 4. التحقق من الباقات المسموح بها
        if (promo.allowed_plans && promo.allowed_plans.length > 0) {
            if (!promo.allowed_plans.includes(planId)) {
                return NextResponse.json({ valid: false, error: 'كود الخصم غير صالح لهذه الباقة' })
            }
        }

        // 5. التحقق من أن المستخدم لم يستخدم الكود من قبل (فقط للمدفوعات المكتملة)
        if (userId) {
            const { data: completedUses } = await (supabase as any)
                .from('promo_code_uses')
                .select('id, payment_id')
                .eq('promo_code_id', promo.id)
                .eq('user_id', userId)

            if (completedUses && completedUses.length > 0) {
                // تحقق ما إذا كان هناك استخدام مرتبط بدفع مكتمل
                for (const use of completedUses) {
                    if (use.payment_id) {
                        const { data: payment } = await (supabase as any)
                            .from('payments')
                            .select('status')
                            .eq('id', use.payment_id)
                            .single()

                        if (payment && (payment.status === 'paid' || payment.status === 'completed' || payment.status === 'success')) {
                            return NextResponse.json({ valid: false, error: 'لقد استخدمت هذا الكود من قبل' })
                        }
                    }
                }
            }
        }

        // 6. جلب سعر الباقة
        const { data: plan } = await (supabase as any)
            .from('plans')
            .select('price')
            .eq('is_active', true)
            .eq('id', planId)
            .single()

        if (!plan) {
            return NextResponse.json({ valid: false, error: 'الباقة غير موجودة' })
        }

        let originalAmount = Number(plan.price)
        if (isUpgrade) {
            if (!userId) return NextResponse.json({ valid: false, error: 'يرجى تسجيل الدخول' }, { status: 401 })
            const subscription = await getUserSubscription(userId)
            const { data: activePlans } = await (supabase as any).from('plans').select('id, price').eq('is_active', true)
            try {
                originalAmount = getCheckoutBasePrice(Object.fromEntries((activePlans || []).map((p: any) => [p.id, Number(p.price)])), planId, true, subscription)
            } catch (error) {
                return NextResponse.json({ valid: false, error: error instanceof Error ? error.message : 'ترقية غير صالحة' }, { status: 400 })
            }
        }

        // 7. التحقق من الحد الأدنى
        if (promo.min_amount && originalAmount < promo.min_amount) {
            return NextResponse.json({
                valid: false,
                error: `الحد الأدنى لاستخدام هذا الكود هو ${promo.min_amount} جنيه`
            })
        }

        // 8. حساب الخصم — منطق واحد مشترك مع create-session (لا انحراف بين المعروض والمخصوم)
        const { discountAmount, finalAmount } = applyPromoDiscount(originalAmount, promo)

        return NextResponse.json({
            valid: true,
            promo_id: promo.id,
            code: promo.code,
            discount_type: promo.discount_type,
            discount_value: promo.discount_value,
            discount_amount: discountAmount,
            original_amount: originalAmount,
            final_amount: Math.round(finalAmount * 100) / 100,
            description: promo.description,
        })
    } catch (error) {
        dbLogger.error('Promo validate error:', error)
        return NextResponse.json({ valid: false, error: 'حدث خطأ في التحقق من الكود' }, { status: 500 })
    }
}
