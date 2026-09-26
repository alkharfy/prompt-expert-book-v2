import { describe, it, expect, vi, beforeEach } from 'vitest'
const { alertSpy, h } = vi.hoisted(() => ({ alertSpy: vi.fn(), h: { supabase: null as any } }))
vi.mock('@/lib/alert', () => ({ alertMoneyPath: alertSpy }))
vi.mock('@/lib/supabase-admin', () => ({ getSupabaseAdmin: () => h.supabase }))
vi.mock('@/lib/logger', () => ({ dbLogger: { info: vi.fn(), error: vi.fn(), warn: vi.fn() } }))
import { activatePaidSubscription, activateStoredPayment, paymentAmountMatches } from '@/lib/payment-activation'

function makeSupabase(opts: { existingSub?: any; user?: any; payment?: any; insertError?: any; updateError?: any; lookupError?: any } = {}) {
  const captured: { subInsert?: any; userUpdate?: any; filters: any[] } = { filters: [] }
  return { captured, from(table: string) {
    const chain: any = {
      select: () => chain,
      eq: (...args: any[]) => { captured.filters.push([table, ...args]); return chain },
      maybeSingle: async () => ({ data: table === 'subscriptions' ? opts.existingSub ?? null : opts.user ?? { current_plan: null, plan_expires_at: null }, error: opts.lookupError ?? null }),
      single: async () => ({ data: opts.payment ?? null, error: null }),
      insert: async (row: any) => { captured.subInsert = row; return { error: opts.insertError ?? null } },
      update: (row: any) => { captured.userUpdate = row; return chain },
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
