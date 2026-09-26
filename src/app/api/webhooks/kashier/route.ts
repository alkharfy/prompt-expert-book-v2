import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase-admin'
import { createHmac, timingSafeEqual } from 'crypto'
import { dbLogger } from '@/lib/logger'
import { activateStoredPayment, paymentAmountMatches } from '@/lib/payment-activation'
import { verifyPaymentSession } from '@/lib/kashier'
import { POST as paymentWebhook } from '@/app/api/payment/webhook/route'

/**
 * Kashier Webhook Handler — HMAC Signature Validation
 *
 * يستقبل إشعارات الدفع من Kashier ويتحقق من صحتها باستخدام HMAC-SHA256.
 * يتم استدعاء هذا الـ webhook تلقائياً عند نجاح/فشل الدفع.
 *
 * Security:
 * - يتحقق من HMAC signature لضمان أن الطلب من Kashier
 * - Idempotent: تشغيل آمن حتى لو جاء نفس الـ webhook عدة مرات
 * - يستخدم service_role client لتجاوز RLS
 *
 * @module api/webhooks/kashier
 */

// ─────────────────────────────────────────────
// HMAC Signature Validation
// ─────────────────────────────────────────────

/**
 * التحقق من توقيع HMAC من Kashier.
 *
 * Kashier sends signature in header: x-kashier-signature
 * Format: HMAC-SHA256 of request body using KASHIER_SECRET_KEY
 *
 * @param body - نص الطلب الخام
 * @param signature - التوقيع من header
 * @returns true إذا كان التوقيع صحيحاً
 */
function verifyKashierSignature(body: string, signature: string | null): boolean {
    if (!signature) {
        dbLogger.warn('[Webhook] Missing x-kashier-signature header')
        return false
    }

    const secretKey = process.env.KASHIER_SECRET_KEY
    if (!secretKey) {
        dbLogger.error('[Webhook] KASHIER_SECRET_KEY not configured')
        return false
    }

    try {
        // حساب HMAC-SHA256
        const hmac = createHmac('sha256', secretKey)
        hmac.update(body)
        const expectedSignature = hmac.digest('hex')

        // SECURITY: Timing-safe comparison to prevent timing attacks
        if (signature.length !== expectedSignature.length) {
            dbLogger.warn('[Webhook] Invalid signature length', {
                expected: expectedSignature.substring(0, 16) + '...',
                received: signature.substring(0, 16) + '...',
            })
            return false
        }
        const isValid = timingSafeEqual(Buffer.from(signature), Buffer.from(expectedSignature))

        if (!isValid) {
            dbLogger.warn('[Webhook] Invalid signature', {
                expected: expectedSignature.substring(0, 16) + '...',
                received: signature.substring(0, 16) + '...',
            })
        }

        return isValid
    } catch (err) {
        dbLogger.error('[Webhook] HMAC verification error:', err)
        return false
    }
}

// ─────────────────────────────────────────────
// Subscription Creation Logic
// ─────────────────────────────────────────────

/**
 * إنشاء اشتراك من webhook (مع حماية ضد التكرار).
 *
 * @param userId - معرّف المستخدم
 * @param sessionId - معرّف جلسة الدفع
 * @param planId - معرّف الباقة
 * @param paymentId - معرّف الدفع
 * @param paidAt - تاريخ الدفع
 */

// ─────────────────────────────────────────────
// Webhook Route Handler
// ─────────────────────────────────────────────

export async function POST(request: NextRequest) {
    try {
        const payload = await request.clone().json()
        if (payload.event && payload.data) return paymentWebhook(request)
        // 1. قراءة نص الطلب الخام (للتحقق من التوقيع)
        const bodyText = await request.text()
        const signature = request.headers.get('x-kashier-signature')

        // 2. التحقق من HMAC signature
        if (!verifyKashierSignature(bodyText, signature)) {
            dbLogger.warn('[Webhook] Signature verification failed')
            return NextResponse.json(
                { error: 'Invalid signature' },
                { status: 401 }
            )
        }

        // 3. تحليل JSON بعد التحقق
        const body = JSON.parse(bodyText)

        // 4. استخراج البيانات من Kashier webhook
        // Format reference: https://developers.kashier.io/payment/webhook
        const {
            merchant_order_id: orderId,
            payment_status: status,
            transaction_id: transactionId,
            customer_reference: userId,
        } = body

        dbLogger.info('[Webhook] Received from Kashier:', {
            orderId,
            status,
            transactionId,
            userId,
        })

        if (!orderId || !userId) {
            return NextResponse.json(
                { error: 'Missing required fields' },
                { status: 400 }
            )
        }

        // 5. جلب بيانات الدفع من قاعدة البيانات
        const supabaseAdmin = getSupabaseAdmin()

        const { data: payment, error: paymentError } = await (supabaseAdmin as any)
            .from('payments')
            .select('id, user_id, plan_id, status, kashier_session_id, amount, paid_at')
            .eq('kashier_order_id', orderId)
            .single()

        if (paymentError || !payment) {
            dbLogger.error('[Webhook] Payment not found for order:', orderId)
            return NextResponse.json(
                { error: 'Payment not found' },
                { status: 404 }
            )
        }

        // SECURITY: Verify customer_reference matches the user_id stored in payments table
        if (payment.user_id && payment.user_id !== userId) {
            dbLogger.error('[Webhook] customer_reference mismatch!', {
                webhookUserId: userId,
                paymentUserId: payment.user_id,
                orderId,
            })
            return NextResponse.json(
                { error: 'User mismatch' },
                { status: 400 }
            )
        }

        // Use the trusted user_id from the payment record
        const trustedUserId = payment.user_id || userId

        // 6. معالجة حسب الحالة
        if (status === 'SUCCESS' || status === 'PAID') {
            if (payment.status !== 'success') {
                const verified = payment.kashier_session_id ? await verifyPaymentSession(payment.kashier_session_id) : null
                if (!verified?.ok || !verified.paid) return NextResponse.json({ error: 'Payment not verified' }, { status: 500 })
                if (!paymentAmountMatches(verified.data?.amount, payment.amount)) return NextResponse.json({ error: 'Amount mismatch' }, { status: 400 })
            }
            // تحديث حالة الدفع
            const { error: updateError } = await (supabaseAdmin as any)
                .from('payments')
                .update({
                    status: 'success',
                    paid_at: payment.paid_at || new Date().toISOString(),
                })
                .eq('kashier_order_id', orderId)

            if (updateError) throw new Error('Payment update failed')
            const activation = await activateStoredPayment(trustedUserId, payment.id, 'legacy-webhook')
            if (!activation.ok) throw new Error(activation.error || 'Activation failed')

            return NextResponse.json({
                success: true,
                message: 'Payment processed successfully',
            })
        } else if (status === 'FAILED') {
            // تحديث الحالة إلى فشل
            await (supabaseAdmin as any)
                .from('payments')
                .update({ status: 'failed' })
                .eq('kashier_order_id', orderId).neq('status', 'success')

            return NextResponse.json({
                success: true,
                message: 'Payment failure recorded',
            })
        } else {
            // PENDING / CREATED / OPENED
            dbLogger.info(`[Webhook] Payment still pending: ${status}`)
            return NextResponse.json({
                success: true,
                message: 'Payment status updated',
            })
        }
    } catch (error) {
        dbLogger.error('[Webhook] Error processing webhook:', error)
        return NextResponse.json(
            { error: 'Webhook processing failed' },
            { status: 500 }
        )
    }
}
