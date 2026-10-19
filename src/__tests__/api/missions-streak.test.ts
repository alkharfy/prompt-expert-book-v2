import { beforeEach, describe, expect, it, vi } from 'vitest'

// «حافظ على سلسلتك» used to stay 0/1 under a lit streak: nothing reported it. GET /api/missions now ticks it.
const h = vi.hoisted(() => ({ today: vi.fn(), update: vi.fn(), lastDay: null as string | null }))
vi.mock('server-only', () => ({}))
vi.mock('@/lib/auth-middleware', () => ({ getAuthenticatedUser: async () => 'u1' }))
vi.mock('@/lib/rate-limit', () => ({ checkRateLimit: () => ({ allowed: true }) }))
vi.mock('@/lib/logger', () => ({ apiLogger: { error: vi.fn() } }))
vi.mock('@/lib/missions', () => ({ getTodayMissions: h.today, generateDailyMissions: vi.fn(), updateMissionProgress: h.update }))
vi.mock('@/lib/supabase-admin', () => ({
    getSupabaseAdmin: () => {
        const chain: any = {}
        chain.from = chain.select = chain.eq = () => chain
        chain.maybeSingle = async () => ({ data: { last_activity_date: h.lastDay } })
        return chain
    },
}))
import { GET } from '@/app/api/missions/route'

const mission = (id: string, status = 'active') => ({ id, mission_template_id: id, target_value: 1, current_value: status === 'completed' ? 1 : 0, status, points_earned: 0, slot_number: 1, template: { title_ar: id } })
const utcToday = () => new Date().toISOString().slice(0, 10)

beforeEach(() => {
    vi.clearAllMocks()
    h.update.mockResolvedValue({ updatedMissions: [{}] })
})

describe('GET /api/missions — streak mission', () => {
    it('completes «حافظ على سلسلتك» when today already counts in the streak', async () => {
        h.lastDay = utcToday()
        h.today.mockResolvedValueOnce([mission('maintain_streak'), mission('read_pages')])
            .mockResolvedValueOnce([mission('maintain_streak', 'completed'), mission('read_pages')])
        const json = await (await GET()).json()
        expect(h.update).toHaveBeenCalledWith('u1', 'maintain_streak', 1)
        expect(json.data[0].status).toBe('completed')
    })

    it('leaves it alone when the learner has not been active today', async () => {
        h.lastDay = '2000-01-01'
        h.today.mockResolvedValue([mission('maintain_streak')])
        await GET()
        expect(h.update).not.toHaveBeenCalled()
    })

    it('does nothing when today has no streak mission', async () => {
        h.lastDay = utcToday()
        h.today.mockResolvedValue([mission('read_pages')])
        await GET()
        expect(h.update).not.toHaveBeenCalled()
    })
})
