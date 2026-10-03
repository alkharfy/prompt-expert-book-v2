import { beforeEach, describe, expect, it, vi } from 'vitest'
import { NextRequest } from 'next/server'

type Row = Record<string, unknown>
interface QueryTrace {
    table: string
    columns: string
    orders: { column: string; ascending: boolean }[]
    filters: { column: string; values: unknown[] }[]
    limit: number | null
}
interface QueryResult { data: Row[] | null; error: { message: string } | null }
interface QueryBuilder extends PromiseLike<QueryResult> {
    select: (columns: string) => QueryBuilder
    order: (column: string, options: { ascending: boolean }) => QueryBuilder
    in: (column: string, values: unknown[]) => QueryBuilder
    limit: (count: number) => QueryBuilder
}

const h = vi.hoisted(() => ({
    auth: vi.fn(), feature: vi.fn(), from: vi.fn(),
    rows: {} as Record<string, Row[]>,
    errors: {} as Record<string, { message: string }>,
    queries: [] as QueryTrace[],
}))
vi.mock('server-only', () => ({}))
vi.mock('@/lib/auth-middleware', () => ({ getAuthenticatedUser: h.auth }))
vi.mock('@/lib/subscription', () => ({ userHasFeature: h.feature }))
vi.mock('@/lib/supabase-admin', () => ({ getSupabaseAdmin: () => ({ from: h.from }) }))
vi.mock('@/lib/logger', () => ({ dbLogger: { error: vi.fn() } }))

import { GET } from '@/app/api/leaderboard/route'

function query(table: string): QueryBuilder {
    const trace: QueryTrace = { table, columns: '', orders: [], filters: [], limit: null }
    h.queries.push(trace)
    const result = (): QueryResult => {
        if (h.errors[table]) return { data: null, error: h.errors[table] }
        let rows = [...(h.rows[table] || [])]
        rows = rows.filter(row => trace.filters.every(filter => filter.values.includes(row[filter.column])))
        rows.sort((left, right) => {
            for (const order of trace.orders) {
                const a = left[order.column] as string | number
                const b = right[order.column] as string | number
                if (a === b) continue
                const comparison = a < b ? -1 : 1
                return order.ascending ? comparison : -comparison
            }
            return 0
        })
        if (trace.limit !== null) rows = rows.slice(0, trace.limit)
        // Keep extra fixture fields so accidental spreading into the response is detectable.
        return { data: rows, error: null }
    }
    const builder: QueryBuilder = {
        select: vi.fn(columns => { trace.columns = columns; return builder }),
        order: vi.fn((column, options) => { trace.orders.push({ column, ascending: options.ascending }); return builder }),
        in: vi.fn((column, values) => { trace.filters.push({ column, values }); return builder }),
        limit: vi.fn(count => { trace.limit = count; return builder }),
        then: (resolve, reject) => Promise.resolve(result()).then(resolve, reject),
    }
    return builder
}

const request = (queryString = '') => new NextRequest(`http://localhost/api/leaderboard${queryString}`)
const columns = (value: string) => value.split(',').map(column => column.trim()).sort()
const entries = [
    { user_id: 'user-current', total_points: 100, current_level: 3, current_streak: 2, exercises_completed: 6, chapters_completed: 77, email: 'private-current@example.com' },
    { user_id: 'user-a', total_points: 100, current_level: 4, current_streak: 7, exercises_completed: 1, chapters_completed: 99, email: 'private-a@example.com' },
    { user_id: 'user-z', total_points: 50, current_level: 2, current_streak: 4, exercises_completed: 9, chapters_completed: 88, email: 'private-z@example.com' },
]

beforeEach(() => {
    vi.clearAllMocks()
    h.auth.mockResolvedValue('user-current')
    h.feature.mockResolvedValue(true)
    h.rows = {
        user_gamification: entries.map(row => ({ ...row })),
        users: [
            { id: 'user-current', full_name: '  أحمد  ', email: 'private-current@example.com' },
            { id: 'user-a', full_name: 'learner@example.com', email: 'private-a@example.com' },
            { id: 'user-z', full_name: 'ز'.repeat(100), email: 'private-z@example.com' },
            { id: 'user-not-ranked', full_name: 'غير مشارك' },
        ],
        user_badges: [
            { user_id: 'user-current', badge_id: 'b1' },
            { user_id: 'user-current', badge_id: 'b2' },
            { user_id: 'user-a', badge_id: 'b3' },
            { user_id: 'user-not-ranked', badge_id: 'b4' },
        ],
    }
    h.errors = {}
    h.queries = []
    h.from.mockImplementation(query)
})

describe('private, entitled leaderboard API', () => {
    it('rejects an unauthenticated request before checking features or querying data', async () => {
        h.auth.mockResolvedValue(null)
        const response = await GET(request())
        expect(response.status).toBe(401)
        expect(h.feature).not.toHaveBeenCalled()
        expect(h.from).not.toHaveBeenCalled()
    })

    it('requires the leaderboard entitlement before admin access', async () => {
        h.feature.mockResolvedValue(false)
        const response = await GET(request())
        expect(response.status).toBe(403)
        expect(h.feature).toHaveBeenCalledExactlyOnceWith('user-current', 'leaderboard')
        expect(h.from).not.toHaveBeenCalled()
    })

    it.each(['email', 'total_points', 'chapters', 'POINTS', '__proto__', 'constructor', 'toString', 'points;drop table users'])('rejects an unsupported tab: %s', async tab => {
        const response = await GET(request(`?tab=${encodeURIComponent(tab)}`))
        expect(response.status).toBe(400)
        expect(h.from).not.toHaveBeenCalled()
    })

    it.each([
        ['', 'total_points', [100, 100, 50]],
        ['?tab=points', 'total_points', [100, 100, 50]],
        ['?tab=streak', 'current_streak', [7, 4, 2]],
        ['?tab=exercises', 'exercises_completed', [9, 6, 1]],
    ])('maps %s to its allowed sort column with a stable tie breaker', async (search, sortColumn, expectedValues) => {
        const response = await GET(request(search))
        expect(response.status).toBe(200)
        expect(response.headers.get('Cache-Control')).toMatch(/private/)
        expect(response.headers.get('Cache-Control')).toMatch(/no-store/)
        const body = await response.json()
        expect(body.entries.map((entry: Row) => entry[sortColumn])).toEqual(expectedValues)
        const main = h.queries.find(trace => trace.table === 'user_gamification')!
        expect(main.orders).toEqual([{ column: sortColumn, ascending: false }, { column: 'user_id', ascending: true }])
        expect(main.limit).toBe(50)
        expect(columns(main.columns)).toEqual(['current_level', 'current_streak', 'exercises_completed', 'total_points', 'user_id'])
    })

    it('returns only public display fields and restricts enrichment to the ranked users', async () => {
        const response = await GET(request())
        const body = await response.json()
        expect(Object.keys(body)).toEqual(['entries'])
        expect(body.entries).toEqual([
            { displayName: 'متعلم', total_points: 100, current_level: 4, current_streak: 7, exercises_completed: 1, badges_count: 1, rank: 1, isCurrentUser: false },
            { displayName: 'أحمد', total_points: 100, current_level: 3, current_streak: 2, exercises_completed: 6, badges_count: 2, rank: 2, isCurrentUser: true },
            { displayName: 'ز'.repeat(80), total_points: 50, current_level: 2, current_streak: 4, exercises_completed: 9, badges_count: 0, rank: 3, isCurrentUser: false },
        ])
        expect(JSON.stringify(body)).not.toMatch(/user-current|user-a|user-z|@|chapters_completed|badge_id/)
        const users = h.queries.find(trace => trace.table === 'users')!
        const badges = h.queries.find(trace => trace.table === 'user_badges')!
        expect(columns(users.columns)).toEqual(['full_name', 'id'])
        expect(columns(badges.columns)).toEqual(['user_id'])
        expect(users.filters).toEqual([{ column: 'id', values: ['user-a', 'user-current', 'user-z'] }])
        expect(badges.filters).toEqual([{ column: 'user_id', values: ['user-a', 'user-current', 'user-z'] }])
    })

    it.each([null, '', '   '])('uses a neutral name for a missing or blank full name: %j', async fullName => {
        h.rows.users[1].full_name = fullName
        const response = await GET(request())
        const body = await response.json()
        expect(body.entries[0].displayName).toBe('متعلم')
    })

    it('does not request names or badges when the leaderboard is empty', async () => {
        h.rows.user_gamification = []
        const response = await GET(request())
        expect(response.status).toBe(200)
        expect(await response.json()).toEqual({ entries: [] })
        expect(h.queries.map(trace => trace.table)).toEqual(['user_gamification'])
    })

    it('limits the public response to the first 50 ranks', async () => {
        h.rows.user_gamification = Array.from({ length: 60 }, (_, index) => ({
            user_id: `ranked-${index}`, total_points: index, current_level: 1, current_streak: 0, exercises_completed: 0,
        }))
        const response = await GET(request())
        const body = await response.json()
        expect(body.entries).toHaveLength(50)
        expect(body.entries[0].total_points).toBe(59)
        expect(body.entries[49]).toMatchObject({ total_points: 10, rank: 50 })
    })

    it('returns bounded display counters when a historical row has invalid numbers', async () => {
        h.rows.user_gamification = [{
            user_id: 'user-current', total_points: -1, current_level: null,
            current_streak: 1.5, exercises_completed: Number.MAX_SAFE_INTEGER + 1,
        }]
        const response = await GET(request())
        const body = await response.json()
        expect(body.entries[0]).toMatchObject({ total_points: 0, current_level: 1, current_streak: 0, exercises_completed: 0 })
    })

    it('caps a historical level above the supported level range', async () => {
        h.rows.user_gamification = [{ ...entries[0], current_level: 999 }]
        const response = await GET(request())
        expect((await response.json()).entries[0].current_level).toBe(10)
    })

    it.each(['user_gamification', 'users', 'user_badges'])('fails closed with a generic 503 on a %s database error', async table => {
        h.errors[table] = { message: 'secret database diagnostic private-db-password' }
        const response = await GET(request())
        expect(response.status).toBe(503)
        const body = await response.json()
        expect(body).toHaveProperty('error')
        expect(body).not.toHaveProperty('entries')
        expect(JSON.stringify(body)).not.toMatch(/secret|diagnostic|private-db-password/)
    })

    it('returns a generic 503 when the admin query throws', async () => {
        h.from.mockImplementation(() => { throw new Error('private database connection diagnostic') })
        const response = await GET(request())
        expect(response.status).toBe(503)
        expect(JSON.stringify(await response.json())).not.toMatch(/private|diagnostic|connection/)
    })
})
