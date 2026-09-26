import { NextRequest, NextResponse } from 'next/server'
import { createPaymentSession } from '@/lib/kashier'
import { getSupabaseAdmin } from '@/lib/supabase-admin'
import { dbLogger } from '@/lib/logger'
import type { PlanId } from '@/types/subscription'
import { getAuthenticatedUser } from '@/lib/auth-middleware'
import { checkRateLimitAsync, getClientIP, RATE_LIMITS } from '@/lib/rate-limit'
import { sendCAPIInitiateCheckout } from '@/lib/meta-capi'
import { checkoutEventId } from '@/lib/tracking-config'
import { applyPromoDiscount } from '@/lib/pricing'
import { SITE_URL } from '@/lib/config'

export async function POST(request: NextRequest) {
    try {
        const supabase = getSupabaseAdmin()
        const body = await request.json()
        const { planId, promoCode, isUpgrade, currentPlanId } = body

        // استخراج userId من cookies مع التحقق من الجلسة
        // skipActiveCheck: المستخدم الجديد لسه ما دفعش فـ is_active=false
        const userId = await getAuthenticatedUser({ skipActiveCheck: true })

        if (!userId || !planId) {
            return NextResponse.json(
                { error: 'بيانات ناقصة - يرجى تسجيل الدخول' },
                { status: 400 }
            )
        }

        // SECURITY: Rate limit payment session creation
        const clientIP = getClientIP(request)
        const rateLimitResult = await checkRateLimitAsync(`payment-create:${userId}:${clientIP}`, RATE_LIMITS.PAYMENT_CREATE)
        if (!rateLimitResult.allowed) {
            return NextResponse.json(
                { error: `تم تجاوز عدد المحاولات. حاول مجدداً بعد ${rateLimitResult.retryAfter} ثانية` },
                { status: 429 }
            )
        }

        // Stage 3: التحقق من أن plan_id صحيح
        const validPlans: PlanId[] = ['basic', 'pro', 'vip']
        if (!validPlans.includes(planId as PlanId)) {
            return NextResponse.json(
                { error: 'معرّف الباقة غير صحيح' },
                { status: 400 }
            )
        }

        // التحقق من وجود المستخدم
        const { data: user, error: userError } = await supabase
            .from('users')
            .select('id, email, full_name')
            .eq('id', userId)
            .single() as { data: { id: string; email: string; full_name: string } | null; error: any }

        if (userError || !user) {
            return NextResponse.json(
                { error: 'المستخدم غير موجود' },
                { status: 404 }
            )
        }

        // السعر مصدره الوحيد جدول plans (يُدار من لوحة الأدمن). نقرؤه server-side
        // كي يتطابق المبلغ المخصوم مع المعروض ومع أي تعديل سعر من اللوحة.
        const { data: planRows, error: plansLoadError } = await (supabase
            .from('plans') as any)
            .select('id, name_ar, price')
            .in('id', validPlans)

        if (plansLoadError || !planRows || planRows.length === 0) {
            dbLogger.error('Failed to load plans for pricing:', plansLoadError)
            return NextResponse.json({ error: 'تعذّر تحديد سعر الباقة' }, { status: 500 })
        }

        const plans: Record<string, { name: string; price: number }> = {}
        for (const row of planRows) {
            plans[row.id] = { name: row.name_ar, price: Number(row.price) }
        }

        const plan = plans[planId]
        // Fail-safe: never create a Kashier session with a missing/invalid price.
        if (!plan || !Number.isFinite(plan.price) || plan.price <= 0) {
            dbLogger.error('Plan price missing or invalid in plans table', { planId, plan })
            return NextResponse.json(
                { error: 'باقة غير صالحة' },
                { status: 400 }
            )
        }

        // حساب السعر — ترقية = الفرق بين الباقتين
        let basePrice = plan.price
        let currentPlanPrice = 0
        if (isUpgrade && currentPlanId && plans[currentPlanId]) {
            currentPlanPrice = plans[currentPlanId].price
            basePrice = plan.price - currentPlanPrice
            if (basePrice <= 0) {
                return NextResponse.json(
                    { error: 'لا يمكن الترقية لباقة بنفس السعر أو أقل' },
                    { status: 400 }
                )
            }
        }

        let finalAmount = basePrice
        let promoId: string | null = null
        let discountAmount = 0

        // التحقق من كود الخصم وتطبيقه
        if (promoCode) {
            const { data: promo, error: promoError } = await (supabase
                .from('promo_codes') as any)
                .select('*')
                .eq('code', promoCode.toUpperCase())
                .eq('is_active', true)
                .single()

            if (promoError || !promo) {
                return NextResponse.json(
                    { error: 'كود الخصم غير صالح' },
                    { status: 400 }
                )
            }

            // التحقق من تاريخ الصلاحية
            const now = new Date()
            if (promo.starts_at && new Date(promo.starts_at) > now) {
                return NextResponse.json({ error: 'كود الخصم لم يبدأ بعد' }, { status: 400 })
            }
            if (promo.expires_at && new Date(promo.expires_at) < now) {
                return NextResponse.json({ error: 'كود الخصم منتهي الصلاحية' }, { status: 400 })
            }

            // التحقق من الحد الأقصى للاستخدام
            if (promo.max_uses !== null && promo.current_uses >= promo.max_uses) {
                return NextResponse.json({ error: 'تم استنفاد كود الخصم' }, { status: 400 })
            }

            // التحقق من الباقات المسموحة
            if (promo.allowed_plans && promo.allowed_plans.length > 0 && !promo.allowed_plans.includes(planId)) {
                return NextResponse.json({ error: 'كود الخصم لا ينطبق على هذه الباقة' }, { status: 400 })
            }

            // التحقق من أن المستخدم لم يستخدم هذا الكود في دفع مكتمل
            const { data: existingUses } = await (supabase
                .from('promo_code_uses') as any)
                .select('id, payment_id')
                .eq('promo_code_id', promo.id)
                .eq('user_id', userId)

            if (existingUses && existingUses.length > 0) {
                // فحص أولي سريع - الفحص الذري النهائي يتم في try_use_promo_code
                for (const use of existingUses) {
                    if (use.payment_id) {
                        const { data: payment } = await (supabase
                            .from('payments') as any)
                            .select('status')
                            .eq('id', use.payment_id)
                            .single()

                        if (payment && (payment.status === 'paid' || payment.status === 'completed' || payment.status === 'success')) {
                            return NextResponse.json({ error: 'لقد استخدمت هذا الكود مسبقاً' }, { status: 400 })
                        }
                    }
                }
                // تنظيف الاستخدامات القديمة وتصحيح العداد يتم ذرياً في try_use_promo_code
            }

            // حساب الخصم — منطق واحد مشترك مع /api/promo/validate (لا انحراف)
            const promoCalc = applyPromoDiscount(basePrice, promo)
            discountAmount = promoCalc.discountAmount
            finalAmount = promoCalc.finalAmount
            promoId = promo.id
        }

        // إنشاء رقم طلب فريد
        const orderId = `ORD-${Date.now()}-${userId.substring(0, 8)}`

        // تحديد رابط العودة — من الدومين الكنسي (SITE_URL) لا من origin العميل القابل للتلاعب،
        // كي تشير redirect/webhook لكاشير دائماً للمضيف الصحيح المُعلَّم.
        const baseUrl = SITE_URL

        // SECURITY: Do NOT include userId in the redirect URL — it's tamperable by the user.
        // The callback page reads identity from the session cookie instead.
        const baseRedirectUrl = `${baseUrl}/payment/callback`
        const webhookUrl = `${baseUrl}/api/payment/webhook`

        // إنشاء جلسة كاشير
        const upgradeLabel = isUpgrade ? ` (ترقية من ${plans[currentPlanId]?.name || 'الحالية'})` : ''
        const sessionResult = await createPaymentSession({
            orderId,
            amount: finalAmount.toFixed(2),
            customerEmail: user.email,
            customerReference: userId,
            description: `اشتراك في PromptMaster - باقة ${plan.name}${upgradeLabel}${promoId ? ` (خصم ${discountAmount} ج.م)` : ''}`,
            redirectUrl: baseRedirectUrl,
            webhookUrl
        })

        if (!sessionResult.success || !sessionResult.sessionId) {
            return NextResponse.json(
                { error: sessionResult.error || 'فشل في إنشاء جلسة الدفع' },
                { status: 500 }
            )
        }

        // حفظ بيانات الدفع في قاعدة البيانات
        const paymentInsert: any = {
            user_id: userId,
            kashier_session_id: sessionResult.sessionId,
            kashier_order_id: orderId,
            amount: finalAmount,
            currency: 'EGP',
            plan_id: planId,
            status: 'pending'
        }
        // Store upgrade metadata if available
        if (isUpgrade && currentPlanId) {
            paymentInsert.notes = `upgrade:${currentPlanId}->${planId}|diff:${basePrice}|from_price:${currentPlanPrice}|to_price:${plan.price}`
        }

        const { data: paymentRecord, error: insertError } = await (supabase
            .from('payments') as any)
            .insert(paymentInsert)
            .select('id')
            .single()

        if (insertError) {
            dbLogger.error('Error saving payment record:', insertError)
            return NextResponse.json(
                { error: 'فشل في حفظ بيانات الطلب' },
                { status: 500 }
            )
        }

        // تسجيل استخدام كود الخصم ذرياً (تنظيف + فحص الحد + تسجيل + تحديث العداد)
        if (promoId && paymentRecord) {
            const { data: promoResult, error: promoRpcError } = await (supabase as any)
                .rpc('try_use_promo_code', {
                    p_promo_id: promoId,
                    p_user_id: userId,
                    p_payment_id: paymentRecord.id,
                    p_original_amount: plan.price,
                    p_discount_amount: discountAmount,
                    p_final_amount: finalAmount,
                })

            if (promoRpcError) {
                dbLogger.error('Promo atomic RPC error:', promoRpcError)
            } else if (promoResult && !promoResult.success) {
                // الدالة الذرية رفضت الاستخدام (max_uses أو already_used)
                dbLogger.warn(`Promo code rejected atomically: ${promoResult.error}`)
            }
        }

        // Send InitiateCheckout event to Meta CAPI (server-side)
        try {
            const fbp = request.cookies.get('_fbp')?.value || undefined
            const fbc = request.cookies.get('_fbc')?.value || undefined

            sendCAPIInitiateCheckout({
                value: finalAmount,
                eventId: checkoutEventId(orderId),
                email: user.email,
                clientIp: clientIP,
                userAgent: request.headers.get('user-agent') || undefined,
                fbp,
                fbc,
            }).catch(() => { /* non-critical */ })
        } catch (capiErr) {
            dbLogger.error('CAPI InitiateCheckout error (non-critical):', capiErr)
        }

        return NextResponse.json({
            success: true,
            sessionUrl: sessionResult.sessionUrl,
            sessionId: sessionResult.sessionId,
            orderId
        })
    } catch (error) {
        dbLogger.error('Payment create-session error:', error)
        return NextResponse.json(
            { error: 'حدث خطأ في إنشاء جلسة الدفع' },
            { status: 500 }
        )
    }
}
