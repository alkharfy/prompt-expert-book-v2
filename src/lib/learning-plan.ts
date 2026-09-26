// =====================================================
// Learning Plan Engine — محرك توليد خطة التعلم الشخصية
// المرحلة 5: الجدول الزمني الذكي
// =====================================================

import 'server-only'
import { getSupabaseAdmin } from '@/lib/supabase-admin'
import { SECTION_REGISTRY } from '@/config/sections'
import { LEARNING_PATHS } from '@/data/learningPaths'
import type { LearningPathId, LearningDurationId } from '@/types/learning'
import { dbLogger } from './logger'

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

const DURATION_DAYS: Record<LearningDurationId, number> = {
  '1week': 7,
  '2weeks': 14,
  '1month': 30,
  '2months': 60,
  'flexible': 0, // No fixed schedule
}

const TASK_TYPE_ORDER: Record<string, number> = {
  reading: 0,
  exercise: 1,
  review: 2,
  celebration: 3,
}

// ===== Section Page Count Helper =====

function getSectionPages(sectionId: string): number {
  const idx = SECTION_REGISTRY.findIndex(s => s.id === sectionId)
  if (idx < 0) return 0
  const nextOffset = idx + 1 < SECTION_REGISTRY.length
    ? SECTION_REGISTRY[idx + 1].progressOffset
    : SECTION_REGISTRY[idx].progressOffset + SECTION_REGISTRY[idx].pageCount
  return nextOffset - SECTION_REGISTRY[idx].progressOffset
}

function getSectionLabel(sectionId: string): string {
  const sec = SECTION_REGISTRY.find(s => s.id === sectionId)
  return sec?.chapterLabel || sectionId
}

// ===== Core: Generate Plan =====

export function generatePlanTasks(
  learningPath: LearningPathId,
  learningDuration: LearningDurationId,
  startDate: string
): PlanTask[] {
  if (learningDuration === 'flexible') return []

  const path = LEARNING_PATHS[learningPath]
  if (!path) return []

  const totalDays = DURATION_DAYS[learningDuration]
  if (totalDays <= 0) return []

  const sections = path.sections
  const tasks: PlanTask[] = []

  // Calculate total pages and exercises
  let totalPages = 0
  const sectionPages: { id: string; pages: number }[] = []
  for (const secId of sections) {
    const pages = getSectionPages(secId)
    sectionPages.push({ id: secId, pages })
    totalPages += pages
  }

  // Pages per day (at least 1)
  const pagesPerDay = Math.max(1, Math.ceil(totalPages / totalDays))

  // Distribute reading tasks across days
  let currentDay = 1
  let currentSectionIdx = 0
  let currentPageInSection = 1
  const start = new Date(startDate)

  while (currentSectionIdx < sectionPages.length && currentDay <= totalDays) {
    const sec = sectionPages[currentSectionIdx]
    const sectionTotalPages = sec.pages
    const sectionLabel = getSectionLabel(sec.id)

    // How many pages to assign today
    const remainingInSection = sectionTotalPages - currentPageInSection + 1
    const pagesToday = Math.min(pagesPerDay, remainingInSection)
    const startPage = currentPageInSection
    const endPage = currentPageInSection + pagesToday - 1

    const taskDate = new Date(start)
    taskDate.setDate(taskDate.getDate() + currentDay - 1)
    const dateStr = taskDate.toISOString().split('T')[0]

    // Reading task
    tasks.push({
      taskDate: dateStr,
      taskType: 'reading',
      sectionId: sec.id,
      startPage,
      endPage,
      titleAr: `📖 اقرأ: ${sectionLabel} — ص ${startPage}${startPage !== endPage ? `-${endPage}` : ''}`,
      descriptionAr: `اقرأ ${pagesToday} ${pagesToday === 1 ? 'صفحة' : 'صفحات'} من ${sectionLabel}`,
      dayNumber: currentDay,
      estimatedMinutes: Math.max(5, pagesToday * 5),
    })

    // Add exercise task at end of section
    if (endPage >= sectionTotalPages) {
      tasks.push({
        taskDate: dateStr,
        taskType: 'exercise',
        sectionId: sec.id,
        exerciseId: `exercise-${sec.id}`,
        titleAr: `✏️ حل تمرين: ${sectionLabel}`,
        descriptionAr: `طبّق اللي اتعلمته في ${sectionLabel}`,
        dayNumber: currentDay,
        estimatedMinutes: 10,
      })

      currentSectionIdx++
      currentPageInSection = 1
    } else {
      currentPageInSection = endPage + 1
    }

    // Review day every 5 days
    if (currentDay % 5 === 0 && currentDay < totalDays) {
      const reviewDate = new Date(start)
      reviewDate.setDate(reviewDate.getDate() + currentDay - 1)
      tasks.push({
        taskDate: reviewDate.toISOString().split('T')[0],
        taskType: 'review',
        titleAr: '🔄 مراجعة سريعة',
        descriptionAr: 'راجع أهم النقاط اللي اتعلمتها الأيام اللي فاتت',
        dayNumber: currentDay,
        estimatedMinutes: 10,
      })
    }

    currentDay++
  }

  // Celebration on the last day
  const lastDate = new Date(start)
  lastDate.setDate(lastDate.getDate() + totalDays - 1)
  tasks.push({
    taskDate: lastDate.toISOString().split('T')[0],
    taskType: 'celebration',
    titleAr: '🎉 مبروك! أنهيت الخطة',
    descriptionAr: 'أنت بطل! خلّصت خطة التعلم بتاعتك. خد شهادتك دلوقتي!',
    dayNumber: totalDays,
    estimatedMinutes: 0,
  })

  return tasks
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
    const endDate = new Date(startDate)
    endDate.setDate(endDate.getDate() + totalDays - 1)

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

    // Get today's tasks
    const { data: tasksData } = await supabase
      .from('learning_plan_tasks')
      .select('*')
      .eq('user_id', userId)
      .eq('task_date', today)
      .order('created_at', { ascending: true })

    const tasks: DailyTask[] = (tasksData || []).map((t: Record<string, unknown>) => ({
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
    })).sort((a, b) => (TASK_TYPE_ORDER[a.taskType] ?? 9) - (TASK_TYPE_ORDER[b.taskType] ?? 9))

    // Calculate day number from start date
    const startMs = new Date(summary.startDate).getTime()
    const todayMs = new Date(today).getTime()
    const dayNumber = Math.floor((todayMs - startMs) / (1000 * 60 * 60 * 24)) + 1

    // Count completed days
    const { count } = await supabase
      .from('learning_plan_tasks')
      .select('task_date', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('status', 'completed')

    const completedDays = count || 0
    const progressPercent = summary.totalDays > 0
      ? Math.min(100, Math.round((completedDays / summary.totalDays) * 100))
      : 0

    return {
      dayNumber: Math.max(1, Math.min(dayNumber, summary.totalDays)),
      totalDays: summary.totalDays,
      progressPercent,
      tasks,
      isFlexible: false,
      summary,
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
): Promise<{ ok: boolean }> {
  const supabase = getSupabaseAdmin()

  try {
    const updateData: Record<string, unknown> = {
      status,
      updated_at: new Date().toISOString(),
    }
    if (status === 'completed') {
      updateData.completed_at = new Date().toISOString()
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
