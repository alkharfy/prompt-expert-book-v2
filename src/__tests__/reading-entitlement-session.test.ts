import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { NextRequest } from 'next/server'
import { SESSION_DURATION_MS } from '@/lib/config'

const h = vi.hoisted(() => ({
    cookies: vi.fn(),
    feature: vi.fn(),
    from: vi.fn(),
    cookieValues: {} as Record<string, string>,
    rows: {} as Record<string, Record<string, unknown>[]>,
    queries: [] as { table: string; operation: string; filters: Record<string, unknown> }[],
}))

vi.mock('server-only', () => ({}))
vi.mock('next/headers', () => ({ cookies: h.cookies }))
vi.mock('@/lib/supabase-admin', () => ({ getSupabaseAdmin: () => ({ from: h.from }) }))
vi.mock('@/lib/subscription', () => ({ userHasFeature: h.feature }))
vi.mock('@/data/recapsData', () => ({ getRecapForSection: vi.fn() }))
vi.mock('@/data/specializationContent', () => ({ hasSpecContent: vi.fn() }))

import { getServerAccess } from '@/lib/server/access'
import { GET as verifySession } from '@/app/api/auth/verify-session/route'

const NOW = Date.parse('2026-10-03T12:00:00Z')
const farExpiry = new Date(NOW + SESSION_DURATION_MS + 86400000).toISOString()
const session = {
    id: 'session-1', session_token: 'token-1', user_id: 'user-1',
    device_id: 'device-1', expires_at: farExpiry,
}

interface QueryBuilder {
    select: () => QueryBuilder
    eq: (key: string, value: unknown) => QueryBuilder
    single: () => Promise<{ data: Record<string, unknown> | null; error: null }>
    maybeSingle: () => Promise<{ data: Record<string, unknown> | null; error: null }>
    delete: () => QueryBuilder
    update: () => QueryBuilder
}

function query(table: string) {
    const record = { table, operation: 'select', filters: {} as Record<string, unknown> }
    h.queries.push(record)
    const result = async () => ({
        data: (h.rows[table] || []).find(row => Object.entries(record.filters).every(([key, value]) => row[key] === value)) || null,
        error: null,
    })
    const builder: QueryBuilder = {
        select: vi.fn(() => builder),
        eq: vi.fn((key: string, value: unknown) => { record.filters[key] = value; return builder }),
        single: vi.fn(result),
        maybeSingle: vi.fn(result),
        delete: vi.fn(() => { record.operation = 'delete'; return builder }),
        update: vi.fn(() => { record.operation = 'update'; return builder }),
    }
    return builder
}

const entryPoints = [
    {
        name: 'server reading access',
        check: async () => {
            const result = await getServerAccess()
            return { authenticated: result.isAuthed, granted: result.hasAccess, userId: result.userId }
        },
    },
    {
        name: 'verify-session API',
        check: async () => {
            const response = await verifySession(new NextRequest('http://localhost/api/auth/verify-session'))
            const result = await response.json()
            if (result.valid) expect(typeof result.hasPaid).toBe('boolean')
            return { authenticated: result.valid, granted: result.hasPaid ?? false, userId: result.userId ?? null }
        },
    },
]

beforeEach(() => {
    vi.resetAllMocks()
    vi.spyOn(Date, 'now').mockReturnValue(NOW)
    h.cookieValues = { ebook_session_token: 'token-1', ebook_user_id: 'user-1', ebook_device_id: 'device-1' }
    h.rows = {
        sessions: [{ ...session }],
        payments: [{ user_id: 'user-1', status: 'success' }],
        users: [{ id: 'user-1', is_active: true, current_plan: 'premium', plan_expires_at: farExpiry }],
        subscriptions: [{ id: 'old-subscription', user_id: 'user-1', status: 'active' }],
    }
    h.queries = []
    h.cookies.mockResolvedValue({ get: (name: string) => h.cookieValues[name] ? { value: h.cookieValues[name] } : undefined })
    h.from.mockImplementation(query)
    h.feature.mockResolvedValue(false)
})

afterEach(() => vi.restoreAllMocks())

describe.each(entryPoints)('$name uses the canonical reading entitlement', ({ check }) => {
    it('keeps a valid user authenticated without paid access when the reading feature is false', async () => {
        expect(await check()).toEqual({ authenticated: true, granted: false, userId: 'user-1' })
        expect(h.feature).toHaveBeenCalledExactlyOnceWith('user-1', 'reading')
    })

    it('grants paid access only after a valid session and a true reading feature', async () => {
        h.feature.mockResolvedValue(true)
        expect(await check()).toEqual({ authenticated: true, granted: true, userId: 'user-1' })
        expect(h.feature).toHaveBeenCalledExactlyOnceWith('user-1', 'reading')
        expect(h.queries).toEqual([
            { table: 'sessions', operation: 'select', filters: { session_token: 'token-1', user_id: 'user-1', device_id: 'device-1' } },
        ])
    })

    it('cannot grant access from a historical payment, active account flag or legacy subscription', async () => {
        // Fixtures deliberately contain all three former grant sources.
        expect(h.rows.payments[0].status).toBe('success')
        expect(h.rows.users[0].is_active).toBe(true)
        expect(await check()).toEqual({ authenticated: true, granted: false, userId: 'user-1' })
        expect(h.feature).toHaveBeenCalledExactlyOnceWith('user-1', 'reading')
        expect(h.queries.every(item => item.table === 'sessions')).toBe(true)
    })

    it.each(['ebook_session_token', 'ebook_user_id'])('rejects missing %s before checking the database or reading feature', async cookie => {
        delete h.cookieValues[cookie]
        h.feature.mockResolvedValue(true)
        expect(await check()).toEqual({ authenticated: false, granted: false, userId: null })
        expect(h.from).not.toHaveBeenCalled()
        expect(h.feature).not.toHaveBeenCalled()
    })

    it.each(['not-a-date', '', undefined, null, new Date(NOW - 1).toISOString(), new Date(NOW).toISOString()])('rejects invalid or expired session expiry %j before checking the reading feature', async expiresAt => {
        h.rows.sessions[0].expires_at = expiresAt
        h.feature.mockResolvedValue(true)
        expect(await check()).toEqual({ authenticated: false, granted: false, userId: null })
        expect(h.feature).not.toHaveBeenCalled()
    })

    it('rejects a missing session despite legacy payment and active account fixtures', async () => {
        h.rows.sessions = []
        h.feature.mockResolvedValue(true)
        expect(await check()).toEqual({ authenticated: false, granted: false, userId: null })
        expect(h.feature).not.toHaveBeenCalled()
    })

    it('allows the token-and-user fallback when the device-scoped lookup misses', async () => {
        h.cookieValues.ebook_device_id = 'changed-device'
        h.feature.mockResolvedValue(true)
        expect(await check()).toEqual({ authenticated: true, granted: true, userId: 'user-1' })
        expect(h.queries).toEqual([
            { table: 'sessions', operation: 'select', filters: { session_token: 'token-1', user_id: 'user-1', device_id: 'changed-device' } },
            { table: 'sessions', operation: 'select', filters: { session_token: 'token-1', user_id: 'user-1' } },
        ])
        expect(h.feature).toHaveBeenCalledExactlyOnceWith('user-1', 'reading')
    })

    it('validates both token and user when the device cookie is absent', async () => {
        delete h.cookieValues.ebook_device_id
        h.feature.mockResolvedValue(true)
        expect(await check()).toEqual({ authenticated: true, granted: true, userId: 'user-1' })
        expect(h.queries).toEqual([
            { table: 'sessions', operation: 'select', filters: { session_token: 'token-1', user_id: 'user-1' } },
        ])
    })

    it('does not let device fallback use another user or token', async () => {
        h.rows.sessions = [
            { ...session, user_id: 'another-user' },
            { ...session, id: 'session-2', session_token: 'another-token' },
        ]
        h.feature.mockResolvedValue(true)
        expect(await check()).toEqual({ authenticated: false, granted: false, userId: null })
        expect(h.feature).not.toHaveBeenCalled()
        expect(h.queries.every(item => item.filters.session_token === 'token-1' && item.filters.user_id === 'user-1')).toBe(true)
    })

    it('fails closed when the entitlement lookup throws', async () => {
        h.feature.mockRejectedValue(new Error('entitlement lookup unavailable'))
        expect(await check()).toEqual({ authenticated: false, granted: false, userId: null })
    })
})
