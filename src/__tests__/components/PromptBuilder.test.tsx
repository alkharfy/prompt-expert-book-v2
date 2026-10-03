import { beforeEach, describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import PromptBuilder from '@/components/exercises/PromptBuilder'

const mocks = vi.hoisted(() => ({
    upsert: vi.fn(), completed: vi.fn(), existing: vi.fn(),
}))
vi.mock('@/lib/supabase_proxy', () => ({ supabaseProxy: { from: () => ({
    select: () => ({ eq: () => ({ eq: () => ({ maybeSingle: mocks.existing }) }) }),
    upsert: mocks.upsert,
}) } }))
vi.mock('@/lib/auth_system', () => ({ authSystem: { getCurrentUserId: () => 'u1' } }))
vi.mock('@/lib/gamification', () => ({ onExerciseComplete: mocks.completed }))
vi.mock('@/lib/logger', () => ({ dbLogger: { error: vi.fn(), debug: vi.fn() } }))
vi.mock('framer-motion', async () => {
    const React = await import('react')
    const component = (tag: string) => function MockMotion({ children, initial, animate, exit, transition, whileHover, whileTap, ...props }: Record<string, unknown>) { return React.createElement(tag, props, children as React.ReactNode) }
    return { motion: { div: component('div'), button: component('button') }, AnimatePresence: ({ children }: { children: React.ReactNode }) => children }
})
const task = 'اكتب خطة محتوى لمتجر كتب يستهدف طلاب الجامعة في مصر. اعرض جدولًا من خمسة منشورات مع الفكرة والجمهور والهدف، وتجنب الادعاءات غير المسندة والنتائج المضمونة.'
const onComplete = vi.fn()

beforeEach(() => {
    vi.clearAllMocks()
    mocks.existing.mockResolvedValue({ data: null, error: null })
    mocks.upsert.mockResolvedValue({ error: null })
    mocks.completed.mockResolvedValue(undefined)
})

async function build() {
    render(<PromptBuilder exerciseId="builder-test" sectionId="section-2" title="تدريب" description="جرّب وراجع" templateFormat="{{task}}" steps={[{ id: 'task', label: 'المهمة', placeholder: '', example: task, required: true }]} onComplete={onComplete} />)
    const input = await screen.findByRole('textbox', { name: 'المهمة' })
    fireEvent.change(input, { target: { value: task } })
    fireEvent.click(screen.getByRole('button', { name: '🚀 إنشاء البرومبت' }))
}

describe('PromptBuilder practice completion', () => {
    it('requires a tried result and self review before awarding participation', async () => {
        await build()
        expect(mocks.upsert).not.toHaveBeenCalled()
        expect(mocks.completed).not.toHaveBeenCalled()
        const complete = screen.getByRole('button', { name: 'سجّل إتمام التدريب' })
        expect(complete).toBeDisabled()
        fireEvent.change(screen.getByRole('textbox', { name: 'ناتج التجربة أو وصف النتيجة' }), { target: { value: 'الناتج يحتوي خمسة منشورات مناسبة، وعدلت ادعاء غير مسند في المنشور الثاني.' } })
        expect(complete).toBeDisabled()
        fireEvent.click(screen.getByRole('checkbox'))
        fireEvent.click(complete)
        await waitFor(() => expect(mocks.completed).toHaveBeenCalledWith('u1', 'prompt_builder', null, 20, 'builder-test'))
        expect(mocks.upsert).toHaveBeenCalledWith(expect.objectContaining({ is_correct: null, is_completed: true }), { onConflict: 'user_id,exercise_id' })
        expect(JSON.parse(mocks.upsert.mock.calls[0][0].user_answer).__selfReviewed).toBe('true')
        expect(onComplete).toHaveBeenCalledWith(null, 20)
        expect(screen.queryByRole('button', { name: 'سجّل إتمام التدريب' })).not.toBeInTheDocument()
    })
    it('shows a save failure without recording completion or awarding points', async () => {
        mocks.upsert.mockResolvedValue({ error: { message: 'offline' } })
        await build()
        fireEvent.change(screen.getByRole('textbox', { name: 'ناتج التجربة أو وصف النتيجة' }), { target: { value: 'جربت الطلب وراجعت الناتج، وأحتاج تعديل ترتيب الأفكار.' } })
        fireEvent.click(screen.getByRole('checkbox'))
        fireEvent.click(screen.getByRole('button', { name: 'سجّل إتمام التدريب' }))
        expect(await screen.findByRole('alert')).toHaveTextContent('تعذر حفظ التدريب')
        expect(mocks.completed).not.toHaveBeenCalled()
        expect(onComplete).not.toHaveBeenCalled()
    })
})
