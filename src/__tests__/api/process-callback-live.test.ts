import { describe, it, expect, vi, beforeEach } from 'vitest'
const h = vi.hoisted(() => ({ supabase: null as any, activate: vi.fn() }))
vi.mock('@/lib/supabase-admin', () => ({ getSupabaseAdmin: () => h.supabase }))
vi.mock('@/lib/logger', () => ({ dbLogger: { info: vi.fn(), error: vi.fn(), warn: vi.fn() } }))
vi.mock('@/lib/auth-middleware', () => ({ getAuthenticatedUser: async () => 'u1' }))
vi.mock('@/lib/rate-limit', () => ({ checkRateLimitAsync: async () => ({ allowed: true }), getClientIP: () => '1.1.1.1', RATE_LIMITS: {} }))
vi.mock('@/lib/meta-capi', () => ({ sendCAPIPurchase: vi.fn() }))
vi.mock('@/lib/kashier', () => ({ verifyPaymentSession: async () => ({ ok: true, paid: true, data: { amount: '599.00', method: 'card' } }) }))
vi.mock('@/lib/payment-activation', () => ({ activateStoredPayment: h.activate, paymentAmountMatches: () => true }))
import { NextRequest } from 'next/server'
import { POST } from '@/app/api/payment/process-callback/route'

function makeSupabase(payment: any) {
  const updates: [string, any][] = []
  return { updates, from(table: string) {
    const chain: any = {
      select: () => chain, eq: () => chain, order: () => chain, limit: () => chain,
      single: async () => ({ data: table === 'payments' ? payment : { email: 'a@b.c', phone_number: null }, error: null }),
      update: (row: any) => { updates.push([table, row]); return chain },
      then: (resolve: any) => Promise.resolve({ error: null }).then(resolve),
    }
    return chain
  } }
}
const callback = () => POST(new NextRequest('http://localhost/api/payment/process-callback', {
  method: 'POST', body: JSON.stringify({ sessionId: 's1', paymentStatus: 'SUCCESS' }),
}))
const pending = (plan_id: string) => ({ id: 'p1', kashier_session_id: 's1', kashier_order_id: 'o1', status: 'pending', plan_id, user_id: 'u1', amount: 599 })

describe('POST /api/payment/process-callback — cart-recovery intents', () => {
  beforeEach(() => { h.activate.mockReset(); h.activate.mockResolvedValue({ ok: true }) })

  it('a live-challenge seat leaves the course payment intents open', async () => {
    const db = makeSupabase(pending('live')); h.supabase = db
    const body = await (await callback()).json()
    expect(body).toMatchObject({ success: true, planId: 'live' })
    expect(db.updates.map(([t]) => t)).toEqual(['payments'])
  })

  it('a course payment closes the buyer\'s open payment intents', async () => {
    const db = makeSupabase(pending('pro')); h.supabase = db
    expect((await (await callback()).json()).success).toBe(true)
    expect(db.updates).toContainEqual(['payment_intents', { completed: true }])
  })
})
