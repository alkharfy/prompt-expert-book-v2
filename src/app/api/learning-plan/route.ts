import { getAuthenticatedUser } from '@/lib/auth-middleware'
import { NextRequest, NextResponse } from 'next/server'
import {
  generatePlanTasks,
  savePlan,
  getTodayPlan,
  getFullPlan,
  updateTaskStatus,
} from '@/lib/learning-plan'
import { getLearningPreferences } from '@/lib/learning-preferences'
import type { LearningPathId, LearningDurationId } from '@/types/learning'

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

    // Get user preferences
    const prefs = await getLearningPreferences(userId)
    if (!prefs) {
      return NextResponse.json({ error: 'لم يتم تحديد تفضيلات التعلم بعد' }, { status: 400 })
    }

    if (prefs.learningDuration === 'flexible') {
      return NextResponse.json({ ok: true, message: 'الخطة المرنة لا تحتاج جدول زمني', flexible: true })
    }

    // Generate plan tasks
    const startDate = prefs.planStartDate || new Date().toISOString().split('T')[0]
    const tasks = generatePlanTasks(
      prefs.learningPath as LearningPathId,
      prefs.learningDuration as LearningDurationId,
      startDate
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
    const { taskId, status } = body

    if (!taskId || !['completed', 'skipped', 'postponed'].includes(status)) {
      return NextResponse.json({ error: 'بيانات غير صالحة' }, { status: 400 })
    }

    const result = await updateTaskStatus(userId, taskId, status)
    if (!result.ok) {
      return NextResponse.json({ error: 'فشل التحديث' }, { status: 500 })
    }

    return NextResponse.json({ ok: true })
  } catch {
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}
