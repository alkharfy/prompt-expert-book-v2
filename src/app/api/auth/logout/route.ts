import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase-admin'
import { cookies } from 'next/headers'

/**
 * Server-side logout endpoint
 * POST /api/auth/logout
 * 
 * Properly clears httpOnly session cookies (which client-side JS cannot delete)
 * and removes the session from the database.
 */
export async function POST(request: NextRequest) {
  try {
    const cookieStore = await cookies()
    const sessionToken = cookieStore.get('ebook_session_token')?.value
    const userId = cookieStore.get('ebook_user_id')?.value

    // Delete session from database if we have the token
    if (sessionToken && userId) {
      try {
        const supabase = getSupabaseAdmin()
        await (supabase.from('sessions') as any)
          .delete()
          .eq('session_token', sessionToken)
          .eq('user_id', userId)
      } catch {
        // Continue even if DB delete fails — still clear cookies
      }
    }

    // Build response and clear ALL auth cookies (including httpOnly ones)
    const response = NextResponse.json({ success: true })

    const clearOptions = {
      path: '/',
      maxAge: 0,
    }

    response.cookies.set('ebook_session_token', '', { ...clearOptions, httpOnly: true })
    response.cookies.set('ebook_user_id', '', clearOptions)
    response.cookies.set('ebook_device_id', '', clearOptions)

    return response
  } catch (error) {
    // Even on error, try to clear cookies
    const response = NextResponse.json({ success: false }, { status: 500 })
    response.cookies.set('ebook_session_token', '', { path: '/', maxAge: 0, httpOnly: true })
    response.cookies.set('ebook_user_id', '', { path: '/', maxAge: 0 })
    response.cookies.set('ebook_device_id', '', { path: '/', maxAge: 0 })
    return response
  }
}
