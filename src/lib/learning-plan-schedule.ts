import { LEARNING_SECTIONS } from '@/config/learningCatalog'
import { LEARNING_PATHS } from '@/data/learningPaths'
import { allExercises } from '@/data/exercisesData'
import {
    FREE_SCOPE_SECTIONS,
    compareReadingPositions,
    countPagesFrom,
    getScopeSections,
    planDaysFor,
    type PlanScopeId,
    type ReadingPosition,
} from '@/lib/onboarding'
import type { DailyMinutes, LearningDurationId, LearningPathId } from '@/types/learning'
import type { DailyTask, PlanTask } from '@/lib/learning-plan'

export const DURATION_DAYS: Record<LearningDurationId, number> = {
    '1week': 7, '2weeks': 14, '1month': 30, '2months': 60, flexible: 0,
}

/** `learning_plan_summary.learning_duration` for plans sized from minutes per day. */
export const minutesDurationLabel = (minutes: DailyMinutes) => `${minutes}min`
const MINUTES_DURATION = /^(10|20|30)min$/
export const isMinutesDuration = (duration: string | null | undefined) => MINUTES_DURATION.test(duration || '')

const PROJECT_PHASE_AFTER_SECTION: Record<string, number> = {
    'section-2': 0, 'section-3': 1, 'section-4': 2, 'section-5': 3,
    'section-6': 4, 'section-8': 5, 'section-10': 6,
}

export function generatePlanTasks(
    learningPath: LearningPathId,
    learningDuration: LearningDurationId,
    startDate: string,
    options: { includeProject?: boolean; includeExercises?: boolean } = {},
): PlanTask[] {
    const path = LEARNING_PATHS[learningPath]
    const totalDays = DURATION_DAYS[learningDuration]
    if (!path || !totalDays) return []
    return buildPlanTasks({
        sectionIds: path.sections,
        start: { sectionId: path.sections[0], page: 1 },
        totalDays,
        startDate,
        includeExercises: options.includeExercises,
        includeProject: learningPath === 'comprehensive' && options.includeProject,
    })
}

/**
 * Onboarding v2 plan: from `start` to the end of `scope` (what the reader can open
 * now), sized so each day is about `dailyMinutes` of reading.
 */
export function generateMinutesPlanTasks(input: {
    scope: PlanScopeId
    start: ReadingPosition
    dailyMinutes: DailyMinutes
    startDate: string
    includeExercises?: boolean
    includeProject?: boolean
}): PlanTask[] {
    const totalDays = planDaysFor(countPagesFrom(input.scope, input.start), input.dailyMinutes)
    if (!totalDays) return []
    return buildPlanTasks({
        sectionIds: getScopeSections(input.scope),
        start: input.start,
        totalDays,
        startDate: input.startDate,
        includeExercises: input.includeExercises,
        includeProject: input.scope === 'comprehensive' && input.includeProject,
    })
}

function buildPlanTasks(input: {
    sectionIds: readonly string[]
    start: ReadingPosition
    totalDays: number
    startDate: string
    includeExercises?: boolean
    includeProject?: boolean
}): PlanTask[] {
    const { totalDays, startDate } = input
    if (!Number.isInteger(totalDays) || totalDays < 1 || !/^\d{4}-\d{2}-\d{2}$/.test(startDate)) return []
    const startMs = Date.parse(`${startDate}T00:00:00.000Z`)
    if (!Number.isFinite(startMs) || new Date(startMs).toISOString().slice(0, 10) !== startDate) return []

    const allSections = input.sectionIds.map(id => LEARNING_SECTIONS.find(section => section.id === id))
    if (allSections.some(section => !section || section.pageCount <= 0)) return []
    // Sections that end before the start position are not part of this plan.
    const sections = allSections.filter(section =>
        compareReadingPositions({ sectionId: section!.id, page: section!.pageCount }, input.start) >= 0)
    if (sections.length === 0) return []
    const tasks: PlanTask[] = []
    let remainingPages = sections.reduce((total, section) => total + section!.pageCount, 0)
    let sectionIndex = 0
    let nextPage = 1
    if (sections[0]!.id === input.start.sectionId) {
        nextPage = Math.min(Math.max(1, input.start.page), sections[0]!.pageCount)
        remainingPages -= nextPage - 1
    }

    for (let day = 1; day <= totalDays && remainingPages > 0; day++) {
        const taskDate = new Date(startMs + (day - 1) * 86_400_000).toISOString().slice(0, 10)
        let dailyBudget = Math.ceil(remainingPages / (totalDays - day + 1))
        while (dailyBudget > 0 && sectionIndex < sections.length) {
            const section = sections[sectionIndex]!
            const pagesToday = Math.min(dailyBudget, section.pageCount - nextPage + 1)
            const endPage = nextPage + pagesToday - 1
            tasks.push({
                taskDate, taskType: 'reading', sectionId: section.id,
                startPage: nextPage, endPage, dayNumber: day,
                titleAr: `📖 اقرأ: ${section.label} — ص ${nextPage}${nextPage === endPage ? '' : `–${endPage}`}`,
                descriptionAr: `اقرأ ${pagesToday} ${pagesToday === 1 ? 'صفحة' : 'صفحات'} من ${section.label}`,
                estimatedMinutes: pagesToday * 5,
            })
            remainingPages -= pagesToday
            dailyBudget -= pagesToday
            nextPage = endPage + 1

            if (endPage === section.pageCount) {
                for (const exercise of input.includeExercises === false ? [] : allExercises[section.id] || []) {
                    tasks.push({
                        taskDate, taskType: 'exercise', sectionId: section.id,
                        exerciseId: exercise.exerciseId, dayNumber: day,
                        titleAr: `✏️ ${section.label}: ${exercise.type === 'quiz' ? exercise.question : exercise.title}`,
                        descriptionAr: 'أكمل التمرين وراجع الإجابة أو الناتج وفق تعليماته.',
                        estimatedMinutes: exercise.type === 'prompt_builder' ? 15 : 5,
                    })
                }
                const phase = PROJECT_PHASE_AFTER_SECTION[section.id]
                if (input.includeProject && phase !== undefined) {
                    tasks.push({
                        taskDate, taskType: 'exercise', sectionId: 'running-project',
                        exerciseId: `running-project-phase-${phase}`, dayNumber: day,
                        titleAr: `🛠️ المشروع الممتد — المرحلة ${phase + 1}`,
                        descriptionAr: 'تابع مشروعك المختار، وجرّب الطلب، واحفظ الناتج وراجع متطلبات المرحلة.',
                        estimatedMinutes: 30,
                    })
                }
                sectionIndex++
                nextPage = 1
            }
        }
        if (day % 5 === 0 && day < totalDays) {
            tasks.push({
                taskDate, taskType: 'review', dayNumber: day,
                titleAr: '🔄 مراجعة وتطبيق',
                descriptionAr: 'راجع أعمالك السابقة وجرّب مهمة جديدة مما تعلمته.',
                estimatedMinutes: 10,
            })
        }
    }

    // Scheduling is not completion. Eligibility is checked from task statuses.
    tasks.push({
        taskDate: new Date(startMs + (totalDays - 1) * 86_400_000).toISOString().slice(0, 10),
        taskType: 'celebration', dayNumber: totalDays, estimatedMinutes: 0,
        titleAr: '🏁 مراجعة نهاية الجدول',
        descriptionAr: 'راجع المهام المتبقية وأعمالك. إتمام الجدول لا يغني عن متطلبات شهادة الإتمام.',
    })
    return tasks
}

export function calculatePlanProgress(tasks: Pick<DailyTask, 'taskDate' | 'taskType' | 'status'>[]) {
    const required = tasks.filter(task => task.taskType !== 'celebration')
    const completed = required.filter(task => task.status === 'completed').length
    const days = new Map<string, typeof required>()
    for (const task of required) days.set(task.taskDate, [...(days.get(task.taskDate) || []), task])
    return {
        progressPercent: required.length === 0 ? 0 : completed === required.length
            ? 100 : Math.min(99, Math.round(completed / required.length * 100)),
        completedDays: [...days.values()].filter(day => day.every(task => task.status === 'completed')).length,
        skippedDays: [...days.values()].filter(day => day.every(task => task.status === 'skipped')).length,
        isComplete: required.length > 0 && completed === required.length,
    }
}

/** Plan scopes: the three legacy paths plus the v2 free-part scope. */
function getPlanSections(learningPath: string): readonly string[] | null {
    if (learningPath === 'free') return FREE_SCOPE_SECTIONS
    return LEARNING_PATHS[learningPath as LearningPathId]?.sections ?? null
}

/**
 * Detect missing real pages while accepting legacy ranges within reserved slots.
 * `fromFirstTask` is for v2 minutes plans, which may start mid-intro (daily users)
 * or at the page a guest returned to: they must be contiguous from their first
 * reading task to the end of the scope. Legacy plans must start at page 1.
 */
export function hasCompleteReadingCoverage(
    tasks: Pick<PlanTask, 'taskType' | 'sectionId' | 'startPage' | 'endPage'>[],
    learningPath: string,
    options: { fromFirstTask?: boolean } = {},
): boolean {
    const scopeSections = getPlanSections(learningPath)
    if (!scopeSections) return false
    const covered = new Set<string>()
    let first: ReadingPosition | null = null
    for (const task of tasks.filter(task => task.taskType === 'reading')) {
        const section = LEARNING_SECTIONS.find(item => item.id === task.sectionId)
        if (!section || !scopeSections.includes(section.id) || !Number.isInteger(task.startPage) || !Number.isInteger(task.endPage)
            || task.startPage! < 1 || task.endPage! > section.slotSize || task.startPage! > task.endPage!) return false
        const startPage = Math.min(task.startPage!, section.pageCount)
        const endPage = Math.min(task.endPage!, section.pageCount)
        const taskStart = { sectionId: section.id, page: startPage }
        if (!first || compareReadingPositions(taskStart, first) < 0) first = taskStart
        for (let page = startPage; page <= endPage; page++) covered.add(`${section.id}:${page}`)
    }
    if (!first) return false
    const from = options.fromFirstTask ? first : { sectionId: scopeSections[0], page: 1 }
    return covered.size === countSectionPagesFrom(scopeSections, from)
}

function countSectionPagesFrom(sectionIds: readonly string[], from: ReadingPosition): number {
    let pages = 0
    for (const section of LEARNING_SECTIONS) {
        if (!sectionIds.includes(section.id)) continue
        for (let page = 1; page <= section.pageCount; page++) {
            if (compareReadingPositions({ sectionId: section.id, page }, from) >= 0) pages++
        }
    }
    return pages
}
