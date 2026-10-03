// =====================================================
// Learning Plan Engine — محرك توليد خطة التعلم الشخصية
// المرحلة 5: الجدول الزمني الذكي
// =====================================================

import 'server-only'
import { getSupabaseAdmin } from '@/lib/supabase-admin'
import type { LearningPathId, LearningDurationId } from '@/types/learning'
import { dbLogger } from './logger'
import { calculatePlanProgress, DURATION_DAYS, hasCompleteReadingCoverage } from '@/lib/learning-plan-schedule'
export { generatePlanTasks } from '@/lib/learning-plan-schedule'

// ===== Types =====

export interface PlanTask {
  taskDate: string          // YYYY-MM-DD
  taskType: 'reading' | 'exercise' | 'review' | 'celebration'
  sectionId?: string
  startPage?: number
  endPage?: number
  exerciseId?: string
  titleAr: string
  descriptionAr?: string
  dayNumber: number
  estimatedMinutes: number
}

export interface PlanSummary {
  userId: string
  learningPath: string
  learningDuration: string
  totalDays: number
  totalReadingTasks: number
  totalExerciseTasks: number
  startDate: string
  expectedEndDate: string
  completedDays: number
  skippedDays: number
  isActive: boolean
}

export interface TodayPlan {
  dayNumber: number
  totalDays: number
  progressPercent: number
  tasks: DailyTask[]
  isFlexible: boolean
  summary: PlanSummary | null
  needsRegeneration?: boolean
}

export interface DailyTask {
  id: string
  taskDate: string
  taskType: 'reading' | 'exercise' | 'review' | 'celebration'
  sectionId?: string
  startPage?: number
  endPage?: number
  exerciseId?: string
  titleAr: string
  descriptionAr?: string
  dayNumber: number
  estimatedMinutes: number
  status: 'pending' | 'completed' | 'skipped' | 'postponed'
  completedAt?: string | null
}

// ===== Duration Config =====

const TASK_TYPE_ORDER: Record<string, number> = {
  reading: 0,
  exercise: 1,
  review: 2,
  celebration: 3,
}

// ===== DB Operations =====

export async function savePlan(
  userId: string,
  learningPath: LearningPathId,
  learningDuration: LearningDurationId,
  startDate: string,
  tasks: PlanTask[]
): Promise<{ ok: boolean; error?: string }> {
  const supabase = getSupabaseAdmin()

  try {
    const totalDays = DURATION_DAYS[learningDuration]
    const endDate = new Date(`${startDate}T00:00:00.000Z`)
    endDate.setUTCDate(endDate.getUTCDate() + totalDays - 1)

    // Delete existing plan
    await supabase.from('learning_plan_tasks').delete().eq('user_id', userId)
    await supabase.from('learning_plan_summary').delete().eq('user_id', userId)

    // Save summary
    const { error: summaryError } = await supabase.from('learning_plan_summary').insert({
      user_id: userId,
      learning_path: learningPath,
      learning_duration: learningDuration,
      total_days: totalDays,
      total_reading_tasks: tasks.filter(t => t.taskType === 'reading').length,
      total_exercise_tasks: tasks.filter(t => t.taskType === 'exercise').length,
      start_date: startDate,
      expected_end_date: endDate.toISOString().split('T')[0],
      is_active: true,
    })

    if (summaryError) {
      dbLogger.error('Error saving plan summary', summaryError)
      return { ok: false, error: summaryError.message }
    }

    // Save tasks in batches of 50
    for (let i = 0; i < tasks.length; i += 50) {
      const batch = tasks.slice(i, i + 50).map(t => ({
        user_id: userId,
        task_date: t.taskDate,
        task_type: t.taskType,
        section_id: t.sectionId || null,
        start_page: t.startPage || null,
        end_page: t.endPage || null,
        exercise_id: t.exerciseId || null,
        title_ar: t.titleAr,
        description_ar: t.descriptionAr || null,
        day_number: t.dayNumber,
        estimated_minutes: t.estimatedMinutes,
        status: 'pending',
      }))

      const { error: insertError } = await supabase.from('learning_plan_tasks').insert(batch)
      if (insertError) {
        dbLogger.error('Error saving plan tasks batch', insertError)
        return { ok: false, error: insertError.message }
      }
    }

    dbLogger.info(`Saved learning plan for user ${userId}: ${tasks.length} tasks over ${totalDays} days`)
    return { ok: true }
  } catch (error) {
    dbLogger.error('Error in savePlan', error)
    return { ok: false, error: 'Internal error' }
  }
}

export async function getTodayPlan(userId: string): Promise<TodayPlan> {
  const supabase = getSupabaseAdmin()
  const today = new Date().toISOString().split('T')[0]

  const defaultResult: TodayPlan = {
    dayNumber: 0,
    totalDays: 0,
    progressPercent: 0,
    tasks: [],
    isFlexible: true,
    summary: null,
  }

  try {
    // Get summary
    const { data: summaryData } = await supabase
      .from('learning_plan_summary')
      .select('*')
      .eq('user_id', userId)
      .eq('is_active', true)
      .maybeSingle()

    if (!summaryData) return defaultResult

    const summary: PlanSummary = {
      userId: summaryData.user_id,
      learningPath: summaryData.learning_path,
      learningDuration: summaryData.learning_duration,
      totalDays: summaryData.total_days,
      totalReadingTasks: summaryData.total_reading_tasks,
      totalExerciseTasks: summaryData.total_exercise_tasks,
      startDate: summaryData.start_date,
      expectedEndDate: summaryData.expected_end_date,
      completedDays: summaryData.completed_days,
      skippedDays: summaryData.skipped_days,
      isActive: summaryData.is_active,
    }

    if (summary.learningDuration === 'flexible') {
      return { ...defaultResult, isFlexible: true, summary }
    }

    const allTasks = await getFullPlan(userId)
    const tasks = allTasks.filter(task => task.taskDate === today)

    // Calculate day number from start date
    const startMs = new Date(summary.startDate).getTime()
    const todayMs = new Date(today).getTime()
    const dayNumber = Math.floor((todayMs - startMs) / (1000 * 60 * 60 * 24)) + 1

    const { progressPercent, completedDays, skippedDays } = calculatePlanProgress(allTasks)
    const needsRegeneration = !hasCompleteReadingCoverage(allTasks, summary.learningPath)

    return {
      dayNumber: Math.max(1, Math.min(dayNumber, summary.totalDays)),
      totalDays: summary.totalDays,
      progressPercent: needsRegeneration ? Math.min(99, progressPercent) : progressPercent,
      tasks,
      isFlexible: false,
      summary: { ...summary, completedDays, skippedDays },
      needsRegeneration,
    }
  } catch (error) {
    dbLogger.error('Error in getTodayPlan', error)
    return defaultResult
  }
}

export async function getFullPlan(userId: string): Promise<DailyTask[]> {
  const supabase = getSupabaseAdmin()

  try {
    const { data } = await supabase
      .from('learning_plan_tasks')
      .select('*')
      .eq('user_id', userId)
      .order('task_date', { ascending: true })
      .order('created_at', { ascending: true })

    return (data || []).map((t: Record<string, unknown>) => ({
      id: t.id as string,
      taskDate: t.task_date as string,
      taskType: t.task_type as DailyTask['taskType'],
      sectionId: t.section_id as string | undefined,
      startPage: t.start_page as number | undefined,
      endPage: t.end_page as number | undefined,
      exerciseId: t.exercise_id as string | undefined,
      titleAr: t.title_ar as string,
      descriptionAr: t.description_ar as string | undefined,
      dayNumber: t.day_number as number,
      estimatedMinutes: t.estimated_minutes as number,
      status: t.status as DailyTask['status'],
      completedAt: t.completed_at as string | null,
    })).sort((a, b) => {
      if (a.taskDate !== b.taskDate) return a.taskDate.localeCompare(b.taskDate)
      return (TASK_TYPE_ORDER[a.taskType] ?? 9) - (TASK_TYPE_ORDER[b.taskType] ?? 9)
    })
  } catch (error) {
    dbLogger.error('Error in getFullPlan', error)
    return []
  }
}

export async function updateTaskStatus(
  userId: string,
  taskId: string,
  status: 'completed' | 'skipped' | 'postponed'
): Promise<{ ok: boolean; error?: string }> {
  const supabase = getSupabaseAdmin()

  try {
    const tasks = await getFullPlan(userId)
    const task = tasks.find(item => item.id === taskId)
    if (!task) return { ok: false, error: 'المهمة غير موجودة في خطتك' }
    if (task.taskType === 'celebration' && status === 'completed' && !calculatePlanProgress(tasks).isComplete) {
      return { ok: false, error: 'أكمل مهام القراءة والتطبيق والمراجعة قبل إتمام الخطة' }
    }
    if (task.taskType === 'celebration' && status === 'completed') {
      const { data: summary } = await supabase.from('learning_plan_summary').select('learning_path').eq('user_id', userId).maybeSingle()
      if (!summary || !hasCompleteReadingCoverage(tasks, summary.learning_path)) {
        return { ok: false, error: 'الخطة القديمة لا تشمل كل الصفحات. أعد توليدها من إعدادات المسار قبل تسجيل الإتمام.' }
      }
    }
    const updateData: Record<string, unknown> = {
      status,
      completed_at: status === 'completed' ? new Date().toISOString() : null,
      updated_at: new Date().toISOString(),
    }

    const { error } = await supabase
      .from('learning_plan_tasks')
      .update(updateData)
      .eq('id', taskId)
      .eq('user_id', userId)

    if (error) {
      dbLogger.error('Error updating task status', error)
      return { ok: false }
    }

    return { ok: true }
  } catch (error) {
    dbLogger.error('Error in updateTaskStatus', error)
    return { ok: false }
  }
}

export async function getPlanTasksForMissions(userId: string): Promise<PlanTask[]> {
  const supabase = getSupabaseAdmin()
  const today = new Date().toISOString().split('T')[0]

  try {
    const { data } = await supabase
      .from('learning_plan_tasks')
      .select('*')
      .eq('user_id', userId)
      .eq('task_date', today)
      .eq('status', 'pending')
      .in('task_type', ['reading', 'exercise'])

    return (data || []).map((t: Record<string, unknown>) => ({
      taskDate: t.task_date as string,
      taskType: t.task_type as PlanTask['taskType'],
      sectionId: t.section_id as string | undefined,
      startPage: t.start_page as number | undefined,
      endPage: t.end_page as number | undefined,
      exerciseId: t.exercise_id as string | undefined,
      titleAr: t.title_ar as string,
      descriptionAr: t.description_ar as string | undefined,
      dayNumber: t.day_number as number,
      estimatedMinutes: t.estimated_minutes as number,
    }))
  } catch (error) {
    dbLogger.error('Error in getPlanTasksForMissions', error)
    return []
  }
}
