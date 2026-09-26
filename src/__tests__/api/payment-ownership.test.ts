import { beforeEach, describe, expect, it, vi } from 'vitest'
import { NextRequest } from 'next/server'

const h = vi.hoisted(() => ({
  auth: vi.fn(), subscription: vi.fn(), verify: vi.fn(), create: vi.fn(), activate: vi.fn(),
  results: [] as any[], calls: [] as any[],
}))
vi.mock('@/lib/auth-middleware', () => ({ getAuthenticatedUser: h.auth }))
vi.mock('@/lib/subscription', () => ({ getUserSubscription: h.subscription }))
vi.mock('@/lib/kashier', () => ({ verifyPaymentSession: h.verify, createPaymentSession: h.create }))
vi.mock('@/lib/payment-activation', async importOriginal => ({ ...await importOriginal<any>(), activateStoredPayment: h.activate }))
vi.mock('@/lib/rate-limit', () => ({ checkRateLimitAsync: async () => ({ allowed: true }), getClientIP: () => 'test', RATE_LIMITS: {} }))
vi.mock('@/lib/meta-capi', () => ({ sendCAPIInitiateCheckout: vi.fn() }))
vi.mock('@/lib/logger', () => ({ dbLogger: { info: vi.fn(), warn: vi.fn(), error: vi.fn() } }))
vi.mock('@/lib/supabase-admin', () => ({ getSupabaseAdmin: () => ({ from(table: string) {
  const chain: any = {}
  for (const method of ['select', 'eq', 'in', 'insert', 'update', 'neq']) chain[method] = (...args: any[]) => {
    h.calls.push([table, method, ...args]); return chain
  }
  chain.single = () => Promise.resolve(h.results.shift() || { data: null, error: null })
  chain.then = (resolve: any) => Promise.resolve(h.results.shift() || { data: null, error: null }).then(resolve)
  return chain
} }) }))

import { POST as verify } from '@/app/api/payment/verify/route'
import { POST as create } from '@/app/api/payment/create-session/route'

function request(path: string, body: unknown) {
  return new NextRequest('http://localhost' + path, { method: 'POST', body: JSON.stringify(body) })
}

beforeEach(() => {
  vi.clearAllMocks(); h.results.length = 0; h.calls.length = 0
  h.auth.mockResolvedValue('u1'); h.subscription.mockResolvedValue(null)
})

describe('checkout ownership and upgrade credit', () => {
  it('never queries the gateway for another user’s checkout', async () => {
    h.results.push({ data: null, error: { message: 'not found' } })
    const response = await verify(request('/api/payment/verify', { sessionId: 'someone-elses-session', userId: 'u2' }))
    expect(response.status).toBe(404)
    expect(h.calls).toContainEqual(['payments', 'eq', 'user_id', 'u1'])
    expect(h.verify).not.toHaveBeenCalled()
    expect(h.activate).not.toHaveBeenCalled()
  })
  it('blocks activation if Kashier confirms success for the wrong amount', async () => {
    h.results.push({ data: { id: 'p1', amount: 499 }, error: null })
    h.verify.mockResolvedValue({ ok: true, paid: true, data: { amount: '99.00' } })
    expect((await verify(request('/api/payment/verify', { sessionId: 's1' }))).status).toBe(400)
    expect(h.activate).not.toHaveBeenCalled()
    expect(h.calls.some(c => c[1] === 'update')).toBe(false)
  })
  it('rejects forged upgrade credit when there is no active subscription', async () => {
    h.results.push({ data: { id: 'u1', email: 'test@example.com', full_name: 'Test' } }, {
      data: [{ id: 'basic', price: 299 }, { id: 'pro', price: 499 }, { id: 'vip', price: 999 }],
    })
    const response = await create(request('/api/payment/create-session', { planId: 'vip', isUpgrade: true, currentPlanId: 'pro' }))
    expect(response.status).toBe(400)
    expect(h.subscription).toHaveBeenCalledWith('u1')
    expect(h.create).not.toHaveBeenCalled()
  })
  it('ignores client credit and uses the server subscription for a real upgrade', async () => {
    const expiresAt = new Date(Date.now() + 60 * 86400000).toISOString()
    h.subscription.mockResolvedValue({ plan_id: 'basic', status: 'active', expires_at: expiresAt })
    h.create.mockResolvedValue({ success: true, sessionId: 's1', sessionUrl: 'https://payments.kashier.io/session/s1' })
    h.results.push({ data: { id: 'u1', email: 'test@example.com', full_name: 'Test' } }, {
      data: [{ id: 'basic', price: 299 }, { id: 'pro', price: 499 }, { id: 'vip', price: 999 }],
    }, { data: { id: 'p1' } })
    const response = await create(request('/api/payment/create-session', { planId: 'vip', isUpgrade: true, currentPlanId: 'pro' }))
    expect(response.status).toBe(200)
    expect(h.create).toHaveBeenCalledWith(expect.objectContaining({ amount: '700.00', customerReference: 'u1' }))
    const insert = h.calls.find(c => c[0] === 'payments' && c[1] === 'insert')
    expect(insert[2].notes).toContain('upgrade:basic->vip')
    expect(insert[2].notes).toContain('|expires:' + expiresAt)
    expect((await response.json()).amount).toBe(700)
  })
})
