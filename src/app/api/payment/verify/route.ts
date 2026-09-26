import { NextRequest, NextResponse } from 'next/server'
import { verifyPaymentSession } from '@/lib/kashier'
import { dbLogger } from '@/lib/logger'
import { getSupabaseAdmin } from '@/lib/supabase-admin'
import { getAuthenticatedUser } from '@/lib/auth-middleware'
import { checkRateLimitAsync, getClientIP, RATE_LIMITS } from '@/lib/rate-limit'
import { activatePaidSubscription } from '@/lib/payment-activation'

/**
 * إنشاء اشتراك بعد الدفع الناجح — يمرّ عبر activatePaidSubscription الموحّد
 * (يضمن is_active، حارس المبلغ، وidempotency). `paidAmount` من Kashier.
 */
async function createSubscriptionAfterPayment(userId: string, sessionId: string, paidAmount?: number | string | null) {
    try {
        const supabaseAdmin = getSupabaseAdmin()

        const { data: payment, error: paymentError } = await (supabaseAdmin as any)
            .from('payments')
            .select('id, plan_id, paid_at, amount')
            .eq('kashier_session_id', sessionId)
            .single()

        if (paymentError || !payment) {
            dbLogger.error('[createSubscription] Payment not found:', paymentError)
            return { ok: false, error: 'Payment not found' }
        }

        return await activatePaidSubscription({
            userId,
            paymentId: payment.id,
            planId: payment.plan_id,
            owedAmount: payment.amount,
            paidAmount: paidAmount ?? null,
            paidAt: payment.paid_at,
            source: 'verify',
        })
    } catch (err) {
        dbLogger.error('[createSubscription] Unexpected error:', err)
        return { ok: false, error: 'خطأ غير متوقع' }
    }
}

export async function POST(request: NextRequest) {
    try {
        const body = await request.json()
        const { sessionId } = body

        // استخراج userId من cookies مع التحقق من الجلسة
        const userId = await getAuthenticatedUser({ skipActiveCheck: true })

        if (!sessionId) {
            return NextResponse.json(
                { error: 'بيانات ناقصة' },
                { status: 400 }
            )
        }

        if (!userId) {
            return NextResponse.json(
                { error: 'غير مصرح - يرجى تسجيل الدخول' },
                { status: 401 }
            )
        }

        // SECURITY: Rate limit payment verification
        const clientIP = getClientIP(request)
        const rateLimitResult = await checkRateLimitAsync(`payment-verify:${userId}:${clientIP}`, RATE_LIMITS.PAYMENT_VERIFY)
        if (!rateLimitResult.allowed) {
            return NextResponse.json(
                { error: `تم تجاوز عدد المحاولات. حاول مجدداً بعد ${rateLimitResult.retryAfter} ثانية` },
                { status: 429 }
            )
        }

        const supabase = getSupabaseAdmin()
        const verifyResult = await verifyPaymentSession(sessionId)

        if (!verifyResult.ok) {
            return NextResponse.json(
                { success: false, error: verifyResult.error },
                { status: 500 }
            )
        }

        const status = verifyResult.status

        if (verifyResult.paid) {
            // الدفع ناجح - تحديث قاعدة البيانات
            const { error: updateError } = await (supabase.from('payments') as any)
                .update({
                    status: 'success',
                    paid_at: new Date().toISOString(),
                    payment_method: verifyResult.data?.method || null
                })
                .eq('kashier_session_id', sessionId)

            if (updateError) {
                dbLogger.error('Error updating payment status:', updateError)
            }

            dbLogger.info(`Payment successful for user ${userId}, session ${sessionId}`)

            // Stage 3: تفعيل الاشتراك عبر المصدر الموحّد (يضبط is_active + حارس المبلغ)
            const subResult = await createSubscriptionAfterPayment(userId, sessionId, verifyResult.data?.amount)
            if (!subResult.ok) {
                dbLogger.error(`[Payment Verify] Activation failed: ${subResult.error}`)
            }

            return NextResponse.json({
                success: true,
                status: 'SUCCESS',
                message: 'تم الدفع بنجاح',
                userId: userId
            })
        } else if (status === 'FAILED' || status === 'EXPIRED') {
            // تحديث حالة الدفع في قاعدة البيانات إلى فشل
            await (supabase.from('payments') as any)
                .update({
                    status: 'failed',
                    payment_method: verifyResult.data?.method || null
                })
                .eq('kashier_session_id', sessionId)

            return NextResponse.json({
                success: false,
                status: status || 'FAILED',
                error: 'لم يتم الدفع بنجاح'
            })
        } else {
            // PENDING / CREATED / OPENED => يبقى معلقاً
            return NextResponse.json({
                success: false,
                status: status || 'PENDING',
                message: 'عملية الدفع لا تزال تحت المعالجة'
            })
        }
    } catch (error) {
        dbLogger.error('Payment verify error:', error)
        return NextResponse.json(
            { error: 'حدث خطأ في التحقق من الدفع' },
            { status: 500 }
        )
    }
}
