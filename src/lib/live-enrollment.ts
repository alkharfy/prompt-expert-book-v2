import { getSupabaseAdmin } from '@/lib/supabase-admin'
import { dbLogger } from '@/lib/logger'
import { alertMoneyPath } from '@/lib/alert'
import { parseLiveOrderNotes } from '@/lib/live'

export interface LivePaymentRow {
  user_id: string
  amount: number | string
  notes: string | null
}

/**
 * Turn a verified live-challenge payment into a seat. Idempotent on payment_id.
 * Never touches subscriptions or the user's plan flags.
 */
export async function activateLiveEnrollment(userId: string, paymentId: string, payment: LivePaymentRow, source: string) {
  const parsed = parseLiveOrderNotes(payment.notes)
  if (!parsed) {
    alertMoneyPath('live_notes_missing', { source, userId, paymentId })
    return { ok: false, error: 'live_notes_missing' }
  }
  const supabase = getSupabaseAdmin()
  const { error } = await (supabase.from('live_enrollments') as any).upsert({
    user_id: userId,
    cohort_id: parsed.cohortId,
    payment_id: paymentId,
    amount: Number(payment.amount),
    whatsapp: parsed.whatsapp,
  }, { onConflict: 'payment_id', ignoreDuplicates: true })

  if (error) {
    // 23505 on (user_id, cohort_id): a second paid order for a seat they already have — refund by hand.
    const duplicateSeat = error.code === '23505'
    alertMoneyPath(duplicateSeat ? 'live_paid_twice' : 'live_enrollment_failed', { source, userId, paymentId, cohort: parsed.cohortId, error: error.message })
    dbLogger.error(`[live:${source}] enrollment error:`, error)
    return duplicateSeat ? { ok: true, activated: false, alreadyActive: true } : { ok: false, error: 'live_enrollment_failed' }
  }
  dbLogger.info(`[live:${source}] user ${userId} enrolled in ${parsed.cohortId}`)
  return { ok: true, activated: true }
}
