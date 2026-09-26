import { NextRequest, NextResponse } from 'next/server'
import { verifyPaymentSession } from '@/lib/kashier'
import { getSupabaseAdmin } from '@/lib/supabase-admin'
import { dbLogger } from '@/lib/logger'
import { getAuthenticatedUser } from '@/lib/auth-middleware'
import { checkRateLimitAsync, getClientIP, RATE_LIMITS } from '@/lib/rate-limit'
import { activateStoredPayment, paymentAmountMatches } from '@/lib/payment-activation'

/**
 * Verify payment by merchantOrderId (Kashier callback param)
 * POST /api/payment/verify-by-order
 */
export async function POST(request: NextRequest) {
    try {
        const body = await request.json()
        const { orderId } = body

        // استخراج userId من cookies مع التحقق من الجلسة
        const userId = await getAuthenticatedUser({ skipActiveCheck: true })

        if (!orderId) {
            return NextResponse.json(
                { error: 'بيانات ناقصة - orderId مطلوب' },
                { status: 400 }
            )
        }

        if (!userId) {
            return NextResponse.json(
                { error: 'غير مصرح - يرجى تسجيل الدخول' },
                { status: 401 }
            )
        }

        // SECURITY: Rate limit
        const clientIP = getClientIP(request)
        const rateLimitResult = await checkRateLimitAsync(`payment-verify-order:${userId}:${clientIP}`, RATE_LIMITS.PAYMENT_VERIFY)
        if (!rateLimitResult.allowed) {
            return NextResponse.json(
                { error: `تم تجاوز عدد المحاولات. حاول مجدداً بعد ${rateLimitResult.retryAfter} ثانية` },
                { status: 429 }
            )
        }

        const supabase = getSupabaseAdmin()
        const { data: payment, error: dbError } = await (supabase
            .from('payments') as any)
            .select('id, kashier_session_id, status, user_id, plan_id, amount, paid_at')
            .eq('kashier_order_id', orderId)
            .eq('user_id', userId)
            .single()

        if (dbError || !payment) {
            return NextResponse.json(
                { error: 'لم يتم العثور على بيانات العملية' },
                { status: 404 }
            )
        }

        // If already marked success, ensure entitlement flags are set (idempotent
        // backfill — closes the is_active bypass for payments marked success by an
        // older code path) then return.
        if (payment.status === 'success') {
            const activation = await activateStoredPayment(userId, payment.id, 'verify-by-order:existing')
            if (!activation.ok) return NextResponse.json({ error: 'تعذّر تفعيل الاشتراك' }, { status: 500 })
            return NextResponse.json({
                success: true,
                status: 'SUCCESS',
                message: 'تم الدفع بنجاح',
                userId
            })
        }

        // Verify with Kashier using the session ID
        if (payment.kashier_session_id) {
            const verifyResult = await verifyPaymentSession(payment.kashier_session_id)

            if (verifyResult.ok && verifyResult.paid) {
                if (!paymentAmountMatches(verifyResult.data?.amount, payment.amount)) return NextResponse.json({ error: 'مبلغ الدفع غير مطابق للطلب' }, { status: 400 })
                // Update payment status
                const paidAt = payment.paid_at || new Date().toISOString()
                const { error: updateError } = await (supabase.from('payments') as any)
                    .update({
                        status: 'success',
                        paid_at: paidAt,
                        payment_method: verifyResult.data?.method || null
                    })
                    .eq('id', payment.id)

                // Activate via the unified source (sets is_active + amount guard)
                if (updateError) return NextResponse.json({ error: 'تعذّر حفظ تأكيد الدفع' }, { status: 500 })
                const activation = await activateStoredPayment(userId, payment.id, 'verify-by-order')

                if (!activation.ok) return NextResponse.json({ error: 'تعذّر تفعيل الاشتراك' }, { status: 500 })
                return NextResponse.json({
                    success: true,
                    status: 'SUCCESS',
                    message: 'تم الدفع بنجاح',
                    userId
                })
            }
        }

        return NextResponse.json({
            success: false,
            error: 'لم يتم التحقق من الدفع'
        })
    } catch (error) {
        dbLogger.error('Payment verify-by-order error:', error)
        return NextResponse.json(
            { error: 'حدث خطأ في التحقق من الدفع' },
            { status: 500 }
        )
    }
}
