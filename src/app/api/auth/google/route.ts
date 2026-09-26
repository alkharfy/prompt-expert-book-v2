import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase-admin'
import { authLogger } from '@/lib/logger'
import { adminAuth, verifyFirebaseToken } from '@/lib/firebase_admin'
import { TOTAL_BOOK_PAGES, SESSION_DURATION_MS } from '@/lib/config'
import { checkRateLimit, getClientIP, RATE_LIMITS } from '@/lib/rate-limit'
import { sendCAPILead } from '@/lib/meta-capi'
import { leadEventId } from '@/lib/tracking-config'

/**
 * Google Auth API — Login or Register via Google
 * POST /api/auth/google
 * 
 * If user exists → create session (login)
 * If user is new → create user + session (register)
 */
export async function POST(request: NextRequest) {
    try {
        const body = await request.json()
        const { email, fullName, firebaseUid, idToken } = body

        if (!email || (!firebaseUid && !idToken)) {
            return NextResponse.json(
                { ok: false, error: 'بيانات غير كاملة' },
                { status: 400 }
            )
        }

        // Rate limiting
        const clientIP = getClientIP(request)
        const rateLimitResult = checkRateLimit(`google-auth:${clientIP}`, RATE_LIMITS.LOGIN)
        if (!rateLimitResult.allowed) {
            return NextResponse.json(
                { ok: false, error: `تم تجاوز عدد المحاولات. حاول مجدداً بعد ${rateLimitResult.retryAfter} ثانية` },
                { status: 429 }
            )
        }

        // SECURITY: Verify Firebase ID token (preferred) or fall back to UID check
        let verifiedUid: string
        try {
            if (idToken) {
                const decodedToken = await verifyFirebaseToken(idToken)
                if (!decodedToken) {
                    return NextResponse.json(
                        { ok: false, error: 'رمز المصادقة غير صالح' },
                        { status: 401 }
                    )
                }
                if (decodedToken.email?.toLowerCase() !== email.toLowerCase()) {
                    return NextResponse.json(
                        { ok: false, error: 'بيانات المستخدم غير متطابقة' },
                        { status: 400 }
                    )
                }
                verifiedUid = decodedToken.uid
            } else {
                const firebaseUser = await adminAuth.getUser(firebaseUid)
                if (firebaseUser.email?.toLowerCase() !== email.toLowerCase()) {
                    return NextResponse.json(
                        { ok: false, error: 'بيانات المستخدم غير متطابقة' },
                        { status: 400 }
                    )
                }
                verifiedUid = firebaseUser.uid
            }
        } catch {
            return NextResponse.json(
                { ok: false, error: 'فشل التحقق من المستخدم' },
                { status: 400 }
            )
        }

        const supabase = getSupabaseAdmin()

        // Check if user exists
        const { data: existingUser } = await supabase
            .from('users')
            .select('id, is_active')
            .eq('email', email.toLowerCase())
            .single()

        let userId: string
        let isNewUser = false

        if (existingUser) {
            // Existing user — login
            userId = existingUser.id

            // Update firebase_uid if needed (do NOT auto-activate — activation requires payment)
            await supabase
                .from('users')
                .update({ firebase_uid: verifiedUid, is_verified: true })
                .eq('id', userId)
        } else {
            // New user — register
            isNewUser = true

            // SECURITY: Use a proper bcrypt hash instead of plaintext 'google-auth' marker
            const { hashPassword: hashPw } = await import('@/lib/password')
            const sentinelHash = await hashPw(crypto.randomUUID())

            const { data: newUser, error: insertError } = await supabase
                .from('users')
                .insert({
                    firebase_uid: verifiedUid,
                    email: email.toLowerCase(),
                    password_hash: sentinelHash, // Random hash — Google users can't login with password
                    full_name: fullName || email.split('@')[0],
                    phone_number: '',
                    is_phone_verified: false,
                    is_verified: true,
                    is_active: false, // NOT active until payment
                })
                .select()
                .single()

            if (insertError || !newUser) {
                authLogger.error('Failed to create Google user', insertError)
                return NextResponse.json(
                    { ok: false, error: 'فشل في إنشاء الحساب' },
                    { status: 500 }
                )
            }

            userId = newUser.id

            // Create reading progress
            await supabase
                .from('reading_progress')
                .insert({
                    user_id: userId,
                    current_page: 1,
                    total_pages: TOTAL_BOOK_PAGES,
                    bookmarks: [],
                    completed_chapters: [],
                    completion_percentage: 0,
                })
        }

        // Create session
        const sessionToken = crypto.randomUUID()
        const expiresAt = new Date(Date.now() + SESSION_DURATION_MS).toISOString()

        // Generate a server-side device ID (do NOT trust client-provided x-device-id)
        const deviceId = `google-${crypto.randomUUID().substring(0, 8)}`

        await supabase.from('sessions').insert({
            user_id: userId,
            session_token: sessionToken,
            device_id: deviceId,
            expires_at: expiresAt,
        })

        // Register device
        try {
            await supabase.from('devices').upsert({
                user_id: userId,
                device_id: deviceId,
                device_fingerprint: deviceId,
                device_info: { type: 'Google Auth', browser: 'Unknown', os: 'Unknown' },
                last_used: new Date().toISOString(),
                is_active: true,
            }, { onConflict: 'user_id,device_id' })
        } catch {
            // Device registration is non-critical
        }

        // Set cookies directly on the NextResponse to ensure they propagate
        const response = NextResponse.json({
            ok: true,
            userId,
            isNewUser,
        })

        const cookieMaxAge = SESSION_DURATION_MS / 1000
        const secure = process.env.NODE_ENV === 'production'
        response.cookies.set('ebook_user_id', userId, {
            httpOnly: false, secure, sameSite: 'lax', maxAge: cookieMaxAge, path: '/',
        })
        // SECURITY: session_token must be httpOnly to prevent XSS theft
        response.cookies.set('ebook_session_token', sessionToken, {
            httpOnly: true, secure, sameSite: 'lax', maxAge: cookieMaxAge, path: '/',
        })
        response.cookies.set('ebook_device_id', deviceId, {
            httpOnly: false, secure, sameSite: 'lax', maxAge: cookieMaxAge, path: '/',
        })

        authLogger.info(`Google auth success (${isNewUser ? 'new' : 'existing'})`, {
            userId,
            email: email.toLowerCase(),
        })

        // New Google users → server-side CAPI Lead with the SAME event_id the
        // browser Pixel Lead uses (register page, also gated on isNewUser) so Meta
        // deduplicates the pair. Returning users are NOT a Lead (just a login).
        if (isNewUser) {
            sendCAPILead({
                eventId: leadEventId(userId),
                email: email.toLowerCase(),
                clientIp: getClientIP(request),
                userAgent: request.headers.get('user-agent') || undefined,
                fbp: request.cookies.get('_fbp')?.value || undefined,
                fbc: request.cookies.get('_fbc')?.value || undefined,
            }).catch(() => { /* non-critical */ })
        }

        return response
    } catch (error) {
        authLogger.error('Google auth API error', error)
        return NextResponse.json(
            { ok: false, error: 'حدث خطأ غير متوقع' },
            { status: 500 }
        )
    }
}
