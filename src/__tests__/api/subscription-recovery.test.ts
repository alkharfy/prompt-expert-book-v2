import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
const h = vi.hoisted(() => ({ queue: [] as any[], calls: [] as any[], activate: vi.fn(), verify: vi.fn() }))
vi.mock('@/lib/auth-middleware', () => ({ getAuthenticatedUser: async () => 'admin-1' }))
vi.mock('@/lib/payment-activation', async original => ({ ...await original<any>(), activateStoredPayment: h.activate }))
vi.mock('@/lib/kashier', () => ({ verifyPaymentSession: h.verify }))
vi.mock('@/lib/meta-capi', () => ({ sendCAPIPurchase: vi.fn() }))
vi.mock('@/lib/alert', () => ({ alertMoneyPath: vi.fn() }))
vi.mock('@/lib/logger', () => ({ dbLogger: { info: vi.fn(), error: vi.fn(), warn: vi.fn() } }))
vi.mock('@/lib/supabase-admin', () => ({ getSupabaseAdmin: () => ({ from(table: string) {
  const chain: any = {}
  for (const method of ['select', 'eq', 'gt', 'lt', 'gte', 'in', 'not', 'limit', 'order', 'update', 'neq']) chain[method] = (...args: any[]) => {
    h.calls.push([table, method, ...args]); return chain
  }
  chain.single = chain.maybeSingle = () => Promise.resolve(h.queue.shift() || {})
  chain.then = (resolve: any) => Promise.resolve(h.queue.shift() || {}).then(resolve)
  return chain
} }) }))
import { POST as cancel } from '@/app/api/admin/subscriptions/cancel/route'
import { GET as expire } from '@/app/api/cron/check-expirations/route'
import { GET as reconcile } from '@/app/api/cron/reconcile-payments/route'

beforeEach(() => {
  h.calls.length = 0; h.queue.length = 0; vi.clearAllMocks()
  vi.stubEnv('CRON_SECRET', 'test-cron-secret'); h.activate.mockResolvedValue({ ok: true })
})
afterEach(() => vi.unstubAllEnvs())
const cronRequest = () => ({ headers: new Headers({ authorization: 'Bearer test-cron-secret' }) }) as any

describe('subscription lifecycle recovery', () => {
  it('keeps the newer VIP term when an older subscription is cancelled', async () => {
    const expires = new Date(Date.now() + 365 * 86400000).toISOString()
    h.queue.push({ data: { is_admin: true } }, { data: { id: 'old-sub', user_id: 'u1', status: 'active' } }, {},
      { data: { plan_id: 'vip', expires_at: expires } }, {})
    const response = await cancel({ json: async () => ({ subscriptionId: 'old-sub' }) } as any)
    expect(response.status).toBe(200)
    expect(h.calls).toContainEqual(['users', 'update', { current_plan: 'vip', plan_expires_at: expires, is_active: true }])
  })
  it('does not clear a still-valid renewal while expiring an older subscription', async () => {
    h.queue.push({ data: [{ id: 'old-sub', user_id: 'u1' }] }, {}, {})
    expect((await expire(cronRequest())).status).toBe(200)
    const expiryFilter = h.calls.find(c => c[0] === 'users' && c[1] === 'lt')
    expect(expiryFilter[2]).toBe('plan_expires_at')
    expect(Date.parse(expiryFilter[3])).toBeLessThanOrEqual(Date.now())
  })
  it('retries an entitlement failure even after the payment was marked successful', async () => {
    h.queue.push({ data: [] }, { data: [{ id: 'paid-1', user_id: 'u1' }] })
    const response = await reconcile(cronRequest())
    expect(response.status).toBe(200)
    expect(h.activate).toHaveBeenCalledWith('u1', 'paid-1', 'reconcile:retry')
    expect(h.verify).not.toHaveBeenCalled()
  })
  it('reports a failed entitlement retry without silently treating it as recovered', async () => {
    h.queue.push({ data: [] }, { data: [{ id: 'paid-1', user_id: 'u1' }] })
    h.activate.mockResolvedValue({ ok: false, error: 'user_update_failed' })
    expect((await (await reconcile(cronRequest())).json()).failed).toBe(1)
  })
})
