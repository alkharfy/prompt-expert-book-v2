import { getSupabaseAdmin } from '@/lib/supabase-admin'
import { dbLogger } from '@/lib/logger'
import { alertMoneyPath } from '@/lib/alert'

// EGP tolerance for the amount guard (rounding / currency-minor differences).
const AMOUNT_TOLERANCE = 0.5

// BURN-IN: while false, an amount mismatch is logged/alerted but DOES NOT block
// activation — so a legitimate payer is never locked out by a parsing/unit bug.
// Flip to true only after observing alerts in production and confirming no false
// positives (separate, deliberate change).
const ENFORCE_AMOUNT_GUARD = false

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
 * on payment_id, runs an amount guard (log-only during burn-in), and alerts on
 * every rejection/failure. Every activation path should funnel through here.
 */
export async function activatePaidSubscription(input: ActivateInput): Promise<ActivateResult> {
  const supabase = getSupabaseAdmin()
  const { userId, paymentId, planId, source } = input

  // ── Amount guard (explicit parseFloat for Kashier string amounts) ──────────
  const paid = input.paidAmount != null ? parseFloat(String(input.paidAmount)) : NaN
  const owed = input.owedAmount != null ? parseFloat(String(input.owedAmount)) : NaN
  if (!Number.isNaN(paid) && !Number.isNaN(owed) && owed > 0 && paid + AMOUNT_TOLERANCE < owed) {
    alertMoneyPath('amount_mismatch', { source, userId, paymentId, planId, paid, owed })
    if (ENFORCE_AMOUNT_GUARD) {
      return { ok: false, blocked: true, error: 'amount_mismatch' }
    }
    // burn-in: fall through and still activate, but the alert is recorded.
  }

  const paidAt = input.paidAt || new Date().toISOString()
  const startsAt = new Date(paidAt)
  const expiresAt = new Date(startsAt)
  expiresAt.setDate(expiresAt.getDate() + 365)

  // ── Idempotency on payment_id ──────────────────────────────────────────────
  const { data: existingSub } = await (supabase.from('subscriptions') as any)
    .select('id')
    .eq('payment_id', paymentId)
    .maybeSingle()

  if (!existingSub) {
    const { error: subError } = await (supabase.from('subscriptions') as any).insert({
      user_id: userId,
      plan_id: planId,
      payment_id: paymentId,
      status: 'active',
      starts_at: startsAt.toISOString(),
      expires_at: expiresAt.toISOString(),
    })
    if (subError) {
      // Not fatal — entitlement flags below are the real gate — but alert.
      alertMoneyPath('subscription_insert_failed', { source, userId, paymentId, error: subError.message })
      dbLogger.error(`[activate:${source}] subscription insert error:`, subError)
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
