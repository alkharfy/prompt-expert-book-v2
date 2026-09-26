import { NextRequest, NextResponse } from 'next/server'
import crypto from 'crypto'
import { getSupabaseAdmin } from '@/lib/supabase-admin'
import { dbLogger } from '@/lib/logger'
import { verifyPaymentSession } from '@/lib/kashier'
import { activateStoredPayment, paymentAmountMatches } from '@/lib/payment-activation'
import { sendCAPIPurchase } from '@/lib/meta-capi'
import { purchaseEventId } from '@/lib/tracking-config'
import { alertMoneyPath } from '@/lib/alert'

/**
 * Payment reconciliation cron (WS8).
 * Recovers payments that succeeded at Kashier but whose tab/callback never
 * completed (e.g. mobile user closed the tab) — these are stuck 'pending'. For
 * each, it re-verifies with Kashier and, if paid, marks success + activates +
 * fires the Purchase CAPI event ONCE per order using the shared deterministic
 * event_id (purchaseEventId) so a concurrent late callback can't double-count.
 *
 * NOTE (acknowledged limit): this server path fires Meta CAPI Purchase only.
 * Google Ads / GA4 conversions are client-only; a webhook/reconcile-only
 * purchase (tab closed) is NOT reported to Google Ads here (that requires the
 * Google Ads offline-conversions API + OAuth — owner setup). Documented, not silent.
 *
 * Scheduled daily at 01:00 UTC for Vercel Hobby compatibility.
 * Auth: Bearer CRON_SECRET. Pending payments remain eligible until resolved.
 */
export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization')
    const cronSecret = process.env.CRON_SECRET
    if (!cronSecret || !authHeader) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    const expected = `Bearer ${cronSecret}`
    const a = Buffer.from(authHeader)
    const b = Buffer.from(expected)
    if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const supabase = getSupabaseAdmin()

    // Pending payments that have a Kashier session to re-verify.
    const { data: pendings, error } = await (supabase.from('payments') as any)
      .select('id, user_id, plan_id, amount, paid_at, kashier_session_id, kashier_order_id, status')
      .eq('status', 'pending')
      .not('kashier_session_id', 'is', null)
      .limit(100)

    if (error) {
      alertMoneyPath('reconcile_query_failed', { error: error.message })
      return NextResponse.json({ error: 'query_failed' }, { status: 500 })
    }

    let checked = 0
    let recovered = 0
    const failures: string[] = []

    for (const p of pendings || []) {
      checked++
      try {
        const result = await verifyPaymentSession(p.kashier_session_id)
        if (!result.ok) continue

        if (result.paid) {
          if (!paymentAmountMatches(result.data?.amount, p.amount)) throw new Error('Payment amount mismatch')
          // pending → success transition (the ONLY place we emit Purchase here)
          const { error: updateError } = await (supabase.from('payments') as any)
            .update({ status: 'success', paid_at: p.paid_at || new Date().toISOString(), payment_method: result.data?.method || null })
            .eq('id', p.id)
          if (updateError) throw new Error('Payment update failed')
          const activation = await activateStoredPayment(p.user_id, p.id, 'reconcile')

          if (!activation.ok) throw new Error(activation.error || 'Activation failed')
          const orderId = p.kashier_order_id || p.id
          await sendCAPIPurchase({
            value: (result.data?.amount ? parseFloat(String(result.data.amount)) : 0) || Number(p.amount) || 0,
            orderId,
            eventId: purchaseEventId(orderId), // shared id → Meta dedups vs any late callback
          }).catch(() => { /* non-critical */ })

          recovered++
          dbLogger.info(`[reconcile] recovered payment ${p.id} (order ${orderId})`)
        } else if (result.status === 'FAILED' || result.status === 'EXPIRED') {
          await (supabase.from('payments') as any)
            .update({ status: 'failed' })
            .eq('id', p.id).neq('status', 'success')
        }
        // PENDING/CREATED/OPENED → leave as-is for the next run
      } catch (err) {
        failures.push(p.id)
        dbLogger.error(`[reconcile] error on payment ${p.id}:`, err)
      }
    }

    // Retry entitlement writes that failed after the payment was marked success.
    // These are already provider-verified; never emit another purchase event.
    const { data: recentPaid, error: retryError } = await (supabase.from('payments') as any)
      .select('id, user_id').eq('status', 'success')
      .gte('paid_at', new Date(Date.now() - 7 * 86400000).toISOString())
      .order('paid_at', { ascending: false }).limit(100)
    if (retryError) throw new Error('Activation recovery lookup failed')
    for (const payment of recentPaid || []) {
      const activation = await activateStoredPayment(payment.user_id, payment.id, 'reconcile:retry')
      if (!activation.ok && !['subscription_expired', 'subscription_inactive', 'upgrade_subscription_expired'].includes(activation.error || '')) failures.push(payment.id)
    }

    if (failures.length) {
      alertMoneyPath('reconcile_item_failures', { count: failures.length, ids: failures.slice(0, 20) })
    }

    return NextResponse.json({ ok: true, checked, recovered, failed: failures.length })
  } catch (err) {
    dbLogger.error('[reconcile] fatal:', err)
    return NextResponse.json({ error: 'server_error' }, { status: 500 })
  }
}
