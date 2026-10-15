import { NextRequest, NextResponse } from 'next/server'
import { getAuthenticatedUser } from '@/lib/auth-middleware'
import { saveOnboardingAnswers, type OnboardingAnswers } from '@/lib/learning-preferences'
import { createMinutesPlan } from '@/lib/learning-plan'
import { isAiLevelId, isDailyMinutes, isProfessionId, parseReadingPath } from '@/lib/onboarding'

/**
 * Onboarding v2: save the answers given (all optional, so Skip keeps partial
 * answers) and, on completion, create a plan sized to the chosen minutes — unless
 * the reader already has an active plan, which is never replaced from here.
 */
export async function POST(request: NextRequest) {
  try {
    const userId = await getAuthenticatedUser()
    if (!userId) {
      return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json().catch(() => null)
    if (!body || typeof body !== 'object' || Array.isArray(body)) {
      return NextResponse.json({ ok: false, error: 'بيانات غير صالحة' }, { status: 400 })
    }

    const { profession, aiLevel, dailyMinutes, status, startPath } = body as Record<string, unknown>
    if (status !== 'completed' && status !== 'skipped') {
      return NextResponse.json({ ok: false, error: 'status غير صالح' }, { status: 400 })
    }
    const answers: OnboardingAnswers = {}
    if (profession !== undefined && profession !== null) {
      if (!isProfessionId(profession)) return NextResponse.json({ ok: false, error: 'profession غير صالح' }, { status: 400 })
      answers.profession = profession
    }
    if (aiLevel !== undefined && aiLevel !== null) {
      if (!isAiLevelId(aiLevel)) return NextResponse.json({ ok: false, error: 'aiLevel غير صالح' }, { status: 400 })
      answers.aiLevel = aiLevel
    }
    if (dailyMinutes !== undefined && dailyMinutes !== null) {
      if (!isDailyMinutes(dailyMinutes)) return NextResponse.json({ ok: false, error: 'dailyMinutes غير صالح' }, { status: 400 })
      answers.dailyMinutes = dailyMinutes
    }

    const saved = await saveOnboardingAnswers(userId, answers, status)
    if (!saved.ok) {
      return NextResponse.json({ ok: false, error: 'save_failed' }, { status: 500 })
    }

    if (status !== 'completed' || !answers.dailyMinutes) {
      return NextResponse.json({ ok: true, plan: null })
    }

    const plan = await createMinutesPlan(userId, {
      dailyMinutes: answers.dailyMinutes,
      aiLevel: answers.aiLevel ?? null,
      startFrom: parseReadingPath(typeof startPath === 'string' ? startPath : null),
    })
    // Preferences are saved even if the plan could not be; /my-plan can retry.
    return NextResponse.json({
      ok: true,
      plan: {
        created: plan.created,
        existing: plan.existing ?? false,
        scope: plan.scope ?? null,
        totalDays: plan.totalDays ?? null,
        failed: !plan.ok,
      },
    })
  } catch {
    return NextResponse.json({ ok: false, error: 'Internal error' }, { status: 500 })
  }
}
