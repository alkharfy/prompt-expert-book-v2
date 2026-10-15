import { getAuthenticatedUser } from '@/lib/auth-middleware'
import { NextRequest, NextResponse } from 'next/server'
import {
  createMinutesPlan,
  generatePlanTasks,
  getReadingPosition,
  savePlan,
  getTodayPlan,
  getFullPlan,
  updateTaskStatus,
} from '@/lib/learning-plan'
import { getLearningPreferences, saveOnboardingAnswers } from '@/lib/learning-preferences'
import { isDailyMinutes } from '@/lib/onboarding'
import type { LearningPathId, LearningDurationId } from '@/types/learning'
import { userHasFeature } from '@/lib/subscription'

// GET — جلب خطة اليوم أو الخطة الكاملة
export async function GET(request: NextRequest) {
  try {
    const userId = await getAuthenticatedUser()
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const view = searchParams.get('view') // 'today' or 'full'

    if (view === 'full') {
      const tasks = await getFullPlan(userId)
      return NextResponse.json({ tasks })
    }

    const todayPlan = await getTodayPlan(userId)
    return NextResponse.json({ plan: todayPlan })
  } catch {
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}

// POST — توليد وحفظ خطة جديدة
export async function POST(request: NextRequest) {
  try {
    const userId = await getAuthenticatedUser()
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Optional { dailyMinutes } from /my-plan's time buttons (no plan yet, or a
    // legacy "flexible" reader). Saved first, then the plan is sized from it.
    const body = await request.json().catch(() => null) as Record<string, unknown> | null
    const requestedMinutes = body?.dailyMinutes
    if (requestedMinutes !== undefined && !isDailyMinutes(requestedMinutes)) {
      return NextResponse.json({ error: 'وقت غير صالح' }, { status: 400 })
    }
    if (requestedMinutes !== undefined) {
      const saved = await saveOnboardingAnswers(userId, { dailyMinutes: requestedMinutes })
      if (!saved.ok) return NextResponse.json({ error: 'فشل حفظ الوقت' }, { status: 500 })
    }

    // Get user preferences
    const prefs = await getLearningPreferences(userId)
    if (!prefs) {
      return NextResponse.json({ error: 'لم يتم تحديد تفضيلات التعلم بعد', needsMinutes: true }, { status: 400 })
    }

    // v2 readers: plan from where they are now, over what they can open now.
    if (prefs.dailyMinutes) {
      const plan = await createMinutesPlan(userId, {
        dailyMinutes: prefs.dailyMinutes,
        aiLevel: prefs.aiLevel,
        startFrom: await getReadingPosition(userId),
        replaceExisting: true,
      })
      if (!plan.ok) return NextResponse.json({ error: plan.error || 'فشل توليد الخطة' }, { status: 500 })
      if (!plan.created) {
        return NextResponse.json({ error: 'خلّصت كل الصفحات المتاحة ليك دلوقتي', nothingLeft: true }, { status: 400 })
      }
      return NextResponse.json({ ok: true, totalDays: plan.totalDays, scope: plan.scope })
    }

    // Legacy "flexible" never produced a plan; ask for minutes instead.
    if (prefs.learningDuration === 'flexible') {
      return NextResponse.json({ error: 'اختار وقتك في اليوم عشان نعمل خطتك', needsMinutes: true }, { status: 400 })
    }

    // Generate plan tasks
    const startDate = prefs.planStartDate || new Date().toISOString().split('T')[0]
    const tasks = generatePlanTasks(
      prefs.learningPath as LearningPathId,
      prefs.learningDuration as LearningDurationId,
      startDate,
      {
        includeProject: await userHasFeature(userId, 'tools'),
        includeExercises: await userHasFeature(userId, 'exercises'),
      }
    )

    if (tasks.length === 0) {
      return NextResponse.json({ error: 'لم نتمكن من توليد الخطة' }, { status: 400 })
    }

    // Save to DB
    const result = await savePlan(
      userId,
      prefs.learningPath as LearningPathId,
      prefs.learningDuration as LearningDurationId,
      startDate,
      tasks
    )

    if (!result.ok) {
      return NextResponse.json({ error: result.error }, { status: 500 })
    }

    return NextResponse.json({ ok: true, totalTasks: tasks.length })
  } catch {
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}

// PATCH — تحديث حالة مهمة
export async function PATCH(request: NextRequest) {
  try {
    const userId = await getAuthenticatedUser()
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    if (!body || typeof body !== 'object' || Array.isArray(body)) {
      return NextResponse.json({ error: 'بيانات غير صالحة' }, { status: 400 })
    }
    const { taskId, status } = body

    if (typeof taskId !== 'string' || !taskId || !['completed', 'skipped', 'postponed'].includes(status)) {
      return NextResponse.json({ error: 'بيانات غير صالحة' }, { status: 400 })
    }

    const result = await updateTaskStatus(userId, taskId, status)
    if (!result.ok) {
      return NextResponse.json({ error: result.error || 'فشل التحديث' }, { status: result.error ? 400 : 500 })
    }

    return NextResponse.json({ ok: true })
  } catch {
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}
