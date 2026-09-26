import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase-admin'
import { hashPassword } from '@/lib/password'
import { verifyFirebaseToken } from '@/lib/firebase_admin'
import { authLogger } from '@/lib/logger'
import { checkRateLimit, getClientIP, RATE_LIMITS } from '@/lib/rate-limit'

/**
 * POST /api/auth/sync-password
 * Sync password hash to Supabase after a Firebase password reset.
 * Requires a valid Firebase ID token to prove the user authenticated.
 *
 * Body: { idToken: string, newPassword: string }
 */
export async function POST(request: NextRequest) {
    try {
        // Rate limiting
        const clientIP = getClientIP(request)
        const rateLimitResult = checkRateLimit(`sync-password:${clientIP}`, { maxRequests: 5, windowSeconds: 15 * 60 })
        if (!rateLimitResult.allowed) {
            return NextResponse.json(
                { ok: false, error: `تم تجاوز عدد المحاولات. حاول مجدداً بعد ${rateLimitResult.retryAfter} ثانية` },
                { status: 429 }
            )
        }

        const body = await request.json()
        const { idToken, newPassword } = body

        if (!idToken || !newPassword) {
            return NextResponse.json(
                { ok: false, error: 'بيانات غير كاملة' },
                { status: 400 }
            )
        }

        if (typeof newPassword !== 'string' || newPassword.length < 6 || newPassword.length > 128) {
            return NextResponse.json(
                { ok: false, error: 'كلمة المرور غير صالحة' },
                { status: 400 }
            )
        }

        // SECURITY: Verify the Firebase ID token to confirm identity
        const decodedToken = await verifyFirebaseToken(idToken)
        if (!decodedToken) {
            return NextResponse.json(
                { ok: false, error: 'رمز المصادقة غير صالح' },
                { status: 401 }
            )
        }

        // Hash the password server-side
        const passwordHash = await hashPassword(newPassword)

        // Update in database
        const supabase = getSupabaseAdmin()
        const { error } = await supabase
            .from('users')
            .update({ password_hash: passwordHash } as any)
            .eq('firebase_uid', decodedToken.uid)

        if (error) {
            authLogger.error('Failed to sync password hash', error)
            return NextResponse.json(
                { ok: false, error: 'فشل تحديث كلمة المرور' },
                { status: 500 }
            )
        }

        // SECURITY: Invalidate ALL sessions for this user after password reset
        // (password reset = user may have been compromised, revoke everything)
        const { data: userData } = await supabase
            .from('users')
            .select('id')
            .eq('firebase_uid', decodedToken.uid)
            .single()

        if (userData) {
            await supabase
                .from('sessions')
                .delete()
                .eq('user_id', (userData as any).id)
            authLogger.info('Invalidated all sessions after password reset sync', { uid: decodedToken.uid })
        }

        authLogger.info('Password hash synced to database', { uid: decodedToken.uid })

        return NextResponse.json({ ok: true })
    } catch (error) {
        authLogger.error('Sync password API error', error)
        return NextResponse.json(
            { ok: false, error: 'حدث خطأ غير متوقع' },
            { status: 500 }
        )
    }
}
