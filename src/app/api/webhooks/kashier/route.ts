import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase-admin'
import { createHmac, timingSafeEqual } from 'crypto'
import { dbLogger } from '@/lib/logger'

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
async function createSubscriptionFromWebhook(
    userId: string,
    sessionId: string,
    planId: string,
    paymentId: string,
    paidAt: string
) {
    const supabaseAdmin = getSupabaseAdmin()

    // حساب expires_at (+365 يوم)
    const startsAt = new Date(paidAt)
    const expiresAt = new Date(startsAt)
    expiresAt.setDate(expiresAt.getDate() + 365)

    // التحقق من وجود اشتراك مسبقاً (Idempotency)
    const { data: existingSub } = await (supabaseAdmin as any)
        .from('subscriptions')
        .select('id')
        .eq('payment_id', paymentId)
        .single()

    if (existingSub) {
        dbLogger.info(`[Webhook] Subscription already exists for payment ${paymentId}`)
        return { ok: true, alreadyExists: true }
    }

    // إنشاء الاشتراك
    const { error: subError } = await (supabaseAdmin as any)
        .from('subscriptions')
        .insert({
            user_id: userId,
            plan_id: planId,
            payment_id: paymentId,
            status: 'active',
            starts_at: startsAt.toISOString(),
            expires_at: expiresAt.toISOString(),
        })

    if (subError) {
        dbLogger.error('[Webhook] Subscription insert error:', subError)
        throw subError
    }

    // تحديث users table وتفعيل الحساب
    await (supabaseAdmin as any)
        .from('users')
        .update({
            current_plan: planId,
            plan_expires_at: expiresAt.toISOString(),
            is_active: true,  // تفعيل الحساب تلقائياً بعد الدفع
            is_verified: true, // تأكيد الحساب
        })
        .eq('id', userId)

    dbLogger.info(`[Webhook] Subscription created for user ${userId}, plan ${planId}`)
    return { ok: true }
}

// ─────────────────────────────────────────────
// Webhook Route Handler
// ─────────────────────────────────────────────

export async function POST(request: NextRequest) {
    try {
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
            .select('id, user_id, plan_id, status, kashier_session_id')
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
            // تحديث حالة الدفع
            const { error: updateError } = await (supabaseAdmin as any)
                .from('payments')
                .update({
                    status: 'success',
                    paid_at: new Date().toISOString(),
                })
                .eq('kashier_order_id', orderId)

            if (updateError) {
                dbLogger.error('[Webhook] Payment update error:', updateError)
            }

            // إنشاء اشتراك (إذا لم يكن موجوداً)
            try {
                await createSubscriptionFromWebhook(
                    trustedUserId,
                    payment.kashier_session_id,
                    payment.plan_id,
                    payment.id,
                    new Date().toISOString()
                )
            } catch (subErr) {
                dbLogger.error('[Webhook] Subscription creation failed:', subErr)
                // لا نفشل الـ webhook — الدفع تم تسجيله
            }

            return NextResponse.json({
                success: true,
                message: 'Payment processed successfully',
            })
        } else if (status === 'FAILED') {
            // تحديث الحالة إلى فشل
            await (supabaseAdmin as any)
                .from('payments')
                .update({ status: 'failed' })
                .eq('kashier_order_id', orderId)

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
