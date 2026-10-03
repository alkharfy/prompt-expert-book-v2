import { LEARNING_SECTIONS } from '@/config/learningCatalog'
import { LEARNING_PATHS } from '@/data/learningPaths'
import { allExercises } from '@/data/exercisesData'
import type { LearningDurationId, LearningPathId } from '@/types/learning'
import type { DailyTask, PlanTask } from '@/lib/learning-plan'

export const DURATION_DAYS: Record<LearningDurationId, number> = {
    '1week': 7, '2weeks': 14, '1month': 30, '2months': 60, flexible: 0,
}

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
    if (!path || !totalDays || !/^\d{4}-\d{2}-\d{2}$/.test(startDate)) return []
    const startMs = Date.parse(`${startDate}T00:00:00.000Z`)
    if (!Number.isFinite(startMs) || new Date(startMs).toISOString().slice(0, 10) !== startDate) return []

    const sections = path.sections.map(id => LEARNING_SECTIONS.find(section => section.id === id))
    if (sections.some(section => !section || section.pageCount <= 0)) return []
    const tasks: PlanTask[] = []
    let remainingPages = path.totalPages
    let sectionIndex = 0
    let nextPage = 1

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
                for (const exercise of options.includeExercises === false ? [] : allExercises[section.id] || []) {
                    tasks.push({
                        taskDate, taskType: 'exercise', sectionId: section.id,
                        exerciseId: exercise.exerciseId, dayNumber: day,
                        titleAr: `✏️ ${section.label}: ${exercise.type === 'quiz' ? exercise.question : exercise.title}`,
                        descriptionAr: 'أكمل التمرين وراجع الإجابة أو الناتج وفق تعليماته.',
                        estimatedMinutes: exercise.type === 'prompt_builder' ? 15 : 5,
                    })
                }
                const phase = PROJECT_PHASE_AFTER_SECTION[section.id]
                if (learningPath === 'comprehensive' && options.includeProject && phase !== undefined) {
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

/** Detect schedules created by the earlier generator that skipped chapter boundaries. */
export function hasCompleteReadingCoverage(
    tasks: Pick<PlanTask, 'taskType' | 'sectionId' | 'startPage' | 'endPage'>[],
    learningPath: string,
): boolean {
    const path = LEARNING_PATHS[learningPath as LearningPathId]
    if (!path) return false
    const covered = new Set<string>()
    for (const task of tasks.filter(task => task.taskType === 'reading')) {
        const section = LEARNING_SECTIONS.find(item => item.id === task.sectionId)
        if (!section || !path.sections.includes(section.id) || !Number.isInteger(task.startPage) || !Number.isInteger(task.endPage)
            || task.startPage! < 1 || task.endPage! > section.pageCount || task.startPage! > task.endPage!) return false
        for (let page = task.startPage!; page <= task.endPage!; page++) covered.add(`${section.id}:${page}`)
    }
    return covered.size === path.totalPages
}
