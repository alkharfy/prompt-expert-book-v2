import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase-admin'
import { getAuthenticatedUser } from '@/lib/auth-middleware'
import { checkRateLimit } from '@/lib/rate-limit'
import { dbLogger } from '@/lib/logger'
import { userHasFeature } from '@/lib/subscription'
import { TOTAL_BOOK_PAGES } from '@/lib/config'
import { lessonKey, parseLessonKey } from '@/lib/lessonProgress'

// POST { lesson: 'section-1:4' }: the learner finished this lesson (pressed «next» at its end).
export async function POST(request: NextRequest) {
    try {
        const userId = await getAuthenticatedUser()
        if (!userId) return NextResponse.json({ error: 'غير مصرح' }, { status: 401 })

        const rateLimit = checkRateLimit(`lesson-done-${userId}`, { maxRequests: 30, windowSeconds: 60 })
        if (!rateLimit.allowed) {
            return NextResponse.json({ error: 'طلبات كتير، جرّب كمان شوية', retryAfter: rateLimit.retryAfter }, { status: 429 })
        }

        let body: unknown
        try { body = await request.json() } catch {
            return NextResponse.json({ error: 'بيانات غير صالحة' }, { status: 400 })
        }
        const lesson = parseLessonKey((body as { lesson?: unknown } | null)?.lesson)
        if (!lesson) return NextResponse.json({ error: 'الدرس ده مش موجود' }, { status: 400 })

        // Only the intro is free; a paid lesson counts only with an active plan.
        if (lesson.sectionId !== 'intro' && !await userHasFeature(userId, 'reading')) {
            return NextResponse.json({ error: 'محتاج اشتراك عشان نحفظ الدرس ده' }, { status: 403 })
        }

        const supabase = getSupabaseAdmin()
        const { data: row, error: readError } = await supabase
            .from('reading_progress')
            .select('completed_lessons')
            .eq('user_id', userId)
            .maybeSingle() as { data: { completed_lessons?: unknown } | null; error: unknown }
        if (readError) {
            dbLogger.error('Error reading finished lessons:', readError)
            return NextResponse.json({ error: 'مقدرناش نحفظ الدرس دلوقتي' }, { status: 503 })
        }

        const key = lessonKey(lesson.sectionId, lesson.page)
        const current = Array.isArray(row?.completed_lessons)
            ? row.completed_lessons.filter((item): item is string => typeof item === 'string')
            : []
        if (current.includes(key)) return NextResponse.json({ success: true, completed_lessons: current })

        const next = [...current, key]
        const now = new Date().toISOString()
        const { error: writeError } = row
            ? await supabase.from('reading_progress').update({ completed_lessons: next, updated_at: now }).eq('user_id', userId)
            : await supabase.from('reading_progress').upsert({ user_id: userId, total_pages: TOTAL_BOOK_PAGES, completed_lessons: next, updated_at: now }, { onConflict: 'user_id' })
        if (writeError) {
            dbLogger.error('Error saving a finished lesson:', writeError)
            return NextResponse.json({ error: 'مقدرناش نحفظ الدرس دلوقتي' }, { status: 503 })
        }
        return NextResponse.json({ success: true, completed_lessons: next })
    } catch (err) {
        dbLogger.error('Finished lesson POST error:', err)
        return NextResponse.json({ error: 'خطأ في الخادم' }, { status: 500 })
    }
}
