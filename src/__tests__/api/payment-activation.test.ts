import { describe, it, expect, vi, beforeEach } from 'vitest'

// ── Hoisted mocks ────────────────────────────────────────────────────────────
const { alertSpy, h } = vi.hoisted(() => ({
  alertSpy: vi.fn(),
  h: { supabase: null as any },
}))

vi.mock('@/lib/alert', () => ({ alertMoneyPath: alertSpy }))
vi.mock('@/lib/supabase-admin', () => ({ getSupabaseAdmin: () => h.supabase }))
vi.mock('@/lib/logger', () => ({ dbLogger: { info: vi.fn(), error: vi.fn(), warn: vi.fn() } }))

import { activatePaidSubscription } from '@/lib/payment-activation'

interface MockOpts {
  existingSub?: { id: string } | null
  subInsertError?: { message: string } | null
  userUpdateError?: { message: string } | null
}

function makeSupabase(opts: MockOpts = {}) {
  const captured: { subInsert?: any; userUpdate?: any } = {}
  const eqResult: any = {
    maybeSingle: async () => ({ data: opts.existingSub ?? null }),
    single: async () => ({ data: opts.existingSub ?? null }),
    // awaitable → resolves to { error } for the users.update(...).eq(...) chain
    then: (resolve: (v: any) => void) => resolve({ error: opts.userUpdateError ?? null }),
  }
  const builder: any = {
    select: () => builder,
    eq: () => eqResult,
    maybeSingle: async () => ({ data: opts.existingSub ?? null }),
    insert: async (row: any) => { captured.subInsert = row; return { error: opts.subInsertError ?? null } },
    update: (payload: any) => { captured.userUpdate = payload; return builder },
  }
  return { from: () => builder, captured }
}

describe('activatePaidSubscription (WS8)', () => {
  beforeEach(() => {
    alertSpy.mockClear()
  })

  it('always sets is_active:true (+is_verified) and creates the subscription on a matching payment', async () => {
    const mock = makeSupabase({ existingSub: null })
    h.supabase = mock
    const res = await activatePaidSubscription({
      userId: 'u1', paymentId: 'p1', planId: 'pro', owedAmount: 199, paidAmount: 199, source: 'verify',
    })
    expect(res.ok).toBe(true)
    expect(res.activated).toBe(true)
    expect(mock.captured.subInsert).toMatchObject({ user_id: 'u1', plan_id: 'pro', payment_id: 'p1', status: 'active' })
    expect(mock.captured.userUpdate).toMatchObject({ current_plan: 'pro', is_active: true, is_verified: true })
    expect(alertSpy).not.toHaveBeenCalled()
  })

  it('accepts Kashier string amounts ("199.00") without a false mismatch', async () => {
    const mock = makeSupabase({ existingSub: null })
    h.supabase = mock
    const res = await activatePaidSubscription({
      userId: 'u1', paymentId: 'p1', planId: 'pro', owedAmount: '199.00', paidAmount: '199.00', source: 'verify',
    })
    expect(res.ok).toBe(true)
    expect(mock.captured.userUpdate.is_active).toBe(true)
    expect(alertSpy).not.toHaveBeenCalled()
  })

  it('underpayment: burn-in still activates BUT raises an amount_mismatch alert', async () => {
    const mock = makeSupabase({ existingSub: null })
    h.supabase = mock
    const res = await activatePaidSubscription({
      userId: 'u1', paymentId: 'p1', planId: 'pro', owedAmount: 199, paidAmount: 99, source: 'verify',
    })
    // Burn-in (ENFORCE_AMOUNT_GUARD=false): activation proceeds, mismatch is alerted.
    expect(res.ok).toBe(true)
    expect(mock.captured.userUpdate.is_active).toBe(true)
    expect(alertSpy).toHaveBeenCalledWith('amount_mismatch', expect.objectContaining({ paid: 99, owed: 199, source: 'verify' }))
  })

  it('idempotent: an existing subscription is not re-inserted, but is_active is still ensured', async () => {
    const mock = makeSupabase({ existingSub: { id: 'sub1' } })
    h.supabase = mock
    const res = await activatePaidSubscription({
      userId: 'u1', paymentId: 'p1', planId: 'pro', owedAmount: 199, paidAmount: 199, source: 'reconcile',
    })
    expect(res.ok).toBe(true)
    expect(res.alreadyActive).toBe(true)
    expect(mock.captured.subInsert).toBeUndefined() // no duplicate insert
    expect(mock.captured.userUpdate.is_active).toBe(true) // entitlement still ensured
  })

  it('reports failure + alerts when the users.update errors', async () => {
    const mock = makeSupabase({ existingSub: null, userUpdateError: { message: 'db down' } })
    h.supabase = mock
    const res = await activatePaidSubscription({
      userId: 'u1', paymentId: 'p1', planId: 'pro', owedAmount: 199, paidAmount: 199, source: 'verify',
    })
    expect(res.ok).toBe(false)
    expect(alertSpy).toHaveBeenCalledWith('user_activation_failed', expect.objectContaining({ userId: 'u1' }))
  })
})
