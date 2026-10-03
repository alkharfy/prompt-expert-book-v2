import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { NextRequest } from 'next/server'

const h = vi.hoisted(() => ({ plan: null as any, rpc: vi.fn(), createClient: vi.fn() }))
vi.mock('next/server', () => ({ NextResponse: {
    next: () => ({ status: 200, headers: new Map(), location: null }),
    redirect: (url: URL) => ({ status: 307, headers: new Map(), location: url.toString() }),
} }))
vi.mock('@supabase/supabase-js', () => ({ createClient: h.createClient }))
import { middleware } from '../../middleware'

const request = (path: string, authed = false) => ({
    url: `https://example.test${path}`, nextUrl: { pathname: path },
    cookies: { get: (name: string) => authed ? { value: name === 'ebook_user_id' ? 'u1' : 'session' } : undefined },
}) as unknown as NextRequest

beforeEach(() => {
    vi.clearAllMocks()
    vi.stubEnv('NEXT_PUBLIC_SUPABASE_URL', 'https://example.test')
    vi.stubEnv('SUPABASE_SERVICE_ROLE_KEY', 'test-placeholder')
    h.plan = { plan_id: 'vip', status: 'active', expires_at: new Date(Date.now() + 86400000).toISOString() }
    h.rpc.mockImplementation(async () => ({ data: h.plan, error: null }))
    h.createClient.mockImplementation(() => ({ rpc: h.rpc, from: (table: string) => {
        const chain: any = {}; chain.select = chain.eq = chain.gt = () => chain
        chain.maybeSingle = async () => ({ data: table === 'sessions' ? { id: 's' } : { is_active: true }, error: null })
        return chain
    } }))
})

describe('public sharing and canonical middleware entitlements', () => {
    it.each(['/certificate/CERT-OLD', '/resources', '/ai-updates'])('keeps %s public without a subscription lookup', async path => {
        expect((await middleware(request(path))).status).toBe(200)
        expect(h.rpc).not.toHaveBeenCalled()
    })
    it('still requires login to open VIP chat', async () => {
        const res = await middleware(request('/chat')) as any
        expect(res.status).toBe(307); expect(res.location).toContain('/login')
    })
    it.each([{ status: 'cancelled' }, { expires_at: '2000-01-01' }, { expires_at: 'invalid' },
        { expires_at: null }, { plan_id: 'toString' }])('rejects an invalid RPC subscription %j', async invalid => {
        Object.assign(h.plan, invalid)
        const res = await middleware(request('/chat', true)) as any
        expect(res.status).toBe(307); expect(res.location).toContain('/payment')
    })
    it('uses the same tier features as the paid API', async () => {
        h.plan.plan_id = 'pro'
        const res = await middleware(request('/chat', true)) as any
        expect(res.status).toBe(307); expect(res.location).toContain('upgrade=true')
        h.plan.plan_id = 'vip'
        expect((await middleware(request('/chat', true))).status).toBe(200)
    })
})
