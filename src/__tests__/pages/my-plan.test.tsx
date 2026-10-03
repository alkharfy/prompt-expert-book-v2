import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import type { ReactNode } from 'react'
import MyPlanPage from '@/app/my-plan/page'

const { router, request, currentUser } = vi.hoisted(() => ({
  router: { push: vi.fn(), replace: vi.fn(), back: vi.fn(), prefetch: vi.fn() },
  request: vi.fn(),
  currentUser: vi.fn(),
}))

// The page depends on router identity; use one instance instead of the setup mock's fresh object.
vi.mock('next/navigation', () => ({ useRouter: () => router }))
vi.mock('@/lib/auth_system', () => ({ authSystem: { getCurrentUserId: currentUser } }))
vi.mock('framer-motion', async () => {
  const React = await import('react')
  return { motion: { div: (props: Record<string, unknown>) => {
    const domProps = { ...props }
    for (const key of ['initial', 'animate', 'transition']) delete domProps[key]
    return React.createElement('div', domProps, props.children as ReactNode)
  } } }
})

const task = {
  id: 'task-reading', taskDate: '2026-10-03', taskType: 'reading', sectionId: 'section1',
  startPage: 1, endPage: 3, titleAr: 'قراءة مقدمة الفصل', dayNumber: 1,
  estimatedMinutes: 15, status: 'pending',
}
const summary = {
  learningPath: 'quick', learningDuration: '1week', startDate: '2026-10-01',
  expectedEndDate: '2026-10-08', totalReadingTasks: 7, totalExerciseTasks: 3,
}
const plan = {
  dayNumber: 1, totalDays: 7, progressPercent: 12, tasks: [task], isFlexible: false, summary,
}
const response = (body: unknown, status = 200) => new Response(JSON.stringify(body), {
  status, headers: { 'Content-Type': 'application/json' },
})

beforeEach(() => {
  vi.clearAllMocks()
  request.mockReset()
  currentUser.mockReturnValue('learner')
  vi.stubGlobal('fetch', request)
})
afterEach(() => { cleanup(); vi.unstubAllGlobals() })

describe('MyPlanPage displays saved plans and confirmed task updates', () => {
  it('keeps a summary-only plan visible before or after its schedule and links an old plan to onboarding', async () => {
    for (const fixture of [
      { startDate: '2030-01-01', expectedEndDate: '2030-01-08', needsRegeneration: false },
      { startDate: '2020-01-01', expectedEndDate: '2020-01-08', needsRegeneration: true },
    ]) {
      request.mockReset()
      request.mockResolvedValueOnce(response({ plan: {
        ...plan, tasks: [], needsRegeneration: fixture.needsRegeneration,
        summary: { ...summary, startDate: fixture.startDate, expectedEndDate: fixture.expectedEndDate },
      } }))
      render(<MyPlanPage />)
      expect(await screen.findByText('⚡ المسار السريع')).toBeInTheDocument()
      expect(screen.getByText('7 قراءة + 3 تمرين')).toBeInTheDocument()
      expect(screen.getByText('🎯 لا يوجد مهام مجدولة اليوم')).toBeInTheDocument()
      expect(screen.getByRole('button', { name: '📊 نظرة عامة' })).toBeInTheDocument()
      expect(screen.queryByText('لسه ما عندكش خطة!')).not.toBeInTheDocument()
      if (fixture.needsRegeneration) {
        expect(screen.getByRole('link', { name: 'حدّث إعدادات المسار لتوليد خطة مكتملة' })).toHaveAttribute('href', '/onboarding')
      }
      expect(request).toHaveBeenCalledTimes(1)
      expect(router.push).not.toHaveBeenCalled()
      cleanup()
    }
  })

  it('shows a rejected PATCH without marking the task complete or increasing progress', async () => {
    request.mockResolvedValueOnce(response({ plan }))
      .mockResolvedValueOnce(response({ ok: false, error: 'تعذر حفظ المهمة الآن' }, 400))
    render(<MyPlanPage />)
    const complete = await screen.findByRole('button', { name: 'أكملت: قراءة مقدمة الفصل' })
    fireEvent.click(complete)
    expect(await screen.findByText(/تعذر حفظ المهمة الآن/)).toBeInTheDocument()
    await waitFor(() => expect(complete).toBeEnabled())
    expect(screen.getByText(/^12%/)).toBeInTheDocument()
    expect(screen.queryByText('✅ مكتمل')).not.toBeInTheDocument()
    expect(request).toHaveBeenCalledTimes(2)
    expect(request).toHaveBeenLastCalledWith('/api/learning-plan', expect.objectContaining({
      method: 'PATCH', body: JSON.stringify({ taskId: task.id, status: 'completed' }),
    }))
  })

  it('reloads today’s plan after a successful PATCH and displays the server’s updated progress', async () => {
    request.mockResolvedValueOnce(response({ plan }))
      .mockResolvedValueOnce(response({ ok: true }))
      .mockResolvedValueOnce(response({ plan: { ...plan, progressPercent: 68, tasks: [{ ...task, status: 'completed' }] } }))
    render(<MyPlanPage />)
    fireEvent.click(await screen.findByRole('button', { name: 'أكملت: قراءة مقدمة الفصل' }))
    expect(await screen.findByText(/^68%/)).toBeInTheDocument()
    expect(screen.getByText('✅ مكتمل')).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'أكملت: قراءة مقدمة الفصل' })).not.toBeInTheDocument()
    expect(screen.queryByText(/^12%/)).not.toBeInTheDocument()
    expect(request.mock.calls.map(([, options]) => options?.method || 'GET')).toEqual(['GET', 'PATCH', 'GET'])
    expect(request).toHaveBeenLastCalledWith('/api/learning-plan')
  })
})
