import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { createHmac } from 'crypto'

const h = vi.hoisted(() => ({ results: [] as any[], updates: vi.fn(), activate: vi.fn() }))
vi.mock('@/lib/payment-activation', async importOriginal => ({ ...await importOriginal<any>(), activateStoredPayment: h.activate }))
vi.mock('@/lib/supabase-admin', () => ({ getSupabaseAdmin: () => ({ from() {
  const chain: any = { select: () => chain, eq: () => chain, update: h.updates.mockImplementation(() => chain) }
  chain.single = () => Promise.resolve(h.results.shift() || { data: null })
  chain.then = (resolve: any) => Promise.resolve(h.results.shift() || { error: null }).then(resolve)
  return chain
} }) }))
vi.mock('@/lib/logger', () => ({ dbLogger: { info: vi.fn(), warn: vi.fn(), error: vi.fn() } }))
vi.mock('@/lib/alert', () => ({ alertMoneyPath: vi.fn() }))
vi.mock('@/lib/meta-capi', () => ({ sendCAPIPurchase: vi.fn() }))
import { POST } from '@/app/api/payment/webhook/route'

function request(data: Record<string, any>, signature?: string) {
  const payload = [...(data.signatureKeys || [])].sort().map(key => `${encodeURIComponent(key)}=${encodeURIComponent(String(data[key]))}`).join('&')
  const signed = signature ?? createHmac('sha256', 'test-key').update(payload).digest('hex')
  return { json: async () => ({ event: 'pay', data }), headers: new Headers({ 'x-kashier-signature': signed }) } as any
}
const data = { amount: '499.00', currency: 'EGP', merchantOrderId: 'order-1', status: 'SUCCESS', signatureKeys: ['amount', 'currency', 'merchantOrderId', 'status'] }
beforeEach(() => {
  vi.stubEnv('KASHIER_API_KEY', 'test-key'); vi.clearAllMocks(); h.results.length = 0
  h.activate.mockResolvedValue({ ok: true })
})
afterEach(() => vi.unstubAllEnvs())

describe('signed payment notifications', () => {
  it('accepts the documented signature and activates the trusted payment owner', async () => {
    h.results.push({ data: { id: 'p1', user_id: 'u1', plan_id: 'pro', amount: 499, status: 'pending' } })
    expect((await POST(request(data))).status).toBe(200)
    expect(h.activate).toHaveBeenCalledWith('u1', 'p1', 'callback')
  })
  it('only writes existing payments columns for a real Kashier payload (with transactionId)', async () => {
    h.results.push({ data: { id: 'p1', user_id: 'u1', plan_id: 'pro', amount: 499, status: 'pending' } })
    const res = await POST(request({ ...data, transactionId: 'TX-123', method: 'card' }))
    expect(res.status).toBe(200)
    const written = h.updates.mock.calls[0][0]
    expect(Object.keys(written).sort()).toEqual(['paid_at', 'payment_method', 'status'])
  })
  it('rejects signatures that omit amount or currency', async () => {
    expect((await POST(request({ ...data, signatureKeys: ['merchantOrderId', 'status'] }))).status).toBe(403)
    expect(h.updates).not.toHaveBeenCalled()
    expect(h.activate).not.toHaveBeenCalled()
  })
  it('rejects an invalid signature', async () => {
    expect((await POST(request(data, '0'.repeat(64)))).status).toBe(403)
    expect(h.updates).not.toHaveBeenCalled()
  })
  it('rejects a correctly signed notification for an insufficient amount', async () => {
    h.results.push({ data: { id: 'p1', user_id: 'u1', plan_id: 'pro', amount: 499, status: 'pending' } })
    expect((await POST(request({ ...data, amount: '99.00' }))).status).toBe(400)
    expect(h.updates).not.toHaveBeenCalled()
    expect(h.activate).not.toHaveBeenCalled()
  })
  it('returns a retryable error when entitlement activation fails after payment is recorded', async () => {
    h.results.push({ data: { id: 'p1', user_id: 'u1', plan_id: 'pro', amount: 499, status: 'pending' } })
    h.activate.mockResolvedValue({ ok: false, error: 'user_update_failed' })
    expect((await POST(request(data))).status).toBe(500)
  })
})
