import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { cookies } from 'next/headers'
import { syncReadingToGamification } from '@/lib/gamification'

// Service role client - bypasses RLS
function getServiceClient() {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

    if (!url || !serviceKey) {
        throw new Error('Missing Supabase environment variables')
    }

    return createClient(url, serviceKey)
}

// Get user ID from cookies (server-side)
function getUserIdFromCookies(): string | null {
    const cookieStore = cookies()
    const userIdCookie = cookieStore.get('ebook_user_id')
    return userIdCookie?.value || null
}

// GET: Fetch reading progress for current user
export async function GET() {
    try {
        const userId = getUserIdFromCookies()

        if (!userId) {
            return NextResponse.json({ error: 'غير مصرح' }, { status: 401 })
        }

        const supabase = getServiceClient()

        const { data, error } = await supabase
            .from('reading_progress')
            .select('*')
            .eq('user_id', userId)
            .maybeSingle()

        if (error) {
            console.error('Error fetching reading progress:', error)
            return NextResponse.json({ error: error.message }, { status: 500 })
        }

        return NextResponse.json({ data })
    } catch (err) {
        console.error('Reading progress GET error:', err)
        return NextResponse.json({ error: 'خطأ في الخادم' }, { status: 500 })
    }
}

// POST: Update reading progress
export async function POST(request: NextRequest) {
    try {
        const userId = getUserIdFromCookies()

        if (!userId) {
            return NextResponse.json({ error: 'غير مصرح' }, { status: 401 })
        }

        const body = await request.json()
        const { current_page, bookmarks, completed_chapters } = body

        if (!current_page && !bookmarks && !completed_chapters) {
            return NextResponse.json({ error: 'لا توجد بيانات للتحديث' }, { status: 400 })
        }

        const supabase = getServiceClient()

        // Build update object
        const updateData: Record<string, unknown> = {
            user_id: userId,
            updated_at: new Date().toISOString()
        }

        if (current_page !== undefined) {
            updateData.current_page = current_page
            updateData.last_read_time = new Date().toISOString()
            // Calculate completion percentage
            const totalPages = 89 // Total book pages
            updateData.completion_percentage = Math.round((current_page / totalPages) * 100)
        }

        if (bookmarks !== undefined) {
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
            console.error('Error updating reading progress:', error)
            return NextResponse.json({ error: error.message }, { status: 500 })
        }

        return NextResponse.json({ success: true, data })
    } catch (err) {
        console.error('Reading progress POST error:', err)
        return NextResponse.json({ error: 'خطأ في الخادم' }, { status: 500 })
    }
}
