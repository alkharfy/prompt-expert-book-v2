import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase-admin'
import { authLogger } from '@/lib/logger'
import { cookies } from 'next/headers'
import { SESSION_DURATION_MS } from '@/lib/config'
import { checkRateLimit, getClientIP, RATE_LIMITS } from '@/lib/rate-limit'
import bcrypt from 'bcryptjs'

/**
 * Replace a specific device during login
 * POST /api/auth/devices/replace
 * 
 * Used when user has 3 devices and wants to replace one to login from a new device.
 * SECURITY: Requires password verification to prevent account takeover.
 * This is a server-side operation that:
 * 1. Verifies user email + password
 * 2. Removes the specified old device
 * 3. Creates a new device record
 * 4. Creates a new session
 */
export async function POST(request: NextRequest) {
    try {
        const body = await request.json()
        const { email, oldDeviceId, password } = body

        if (!email || !oldDeviceId || !password) {
            return NextResponse.json(
                { ok: false, error: 'بيانات غير كاملة — يرجى إدخال كلمة المرور' },
                { status: 400 }
            )
        }

        // Rate limiting — strict to prevent brute force
        const clientIP = getClientIP(request)
        const rateLimitResult = checkRateLimit(`device-replace:${clientIP}`, { maxRequests: 5, windowSeconds: 15 * 60 })
        if (!rateLimitResult.allowed) {
            return NextResponse.json(
                { ok: false, error: `تم تجاوز عدد المحاولات. حاول مجدداً بعد ${rateLimitResult.retryAfter} ثانية` },
                { status: 429 }
            )
        }

        const supabase = getSupabaseAdmin()

        // Get user WITH password_hash for verification
        const { data: user, error: userError } = await supabase
            .from('users')
            .select('id, password_hash')
            .eq('email', email.toLowerCase())
            .single()

        if (userError || !user) {
            return NextResponse.json(
                { ok: false, error: 'البريد الإلكتروني أو كلمة المرور غير صحيحة' },
                { status: 401 }
            )
        }

        // SECURITY: Verify password before allowing device replacement
        // Google users (password_hash = 'google-auth') cannot use this endpoint
        if (!user.password_hash || user.password_hash === 'google-auth') {
            return NextResponse.json(
                { ok: false, error: 'يرجى تسجيل الدخول بحساب Google بدلاً من ذلك' },
                { status: 400 }
            )
        }

        const isPasswordValid = await bcrypt.compare(password, user.password_hash)
        if (!isPasswordValid) {
            return NextResponse.json(
                { ok: false, error: 'البريد الإلكتروني أو كلمة المرور غير صحيحة' },
                { status: 401 }
            )
        }

        // Delete the old device
        await supabase
            .from('devices')
            .delete()
            .eq('user_id', user.id)
            .eq('device_id', oldDeviceId)

        // Delete sessions for the old device
        await supabase
            .from('sessions')
            .delete()
            .eq('user_id', user.id)
            .eq('device_id', oldDeviceId)

        // Create new device
        const newDeviceId = 'device_' + crypto.randomUUID().replace(/-/g, '').substring(0, 16)
        const userAgent = request.headers.get('user-agent') || 'Unknown'

        const { error: deviceError } = await supabase
            .from('devices')
            .insert({
                user_id: user.id,
                device_id: newDeviceId,
                device_fingerprint: '',
                device_info: { userAgent },
                is_active: true,
            })

        if (deviceError) {
            authLogger.error('Failed to create replacement device', deviceError)
            return NextResponse.json(
                { ok: false, error: 'فشل في تسجيل الجهاز الجديد' },
                { status: 500 }
            )
        }

        // Create session
        const sessionToken = crypto.randomUUID()
        const expiresAt = new Date(Date.now() + SESSION_DURATION_MS).toISOString()

        const { error: sessionError } = await supabase
            .from('sessions')
            .insert({
                user_id: user.id,
                device_id: newDeviceId,
                session_token: sessionToken,
                expires_at: expiresAt,
            })

        if (sessionError) {
            authLogger.error('Failed to create session', sessionError)
            return NextResponse.json(
                { ok: false, error: 'فشل في إنشاء الجلسة' },
                { status: 500 }
            )
        }

        // Set cookies
        const cookieStore = await cookies()
        const cookieOptions = {
            httpOnly: false,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax' as const,
            maxAge: SESSION_DURATION_MS / 1000,
            path: '/',
        }
        cookieStore.set('ebook_user_id', user.id, cookieOptions)
        cookieStore.set('ebook_session_token', sessionToken, { ...cookieOptions, httpOnly: true })
        cookieStore.set('ebook_device_id', newDeviceId, cookieOptions)

        authLogger.info('Device replaced successfully', {
            userId: user.id,
            oldDeviceId,
            newDeviceId,
        })

        return NextResponse.json({ ok: true, message: 'تم استبدال الجهاز بنجاح' })
    } catch (error) {
        authLogger.error('Device replace API error', error)
        return NextResponse.json(
            { ok: false, error: 'حدث خطأ غير متوقع' },
            { status: 500 }
        )
    }
}
