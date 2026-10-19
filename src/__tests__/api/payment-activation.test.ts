import { describe, it, expect, vi, beforeEach } from 'vitest'
const { alertSpy, h } = vi.hoisted(() => ({ alertSpy: vi.fn(), h: { supabase: null as any } }))
vi.mock('@/lib/alert', () => ({ alertMoneyPath: alertSpy }))
vi.mock('@/lib/supabase-admin', () => ({ getSupabaseAdmin: () => h.supabase }))
vi.mock('@/lib/logger', () => ({ dbLogger: { info: vi.fn(), error: vi.fn(), warn: vi.fn() } }))
import { activatePaidSubscription, activateStoredPayment, paymentAmountMatches } from '@/lib/payment-activation'

function makeSupabase(opts: { existingSub?: any; user?: any; payment?: any; insertError?: any; updateError?: any; lookupError?: any } = {}) {
  const captured: { subInsert?: any; userUpdate?: any; filters: any[]; inserts: number; otherUpdates: any[] } = { filters: [], inserts: 0, otherUpdates: [] }
  return { captured, from(table: string) {
    const chain: any = {
      select: () => chain,
      eq: (...args: any[]) => { captured.filters.push([table, ...args]); return chain },
      maybeSingle: async () => ({ data: table === 'subscriptions' ? opts.existingSub ?? null : opts.user ?? { current_plan: null, plan_expires_at: null }, error: opts.lookupError ?? null }),
      single: async () => ({ data: opts.payment ?? null, error: null }),
      neq: () => chain,
      or: () => chain,
      insert: async (row: any) => {
        captured.subInsert = row; captured.inserts++
        return { error: (typeof opts.insertError === 'function' ? opts.insertError(captured.inserts) : opts.insertError) ?? null }
      },
      update: (row: any) => { if (table === 'users') captured.userUpdate = row; else captured.otherUpdates.push([table, row]); return chain },
      then: (resolve: any) => Promise.resolve({ error: opts.updateError ?? null }).then(resolve),
    }
    return chain
  } }
}
const input = { userId: 'u1', paymentId: 'p1', planId: 'pro', owedAmount: 499, paidAmount: '499.00', paidAt: '2026-09-26T00:00:00Z', source: 'verify' }
const expiry = '2027-02-01T00:00:00.000Z'
describe('verified activation and payment replay', () => {
  beforeEach(() => { alertSpy.mockClear(); vi.useFakeTimers(); vi.setSystemTime(new Date('2026-09-26T00:00:00Z')) })
  it('creates a one-year entitlement from the original payment date', async () => {
    const db = makeSupabase(); h.supabase = db
    expect((await activatePaidSubscription(input)).ok).toBe(true)
    expect(db.captured.subInsert).toMatchObject({ user_id: 'u1', plan_id: 'pro', payment_id: 'p1', expires_at: '2027-09-26T00:00:00.000Z' })
    expect(db.captured.userUpdate).toMatchObject({ is_active: true, is_verified: true })
  })
  it.each([null, undefined, '', 'garbage', '4.99', 99])('blocks an invalid or insufficient provider amount (%j)', async amount => {
    const db = makeSupabase(); h.supabase = db
    const result = await activatePaidSubscription({ ...input, paidAmount: amount })
    expect(result).toMatchObject({ ok: false, blocked: true, error: 'amount_mismatch' })
    expect(db.captured.subInsert).toBeUndefined()
    expect(db.captured.userUpdate).toBeUndefined()
    expect(alertSpy).toHaveBeenCalled()
  })
  it('preserves the original expiry when the same payment is replayed', async () => {
    const db = makeSupabase({ existingSub: { id: 's1', user_id: 'u1', plan_id: 'pro', status: 'active', expires_at: expiry } }); h.supabase = db
    expect((await activatePaidSubscription(input)).alreadyActive).toBe(true)
    expect(db.captured.subInsert).toBeUndefined()
    expect(db.captured.userUpdate.plan_expires_at).toBe(expiry)
  })
  it.each(['expired', 'cancelled', 'other-owner'])('rejects an %s existing entitlement', async mode => {
    const db = makeSupabase({ existingSub: { id: 's1', user_id: mode === 'other-owner' ? 'u2' : 'u1', plan_id: 'pro', status: mode === 'cancelled' ? 'cancelled' : 'active', expires_at: mode === 'expired' ? '2026-01-01' : expiry } }); h.supabase = db
    expect((await activatePaidSubscription(input)).ok).toBe(false)
    expect(db.captured.userUpdate).toBeUndefined()
  })
  it('cannot downgrade VIP when an old Pro payment is replayed', async () => {
    const db = makeSupabase({ user: { current_plan: 'vip', plan_expires_at: expiry } }); h.supabase = db
    expect((await activatePaidSubscription(input)).alreadyActive).toBe(true)
    expect(db.captured.userUpdate).toBeUndefined()
  })
  it('keeps the existing term on upgrade instead of adding another year', async () => {
    const db = makeSupabase({ user: { current_plan: 'basic', plan_expires_at: expiry } }); h.supabase = db
    expect((await activatePaidSubscription({ ...input, isUpgrade: true })).ok).toBe(true)
    expect(db.captured.subInsert.expires_at).toBe(expiry)
  })
  it('restores the upgrade expiry recorded at checkout even if the user pointer changed', async () => {
    const db = makeSupabase(); h.supabase = db
    expect((await activatePaidSubscription({ ...input, isUpgrade: true, upgradeExpiresAt: expiry })).ok).toBe(true)
    expect(db.captured.subInsert.expires_at).toBe(expiry)
  })
  it('opens 30 days for the monthly plan', async () => {
    const db = makeSupabase(); h.supabase = db
    expect((await activatePaidSubscription({ ...input, planId: 'monthly', owedAmount: 100, paidAmount: '100.00' })).ok).toBe(true)
    expect(db.captured.subInsert).toMatchObject({ plan_id: 'monthly', expires_at: '2026-10-26T00:00:00.000Z' })
  })
  it('adds a renewed month (or a year) after the month already paid, not from today', async () => {
    const monthEnd = '2026-10-10T00:00:00.000Z'
    let db = makeSupabase({ user: { current_plan: 'monthly', plan_expires_at: monthEnd } }); h.supabase = db
    expect((await activatePaidSubscription({ ...input, planId: 'monthly', owedAmount: 100, paidAmount: 100 })).ok).toBe(true)
    expect(db.captured.subInsert.expires_at).toBe('2026-11-09T00:00:00.000Z')
    db = makeSupabase({ user: { current_plan: 'monthly', plan_expires_at: monthEnd } }); h.supabase = db
    expect((await activatePaidSubscription(input)).ok).toBe(true)
    expect(db.captured.subInsert.expires_at).toBe('2027-10-10T00:00:00.000Z')
  })
  it('keeps one active subscription: the running one is retired when a new term is recorded', async () => {
    const db = makeSupabase({ user: { current_plan: 'monthly', plan_expires_at: '2026-10-10T00:00:00.000Z' } }); h.supabase = db
    expect((await activatePaidSubscription({ ...input, planId: 'monthly', owedAmount: 100, paidAmount: 100 })).ok).toBe(true)
    expect(db.captured.otherUpdates).toContainEqual(['subscriptions', { status: 'upgraded' }])
  })
  it('records the purchase after a one-active-subscription conflict', async () => {
    const db = makeSupabase({ insertError: (n: number) => n === 1 ? { code: '23505', message: 'duplicate' } : null }); h.supabase = db
    expect((await activatePaidSubscription(input)).ok).toBe(true)
    expect(db.captured.inserts).toBe(2)
  })
  it('flags a paid month that a running year already covers, and grants nothing', async () => {
    const db = makeSupabase({ user: { current_plan: 'basic', plan_expires_at: expiry } }); h.supabase = db
    expect((await activatePaidSubscription({ ...input, planId: 'monthly', owedAmount: 100, paidAmount: 100 })).alreadyActive).toBe(true)
    expect(alertSpy).toHaveBeenCalledWith('paid_order_not_applied', expect.objectContaining({ planId: 'monthly' }))
    expect(db.captured.userUpdate).toBeUndefined()
  })
  it('refuses an upgrade priced from a monthly term', async () => {
    const db = makeSupabase({ user: { current_plan: 'monthly', plan_expires_at: '2026-10-10T00:00:00.000Z' } }); h.supabase = db
    expect(await activatePaidSubscription({ ...input, isUpgrade: true })).toMatchObject({ ok: false, blocked: true })
    expect(db.captured.userUpdate).toBeUndefined()
  })
  it('never shortens a later extension when an older payment is replayed', async () => {
    const db = makeSupabase({ existingSub: { id: 's1', user_id: 'u1', plan_id: 'pro', status: 'active', expires_at: expiry }, user: { current_plan: 'pro', plan_expires_at: '2028-01-01T00:00:00.000Z' } }); h.supabase = db
    expect((await activatePaidSubscription(input)).alreadyActive).toBe(true)
    expect(db.captured.userUpdate).toBeUndefined()
  })
  it('reports a failed insert without granting access', async () => {
    const db = makeSupabase({ insertError: { message: 'DB down' } }); h.supabase = db
    expect((await activatePaidSubscription(input)).ok).toBe(false)
    expect(db.captured.userUpdate).toBeUndefined()
  })
  it('reports a failed user update so callbacks can retry', async () => {
    h.supabase = makeSupabase({ updateError: { message: 'DB down' } })
    expect((await activatePaidSubscription(input)).error).toBe('user_update_failed')
  })
  it('fails closed when subscription lookup fails', async () => {
    const db = makeSupabase({ lookupError: { message: 'DB down' } }); h.supabase = db
    expect((await activatePaidSubscription(input)).ok).toBe(false)
    expect(db.captured.subInsert).toBeUndefined()
  })
  it('checks stored payment ownership and paid status before activation', async () => {
    const db = makeSupabase({ payment: { user_id: 'u2', plan_id: 'vip', status: 'success', amount: 999, paid_at: input.paidAt } }); h.supabase = db
    expect((await activateStoredPayment('u1', 'p1', 'test')).error).toBe('payment_not_verified')
    expect(db.captured.filters).toContainEqual(['payments', 'user_id', 'u1'])
    expect(db.captured.subInsert).toBeUndefined()
  })
  it('rejects missing, zero and negative amounts, accepting only currency-scale rounding', () => {
    expect(paymentAmountMatches('499.00', 499)).toBe(true)
    expect(paymentAmountMatches(499.001, 499)).toBe(true)
    expect(paymentAmountMatches(498.5, 499)).toBe(false)
    expect(paymentAmountMatches(0, 0)).toBe(false)
    expect(paymentAmountMatches(false, 499)).toBe(false)
  })
})
