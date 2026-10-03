import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase-admin'
import { cookies } from 'next/headers'
import { SESSION_DURATION_MS } from '@/lib/config'
import { userHasFeature } from '@/lib/subscription'

/**
 * Verify current session server-side (bypasses RLS with service_role)
 * GET /api/auth/verify-session
 * 
 * Also handles session renewal: if remaining session time < 50% of total duration,
 * extends the session and refreshes cookie maxAge automatically.
 */
export async function GET(request: NextRequest) {
  try {
    const cookieStore = await cookies()
    const sessionToken = cookieStore.get('ebook_session_token')?.value
    const deviceId = cookieStore.get('ebook_device_id')?.value
    const userId = cookieStore.get('ebook_user_id')?.value

    if (!sessionToken || !userId) {
      return NextResponse.json({ valid: false, error: 'no_session' })
    }

    const supabase = getSupabaseAdmin()

    // Find session in database — try with device_id first, fallback without
    let session: any = null

    if (deviceId) {
      const { data } = await (supabase
        .from('sessions') as any)
        .select('id, session_token, user_id, device_id, expires_at')
        .eq('session_token', sessionToken)
        .eq('user_id', userId)
        .eq('device_id', deviceId)
        .single()
      session = data
    }

    // Fallback: find session by token + user only (device might not match)
    if (!session) {
      const { data } = await (supabase
        .from('sessions') as any)
        .select('id, session_token, user_id, device_id, expires_at')
        .eq('session_token', sessionToken)
        .eq('user_id', userId)
        .single()
      session = data
    }

    if (!session) {
      return NextResponse.json({ valid: false, error: 'session_not_found' })
    }

    // Check if session expired
    const expiresAt = new Date(session.expires_at)
    if (!(expiresAt.getTime() > Date.now())) {
      await (supabase.from('sessions') as any).delete().eq('id', session.id)
      return NextResponse.json({ valid: false, error: 'session_expired' })
    }

    // Session renewal: if remaining time < 50% of total duration, extend it
    let renewed = false
    const now = Date.now()
    const remainingMs = expiresAt.getTime() - now
    const halfDuration = SESSION_DURATION_MS / 2

    if (remainingMs < halfDuration) {
      const newExpiresAt = new Date(now + SESSION_DURATION_MS)
      await (supabase.from('sessions') as any)
        .update({ expires_at: newExpiresAt.toISOString() })
        .eq('id', session.id)
      renewed = true
    }

    const hasPaid = await userHasFeature(userId, 'reading')

    const responseData = { valid: true, userId, hasPaid, renewed }
    const response = NextResponse.json(responseData)

    if (renewed) {
      const maxAgeSeconds = Math.floor(SESSION_DURATION_MS / 1000)
      const cookieOptions = {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax' as const,
        path: '/',
        maxAge: maxAgeSeconds,
      }

      // Refresh session token cookie expiry
      response.cookies.set('ebook_session_token', sessionToken, cookieOptions)

      // Refresh user_id cookie expiry (non-httpOnly so client can read it)
      response.cookies.set('ebook_user_id', userId, {
        ...cookieOptions,
        httpOnly: false,
      })

      // Refresh device_id cookie expiry if present
      if (deviceId) {
        response.cookies.set('ebook_device_id', deviceId, {
          ...cookieOptions,
          httpOnly: false,
        })
      }
    }

    return response
  } catch (error) {
    return NextResponse.json({ valid: false, error: 'server_error' }, { status: 500 })
  }
}
