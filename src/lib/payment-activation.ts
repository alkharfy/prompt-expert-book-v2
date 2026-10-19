import { getSupabaseAdmin } from '@/lib/supabase-admin'
import { dbLogger } from '@/lib/logger'
import { alertMoneyPath } from '@/lib/alert'
import { PLAN_ORDER } from '@/lib/pricing'
import { PLAN_DURATION_DAYS, type PlanId } from '@/types/subscription'

// EGP tolerance for the amount guard (rounding / currency-minor differences).
const AMOUNT_TOLERANCE = 0.01

export function paymentAmountMatches(paidAmount: unknown, owedAmount: unknown): boolean {
  const paid = typeof paidAmount === 'number' || typeof paidAmount === 'string' && paidAmount.trim() ? Number(paidAmount) : NaN
  const owed = typeof owedAmount === 'number' || typeof owedAmount === 'string' && owedAmount.trim() ? Number(owedAmount) : NaN
  return Number.isFinite(paid) && Number.isFinite(owed) && paid > 0 && owed > 0 && Math.abs(paid - owed) <= AMOUNT_TOLERANCE + Number.EPSILON * Math.max(paid, owed)
}

export interface ActivateInput {
  userId: string
  paymentId: string
  planId: string
  /** Amount actually paid (Kashier-reported); may be a string like "199.00". */
  paidAmount?: number | string | null
  /** Amount owed for this order/plan (from our payments row). */
  owedAmount?: number | string | null
  paidAt?: string | null
  /** Where activation was triggered: 'verify' | 'verify-by-order' | 'reconcile' | ... */
  source: string
  isUpgrade?: boolean
  upgradeExpiresAt?: string | null
}

export interface ActivateResult {
  ok: boolean
  activated?: boolean
  alreadyActive?: boolean
  blocked?: boolean
  error?: string
}

/**
 * Single source of truth for turning a successful payment into access (WS8).
 * Guarantees `is_active: true` on the user (the latent-lock fix), is idempotent
 * on payment_id, rejects mismatched amounts, and alerts on
 * every rejection/failure. Every activation path should funnel through here.
 */
export async function activatePaidSubscription(input: ActivateInput): Promise<ActivateResult> {
  const supabase = getSupabaseAdmin()
  const { userId, paymentId, planId, source } = input
  if (!Object.hasOwn(PLAN_DURATION_DAYS, planId)) return { ok: false, error: 'invalid_plan' }
  const durationDays = PLAN_DURATION_DAYS[planId as PlanId]

  // ── Amount guard (explicit parseFloat for Kashier string amounts) ──────────
  const paid = Number(input.paidAmount)
  const owed = Number(input.owedAmount)
  if (!paymentAmountMatches(input.paidAmount, input.owedAmount)) {
    alertMoneyPath('amount_mismatch', { source, userId, paymentId, planId, paid, owed })
    return { ok: false, blocked: true, error: 'amount_mismatch' }
  }

  const paidAt = input.paidAt || new Date().toISOString()
  const startsAt = new Date(paidAt)
  if (!Number.isFinite(startsAt.getTime())) return { ok: false, error: 'invalid_paid_at' }
  let expiresAt = new Date(startsAt)
  expiresAt.setUTCDate(expiresAt.getUTCDate() + durationDays)

  // ── Idempotency on payment_id ──────────────────────────────────────────────
  const { data: existingSub, error: existingError } = await (supabase.from('subscriptions') as any)
    .select('id, status, expires_at, user_id, plan_id')
    .eq('payment_id', paymentId)
    .maybeSingle()

  if (existingError) return { ok: false, error: 'subscription_lookup_failed' }
  if (existingSub) {
    if (existingSub.user_id && existingSub.user_id !== userId || existingSub.plan_id && existingSub.plan_id !== planId) {
      return { ok: false, blocked: true, error: 'payment_owner_mismatch' }
    }
    if (existingSub.status && existingSub.status !== 'active') return { ok: false, blocked: true, error: 'subscription_inactive' }
    if (existingSub.expires_at) expiresAt = new Date(existingSub.expires_at)
    if (!Number.isFinite(expiresAt.getTime()) || expiresAt.getTime() <= Date.now()) return { ok: false, blocked: true, error: 'subscription_expired' }
  }

  const { data: currentUser, error: currentUserError } = await (supabase.from('users') as any)
    .select('current_plan, plan_expires_at').eq('id', userId).maybeSingle()
  if (currentUserError || !currentUser) return { ok: false, error: 'user_lookup_failed' }
  const currentExpiry = currentUser?.plan_expires_at ? new Date(currentUser.plan_expires_at) : null
  const currentActive = currentExpiry && Number.isFinite(currentExpiry.getTime()) && currentExpiry.getTime() > Date.now()
  // A replayed payment must never shorten a term that a later purchase already extended.
  if (existingSub && currentActive && currentExpiry!.getTime() > expiresAt.getTime()) {
    return { ok: true, alreadyActive: true }
  }
  if (currentActive && PLAN_ORDER[currentUser.current_plan] > PLAN_ORDER[planId]) {
    // Money for something the running (higher) term already covers, e.g. a monthly checkout left
    // open and paid after buying a year. Nothing to grant: flag it so the owner refunds it.
    if (!existingSub) alertMoneyPath('paid_order_not_applied', { source, userId, paymentId, planId, currentPlan: currentUser.current_plan })
    return { ok: true, alreadyActive: true }
  }
  if (!existingSub && input.isUpgrade && currentUser.current_plan === 'monthly') {
    // Checkout never prices monthly → yearly as an upgrade; a stale or forged one must not keep the month's end date.
    alertMoneyPath('upgrade_from_monthly', { source, userId, paymentId, planId })
    return { ok: false, blocked: true, error: 'upgrade_from_monthly' }
  }
  if (!existingSub && input.isUpgrade) {
    if (input.upgradeExpiresAt) expiresAt = new Date(input.upgradeExpiresAt)
    else if (currentActive) expiresAt = currentExpiry
    else return { ok: false, blocked: true, error: 'upgrade_subscription_expired' }
  } else if (!existingSub && currentActive && currentExpiry) {
    // Bought while a term is still running (another month, a month → a year, or a second checkout for
    // the same plan): the new term is added after the running one, so no paid day is lost.
    expiresAt = new Date(currentExpiry)
    expiresAt.setUTCDate(expiresAt.getUTCDate() + durationDays)
  }
  if (!Number.isFinite(expiresAt.getTime())) return { ok: false, error: 'invalid_expires_at' }
  if (expiresAt.getTime() <= Date.now()) return { ok: false, blocked: true, error: 'subscription_expired' }

  if (!existingSub) {
    const row = {
      user_id: userId,
      plan_id: planId,
      payment_id: paymentId,
      status: 'active',
      starts_at: startsAt.toISOString(),
      expires_at: expiresAt.toISOString(),
    }
    // One active subscription per user: the running one is retired as 'upgraded' (its days are
    // already inside this row's end date). Replays of a retired row are then refused above.
    const retireOthers = () => (supabase.from('subscriptions') as any)
      .update({ status: 'upgraded' })
      .eq('user_id', userId)
      .eq('status', 'active')
      .or(`payment_id.is.null,payment_id.neq.${paymentId}`)
    let { error: subError } = await (supabase.from('subscriptions') as any).insert(row)
    if (subError?.code === '23505') {
      await retireOthers()
      ;({ error: subError } = await (supabase.from('subscriptions') as any).insert(row))
    } else if (!subError) {
      await retireOthers()
    }
    if (subError) {
      alertMoneyPath('subscription_insert_failed', { source, userId, paymentId, error: subError.message })
      dbLogger.error(`[activate:${source}] subscription insert error:`, subError)
      return { ok: false, error: 'subscription_insert_failed' }
    }
  }

  // ── ALWAYS set entitlement flags (the BUG A/B fix) ─────────────────────────
  const { error: userError } = await (supabase.from('users') as any)
    .update({
      current_plan: planId,
      plan_expires_at: expiresAt.toISOString(),
      is_active: true,
      is_verified: true,
    })
    .eq('id', userId)

  if (userError) {
    alertMoneyPath('user_activation_failed', { source, userId, paymentId, error: userError.message })
    dbLogger.error(`[activate:${source}] users.update error:`, userError)
    return { ok: false, error: 'user_update_failed' }
  }

  dbLogger.info(`[activate:${source}] user ${userId} active, plan ${planId}, sub ${existingSub ? 'existing' : 'created'}`)
  return { ok: true, activated: true, alreadyActive: !!existingSub }
}

/** Read ownership, paid status and upgrade term from our trusted payment row. */
export async function activateStoredPayment(userId: string, paymentId: string, source: string): Promise<ActivateResult> {
  const supabase = getSupabaseAdmin()
  const { data: payment, error } = await (supabase.from('payments') as any)
    .select('user_id, plan_id, amount, paid_at, notes, status')
    .eq('id', paymentId).eq('user_id', userId).single()
  if (error || !payment || payment.user_id !== userId || payment.status !== 'success' || !payment.paid_at) {
    return { ok: false, blocked: true, error: 'payment_not_verified' }
  }
  const isUpgrade = typeof payment.notes === 'string' && payment.notes.startsWith('upgrade:')
  const upgradeExpiresAt = isUpgrade ? payment.notes.match(/\|expires:([^|]+)/)?.[1] : null
  return activatePaidSubscription({
    userId, paymentId, planId: payment.plan_id, owedAmount: payment.amount, paidAmount: payment.amount,
    paidAt: payment.paid_at, isUpgrade, upgradeExpiresAt, source,
  })
}
