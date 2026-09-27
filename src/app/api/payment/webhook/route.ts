import { activateStoredPayment, paymentAmountMatches } from '@/lib/payment-activation'
import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase-admin'
import { dbLogger } from '@/lib/logger'
import { sendCAPIPurchase } from '@/lib/meta-capi'
import { alertMoneyPath } from '@/lib/alert'
import crypto from 'crypto'

/**
 * Kashier Webhook Endpoint — Server-to-Server Payment Notification
 * 
 * This is the MOST RELIABLE way to confirm payments.
 * Kashier sends a POST request here when payment status changes.
 * No auth required (unauthenticated POST as per Kashier docs).
 * Signature verification ensures authenticity.
 * 
 * POST /api/payment/webhook
 */
export async function POST(request: NextRequest) {
    try {
        const body = await request.json()
        const { event, data } = body

        dbLogger.info('[webhook] Received:', { event, merchantOrderId: data?.merchantOrderId, status: data?.status })

        // Only handle payment events
        if (event !== 'pay') {
            dbLogger.info(`[webhook] Ignoring event type: ${event}`)
            return NextResponse.json({ received: true }, { status: 200 })
        }

        if (!data) {
            dbLogger.error('[webhook] No data in webhook payload')
            return NextResponse.json({ received: true }, { status: 200 })
        }

        // SECURITY: Verify webhook signature (HMAC-SHA256) — MANDATORY
        // Reject any webhook missing the signature header or signatureKeys field.
        // This closes a spoofing vector where an attacker could POST a forged
        // "SUCCESS" event and activate a subscription without paying.
        const kashierSignature = request.headers.get('x-kashier-signature')
        if (!kashierSignature) {
            dbLogger.error('[webhook] Missing x-kashier-signature header — rejecting')
            return NextResponse.json({ error: 'Signature required' }, { status: 403 })
        }
        if (!data.signatureKeys) {
            dbLogger.error('[webhook] Missing signatureKeys in payload — rejecting')
            return NextResponse.json({ error: 'Signature payload incomplete' }, { status: 403 })
        }
        const isValid = verifySignature(data, kashierSignature)
        if (!isValid) {
            dbLogger.error('[webhook] Invalid signature — potential spoofing attempt')
            return NextResponse.json({ error: 'Invalid signature' }, { status: 403 })
        }
        dbLogger.info('[webhook] Signature verified ✓')

        const {
            merchantOrderId,
            status,
            transactionId,
            method,
        } = data

        // Only process successful payments
        if (status !== 'SUCCESS') {
            dbLogger.info(`[webhook] Payment status: ${status} for order ${merchantOrderId} — not activating`)
            return NextResponse.json({ received: true }, { status: 200 })
        }

        if (!merchantOrderId) {
            dbLogger.error('[webhook] Missing merchantOrderId')
            return NextResponse.json({ received: true }, { status: 200 })
        }

        const supabase = getSupabaseAdmin()

        // Find payment by merchantOrderId (our kashier_order_id)
        const { data: payment, error: findError } = await (supabase.from('payments') as any)
            .select('id, user_id, plan_id, status, kashier_session_id, amount')
            .eq('kashier_order_id', merchantOrderId)
            .single()

        if (findError || !payment) {
            dbLogger.error(`[webhook] Payment not found for merchantOrderId: ${merchantOrderId}`, findError)
            return NextResponse.json({ received: true }, { status: 200 })
        }

        if (!paymentAmountMatches(data.amount, payment.amount) || data.currency !== 'EGP') return NextResponse.json({ error: 'Payment amount or currency mismatch' }, { status: 400 })

        // Already processed — idempotent
        if (payment.status === 'success') {
            dbLogger.info(`[webhook] Payment ${payment.id} already marked as success — idempotent skip`)
            // Still ensure subscription exists (in case it was missed)
            await ensureSubscription(supabase, payment.user_id, payment.id, payment.plan_id)
            return NextResponse.json({ received: true }, { status: 200 })
        }

        // Mark payment as success
        const updateData: Record<string, unknown> = {
            status: 'success',
            paid_at: new Date().toISOString(),
        }
        if (method) updateData.payment_method = method
        // payments has no kashier_transaction_id column — writing it made every real
        // (signed, SUCCESS) webhook fail with 500. Keep the id in the log instead.
        dbLogger.info(`[webhook] Kashier transaction ${transactionId || 'n/a'} for payment ${payment.id}`)

        const { error: updateError } = await (supabase.from('payments') as any)
            .update(updateData)
            .eq('id', payment.id)

        if (updateError) {
            dbLogger.error('[webhook] Payment update error:', updateError)
            alertMoneyPath('webhook_payment_update_failed', { paymentId: payment.id, merchantOrderId, error: updateError.message })
            throw new Error('Payment status update failed')
        }

        // Create subscription + activate user
        await ensureSubscription(supabase, payment.user_id, payment.id, payment.plan_id)

        // Send Purchase event to Meta Conversions API (server-side)
        try {
            const { data: user } = await (supabase as any)
                .from('users')
                .select('email, phone_number')
                .eq('id', payment.user_id)
                .single()

            // Prefer the Kashier payload amount; fall back to the amount stored on
            // our payment row so the Purchase event is never sent with value 0.
            const amount = (data.amount ? parseFloat(data.amount) : 0) || Number(payment.amount) || 0
            const clientIp = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || undefined
            const userAgent = request.headers.get('user-agent') || undefined

            await sendCAPIPurchase({
                value: amount,
                orderId: merchantOrderId,
                email: user?.email,
                phone: user?.phone_number,
                clientIp,
                userAgent,
            })
        } catch (capiErr) {
            dbLogger.error('[webhook] CAPI Purchase event error (non-critical):', capiErr)
        }

        dbLogger.info(`[webhook] ✓ Payment ${payment.id} activated via webhook for user ${payment.user_id}, plan ${payment.plan_id}`)

        // MUST respond with 200 quickly — Kashier retries if not acknowledged
        return NextResponse.json({ received: true }, { status: 200 })
    } catch (error) {
        dbLogger.error('[webhook] Unexpected error:', error)
        alertMoneyPath('webhook_unexpected_error', { error: error instanceof Error ? error.message : String(error) })
        // Let Kashier retry transient database or activation failures.
        return NextResponse.json({ error: 'Payment processing temporarily failed' }, { status: 500 })
    }
}

/**
 * Verify Kashier webhook signature using HMAC-SHA256
 */
function verifySignature(data: Record<string, unknown>, receivedSignature: string): boolean {
    try {
        const apiKey = process.env.KASHIER_API_KEY
        if (!apiKey) {
            dbLogger.error('[webhook] KASHIER_API_KEY not set — cannot verify signature')
            return false
        }

        const signatureKeys = data.signatureKeys as string[]
        if (!Array.isArray(signatureKeys) || !['amount', 'currency', 'merchantOrderId', 'status'].every(key => signatureKeys.includes(key) && key in data)) {
            return false
        }

        // Sort signature keys alphabetically
        const sortedKeys = [...signatureKeys].sort()

        // Create query string payload (same as queryString.stringify)
        const signaturePayload = sortedKeys
            .filter(key => key in data)
            .map(key => `${encodeURIComponent(key)}=${encodeURIComponent(String(data[key]))}`)
            .join('&')

        // Generate HMAC-SHA256
        const cleanApiKey = apiKey.trim().replace(/^["']|["']$/g, '')
        const computedSignature = crypto
            .createHmac('sha256', cleanApiKey)
            .update(signaturePayload)
            .digest('hex')

        if (!/^[a-f0-9]{64}$/i.test(receivedSignature)) return false
        return crypto.timingSafeEqual(Buffer.from(computedSignature, 'hex'), Buffer.from(receivedSignature, 'hex'))
    } catch (err) {
        dbLogger.error('[webhook] Signature verification error:', err)
        return false
    }
}

/**
 * Ensure subscription exists and user is activated
 */
async function ensureSubscription(supabase: any, userId: string, paymentId: string, planId: string) {
    const result = await activateStoredPayment(userId, paymentId, 'callback')
    if (!result.ok) throw new Error(result.error || 'Subscription activation failed')
}
