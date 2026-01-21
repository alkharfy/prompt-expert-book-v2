import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { cookies } from 'next/headers'

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

interface Bookmark {
    id: string
    title: string
    date: string
}

// GET: Fetch bookmarks for current user
export async function GET() {
    try {
        const userId = getUserIdFromCookies()

        if (!userId) {
            return NextResponse.json({ error: 'غير مصرح' }, { status: 401 })
        }

        const supabase = getServiceClient()

        const { data, error } = await supabase
            .from('reading_progress')
            .select('bookmarks')
            .eq('user_id', userId)
            .maybeSingle()

        if (error) {
            console.error('Error fetching bookmarks:', error)
            return NextResponse.json({ error: error.message }, { status: 500 })
        }

        return NextResponse.json({ bookmarks: data?.bookmarks || [] })
    } catch (err) {
        console.error('Bookmarks GET error:', err)
        return NextResponse.json({ error: 'خطأ في الخادم' }, { status: 500 })
    }
}

// POST: Add or remove bookmark
export async function POST(request: NextRequest) {
    try {
        const userId = getUserIdFromCookies()

        if (!userId) {
            return NextResponse.json({ error: 'غير مصرح' }, { status: 401 })
        }

        const body = await request.json()
        const { action, pageId, pageTitle } = body

        if (!action || !pageId) {
            return NextResponse.json({ error: 'بيانات ناقصة' }, { status: 400 })
        }

        const supabase = getServiceClient()

        // Get current bookmarks
        const { data: currentData, error: fetchError } = await supabase
            .from('reading_progress')
            .select('bookmarks, current_page')
            .eq('user_id', userId)
            .maybeSingle()

        if (fetchError) {
            console.error('Error fetching current bookmarks:', fetchError)
            return NextResponse.json({ error: fetchError.message }, { status: 500 })
        }

        let bookmarks: Bookmark[] = (currentData?.bookmarks as Bookmark[]) || []

        if (action === 'add') {
            // Check if already bookmarked
            if (!bookmarks.some(b => b.id === pageId)) {
                bookmarks.push({
                    id: pageId,
                    title: pageTitle || pageId,
                    date: new Date().toISOString()
                })
            }
        } else if (action === 'remove') {
            bookmarks = bookmarks.filter(b => b.id !== pageId)
        } else {
            return NextResponse.json({ error: 'إجراء غير صالح' }, { status: 400 })
        }

        // Upsert
        const { error: upsertError } = await supabase
            .from('reading_progress')
            .upsert({
                user_id: userId,
                bookmarks: bookmarks,
                current_page: currentData?.current_page || 1,
                total_pages: 89,
                updated_at: new Date().toISOString()
            }, { onConflict: 'user_id' })

        if (upsertError) {
            console.error('Error saving bookmarks:', upsertError)
            return NextResponse.json({ error: upsertError.message }, { status: 500 })
        }

        const isBookmarked = action === 'add'
        return NextResponse.json({
            success: true,
            isBookmarked,
            message: isBookmarked ? 'تم حفظ الإشارة المرجعية' : 'تم إزالة الإشارة المرجعية'
        })
    } catch (err) {
        console.error('Bookmarks POST error:', err)
        return NextResponse.json({ error: 'خطأ في الخادم' }, { status: 500 })
    }
}
