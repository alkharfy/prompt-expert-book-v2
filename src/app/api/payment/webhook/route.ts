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
        if (transactionId) updateData.kashier_transaction_id = transactionId

        const { error: updateError } = await (supabase.from('payments') as any)
            .update(updateData)
            .eq('id', payment.id)

        if (updateError) {
            dbLogger.error('[webhook] Payment update error:', updateError)
            alertMoneyPath('webhook_payment_update_failed', { paymentId: payment.id, merchantOrderId, error: updateError.message })
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
        // Return 200 to avoid Kashier infinite-retry loops on a deterministic error.
        // Any payment left 'pending' by a transient failure is recovered by the
        // reconcile-payments cron (≤15 min), so a missed activation is never silent.
        return NextResponse.json({ received: true }, { status: 200 })
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
        if (!signatureKeys || !Array.isArray(signatureKeys)) {
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

        return computedSignature === receivedSignature
    } catch (err) {
        dbLogger.error('[webhook] Signature verification error:', err)
        return false
    }
}

/**
 * Ensure subscription exists and user is activated
 */
async function ensureSubscription(supabase: ReturnType<typeof getSupabaseAdmin>, userId: string, paymentId: string, planId: string) {
    try {
        // Idempotency: check if subscription already exists for this payment
        const { data: existingSub } = await (supabase as any)
            .from('subscriptions')
            .select('id')
            .eq('payment_id', paymentId)
            .maybeSingle()

        if (existingSub) {
            dbLogger.info(`[webhook:ensureSubscription] Already exists for payment ${paymentId}`)
            // Still ensure user is marked active
            await (supabase as any)
                .from('users')
                .update({ is_active: true, current_plan: planId })
                .eq('id', userId)
            return
        }

        // Deactivate any existing active subscriptions (for upgrades)
        const { data: activeSubs } = await (supabase as any)
            .from('subscriptions')
            .select('id, plan_id')
            .eq('user_id', userId)
            .eq('status', 'active')

        if (activeSubs && activeSubs.length > 0) {
            for (const sub of activeSubs) {
                await (supabase as any)
                    .from('subscriptions')
                    .update({ status: 'upgraded', updated_at: new Date().toISOString() })
                    .eq('id', sub.id)
            }
        }

        const startsAt = new Date()
        const expiresAt = new Date(startsAt)
        expiresAt.setDate(expiresAt.getDate() + 365)

        // Create subscription
        const { error: subError } = await (supabase as any)
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
            dbLogger.error('[webhook:ensureSubscription] Insert error:', subError)
            return
        }

        // Update user — MUST set is_active: true
        const { error: userError } = await (supabase as any)
            .from('users')
            .update({
                current_plan: planId,
                plan_expires_at: expiresAt.toISOString(),
                is_active: true,
            })
            .eq('id', userId)

        if (userError) {
            dbLogger.error('[webhook:ensureSubscription] User update error:', userError)
        }

        dbLogger.info(`[webhook:ensureSubscription] Created for user ${userId}, plan ${planId}`)
    } catch (err) {
        dbLogger.error('[webhook:ensureSubscription] Unexpected error:', err)
    }
}
