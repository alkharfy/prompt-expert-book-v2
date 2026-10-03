import { beforeEach, describe, expect, it, vi } from 'vitest'
import { NextRequest } from 'next/server'
vi.mock('server-only', () => ({}))

const h = vi.hoisted(() => ({
    user: 'u1' as string | null, row: null as any, writes: [] as any[], allowed: true,
    sync: vi.fn(), from: vi.fn(), readError: null as any,
}))
vi.mock('@/lib/auth-middleware', () => ({ getAuthenticatedUser: async () => h.user }))
vi.mock('@/lib/subscription', () => ({ userHasFeature: async () => h.allowed }))
vi.mock('@/lib/gamification', () => ({ syncReadingToGamification: h.sync }))
vi.mock('@/lib/rate-limit', () => ({ checkRateLimit: () => ({ allowed: true }) }))
vi.mock('@/lib/logger', () => ({ dbLogger: { error: vi.fn() } }))
vi.mock('next/headers', () => ({ cookies: async () => ({ get: (key: string) => ({ value: key === 'ebook_user_id' ? 'u1' : 'verified-session' }) }) }))
vi.mock('@/lib/supabase-admin', () => ({ getSupabaseAdmin: () => ({ from: h.from }) }))

import { GET, POST } from '@/app/api/reading-progress/route'
import { POST as proxy } from '@/app/api/auth/db-operation/route'

beforeEach(() => {
    h.user = 'u1'; h.row = { current_page: 1, completed_chapters: [] }; h.allowed = true
    h.readError = null; h.writes.length = 0; vi.clearAllMocks()
    h.from.mockImplementation((table: string) => {
        const c: any = {}
        c.select = c.eq = c.gt = () => c
        c.maybeSingle = async () => ({ data: table === 'sessions' ? { id: 'verified' } : h.row, error: h.readError })
        c.upsert = (data: any) => { h.writes.push(data); return c }
        c.single = async () => ({ data: h.writes.at(-1), error: null })
        return c
    })
})
const request = (body: unknown) => new NextRequest('http://localhost/api/reading-progress', { method: 'POST', body: JSON.stringify(body) })

describe('validated self-reported reading', () => {
    it('requires a verified session before reading or writing', async () => {
        h.user = null
        expect((await GET()).status).toBe(401)
        expect((await POST(request({ current_page: 23 }))).status).toBe(401)
        expect(h.from).not.toHaveBeenCalled()
    })
    it.each([null, [], { current_page: 1.5 }, { current_page: 223 }, { completed_chapters: ['1', '1'] },
        { completed_chapters: ['section-1'] }, { completed_chapter: -1 }])('rejects malformed progress %j', async body => {
        expect((await POST(request(body))).status).toBe(400)
        expect(h.writes).toHaveLength(0)
    })
    it('does not complete earlier chapters when a reader jumps to the last page', async () => {
        expect((await POST(request({ current_page: 222 }))).status).toBe(200)
        expect(h.writes[0]).toMatchObject({ current_page: 222 })
        expect(h.writes[0]).not.toHaveProperty('completed_chapters')
        expect(h.writes[0]).not.toHaveProperty('completion_percentage')
        expect(h.sync).not.toHaveBeenCalled()
    })
    it('never overwrites chapter markers in a page or bookmark-only save', async () => {
        h.row.completed_chapters = ['1', '2']
        expect((await POST(request({ current_page: 40, bookmarks: [4] }))).status).toBe(200)
        expect(h.writes[0]).not.toHaveProperty('completed_chapters')
        expect(h.writes[0]).not.toHaveProperty('completion_percentage')
    })
    it('blocks progress on paid chapters without a reading entitlement', async () => {
        h.allowed = false
        expect((await POST(request({ current_page: 24 }))).status).toBe(403)
        expect(h.writes).toHaveLength(0)
    })
    it('allows the free chapter without payment and counts it once', async () => {
        h.allowed = false; h.row = { current_page: 23, completed_chapters: ['0'] }
        expect((await POST(request({ completed_chapter: 1 }))).status).toBe(200)
        expect(h.writes[0]).toMatchObject({ completed_chapters: ['0', '1'], completion_percentage: 10 })
        expect(h.sync).toHaveBeenCalledWith('u1', 1, expect.anything())
    })
    it('rejects a bulk completion claim even at the final page', async () => {
        h.row.current_page = 182
        expect((await POST(request({ completed_chapters: Array.from({ length: 10 }, (_, i) => String(i + 1)) }))).status).toBe(400)
        expect(h.writes).toHaveLength(0)
    })
    it('requires the end page to have been saved separately', async () => {
        expect((await POST(request({ current_page: 23, completed_chapter: 1 }))).status).toBe(400)
        expect(h.writes).toHaveLength(0)
    })
    it('merges a valid last-chapter marker and sanitizes legacy duplicates', async () => {
        h.row = { current_page: 182, completed_chapters: ['0', '1', '1', 'bogus', ...Array.from({ length: 8 }, (_, i) => String(i + 2))] }
        expect((await POST(request({ completed_chapter: '10' }))).status).toBe(200)
        expect(h.writes[0].completion_percentage).toBe(100)
        expect(h.writes[0].completed_chapters).toHaveLength(11)
    })
    it('derives returned completion from unique main chapters, never the old percentage', async () => {
        h.row = { current_page: 222, total_pages: 89, completed_chapters: ['0', '1', '1', '11', '12', 'bogus'], completion_percentage: 100 }
        expect((await (await GET()).json()).data).toMatchObject({ total_pages: 222,
            completed_chapters: ['0', '1', '11', '12'], completion_percentage: 10 })
    })
    it('fails closed when the saved reading record cannot be checked', async () => {
        h.readError = { message: 'unavailable' }
        expect((await POST(request({ current_page: 23 }))).status).toBe(500)
        expect(h.writes).toHaveLength(0)
    })
    it.each(['insert', 'upsert', 'update'])('prevents %s through the generic DB proxy from bypassing validation', async operation => {
        const res = await proxy(request({ operation, table: 'reading_progress', data: { current_page: 222, completed_chapters: ['1'], completion_percentage: 100 } }))
        expect(res.status).toBe(403)
        expect(h.writes).toHaveLength(0)
    })
})
