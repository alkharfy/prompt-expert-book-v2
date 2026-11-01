import { beforeEach, describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import GradeCheck from '@/components/reading/GradeCheck'

vi.mock('@/lib/analytics', () => ({ trackEvent: vi.fn() }))
vi.mock('@/components/reading/bag', () => ({ saveToBag: vi.fn() }))
vi.mock('@/components/reading/gradePass', () => ({ markGradePassed: vi.fn() }))

const prompt = 'أنا محاسب، راجعلي الفواتير دي وطلّعلي الأخطاء في جدول'
const missed = { criteria: [{ id: 'task', label: 'المهمة', verdict: 'fail', note: '', evidence: '' }], fix: 'وضّح المطلوب', remaining: 7 }

function renderGate() {
    render(<GradeCheck rubricId="intro-demo" sectionId="section-2" pageNumber={2} gated />)
    fireEvent.change(screen.getByLabelText('اللي كتبته'), { target: { value: prompt } })
}

const selfCheck = () => screen.getByText(/✍️/).closest('details')!

beforeEach(() => { vi.mocked(fetch).mockReset() })

// Owner 2026-11-01: the open self-check list crowded the Mister's notes, so it folds into a dropdown.
describe('«المستر بيصحّح» self-check', () => {
    it('folds the list after repeated misses, so the Mister\'s notes stay readable', async () => {
        vi.mocked(fetch).mockResolvedValue({ ok: true, json: async () => missed } as Response)
        renderGate()
        for (let attempt = 0; attempt < 5; attempt++) {
            fireEvent.click(screen.getByRole('button', { name: attempt === 0 ? 'صحّحلي' : 'عدّلت؟ صحّحلي تاني' }))
            await screen.findByText(/فاضلك النهارده 7/)
        }
        await waitFor(() => expect(selfCheck()).not.toHaveAttribute('open'))
        fireEvent.click(screen.getByText(/متأكد إن طلبك صح والمستر غلطان؟/))
        expect(selfCheck()).toHaveAttribute('open')
    })

    it('opens the list right away when the Mister can\'t answer, since it is the only way on', async () => {
        vi.mocked(fetch).mockResolvedValue({ ok: false, json: async () => ({ error: 'unavailable', message: 'المستر مقدرش يصحّح دلوقتي' }) } as Response)
        renderGate()
        fireEvent.click(screen.getByRole('button', { name: 'صحّحلي' }))
        await screen.findByText(/لحد ما المستر يرجع/)
        expect(selfCheck()).toHaveAttribute('open')
    })
})
