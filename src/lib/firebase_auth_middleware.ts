import { NextRequest } from 'next/server'
import { cookies } from 'next/headers'
import { verifyFirebaseToken } from './firebase_admin'
import { getSupabaseAdmin } from './supabase-admin'

/**
 * Get authenticated user ID from request
 *
 * Supports two auth methods:
 * 1. Custom session cookies (ebook_user_id + ebook_session_token) - Primary method
 * 2. Firebase ID token in Authorization header - For API/mobile clients
 *
 * @param request - Next.js request object
 * @returns user_id (UUID) or null if not authenticated
 */
export async function getAuthenticatedUserId(
  request: NextRequest
): Promise<string | null> {
  try {
    // Strategy 1: Check custom session cookies (existing system)
    const cookieStore = await cookies()
    const userId = cookieStore.get('ebook_user_id')?.value
    const sessionToken = cookieStore.get('ebook_session_token')?.value

    if (userId && sessionToken) {
      // Validate session exists in database and not expired
      const supabase = getSupabaseAdmin()

      const { data: session } = await supabase
        .from('sessions')
        .select('expires_at')
        .eq('session_token', sessionToken)
        .eq('user_id', userId)
        .maybeSingle()

      if (session && new Date(session.expires_at) > new Date()) {
        // Session is valid — user is authenticated
        // NOTE: is_active=false means unpaid, NOT disabled account.
        // Authentication should NOT be blocked by payment status.
        // Premium feature access is controlled by middleware + subscription checks.
        return userId
      }
    }

    // Strategy 2: Check Firebase ID token (future-proof for mobile apps)
    const authHeader = request.headers.get('authorization')
    if (authHeader?.startsWith('Bearer ')) {
      const idToken = authHeader.split('Bearer ')[1]
      const decodedToken = await verifyFirebaseToken(idToken)

      if (decodedToken) {
        // Get user_id from firebase_uid mapping
        const supabase = getSupabaseAdmin()

        const { data: user } = await supabase
          .from('users')
          .select('id, is_active')
          .eq('firebase_uid', decodedToken.uid)
          .single()

        // SECURITY: Reject only if user doesn't exist
        if (!user) return null
        return user.id
      }
    }

    return null
  } catch (error) {
    console.error('Auth verification failed:', error)
    return null
  }
}

/**
 * Get authenticated user with full details
 * @param request - Next.js request object
 * @returns User object or null
 */
export async function getAuthenticatedUser(
  request: NextRequest
): Promise<any | null> {
  try {
    const userId = await getAuthenticatedUserId(request)
    if (!userId) return null

    const supabase = getSupabaseAdmin()

    const { data: user } = await supabase
      .from('users')
      .select('id, email, full_name, phone_number, is_verified, is_active, is_admin, current_plan, plan_expires_at, firebase_uid, referral_code, created_at, updated_at')
      .eq('id', userId)
      .single()

    return user
  } catch (error) {
    console.error('Failed to get authenticated user:', error)
    return null
  }
}
