import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase-admin'
import { TOTAL_BOOK_PAGES } from '@/lib/config'
import { syncReadingToGamification } from '@/lib/gamification'
import { getAuthenticatedUser } from '@/lib/auth-middleware'
import { checkRateLimit } from '@/lib/rate-limit'
import { dbLogger } from '@/lib/logger'
import { userHasFeature } from '@/lib/subscription'
import {
    FREE_READING_LAST_PAGE, getChapterEndPage, getMainChapterCompletion,
    isValidCompletedChapters, normalizeCompletedChapters, parseChapterId,
} from '@/lib/reading-completion'

// GET: Fetch reading progress for current user
export async function GET() {
    try {
        const userId = await getAuthenticatedUser()

        if (!userId) {
            return NextResponse.json({ error: 'غير مصرح' }, { status: 401 })
        }

        const supabase = getSupabaseAdmin()

        const { data, error } = await supabase
            .from('reading_progress')
            .select('*')
            .eq('user_id', userId)
            .maybeSingle()

        if (error) {
            dbLogger.error('Error fetching reading progress:', error)
            return NextResponse.json({ error: 'خطأ في جلب بيانات القراءة' }, { status: 500 })
        }

        return NextResponse.json({ data: data ? {
            ...data,
            total_pages: TOTAL_BOOK_PAGES,
            completed_chapters: normalizeCompletedChapters(data.completed_chapters),
            completion_percentage: getMainChapterCompletion(data.completed_chapters).percentage,
        } : null })
    } catch (err) {
        dbLogger.error('Reading progress GET error:', err)
        return NextResponse.json({ error: 'خطأ في الخادم' }, { status: 500 })
    }
}

// POST: Update reading progress
export async function POST(request: NextRequest) {
    try {
        const userId = await getAuthenticatedUser()

        if (!userId) {
            return NextResponse.json({ error: 'غير مصرح' }, { status: 401 })
        }

        // SECURITY: Rate limit reading progress updates
        const rateLimit = checkRateLimit(`reading-progress-${userId}`, { maxRequests: 30, windowSeconds: 60 })
        if (!rateLimit.allowed) {
            return NextResponse.json(
                { error: 'طلبات كثيرة، حاول بعد قليل', retryAfter: rateLimit.retryAfter },
                { status: 429 }
            )
        }

        let body: unknown
        try { body = await request.json() } catch {
            return NextResponse.json({ error: 'بيانات غير صالحة' }, { status: 400 })
        }
        if (!body || typeof body !== 'object' || Array.isArray(body)) {
            return NextResponse.json({ error: 'بيانات غير صالحة' }, { status: 400 })
        }
        const { current_page, bookmarks, completed_chapters, completed_chapter } = body as Record<string, any>

        if ([current_page, bookmarks, completed_chapters, completed_chapter].every(value => value === undefined)) {
            return NextResponse.json({ error: 'لا توجد بيانات للتحديث' }, { status: 400 })
        }

        // التحقق من نطاق الصفحة
        if (current_page !== undefined) {
            if (!Number.isInteger(current_page) || current_page < 1 || current_page > TOTAL_BOOK_PAGES) {
                return NextResponse.json({ error: 'رقم الصفحة غير صالح' }, { status: 400 })
            }
        }

        // التحقق من أن completed_chapters مصفوفة صالحة
        if (completed_chapters !== undefined) {
            if (!isValidCompletedChapters(completed_chapters)) {
                return NextResponse.json({ error: 'بيانات الفصول غير صالحة' }, { status: 400 })
            }
        }

        if (completed_chapter !== undefined && (parseChapterId(completed_chapter) === null
            || completed_chapters !== undefined)) {
            return NextResponse.json({ error: 'بيانات إتمام الفصل غير صالحة' }, { status: 400 })
        }

        const supabase = getSupabaseAdmin()

        const { data: previous, error: previousError } = await supabase
            .from('reading_progress')
            .select('current_page, completed_chapters')
            .eq('user_id', userId)
            .maybeSingle()
        if (previousError) {
            return NextResponse.json({ error: 'تعذّر التحقق من سجل القراءة' }, { status: 500 })
        }

        const storedChapters = normalizeCompletedChapters(previous?.completed_chapters)
        const requestedChapters = completed_chapter !== undefined
            ? [parseChapterId(completed_chapter)!]
            : normalizeCompletedChapters(completed_chapters)
        const addedChapters = requestedChapters.filter(id => !storedChapters.includes(id))

        // A page visit is not evidence that every earlier chapter was completed.
        // Accept one explicit marker at the last SAVED page of that chapter only.
        if (addedChapters.length > 1 || addedChapters.some(id => previous?.current_page !== getChapterEndPage(id))) {
            return NextResponse.json({ error: 'سجّل إتمام الفصل من آخر صفحة فيه؛ لا يمكن إكمال عدة فصول دفعة واحدة' }, { status: 400 })
        }
        if ((current_page > FREE_READING_LAST_PAGE || addedChapters.some(id => Number(id) > 1))
            && !await userHasFeature(userId, 'reading')) {
            return NextResponse.json({ error: 'يلزم اشتراك نشط لحفظ تقدم الفصول المدفوعة' }, { status: 403 })
        }
        const updatedChapters = normalizeCompletedChapters([...storedChapters, ...addedChapters])

        // Build update object
        const updateData: Record<string, unknown> = {
            user_id: userId,
            total_pages: TOTAL_BOOK_PAGES,
            updated_at: new Date().toISOString(),
        }

        // Resume/bookmark saves must not overwrite markers concurrently saved
        // by an explicit completion request from another tab or the reader.
        if (addedChapters.length > 0) {
            updateData.completed_chapters = updatedChapters
            updateData.completion_percentage = getMainChapterCompletion(updatedChapters).percentage
        }

        if (current_page !== undefined) {
            updateData.current_page = current_page
            updateData.last_read_time = new Date().toISOString()
        }

        if (bookmarks !== undefined) {
            // SECURITY: Validate bookmarks — must be array with size limits to prevent DoS
            if (!Array.isArray(bookmarks) || bookmarks.length > 200) {
                return NextResponse.json({ error: 'عدد العلامات المرجعية كبير جداً (حد أقصى 200)' }, { status: 400 })
            }
            // Ensure serialized size is reasonable (max 50KB)
            const serialized = JSON.stringify(bookmarks)
            if (serialized.length > 50_000) {
                return NextResponse.json({ error: 'حجم العلامات المرجعية كبير جداً' }, { status: 400 })
            }
            updateData.bookmarks = bookmarks
        }

        // Upsert - insert or update
        const { data, error } = await supabase
            .from('reading_progress')
            .upsert(updateData, { onConflict: 'user_id' })
            .select()
            .single()

        if (error) {
            dbLogger.error('Error updating reading progress:', error)
            return NextResponse.json({ error: 'خطأ في تحديث بيانات القراءة' }, { status: 500 })
        }

        // Award reading progress only after the validated record was saved.
        if (addedChapters.length > 0) {
            await syncReadingToGamification(userId, getMainChapterCompletion(updatedChapters).completed, supabase)
        }

        return NextResponse.json({ success: true, data: data ? {
            ...data,
            completed_chapters: normalizeCompletedChapters(data.completed_chapters),
            completion_percentage: getMainChapterCompletion(data.completed_chapters).percentage,
        } : null })
    } catch (err) {
        dbLogger.error('Reading progress POST error:', err)
        return NextResponse.json({ error: 'خطأ في الخادم' }, { status: 500 })
    }
}
