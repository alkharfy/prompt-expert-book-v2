import { beforeEach, describe, expect, it, vi } from 'vitest'
import { NextRequest } from 'next/server'

const h = vi.hoisted(() => ({ plan: null as any, auth: vi.fn(), rate: vi.fn(), rpc: vi.fn() }))
vi.mock('server-only', () => ({}))
vi.mock('@/lib/auth-middleware', () => ({ getAuthenticatedUser: h.auth }))
vi.mock('@/lib/supabase-admin', () => ({ getSupabaseAdmin: () => ({ rpc: h.rpc }) }))
vi.mock('@/lib/rate-limit', () => ({ checkRateLimitAsync: h.rate, RATE_LIMITS: { CHAT: {}, HOSPITAL_DIAGNOSE: {} } }))
vi.mock('@/lib/chat-context', () => ({ retrieveContext: vi.fn(), formatContextForPrompt: vi.fn() }))
vi.mock('@/lib/logger', () => ({ dbLogger: { error: vi.fn() } }))
import { userHasFeature } from '@/lib/subscription'
import { POST as chat } from '@/app/api/chat/route'
import { POST as diagnose } from '@/app/api/prompt-hospital/diagnose/route'
import { GET as subscriptionStatus } from '@/app/api/subscription/status/route'

beforeEach(() => {
    vi.clearAllMocks()
    h.plan = { plan_id: 'vip', status: 'active', expires_at: new Date(Date.now() + 86400000).toISOString() }
    h.rpc.mockImplementation(async () => ({ data: h.plan, error: null }))
    h.auth.mockResolvedValue('u1'); h.rate.mockResolvedValue({ allowed: true })
})
describe('canonical paid entitlements on the server', () => {
    it.each(['basic', 'pro'])('denies chat for active %s even when a subscription exists', async plan => {
        h.plan.plan_id = plan
        expect(await userHasFeature('u1', 'chat')).toBe(false)
        expect((await chat(new NextRequest('http://localhost/api/chat', { method: 'POST', body: '{}' }))).status).toBe(403)
        expect(h.rate).not.toHaveBeenCalled()
    })
    it('denies hospital diagnosis to Basic before using the AI quota', async () => {
        h.plan.plan_id = 'basic'
        expect((await diagnose(new NextRequest('http://localhost/api/prompt-hospital/diagnose', { method: 'POST', body: '{}' }))).status).toBe(403)
        expect(h.rate).not.toHaveBeenCalled()
    })
    it.each(['pro', 'vip'])('grants tools and certificate to active %s', async plan => {
        h.plan.plan_id = plan
        expect(await userHasFeature('u1', 'tools')).toBe(true)
        expect(await userHasFeature('u1', 'certificate')).toBe(true)
    })
    it.each([{ status: 'cancelled' }, { expires_at: '2000-01-01' }, { expires_at: 'invalid' },
        { expires_at: null }, { plan_id: 'toString' }])('fails closed for %j', async invalid => {
        Object.assign(h.plan, invalid)
        expect(await userHasFeature('u1', 'chat')).toBe(false)
        expect(await (await subscriptionStatus({} as NextRequest)).json()).toMatchObject({ plan_id: null, features: [] })
    })
    it('returns only canonical implemented features to the client', async () => {
        h.plan = { ...h.plan, plan_id: 'pro', features: ['chat', 'resources', 'ai_updates'] }
        const result = await (await subscriptionStatus({} as NextRequest)).json()
        expect(result.features).toContain('tools'); expect(result.features).toContain('certificate')
        expect(result.features).not.toContain('chat'); expect(result.features).not.toContain('resources')
        expect(result.features).not.toContain('ai_updates')
    })
    it('accepts VIP permission but still validates the request before calling a model', async () => {
        expect(await userHasFeature('u1', 'chat')).toBe(true)
        expect((await chat(new NextRequest('http://localhost/api/chat', { method: 'POST', body: '{}' }))).status).toBe(400)
        expect(h.rate).not.toHaveBeenCalled()
    })
    it('requires a verified session even for an otherwise entitled plan', async () => {
        h.auth.mockResolvedValue(null)
        expect((await chat(new NextRequest('http://localhost/api/chat', { method: 'POST', body: '{}' }))).status).toBe(401)
        expect(h.rpc).not.toHaveBeenCalled()
    })
})
