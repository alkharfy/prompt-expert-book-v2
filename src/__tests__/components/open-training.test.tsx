import { beforeEach, afterEach, describe, expect, it, vi } from 'vitest'
import { act, cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import type { ComponentType, ReactNode } from 'react'
import RunningProjectHub from '@/components/tools/RunningProjectHub'
import PromptChallenges from '@/components/tools/PromptChallenges'
import ReadingPagination from '@/components/reading/ReadingPagination'

const { award, userId, insert, loadProgress } = vi.hoisted(() => ({
    award: vi.fn(), userId: vi.fn(), insert: vi.fn(), loadProgress: vi.fn(),
}))
vi.mock('@/lib/auth_system', () => ({ authSystem: { getCurrentUserId: userId } }))
vi.mock('@/lib/gamification', () => ({ onExerciseComplete: award }))
vi.mock('@/lib/supabase_proxy', () => {
    const query = { select: () => query, eq: () => query, like: loadProgress, insert }
    return { supabaseProxy: { from: () => query } }
})
vi.mock('framer-motion', async () => {
    const React = await import('react')
    const cache: Record<string, ComponentType<Record<string, unknown>>> = {}
    return {
        AnimatePresence: ({ children }: { children: ReactNode }) => children,
        motion: new Proxy({}, { get: (_, tag: string) => cache[tag] ||= (props: Record<string, unknown>) => {
            const domProps = { ...props }
            for (const key of ['initial', 'animate', 'exit', 'transition', 'whileHover', 'whileTap', 'layout']) delete domProps[key]
            return React.createElement(tag, domProps, props.children as ReactNode)
        } }),
    }
})
vi.mock('@/data/runningProjectData', () => {
    const criteria = [
        { id: 'context', name: 'السياق', weight: 50, check: 'has_context', description: 'راجع سياق المهمة' },
        { id: 'format', name: 'التنسيق', weight: 50, check: 'has_format', description: 'راجع شكل الناتج' },
    ]
    return {
        runningProjects: [{ id: 'test-project', name: 'مشروع اختبار', icon: '📚', description: 'تجربة تدريب', domain: 'عام', difficulty: 'beginner', color: '#22C55E', totalPoints: 40,
            phases: [0, 1].map(index => ({ index, title: index === 0 ? 'المرحلة الأولى' : 'المرحلة الثانية', description: 'مهمة المرحلة', brief: 'جرّب الطلب', relatedUnits: 'الفصل1', hints: [], scoringCriteria: criteria, idealPrompt: 'مثال للمقارنة', coachTip: 'راجع الناتج', points: 20 })) }],
        evaluatePhaseCriterion: (prompt: string) => prompt.length >= 100,
    }
})
vi.mock('@/data/hospitalChallengesData', () => ({
    hospitalChallenges: [{ id: 'test-challenge', exerciseId: 'hospital-challenge-test', name: 'تحدي اختبار', icon: '🧩', description: 'إصلاح بنية الطلب', diseases: [], sickPrompt: 'طلب ناقص', difficulty: 'easy', points: 10, hints: [], idealPrompt: 'مثال للمقارنة', scoringCriteria: [{ id: 'length', name: 'التفصيل', weight: 100, check: 'minimum_length', description: 'مؤشر بنية' }] }],
    evaluateCriterion: (prompt: string) => prompt.length >= 100,
}))

const prompt = 'اكتب تقريرًا واضحًا لجمهور الطلاب في جدول، مع تحديد المعلومات الناقصة وتجنب اختلاق المصادر. '.repeat(2)
function openProject() {
    render(<RunningProjectHub />)
    fireEvent.click(screen.getByText('مشروع اختبار'))
    fireEvent.click(screen.getByText('المرحلة الأولى'))
    fireEvent.change(screen.getByPlaceholderText('حدد المهمة والسياق والقيود وشكل الناتج الذي تحتاجه.'), { target: { value: prompt } })
    fireEvent.click(screen.getByRole('button', { name: 'فحص بنية أولي' }))
}
function reviewProjectTrial() {
    fireEvent.change(screen.getByLabelText('ناتج التجربة'), { target: { value: 'هذا ناتج تجربة فعلي يحتوي على جدول ومعلومات تحتاج إلى مراجعة.' } })
    fireEvent.click(screen.getByRole('button', { name: 'حفظ ناتج التجربة محليًا' }))
    for (const checkbox of screen.getAllByRole('checkbox')) fireEvent.click(checkbox)
    fireEvent.change(screen.getByLabelText('ماذا وجدت بعد مقارنة الناتج بالمعايير؟ اذكر نقصًا أو سبب قبول الناتج.'), { target: { value: 'راجعت السياق والتنسيق وحددت المعلومات الناقصة لإعادة التجربة.' } })
}
function submitChallenge() {
    render(<PromptChallenges />)
    fireEvent.click(screen.getByText('تحدي اختبار'))
    fireEvent.change(screen.getByPlaceholderText('اكتب البرومبت بعد إصلاحه هنا...'), { target: { value: prompt } })
    fireEvent.click(screen.getByRole('button', { name: 'فحص بنية أولي' }))
}

beforeEach(() => {
    vi.clearAllMocks()
    localStorage.clear()
    userId.mockReturnValue('learner')
    award.mockResolvedValue(undefined)
    insert.mockResolvedValue({ error: null })
    loadProgress.mockResolvedValue({ data: [], error: null })
})
afterEach(() => { cleanup(); vi.restoreAllMocks() })

describe('open training distinguishes structure from reviewed work', () => {
    it('requires a saved trial and complete self review before completion or points', async () => {
        openProject()
        expect(award).not.toHaveBeenCalled()
        expect(JSON.parse(localStorage.getItem('running_project_progress')!).currentPhaseIndex).toBe(0)
        const complete = screen.getByRole('button', { name: 'إتمام تجربة ومراجعة ذاتية' })
        expect(complete).toBeDisabled()
        fireEvent.change(screen.getByLabelText('ناتج التجربة'), { target: { value: 'هذا ناتج تجربة فعلي يحتوي على جدول ومعلومات تحتاج إلى مراجعة.' } })
        fireEvent.click(screen.getByRole('button', { name: 'حفظ ناتج التجربة محليًا' }))
        expect(JSON.parse(localStorage.getItem('running_project_progress')!).phases[0].completed).toBe(false)
        expect(complete).toBeDisabled()
        for (const checkbox of screen.getAllByRole('checkbox')) fireEvent.click(checkbox)
        fireEvent.change(screen.getByLabelText('ماذا وجدت بعد مقارنة الناتج بالمعايير؟ اذكر نقصًا أو سبب قبول الناتج.'), { target: { value: 'راجعت السياق والتنسيق وحددت المعلومات الناقصة لإعادة التجربة.' } })
        fireEvent.click(complete)
        await waitFor(() => expect(award).toHaveBeenCalledWith('learner', 'prompt_builder', null, 20, 'running-project-test-project-phase-0'))
        expect(insert).toHaveBeenCalledWith(expect.objectContaining({ exercise_id: 'running-project-test-project-phase-0',
            exercise_type: 'prompt_builder', section_id: 'running-project', is_correct: null, is_completed: true }))
        expect(insert.mock.invocationCallOrder[0]).toBeLessThan(award.mock.invocationCallOrder[0])
        const saved = JSON.parse(localStorage.getItem('running_project_progress')!)
        expect(saved.currentPhaseIndex).toBe(1)
        expect(saved.phases[0]).toMatchObject({ completed: true, completionVersion: 2, reviewedCriteria: ['context', 'format'] })
        expect(saved.phases[0].trialOutput).toContain('ناتج تجربة')
        expect(saved.phases[0].reviewNotes).toContain('المعلومات الناقصة')
    })

    it('waits for the account save before marking a project phase complete', async () => {
        let resolveInsert!: (value: { error: null }) => void
        insert.mockImplementationOnce(() => new Promise(resolve => { resolveInsert = resolve }))
        openProject()
        reviewProjectTrial()
        fireEvent.click(screen.getByRole('button', { name: 'إتمام تجربة ومراجعة ذاتية' }))
        expect(insert).toHaveBeenCalledTimes(1)
        const draft = JSON.parse(localStorage.getItem('running_project_progress')!)
        expect(draft.currentPhaseIndex).toBe(0)
        expect(draft.phases[0].completed).toBe(false)
        expect(draft.phases[0].reviewNotes).toContain('المعلومات الناقصة')
        expect(award).not.toHaveBeenCalled()
        await act(async () => { resolveInsert({ error: null }) })
        expect(JSON.parse(localStorage.getItem('running_project_progress')!).phases[0].completed).toBe(true)
        expect(award).toHaveBeenCalledTimes(1)
    })

    it('retains a project draft without completion or points when the account save fails', async () => {
        insert.mockResolvedValueOnce({ error: { code: '42501', message: 'denied' } })
        openProject()
        reviewProjectTrial()
        fireEvent.click(screen.getByRole('button', { name: 'إتمام تجربة ومراجعة ذاتية' }))
        await screen.findByRole('alert')
        expect(screen.getByRole('alert')).toHaveTextContent('تعذّر حفظ المحاولة في حسابك')
        const saved = JSON.parse(localStorage.getItem('running_project_progress')!)
        expect(saved.currentPhaseIndex).toBe(0)
        expect(saved.phases[0]).toMatchObject({ completed: false, pointsEarned: 0 })
        expect(saved.phases[0].reviewedCriteria).toEqual(['context', 'format'])
        expect(award).not.toHaveBeenCalled()
    })

    it('accepts a previously saved project attempt without awarding points again', async () => {
        insert.mockResolvedValueOnce({ error: { code: '23505', message: 'duplicate' } })
        openProject()
        reviewProjectTrial()
        fireEvent.click(screen.getByRole('button', { name: 'إتمام تجربة ومراجعة ذاتية' }))
        await waitFor(() => expect(JSON.parse(localStorage.getItem('running_project_progress')!).currentPhaseIndex).toBe(1))
        expect(award).not.toHaveBeenCalled()
        expect(screen.queryByRole('alert')).not.toBeInTheDocument()
    })

    it('lets a guest keep a reviewed local project without an account write or points', async () => {
        userId.mockReturnValue(null)
        openProject()
        reviewProjectTrial()
        fireEvent.click(screen.getByRole('button', { name: 'إتمام تجربة ومراجعة ذاتية' }))
        await waitFor(() => expect(JSON.parse(localStorage.getItem('running_project_progress')!).currentPhaseIndex).toBe(1))
        expect(JSON.parse(localStorage.getItem('running_project_progress')!).phases[0].pointsEarned).toBe(0)
        expect(insert).not.toHaveBeenCalled()
        expect(award).not.toHaveBeenCalled()
    })

    it('does not complete work when saving the trial fails', () => {
        openProject()
        fireEvent.change(screen.getByLabelText('ناتج التجربة'), { target: { value: 'ناتج تجربة يحتوي على معلومات كثيرة تستحق المراجعة.' } })
        vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => { throw new Error('quota exceeded') })
        fireEvent.click(screen.getByRole('button', { name: 'حفظ ناتج التجربة محليًا' }))
        expect(screen.getByRole('alert')).toHaveTextContent('تعذّر حفظ ناتج التجربة')
        expect(screen.getByRole('button', { name: 'إتمام تجربة ومراجعة ذاتية' })).toBeDisabled()
        expect(award).not.toHaveBeenCalled()
    })

    it('requires saving and reviewing again if the trial output changes', () => {
        openProject()
        fireEvent.change(screen.getByLabelText('ناتج التجربة'), { target: { value: 'ناتج أول تمت تجربته ويحتاج مراجعة كاملة.' } })
        fireEvent.click(screen.getByRole('button', { name: 'حفظ ناتج التجربة محليًا' }))
        for (const checkbox of screen.getAllByRole('checkbox')) fireEvent.click(checkbox)
        fireEvent.change(screen.getByLabelText('ماذا وجدت بعد مقارنة الناتج بالمعايير؟ اذكر نقصًا أو سبب قبول الناتج.'), { target: { value: 'راجعته وحددت النقص وأحتاج تجربة أخرى.' } })
        expect(screen.getByRole('button', { name: 'إتمام تجربة ومراجعة ذاتية' })).toBeEnabled()
        fireEvent.change(screen.getByLabelText('ناتج التجربة'), { target: { value: 'ناتج مختلف يحتاج إلى حفظ ومراجعة جديدة قبل الإتمام.' } })
        expect(screen.getByRole('button', { name: 'إتمام تجربة ومراجعة ذاتية' })).toBeDisabled()
        expect(screen.getAllByRole('checkbox').every(c => !(c as HTMLInputElement).checked)).toBe(true)
        expect(award).not.toHaveBeenCalled()
    })

    it('disables chapter navigation while completion is being saved', () => {
        const next = vi.fn(), locked = vi.fn(), prev = vi.fn()
        render(<ReadingPagination currentIndex={16} total={17} onPrev={prev} onNext={next} isFirst={false} isLast={true} isNextLocked={true} onLockedClick={locked} isNextBusy={true} />)
        for (const button of screen.getAllByRole('button')) {
            expect(button).toBeDisabled()
            fireEvent.click(button)
        }
        expect(next).not.toHaveBeenCalled()
        expect(locked).not.toHaveBeenCalled()
        expect(prev).not.toHaveBeenCalled()
    })

    it('keeps legacy prompts as drafts without treating regex-only marks as reviewed work', () => {
        localStorage.setItem('running_project_selected', 'test-project')
        localStorage.setItem('running_project_progress', JSON.stringify({ projectId: 'test-project', currentPhaseIndex: 2, phases: { 0: { completed: true, score: 100, pointsEarned: 20, userPrompt: 'طلب قديم محفوظ' } } }))
        render(<RunningProjectHub />)
        fireEvent.click(screen.getByText('المرحلة الأولى'))
        expect(screen.getByPlaceholderText('حدد المهمة والسياق والقيود وشكل الناتج الذي تحتاجه.')).toHaveValue('طلب قديم محفوظ')
        expect(screen.queryByText('إتمام تجربة ومراجعة ذاتية')).not.toBeInTheDocument()
        expect(award).not.toHaveBeenCalled()
    })

    it('gives no points or completion for a challenge that fails the structure check', async () => {
        render(<PromptChallenges />)
        fireEvent.click(screen.getByText('تحدي اختبار'))
        fireEvent.change(screen.getByPlaceholderText('اكتب البرومبت بعد إصلاحه هنا...'), { target: { value: 'طلب قصير' } })
        fireEvent.click(screen.getByRole('button', { name: 'فحص بنية أولي' }))
        await screen.findByText('لا نقاط أو إتمام لهذا الفحص')
        expect(insert).not.toHaveBeenCalled()
        expect(award).not.toHaveBeenCalled()
    })

    it('records challenge participation as ungraded and avoids another award on retry', async () => {
        render(<PromptChallenges />)
        fireEvent.click(screen.getByText('تحدي اختبار'))
        fireEvent.change(screen.getByPlaceholderText('اكتب البرومبت بعد إصلاحه هنا...'), { target: { value: prompt } })
        fireEvent.click(screen.getByRole('button', { name: 'فحص بنية أولي' }))
        await waitFor(() => expect(award).toHaveBeenCalledWith('learner', 'prompt_builder', null, 10, 'hospital-challenge-test'))
        expect(insert).toHaveBeenCalledWith(expect.objectContaining({ exercise_id: 'hospital-challenge-test',
            exercise_type: 'prompt_builder', section_id: 'hospital-challenges', is_correct: null, is_completed: true }))
        expect(insert.mock.invocationCallOrder[0]).toBeLessThan(award.mock.invocationCallOrder[0])
        fireEvent.click(screen.getByRole('button', { name: 'عدّل الطلب وأعد الفحص' }))
        fireEvent.click(screen.getByRole('button', { name: 'فحص بنية أولي' }))
        expect(award).toHaveBeenCalledTimes(1)
        expect(insert).toHaveBeenCalledTimes(1)
    })

    it('does not award or mark a challenge completed when saving the account attempt fails', async () => {
        insert.mockResolvedValueOnce({ error: { code: '42501', message: 'denied' } })
        submitChallenge()
        expect(await screen.findByRole('alert')).toHaveTextContent('لم يُسجّل الإتمام أو نقاط المشاركة')
        expect(award).not.toHaveBeenCalled()
        fireEvent.click(screen.getByRole('button', { name: '→ العودة للتحديات' }))
        expect(screen.queryByText('✅ مشاركة مسجلة')).not.toBeInTheDocument()
    })

    it('treats a duplicate challenge attempt from a previous visit or another tab as completed without another award', async () => {
        insert.mockResolvedValueOnce({ error: { code: '23505', message: 'duplicate' } })
        submitChallenge()
        await waitFor(() => expect(insert).toHaveBeenCalledTimes(1))
        fireEvent.click(screen.getByRole('button', { name: '→ العودة للتحديات' }))
        expect(await screen.findByText('✅ مشاركة مسجلة')).toBeInTheDocument()
        expect(award).not.toHaveBeenCalled()
        fireEvent.click(screen.getByText('تحدي اختبار'))
        fireEvent.change(screen.getByPlaceholderText('اكتب البرومبت بعد إصلاحه هنا...'), { target: { value: prompt } })
        fireEvent.click(screen.getByRole('button', { name: 'فحص بنية أولي' }))
        expect(insert).toHaveBeenCalledTimes(1)
        expect(award).not.toHaveBeenCalled()
    })
})
