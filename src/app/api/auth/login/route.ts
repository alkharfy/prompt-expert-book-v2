import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase-admin'
import { authLogger } from '@/lib/logger'
import { adminAuth, verifyFirebaseToken } from '@/lib/firebase_admin'
import { SESSION_DURATION_MS } from '@/lib/config'
import { checkRateLimit, getClientIP, RATE_LIMITS } from '@/lib/rate-limit'

/**
 * Login user with Firebase Auth + Create Session
 * POST /api/auth/login
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email, firebaseUid, idToken } = body

    // Validate inputs
    if (!email || (!firebaseUid && !idToken)) {
      return NextResponse.json(
        { ok: false, error: 'البريد الإلكتروني مطلوب' },
        { status: 400 }
      )
    }

    // Server-side rate limiting
    const clientIP = getClientIP(request)
    const rateLimitResult = checkRateLimit(`login:${clientIP}`, RATE_LIMITS.LOGIN)
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
        // Best: verify the actual ID token cryptographically
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
        // Fallback: verify UID exists (backward compat — clients should migrate to idToken)
        const firebaseUser = await adminAuth.getUser(firebaseUid)
        if (firebaseUser.email?.toLowerCase() !== email.toLowerCase()) {
          return NextResponse.json(
            { ok: false, error: 'بيانات المستخدم غير متطابقة' },
            { status: 400 }
          )
        }
        verifiedUid = firebaseUser.uid
      }
    } catch (err) {
      authLogger.error('Firebase user verification failed', err)
      // Generic message — don't confirm whether the email is registered.
      return NextResponse.json(
        { ok: false, error: 'بيانات الدخول غير صحيحة' },
        { status: 401 }
      )
    }

    // Use service_role to access database
    const supabase = getSupabaseAdmin()

    // Get user from database by firebase_uid
    let { data: user, error: userError } = await supabase
      .from('users')
      .select('id, email, full_name, is_active, firebase_uid')
      .eq('firebase_uid', verifiedUid)
      .single()

    if (userError || !user) {
      // Fallback: Try by email for backward compatibility
      const { data: userByEmail } = await supabase
        .from('users')
        .select('id, email, full_name, is_active, firebase_uid')
        .eq('email', email.toLowerCase())
        .single()

      if (userByEmail) {
        // Update firebase_uid for this user
        await supabase
          .from('users')
          .update({ firebase_uid: verifiedUid })
          .eq('id', userByEmail.id)

        // Use this user
        user = userByEmail
      } else {
        // Generic message to avoid user enumeration via the error response.
        return NextResponse.json(
          { ok: false, error: 'بيانات الدخول غير صحيحة' },
          { status: 401 }
        )
      }
    }

    // Note: inactive accounts can still log in but will only see free content
    // Access control is handled by the subscription/payment system
    const isActive = !!user.is_active

    // Generate simple device fingerprint (server-side)
    const userAgent = request.headers.get('user-agent') || 'Unknown'
    const serverDeviceId = (() => {
      const ip = request.headers.get('x-forwarded-for') ||
                 request.headers.get('x-real-ip') ||
                 'Unknown'
      const fingerprintString = `${userAgent}-${ip}`
      let hash = 0
      for (let i = 0; i < fingerprintString.length; i++) {
        const char = fingerprintString.charCodeAt(i)
        hash = ((hash << 5) - hash) + char
        hash |= 0
      }
      return 'device_' + Math.abs(hash).toString(16).padStart(16, '0')
    })()

    // Try to find an existing device for this user:
    // Support up to 3 devices per user
    const MAX_DEVICES = 3
    
    let { data: device } = await (supabase
      .from('devices') as any)
      .select('id, user_id, device_id, device_name, is_active, last_used')
      .eq('user_id', user.id)
      .eq('device_id', serverDeviceId)
      .single()

    let finalDeviceId = serverDeviceId

    if (!device) {
      // No exact match — check all active devices
      const { data: existingDevices } = await (supabase
        .from('devices') as any)
        .select('id, user_id, device_id, device_name, is_active, last_used')
        .eq('user_id', user.id)
        .eq('is_active', true)
        .order('last_used', { ascending: false })

      if (existingDevices && existingDevices.length > 0) {
        // Reuse the most recently used device (server-side login can't fingerprint accurately)
        device = existingDevices[0]
        finalDeviceId = device.device_id
        await (supabase
          .from('devices') as any)
          .update({ last_used: new Date().toISOString() })
          .eq('id', device.id)
      } else {
        // No devices at all — create a new one
        const { data: newDevice, error: deviceError } = await (supabase
          .from('devices') as any)
          .insert({
            user_id: user.id,
            device_id: serverDeviceId,
            device_fingerprint: '',
            device_info: {},
            is_active: true,
          })
          .select()
          .single()

        if (deviceError) {
          authLogger.error('Failed to create device', deviceError)
        } else {
          device = newDevice
        }
      }
    } else {
      // Exact match found — update last used
      await (supabase
        .from('devices') as any)
        .update({ last_used: new Date().toISOString() })
        .eq('id', device.id)
    }

    // Cleanup expired sessions for this user (prevent table bloat)
    await supabase
      .from('sessions')
      .delete()
      .eq('user_id', user.id)
      .lt('expires_at', new Date().toISOString())

    // Generate session token
    const sessionToken = crypto.randomUUID()
    const expiresAt = new Date(Date.now() + SESSION_DURATION_MS).toISOString()

    // Create session in database
    const { error: sessionError } = await (supabase
      .from('sessions') as any)
      .insert({
        user_id: user.id,
        device_id: finalDeviceId,
        session_token: sessionToken,
        expires_at: expiresAt,
      })

    if (sessionError) {
      authLogger.error('Failed to create session', sessionError)
      return NextResponse.json(
        { ok: false, error: 'فشل إنشاء الجلسة' },
        { status: 500 }
      )
    }

    authLogger.info('User logged in successfully', {
      userId: user.id,
      email: user.email,
    })

    // Set cookies directly on the response object to ensure they propagate
    const response = NextResponse.json({
      ok: true,
      isActive,
      user: {
        id: user.id,
        email: user.email,
        full_name: user.full_name,
      },
    })

    const cookieMaxAge = SESSION_DURATION_MS / 1000
    const secure = process.env.NODE_ENV === 'production'
    response.cookies.set('ebook_user_id', user.id, {
      httpOnly: false, secure, sameSite: 'lax', maxAge: cookieMaxAge, path: '/',
    })
    // session_token يجب أن يكون httpOnly لمنع سرقته عبر XSS
    response.cookies.set('ebook_session_token', sessionToken, {
      httpOnly: true, secure, sameSite: 'lax', maxAge: cookieMaxAge, path: '/',
    })
    response.cookies.set('ebook_device_id', finalDeviceId, {
      httpOnly: false, secure, sameSite: 'lax', maxAge: cookieMaxAge, path: '/',
    })

    return response
  } catch (error) {
    authLogger.error('Login API error', error)
    return NextResponse.json(
      { ok: false, error: 'حدث خطأ غير متوقع' },
      { status: 500 }
    )
  }
}
