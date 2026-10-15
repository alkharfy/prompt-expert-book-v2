import { describe, expect, it } from 'vitest'
import {
  generateMinutesPlanTasks,
  hasCompleteReadingCoverage,
  isMinutesDuration,
  minutesDurationLabel,
} from '@/lib/learning-plan-schedule'
import { countPagesFrom } from '@/lib/onboarding'
import type { PlanTask } from '@/lib/learning-plan'

const startDate = '2026-10-20'
const readingPages = (tasks: PlanTask[]) => tasks.filter(task => task.taskType === 'reading').flatMap(task =>
  Array.from({ length: task.endPage! - task.startPage! + 1 }, (_, index) => `${task.sectionId}:${task.startPage! + index}`))

describe('minutes-based learning plans', () => {
  it('covers the thirteen free pages once and finishes the 20-minute plan on day four', () => {
    const tasks = generateMinutesPlanTasks({
      scope: 'free', start: { sectionId: 'intro', page: 1 }, dailyMinutes: 20, startDate, includeExercises: false,
    })
    const pages = readingPages(tasks)
    expect(pages).toEqual([
      ...Array.from({ length: 3 }, (_, index) => `intro:${index + 1}`),
      ...Array.from({ length: 10 }, (_, index) => `section-1:${index + 1}`),
    ])
    expect(new Set(pages).size).toBe(13)
    expect(Math.max(...tasks.filter(task => task.taskType === 'reading').map(task => task.dayNumber))).toBeLessThanOrEqual(4)
    expect(tasks.at(-1)).toMatchObject({ taskType: 'celebration', dayNumber: 4, taskDate: '2026-10-23' })
    expect(tasks.some(task => task.taskType === 'exercise')).toBe(false)
    expect(hasCompleteReadingCoverage(tasks, 'free')).toBe(true)
    expect(hasCompleteReadingCoverage(tasks, 'free', { fromFirstTask: true })).toBe(true)
  })

  it('starts a daily AI reader at intro page three and checks coverage from there', () => {
    const tasks = generateMinutesPlanTasks({
      scope: 'free', start: { sectionId: 'intro', page: 3 }, dailyMinutes: 10, startDate, includeExercises: false,
    })
    const readingTasks = tasks.filter(task => task.taskType === 'reading')
    expect(readingTasks[0]).toMatchObject({ sectionId: 'intro', startPage: 3 })
    const pages = readingPages(tasks)
    expect(pages).not.toContain('intro:1')
    expect(pages).not.toContain('intro:2')
    expect(hasCompleteReadingCoverage(tasks, 'free', { fromFirstTask: true })).toBe(true)
    expect(hasCompleteReadingCoverage(tasks, 'free')).toBe(false)
  })

  it('sizes the comprehensive plan using only pages from section two onwards', () => {
    const start = { sectionId: 'section-2', page: 1 }
    const pages = countPagesFrom('comprehensive', start)
    const expectedDays = Math.ceil(pages * 5 / 30)
    const tasks = generateMinutesPlanTasks({ scope: 'comprehensive', start, dailyMinutes: 30, startDate, includeExercises: false })
    expect(tasks.filter(task => task.taskType === 'reading')[0]).toMatchObject({ sectionId: 'section-2', startPage: 1 })
    expect(tasks.some(task => task.sectionId === 'intro' || task.sectionId === 'section-1')).toBe(false)
    expect(readingPages(tasks)).toHaveLength(pages)
    expect(hasCompleteReadingCoverage(tasks, 'comprehensive', { fromFirstTask: true })).toBe(true)
    expect(Math.max(...tasks.map(task => task.dayNumber))).toBe(expectedDays)
    expect(tasks.at(-1)).toMatchObject({ taskType: 'celebration', dayNumber: expectedDays })
  })

  it('returns an empty free plan for a start beyond the free scope', () => {
    expect(generateMinutesPlanTasks({ scope: 'free', start: { sectionId: 'section-2', page: 1 }, dailyMinutes: 20, startDate })).toEqual([])
  })

  it('never includes the running project in a free plan', () => {
    const tasks = generateMinutesPlanTasks({
      scope: 'free', start: { sectionId: 'intro', page: 1 }, dailyMinutes: 20, startDate, includeProject: true,
    })
    expect(tasks.length).toBeGreaterThan(0)
    expect(hasCompleteReadingCoverage(tasks, 'free')).toBe(true)
    expect(tasks.some(task => task.sectionId === 'running-project')).toBe(false)
  })

  it.each([['20min', true], ['1week', false], ['15min', false], ['', false]] as const)('recognizes minutes duration %s as %s', (duration, valid) => {
    expect(isMinutesDuration(duration)).toBe(valid)
  })

  it('labels a thirty-minute duration', () => {
    expect(minutesDurationLabel(30)).toBe('30min')
  })
})
