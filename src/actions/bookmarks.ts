'use server'

import { createClient } from '@supabase/supabase-js'
import { cookies } from 'next/headers'

import { TOTAL_BOOK_PAGES } from '@/lib/config'

interface Bookmark {
    id: string
    title: string
    date: string
}

function getServiceClient() {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

    if (!url || !serviceKey) {
        throw new Error('Missing Supabase environment variables')
    }

    return createClient(url, serviceKey)
}

async function getUserId(): Promise<string | null> {
    const cookieStore = await cookies()
    const userId = cookieStore.get('ebook_user_id')?.value
    const sessionToken = cookieStore.get('ebook_session_token')?.value

    if (!userId || !sessionToken) return null

    // SECURITY: Verify session token to prevent IDOR via forged cookie
    const supabase = getServiceClient()
    const { data: session } = await supabase
        .from('sessions')
        .select('user_id')
        .eq('user_id', userId)
        .eq('session_token', sessionToken)
        .gt('expires_at', new Date().toISOString())
        .single()

    return session ? session.user_id : null
}

export async function getBookmarks(): Promise<{ bookmarks: Bookmark[]; error?: string }> {
    try {
        const userId = await getUserId()
        if (!userId) {
            return { bookmarks: [], error: 'غير مصرح' }
        }

        const supabase = getServiceClient()

        const { data, error } = await supabase
            .from('reading_progress')
            .select('bookmarks')
            .eq('user_id', userId)
            .maybeSingle()

        if (error) {
            console.error('Error fetching bookmarks:', error)
            return { bookmarks: [], error: error.message }
        }

        return { bookmarks: (data?.bookmarks as Bookmark[]) || [] }
    } catch (err) {
        console.error('Bookmarks fetch error:', err)
        return { bookmarks: [], error: 'خطأ في الخادم' }
    }
}

export async function toggleBookmark(
    action: 'add' | 'remove',
    pageId: string,
    pageTitle?: string
): Promise<{ success: boolean; isBookmarked: boolean; message: string }> {
    try {
        const userId = await getUserId()
        if (!userId) {
            return { success: false, isBookmarked: false, message: 'غير مصرح' }
        }

        if (!pageId) {
            return { success: false, isBookmarked: false, message: 'بيانات ناقصة' }
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
            return { success: false, isBookmarked: false, message: fetchError.message }
        }

        let bookmarks: Bookmark[] = (currentData?.bookmarks as Bookmark[]) || []

        if (action === 'add') {
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
            return { success: false, isBookmarked: false, message: 'إجراء غير صالح' }
        }

        // Upsert
        const { error: upsertError } = await supabase
            .from('reading_progress')
            .upsert({
                user_id: userId,
                bookmarks: bookmarks,
                current_page: currentData?.current_page || 1,
                total_pages: TOTAL_BOOK_PAGES,
                updated_at: new Date().toISOString()
            }, { onConflict: 'user_id' })

        if (upsertError) {
            console.error('Error saving bookmarks:', upsertError)
            return { success: false, isBookmarked: false, message: upsertError.message }
        }

        const isBookmarked = action === 'add'

        // تحديث تقدم المهام اليومية (bookmark) — fire and forget
        if (isBookmarked) {
            import('@/lib/missions').then(({ updateMissionProgress }) => {
                updateMissionProgress(userId, 'add_bookmark').catch(() => { /* silent */ })
            }).catch(() => { /* silent */ })
        }

        return {
            success: true,
            isBookmarked,
            message: isBookmarked ? 'تم حفظ الإشارة المرجعية' : 'تم إزالة الإشارة المرجعية'
        }
    } catch (err) {
        console.error('Bookmarks toggle error:', err)
        return { success: false, isBookmarked: false, message: 'خطأ في الخادم' }
    }
}
