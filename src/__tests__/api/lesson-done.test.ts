import { beforeEach, describe, expect, it, vi } from 'vitest'
import { NextRequest } from 'next/server'
vi.mock('server-only', () => ({}))

const h = vi.hoisted(() => ({
    user: 'u1' as string | null, allowed: true, row: null as any, readError: null as any,
    updates: [] as any[], upserts: [] as any[], from: vi.fn(),
}))
vi.mock('@/lib/auth-middleware', () => ({ getAuthenticatedUser: async () => h.user }))
vi.mock('@/lib/subscription', () => ({ userHasFeature: async () => h.allowed }))
vi.mock('@/lib/rate-limit', () => ({ checkRateLimit: () => ({ allowed: true }) }))
vi.mock('@/lib/logger', () => ({ dbLogger: { error: vi.fn() } }))
vi.mock('@/lib/supabase-admin', () => ({ getSupabaseAdmin: () => ({ from: h.from }) }))

import { POST } from '@/app/api/reading-progress/lesson/route'
import { parseLessonKey } from '@/lib/lessonProgress'

beforeEach(() => {
    h.user = 'u1'; h.allowed = true; h.row = { completed_lessons: ['intro:1'] }; h.readError = null
    h.updates.length = 0; h.upserts.length = 0
    h.from.mockImplementation(() => {
        const c: any = {}
        c.select = () => c
        c.eq = () => c
        c.maybeSingle = async () => ({ data: h.row, error: h.readError })
        c.update = (data: any) => { h.updates.push(data); return { eq: async () => ({ error: null }) } }
        c.upsert = async (data: any) => { h.upserts.push(data); return { error: null } }
        return c
    })
})
const request = (lesson: unknown) => new NextRequest('http://localhost/api/reading-progress/lesson', { method: 'POST', body: JSON.stringify({ lesson }) })

describe('saving a finished lesson', () => {
    it('only accepts lessons that exist', () => {
        expect(parseLessonKey('section-1:9')).toEqual({ sectionId: 'section-1', page: 9 })
        for (const bad of ['section-1:10', 'section-1:0', 'nope:1', 'intro', 4, null]) expect(parseLessonKey(bad)).toBeNull()
    })

    it('needs a signed-in learner', async () => {
        h.user = null
        expect((await POST(request('intro:2'))).status).toBe(401)
    })

    it('adds the lesson once', async () => {
        const res = await POST(request('intro:2'))
        expect(res.status).toBe(200)
        expect(h.updates[0].completed_lessons).toEqual(['intro:1', 'intro:2'])
        h.row = { completed_lessons: ['intro:1', 'intro:2'] }
        expect((await POST(request('intro:2'))).status).toBe(200)
        expect(h.updates).toHaveLength(1)
    })

    it('needs a plan for paid lessons but not for the intro', async () => {
        h.allowed = false
        expect((await POST(request('section-1:2'))).status).toBe(403)
        expect((await POST(request('intro:3'))).status).toBe(200)
    })

    it('fails softly before the database column exists', async () => {
        h.readError = { message: 'column reading_progress.completed_lessons does not exist' }
        expect((await POST(request('intro:2'))).status).toBe(503)
        expect(h.updates).toHaveLength(0)
    })
})
