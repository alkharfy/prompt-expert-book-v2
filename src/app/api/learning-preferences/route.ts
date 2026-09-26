import { NextRequest, NextResponse } from 'next/server'
import {
  getLearningPreferences,
  saveLearningPreferences,
  validatePreferences,
} from '@/lib/learning-preferences'

export async function GET(request: NextRequest) {
  try {
    const userId = request.cookies.get('ebook_user_id')?.value
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const prefs = await getLearningPreferences(userId)
    return NextResponse.json({ preferences: prefs })
  } catch {
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const userId = request.cookies.get('ebook_user_id')?.value
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const validationError = validatePreferences(body)
    if (validationError) {
      return NextResponse.json({ error: validationError }, { status: 400 })
    }

    const result = await saveLearningPreferences(userId, {
      learningGoal: body.learningGoal,
      specialization: body.specialization,
      learningPath: body.learningPath,
      learningDuration: body.learningDuration,
    })

    if (!result.ok) {
      return NextResponse.json({ error: result.error }, { status: 500 })
    }

    return NextResponse.json({ ok: true })
  } catch {
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}
