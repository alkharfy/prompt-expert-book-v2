import { activateStoredPayment, paymentAmountMatches } from '@/lib/payment-activation'
import { NextRequest, NextResponse } from 'next/server'
import { verifyPaymentSession } from '@/lib/kashier'
import { getSupabaseAdmin } from '@/lib/supabase-admin'
import { dbLogger } from '@/lib/logger'
import { getAuthenticatedUser } from '@/lib/auth-middleware'
import { checkRateLimitAsync, getClientIP, RATE_LIMITS } from '@/lib/rate-limit'
import { sendCAPIPurchase } from '@/lib/meta-capi'

/**
 * Process Kashier payment callback
 * Accepts all available params from Kashier redirect and handles payment verification.
 * userId is extracted from cookies (not from body) to prevent spoofing.
 *
 * POST /api/payment/process-callback
 */
export async function POST(request: NextRequest) {
    try {
        const body = await request.json()
        const { paymentStatus, sessionId, merchantOrderId, transactionId } = body

        // استخراج userId من cookies مع التحقق من الجلسة
        const userId = await getAuthenticatedUser({ skipActiveCheck: true })

        if (!userId) {
            return NextResponse.json({ success: false, error: 'غير مصرح - يرجى تسجيل الدخول' }, { status: 401 })
        }

        // SECURITY: Rate limit
        const clientIP = getClientIP(request)
        const rateLimitResult = await checkRateLimitAsync(`payment-callback:${userId}:${clientIP}`, RATE_LIMITS.PAYMENT_CALLBACK)
        if (!rateLimitResult.allowed) {
            return NextResponse.json(
                { success: false, error: `تم تجاوز عدد المحاولات. حاول مجدداً بعد ${rateLimitResult.retryAfter} ثانية` },
                { status: 429 }
            )
        }

        const supabase = getSupabaseAdmin()

        // 2. Find the payment record
        let payment: any = null

        // Try by sessionId first
        if (sessionId) {
            const { data } = await (supabase.from('payments') as any)
                .select('id, kashier_session_id, kashier_order_id, status, plan_id, user_id, amount')
                .eq('kashier_session_id', sessionId)
                .eq('user_id', userId)
                .single()
            payment = data
        }

        // Try by merchantOrderId
        if (!payment && merchantOrderId) {
            const { data } = await (supabase.from('payments') as any)
                .select('id, kashier_session_id, kashier_order_id, status, plan_id, user_id, amount')
                .eq('kashier_order_id', merchantOrderId)
                .eq('user_id', userId)
                .single()
            payment = data
        }

        // Fallback: latest pending payment for this user
        if (!payment) {
            const { data: payments } = await (supabase.from('payments') as any)
                .select('id, kashier_session_id, kashier_order_id, status, plan_id, user_id, amount')
                .eq('user_id', userId)
                .eq('status', 'pending')
                .order('created_at', { ascending: false })
                .limit(1)

            if (payments && payments.length > 0) {
                payment = payments[0]
            }
        }

        if (!payment) {
            dbLogger.error(`[process-callback] No payment found for user ${userId}`)
            return NextResponse.json({ success: false, error: 'لم يتم العثور على عملية دفع' }, { status: 404 })
        }

        // 3. If payment already success, just ensure subscription exists
        if (payment.status === 'success') {
            await ensureSubscription(supabase, userId, payment.id, payment.plan_id)
            return NextResponse.json({
                success: true,
                status: 'SUCCESS',
                message: 'تم الدفع بنجاح',
                userId,
                amount: payment.amount ?? null,
                planId: payment.plan_id ?? null,
                orderId: payment.kashier_order_id ?? null,
            })
        }

        // 4. Verify payment via Kashier API (لا نثق بـ redirect parameters وحدها)

        let verified = false
        let paymentMethod: string | null = null
        let verifiedAmount: unknown

        // التحقق عبر Kashier API — المصدر الموثوق الوحيد
        // Retry up to 2 times with short delays (Kashier may lag behind redirect)
        if (payment.kashier_session_id) {
            const MAX_API_RETRIES = 2
            for (let i = 0; i <= MAX_API_RETRIES && !verified; i++) {
                if (i > 0) {
                    await new Promise(r => setTimeout(r, 2000)) // Wait 2s between retries
                }
                try {
                    const verifyResult = await verifyPaymentSession(payment.kashier_session_id)
                    if (verifyResult.ok && verifyResult.paid) {
                        verified = paymentAmountMatches(verifyResult.data?.amount, payment.amount)
                        verifiedAmount = verifyResult.data?.amount
                        paymentMethod = verifyResult.data?.method || null
                        dbLogger.info(`[process-callback] Kashier API confirms SUCCESS for session ${payment.kashier_session_id} (attempt ${i + 1})`)
                    } else {
                        dbLogger.info(`[process-callback] Kashier API status: ${verifyResult.status} for session ${payment.kashier_session_id} (attempt ${i + 1})`)
                    }
                } catch (err) {
                    dbLogger.error(`[process-callback] Kashier API check error (attempt ${i + 1}):`, err)
                }
            }
        }

        // SECURITY: No fallback — we NEVER trust redirect parameters alone
        // If Kashier API verification failed and no session_id, reject the payment
        if (!verified && !payment.kashier_session_id) {
            dbLogger.error(`[process-callback] Cannot verify payment ${payment.id} — no kashier_session_id for API verification`)
        }

        if (!verified) {
            return NextResponse.json({
                success: false,
                error: 'لم يتم التحقق من الدفع — يرجى المحاولة مرة أخرى بعد قليل'
            })
        }

        if (!paymentAmountMatches(verifiedAmount, payment.amount)) return NextResponse.json({ success: false, error: 'مبلغ الدفع غير مطابق للطلب' }, { status: 400 })

        // 5. Mark payment as success
        const updateData: any = {
            status: 'success',
            paid_at: new Date().toISOString(),
        }
        if (paymentMethod) updateData.payment_method = paymentMethod
        // No kashier_transaction_id column on payments — writing it failed the update.
        dbLogger.info(`[process-callback] Kashier transaction ${transactionId || 'n/a'} for payment ${payment.id}`)

        const { error: updateError } = await (supabase.from('payments') as any)
            .update(updateData)
            .eq('id', payment.id)

        if (updateError) {
            throw new Error('Payment status update failed')
        }

        // 6. Create subscription
        await ensureSubscription(supabase, userId, payment.id, payment.plan_id)

        // 6b. Mark this user's open payment intents as completed so cart-recovery
        //     never re-emails a buyer (defense-in-depth; non-blocking).
        try {
            await (supabase.from('payment_intents') as any)
                .update({ completed: true })
                .eq('user_id', userId)
                .eq('completed', false)
        } catch (intentErr) {
            dbLogger.error('[process-callback] Failed to mark payment_intents completed (non-critical):', intentErr)
        }

        // 7. Send Purchase event to Meta CAPI (server-side, real user IP/UA)
        try {
            const { data: user } = await (supabase as any)
                .from('users')
                .select('email, phone_number')
                .eq('id', userId)
                .single()

            const fbp = request.cookies.get('_fbp')?.value || undefined
            const fbc = request.cookies.get('_fbc')?.value || undefined

            await sendCAPIPurchase({
                value: payment.amount || 0,
                orderId: payment.kashier_order_id || payment.id,
                email: user?.email,
                phone: user?.phone_number,
                clientIp: clientIP,
                userAgent: request.headers.get('user-agent') || undefined,
                fbp,
                fbc,
            })
        } catch (capiErr) {
            dbLogger.error('[process-callback] CAPI Purchase error (non-critical):', capiErr)
        }

        dbLogger.info(`[process-callback] Payment ${payment.id} marked SUCCESS for user ${userId}`)

        return NextResponse.json({
            success: true,
            status: 'SUCCESS',
            message: 'تم الدفع بنجاح',
            userId,
            amount: payment.amount ?? null,
            planId: payment.plan_id ?? null,
            orderId: payment.kashier_order_id ?? null,
        })
    } catch (error) {
        dbLogger.error('[process-callback] Unexpected error:', error)
        return NextResponse.json(
            { success: false, error: 'حدث خطأ في معالجة الدفع' },
            { status: 500 }
        )
    }
}

async function ensureSubscription(supabase: any, userId: string, paymentId: string, planId: string) {
    const result = await activateStoredPayment(userId, paymentId, 'callback')
    if (!result.ok) throw new Error(result.error || 'Subscription activation failed')
}
