import { beforeEach, describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react'

const h = vi.hoisted(() => ({ push: vi.fn() }))
vi.mock('next/navigation', () => ({ useRouter: () => ({ push: h.push }) }))
vi.mock('@/components/Navigation', () => ({ default: () => <nav>التنقل</nav> }))
vi.mock('@/components/sharing/ShareButton', () => ({ default: () => <button>مشاركة</button> }))
// Reading award tables with the anonymous client breaks after the server-only migration.
vi.mock('@/lib/supabase', () => { throw new Error('Leaderboard must use the authenticated server API') })
vi.mock('@/lib/auth_system', () => { throw new Error('Own rank must use the server flag') })

import LeaderboardPage from '@/app/leaderboard/page'

const entry = (displayName: string, rank: number, isCurrentUser = false) => ({
    displayName, rank, isCurrentUser, total_points: 200, current_level: 3,
    current_streak: 4, exercises_completed: 5, badges_count: 2,
})
const result = (entries: ReturnType<typeof entry>[]) => ({ ok: true, status: 200, json: async () => ({ entries }) }) as Response

beforeEach(() => { vi.mocked(fetch).mockReset(); h.push.mockReset() })

describe('server-backed leaderboard', () => {
    it('shows loading while waiting for the authenticated API', () => {
        vi.mocked(fetch).mockImplementation(() => new Promise(() => {}))
        render(<LeaderboardPage />)
        expect(screen.getByText('جاري التحميل...')).toBeInTheDocument()
        expect(fetch).toHaveBeenCalledWith('/api/leaderboard?tab=points', expect.objectContaining({ cache: 'no-store', signal: expect.any(AbortSignal) }))
    })

    it.each([1, 2])('renders all rows when the list contains only %i learners', async count => {
        const entries = Array.from({ length: count }, (_, index) => entry(`متعلم ${index + 1}`, index + 1, index === 0))
        vi.mocked(fetch).mockResolvedValue(result(entries))
        render(<LeaderboardPage />)
        for (const learner of entries) expect(await screen.findByText(learner.displayName)).toBeInTheDocument()
        expect(screen.getByText('متعلم 1').closest('.leaderboard-item')).toHaveClass('current-user')
        expect(screen.getByText(/ترتيبك:/)).toBeInTheDocument()
    })

    it('uses isCurrentUser for own rank without needing any user UUID', async () => {
        vi.mocked(fetch).mockResolvedValue(result([
            entry('الأول', 1), entry('الثاني', 2), entry('الثالث', 3), entry('متعلم حالي', 4, true),
        ]))
        render(<LeaderboardPage />)
        const ownName = await screen.findByText('متعلم حالي')
        expect(ownName.closest('.leaderboard-item')).toHaveClass('current-user')
        const ownCard = screen.getByText(/ترتيبك: #4/).closest('.user-rank-card') as HTMLElement
        expect(within(ownCard).getByText('مستوى النشاط 3')).toBeInTheDocument()
        expect(screen.getByText(/ولا يقيس الإتقان/)).toBeInTheDocument()
    })

    it('shows authentication failure as an error with a login action', async () => {
        vi.mocked(fetch).mockResolvedValue({ ok: false, status: 401 } as Response)
        render(<LeaderboardPage />)
        expect(await screen.findByRole('alert')).toHaveTextContent('يرجى تسجيل الدخول')
        expect(screen.getByRole('button', { name: 'تسجيل الدخول' })).toBeInTheDocument()
        fireEvent.click(screen.getByRole('button', { name: 'تسجيل الدخول' }))
        expect(h.push).toHaveBeenCalledWith('/login')
        expect(screen.queryByText('لا يوجد متصدرين بعد')).not.toBeInTheDocument()
    })

    it('shows a denied subscription instead of an empty leaderboard', async () => {
        vi.mocked(fetch).mockResolvedValue({ ok: false, status: 403 } as Response)
        render(<LeaderboardPage />)
        expect(await screen.findByRole('alert')).toHaveTextContent('Pro أو VIP')
        expect(screen.getByRole('button', { name: 'عرض الباقات' })).toBeInTheDocument()
        fireEvent.click(screen.getByRole('button', { name: 'عرض الباقات' }))
        expect(h.push).toHaveBeenCalledWith('/#pricing')
        expect(screen.queryByText('لا يوجد متصدرين بعد')).not.toBeInTheDocument()
    })

    it('retries a server failure and replaces it with real entries', async () => {
        vi.mocked(fetch).mockResolvedValueOnce({ ok: false, status: 503 } as Response).mockResolvedValueOnce(result([entry('عاد الاتصال', 1)]))
        render(<LeaderboardPage />)
        expect(await screen.findByRole('alert')).toHaveTextContent('تعذّر تحميل')
        fireEvent.click(screen.getByRole('button', { name: 'إعادة المحاولة' }))
        expect(await screen.findByText('عاد الاتصال')).toBeInTheDocument()
        expect(fetch).toHaveBeenCalledTimes(2)
        expect(screen.queryByRole('alert')).not.toBeInTheDocument()
    })

    it('does not silently turn a network failure into an empty list', async () => {
        vi.mocked(fetch).mockRejectedValue(new Error('network failed'))
        render(<LeaderboardPage />)
        expect(await screen.findByRole('alert')).toHaveTextContent('تعذّر تحميل')
        expect(screen.queryByText('لا يوجد متصدرين بعد')).not.toBeInTheDocument()
    })

    it('requests the selected tab and clears a previous rank when the new list is empty', async () => {
        vi.mocked(fetch).mockResolvedValueOnce(result([entry('متعلم حالي', 1, true)])).mockResolvedValueOnce(result([]))
        render(<LeaderboardPage />)
        expect(await screen.findByText(/ترتيبك:/)).toBeInTheDocument()
        fireEvent.click(screen.getByRole('button', { name: '🔥 التتابع' }))
        await waitFor(() => expect(fetch).toHaveBeenLastCalledWith('/api/leaderboard?tab=streak', expect.any(Object)))
        expect(await screen.findByText('لا يوجد متصدرين بعد')).toBeInTheDocument()
        expect(screen.queryByText(/ترتيبك:/)).not.toBeInTheDocument()
    })

    it('shows a malformed successful response as a load failure', async () => {
        vi.mocked(fetch).mockResolvedValue({ ok: true, status: 200, json: async () => ({ entries: null }) } as Response)
        render(<LeaderboardPage />)
        expect(await screen.findByRole('alert')).toHaveTextContent('تعذّر تحميل')
    })
})
