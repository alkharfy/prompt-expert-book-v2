import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase-admin'
import { TOTAL_BOOK_PAGES } from '@/lib/config'
import { syncReadingToGamification } from '@/lib/gamification'
import { getAuthenticatedUser } from '@/lib/auth-middleware'
import { checkRateLimit } from '@/lib/rate-limit'
import { dbLogger } from '@/lib/logger'

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

        return NextResponse.json({ data })
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

        const body = await request.json()
        const { current_page, bookmarks, completed_chapters } = body

        if (!current_page && !bookmarks && !completed_chapters) {
            return NextResponse.json({ error: 'لا توجد بيانات للتحديث' }, { status: 400 })
        }

        // التحقق من نطاق الصفحة
        if (current_page !== undefined) {
            if (typeof current_page !== 'number' || current_page < 1 || current_page > TOTAL_BOOK_PAGES) {
                return NextResponse.json({ error: 'رقم الصفحة غير صالح' }, { status: 400 })
            }
        }

        // التحقق من أن completed_chapters مصفوفة صالحة
        if (completed_chapters !== undefined) {
            if (!Array.isArray(completed_chapters) || completed_chapters.length > 15) {
                return NextResponse.json({ error: 'بيانات الفصول غير صالحة' }, { status: 400 })
            }
        }

        const supabase = getSupabaseAdmin()

        // Build update object
        const updateData: Record<string, unknown> = {
            user_id: userId,
            updated_at: new Date().toISOString()
        }

        if (current_page !== undefined) {
            updateData.current_page = current_page
            updateData.last_read_time = new Date().toISOString()
            // Calculate completion percentage
            const totalPages = TOTAL_BOOK_PAGES
            updateData.completion_percentage = Math.min(Math.round((current_page / totalPages) * 100), 100)
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

        if (completed_chapters !== undefined) {
            updateData.completed_chapters = completed_chapters
            // Sync to gamification
            const chaptersCount = Array.isArray(completed_chapters) ? completed_chapters.length : 0
            if (chaptersCount > 0) {
                await syncReadingToGamification(userId, chaptersCount)
            }
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

        return NextResponse.json({ success: true, data })
    } catch (err) {
        dbLogger.error('Reading progress POST error:', err)
        return NextResponse.json({ error: 'خطأ في الخادم' }, { status: 500 })
    }
}
