import { describe, expect, it } from 'vitest'
import { LEARNING_SECTIONS } from '@/config/learningCatalog'
import { allExercises } from '@/data/exercisesData'
import { LEARNING_PATHS } from '@/data/learningPaths'
import { calculatePlanProgress, generatePlanTasks, hasCompleteReadingCoverage } from '@/lib/learning-plan-schedule'
import type { DailyTask, PlanTask } from '@/lib/learning-plan'
import type { LearningDurationId, LearningPathId } from '@/types/learning'

const paths: LearningPathId[] = ['quick', 'intermediate', 'comprehensive']
const durations: [LearningDurationId, number][] = [['1week', 7], ['2weeks', 14], ['1month', 30], ['2months', 60]]
const cases = paths.flatMap(path => durations.map(([duration, days]) => ({ path, duration, days })))
const startDate = '2026-10-02'
const dateOnDay = (start: string, day: number) => new Date(Date.parse(`${start}T00:00:00Z`) + (day - 1) * 86400000).toISOString().slice(0, 10)
type ProgressTask = Pick<DailyTask, 'taskDate' | 'taskType' | 'status'>
const progressTask = (taskDate: string, taskType: ProgressTask['taskType'], status: ProgressTask['status']): ProgressTask => ({ taskDate, taskType, status })

describe('learning plan scheduling', () => {
    it.each(cases)('$path over $days days covers every included page and exercise exactly once', ({ path, duration, days }) => {
        const tasks = generatePlanTasks(path, duration, startDate)
        const readingTasks = tasks.filter(task => task.taskType === 'reading')
        const coveredPages = readingTasks.flatMap(task => {
            const section = LEARNING_SECTIONS.find(item => item.id === task.sectionId)!
            expect(section).toBeDefined()
            expect(task.startPage).toBeGreaterThanOrEqual(1)
            expect(task.endPage).toBeLessThanOrEqual(section.pageCount)
            expect(task.endPage).toBeGreaterThanOrEqual(task.startPage!)
            return Array.from({ length: task.endPage! - task.startPage! + 1 }, (_, i) => `${task.sectionId}:${task.startPage! + i}`)
        })
        const expectedPages = LEARNING_PATHS[path].sections.flatMap(id => {
            const section = LEARNING_SECTIONS.find(item => item.id === id)!
            return Array.from({ length: section.pageCount }, (_, i) => `${id}:${i + 1}`)
        })
        expect(coveredPages).toEqual(expectedPages)
        expect(new Set(coveredPages).size).toBe(coveredPages.length)
        expect(coveredPages).toHaveLength(LEARNING_PATHS[path].totalPages)

        const exerciseTasks = tasks.filter(task => task.taskType === 'exercise')
        const expectedExercises = LEARNING_PATHS[path].sections.flatMap(id => allExercises[id] || [])
        expect(exerciseTasks.map(task => task.exerciseId)).toEqual(expectedExercises.map(exercise => exercise.exerciseId))
        expect(exerciseTasks).toHaveLength({ quick: 10, intermediate: 28, comprehensive: 45 }[path])
        expect(exerciseTasks.some(task => task.sectionId === 'intro')).toBe(false)
        for (const task of exerciseTasks) {
            const finalReading = readingTasks.find(reading => reading.sectionId === task.sectionId && reading.endPage === LEARNING_SECTIONS.find(item => item.id === task.sectionId)!.pageCount)!
            expect(tasks.indexOf(task)).toBeGreaterThan(tasks.indexOf(finalReading))
            expect(task.taskDate >= finalReading.taskDate).toBe(true)
        }

        for (const task of tasks) {
            expect(task.dayNumber).toBeGreaterThanOrEqual(1)
            expect(task.dayNumber).toBeLessThanOrEqual(days)
            expect(task.taskDate).toBe(dateOnDay(startDate, task.dayNumber))
        }
        const finalTasks = tasks.filter(task => task.taskType === 'celebration')
        expect(finalTasks).toHaveLength(1)
        expect(finalTasks[0].taskDate).toBe(dateOnDay(startDate, days))
        expect(finalTasks[0].dayNumber).toBe(days)
    })

    it.each(cases)('$path over $days days adds project phases only when the comprehensive option is enabled', ({ path, duration }) => {
        const withoutProject = generatePlanTasks(path, duration, startDate, { includeProject: false })
        expect(withoutProject.some(task => task.sectionId === 'running-project')).toBe(false)
        const withProject = generatePlanTasks(path, duration, startDate, { includeProject: true })
        const phases = withProject.filter(task => task.sectionId === 'running-project')
        expect(phases.map(task => task.exerciseId)).toEqual(path === 'comprehensive'
            ? Array.from({ length: 7 }, (_, i) => `running-project-phase-${i}`)
            : [])
        const ordinaryExercises = withProject.filter(task => task.taskType === 'exercise' && task.sectionId !== 'running-project')
        expect(ordinaryExercises).toHaveLength(LEARNING_PATHS[path].exerciseCount)
    })

    it.each(cases)('$path over $days days can omit ordinary exercises while keeping project access independent', ({ path, duration }) => {
        const defaultPlan = generatePlanTasks(path, duration, startDate)
        expect(generatePlanTasks(path, duration, startDate, { includeExercises: true })).toEqual(defaultPlan)

        const readingPlan = generatePlanTasks(path, duration, startDate, { includeExercises: false })
        expect(readingPlan).toEqual(defaultPlan.filter(task => task.taskType !== 'exercise'))
        expect(readingPlan.some(task => task.taskType === 'exercise')).toBe(false)

        const projectPlan = generatePlanTasks(path, duration, startDate, { includeExercises: false, includeProject: true })
        const exerciseTasks = projectPlan.filter(task => task.taskType === 'exercise')
        expect(exerciseTasks.map(task => task.exerciseId)).toEqual(path === 'comprehensive'
            ? Array.from({ length: 7 }, (_, i) => `running-project-phase-${i}`)
            : [])
        expect(exerciseTasks.every(task => task.sectionId === 'running-project')).toBe(true)
        expect(projectPlan.filter(task => task.taskType !== 'exercise')).toEqual(readingPlan)
    })

    it('rolls dates across the end of the year without duplicating a calendar day', () => {
        const tasks = generatePlanTasks('comprehensive', '1week', '2026-12-29')
        expect([...new Set(tasks.map(task => task.taskDate))]).toEqual([
            '2026-12-29', '2026-12-30', '2026-12-31', '2027-01-01', '2027-01-02', '2027-01-03', '2027-01-04',
        ])
        for (const task of tasks) expect(task.taskDate).toBe(dateOnDay('2026-12-29', task.dayNumber))
    })

    it('accepts leap days and continues correctly into the next month', () => {
        const tasks = generatePlanTasks('comprehensive', '1week', '2028-02-27')
        expect([...new Set(tasks.map(task => task.taskDate))]).toEqual([
            '2028-02-27', '2028-02-28', '2028-02-29', '2028-03-01', '2028-03-02', '2028-03-03', '2028-03-04',
        ])
        expect(generatePlanTasks('quick', '1week', '2028-02-29').length).toBeGreaterThan(0)
    })

    it.each(['', '2026-02-29', '2026-02-30', '2026-04-31', '2026-13-01', '2026-00-01', '2026-10-00', '2026-1-02', '02/10/2026', '2026-10-02T00:00:00Z', 'not-a-date'])('rejects invalid or ambiguous start date %j', date => {
        expect(generatePlanTasks('comprehensive', '1week', date)).toEqual([])
    })

    it.each(paths)('%s flexible mode does not fabricate dated tasks', path => {
        expect(generatePlanTasks(path, 'flexible', startDate, { includeProject: true })).toEqual([])
    })

    it('rejects unknown paths and durations at the runtime boundary', () => {
        expect(generatePlanTasks('unknown' as LearningPathId, '1week', startDate)).toEqual([])
        expect(generatePlanTasks('quick', 'unknown' as LearningDurationId, startDate)).toEqual([])
    })
})

describe('learning plan progress', () => {
    it('does not complete a day when another task on that day is still pending', () => {
        const tasks = [progressTask(startDate, 'reading', 'completed'), progressTask(startDate, 'exercise', 'pending')]
        expect(calculatePlanProgress(tasks)).toEqual({ progressPercent: 50, completedDays: 0, skippedDays: 0, isComplete: false })
        tasks[1].status = 'completed'
        expect(calculatePlanProgress(tasks)).toEqual({ progressPercent: 100, completedDays: 1, skippedDays: 0, isComplete: true })
    })

    it('counts completed and skipped calendar days once, while mixed days stay incomplete', () => {
        const tasks = [
            progressTask('2026-10-02', 'reading', 'completed'), progressTask('2026-10-02', 'exercise', 'completed'),
            progressTask('2026-10-03', 'reading', 'skipped'), progressTask('2026-10-03', 'review', 'skipped'),
            progressTask('2026-10-04', 'reading', 'completed'), progressTask('2026-10-04', 'exercise', 'skipped'),
        ]
        expect(calculatePlanProgress(tasks)).toEqual({ progressPercent: 50, completedDays: 1, skippedDays: 1, isComplete: false })
    })

    it.each(['pending', 'skipped', 'postponed'] as const)('caps rounded progress at 99%% if one required task is %s', status => {
        const tasks = Array.from({ length: 500 }, () => progressTask(startDate, 'reading', 'completed'))
        tasks[499].status = status
        expect(calculatePlanProgress(tasks)).toEqual({ progressPercent: 99, completedDays: 0, skippedDays: 0, isComplete: false })
    })

    it('does not treat a missing completion status as completed', () => {
        const tasks: ProgressTask[] = Array.from({ length: 499 }, () => progressTask(startDate, 'reading', 'completed'))
        tasks.push({ taskDate: startDate, taskType: 'exercise' } as ProgressTask)
        expect(calculatePlanProgress(tasks)).toEqual({ progressPercent: 99, completedDays: 0, skippedDays: 0, isComplete: false })
    })

    it('requires review tasks but ignores the end-of-schedule celebration', () => {
        expect(calculatePlanProgress([
            progressTask(startDate, 'reading', 'completed'), progressTask(startDate, 'review', 'pending'),
            progressTask('2026-10-03', 'celebration', 'completed'),
        ])).toEqual({ progressPercent: 50, completedDays: 0, skippedDays: 0, isComplete: false })
        expect(calculatePlanProgress([
            progressTask(startDate, 'reading', 'completed'), progressTask('2026-10-03', 'celebration', 'pending'),
        ])).toEqual({ progressPercent: 100, completedDays: 1, skippedDays: 0, isComplete: true })
    })

    it('does not declare empty or celebration-only plans complete', () => {
        const empty = { progressPercent: 0, completedDays: 0, skippedDays: 0, isComplete: false }
        expect(calculatePlanProgress([])).toEqual(empty)
        expect(calculatePlanProgress([progressTask(startDate, 'celebration', 'completed')])).toEqual(empty)
    })
})

describe('legacy learning plan reading coverage', () => {
    it.each(cases)('$path over $days days has complete coverage with or without ordinary exercises', ({ path, duration }) => {
        expect(hasCompleteReadingCoverage(generatePlanTasks(path, duration, startDate), path)).toBe(true)
        expect(hasCompleteReadingCoverage(generatePlanTasks(path, duration, startDate, { includeExercises: false, includeProject: true }), path)).toBe(true)
    })

    it.each(paths)('%s rejects a plan that is missing one page', path => {
        const tasks = generatePlanTasks(path, '1week', startDate).map(task => ({ ...task }))
        const reading = tasks.find(task => task.taskType === 'reading' && task.endPage! > task.startPage!)!
        expect(reading).toBeDefined()
        reading.endPage = reading.endPage! - 1
        expect(hasCompleteReadingCoverage(tasks, path)).toBe(false)
    })

    it.each(paths)('%s rejects a plan that is missing a whole section', path => {
        const missingSection = LEARNING_PATHS[path].sections.at(-1)!
        const tasks = generatePlanTasks(path, '1week', startDate).filter(task => task.sectionId !== missingSection)
        expect(hasCompleteReadingCoverage(tasks, path)).toBe(false)
    })

    it('rejects the old comprehensive plan that only covered the 182 core pages', () => {
        const tasks = generatePlanTasks('comprehensive', '1week', startDate)
            .filter(task => !['library', 'appendix', 'glossary'].includes(task.sectionId || ''))
        expect(hasCompleteReadingCoverage(tasks, 'comprehensive')).toBe(false)
    })

    it.each([
        { startPage: 0, endPage: 6 },
        { startPage: -1, endPage: 6 },
        { startPage: 1, endPage: 7 },
        { startPage: 2, endPage: 1 },
        { startPage: 1.5, endPage: 6 },
        { startPage: 1, endPage: 5.5 },
        { startPage: Number.NaN, endPage: 6 },
        { startPage: undefined, endPage: 6 },
        { startPage: 1, endPage: undefined },
        { sectionId: undefined, startPage: 1, endPage: 6 },
        { sectionId: 'unknown', startPage: 1, endPage: 6 },
        { sectionId: 'section-10', startPage: 1, endPage: 6 },
    ] satisfies Partial<PlanTask>[])('rejects an invalid reading task %j', invalidRange => {
        const tasks = generatePlanTasks('quick', '1week', startDate)
        const index = tasks.findIndex(task => task.taskType === 'reading')
        tasks[index] = { ...tasks[index], ...invalidRange }
        expect(hasCompleteReadingCoverage(tasks, 'quick')).toBe(false)
    })

    it('rejects an empty plan and an unknown path', () => {
        expect(hasCompleteReadingCoverage([], 'quick')).toBe(false)
        expect(hasCompleteReadingCoverage(generatePlanTasks('quick', '1week', startDate), 'unknown')).toBe(false)
    })
})
