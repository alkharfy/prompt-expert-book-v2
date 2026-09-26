import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase-admin'
import { authLogger } from '@/lib/logger'
import { hashPassword } from '@/lib/password'
import { adminAuth, verifyFirebaseToken } from '@/lib/firebase_admin'
import { TOTAL_BOOK_PAGES, SESSION_DURATION_MS } from '@/lib/config'
import { checkRateLimit, getClientIP, RATE_LIMITS } from '@/lib/rate-limit'
import { sendCAPILead } from '@/lib/meta-capi'
import { leadEventId } from '@/lib/tracking-config'
import { ensureEmailPreferences, sendWelcomeEmail } from '@/lib/email'

/**
 * Register new user with Firebase Auth + Supabase Database
 * POST /api/auth/register
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { fullName, email, password, phoneNumber, firebaseUid, idToken, referralCode } = body

    // Validate inputs
    if (!fullName || !email || !password || (!firebaseUid && !idToken)) {
      return NextResponse.json(
        { ok: false, error: 'جميع الحقول المطلوبة غير مكتملة' },
        { status: 400 }
      )
    }

    // Server-side rate limiting
    const clientIP = getClientIP(request)
    const rateLimitResult = checkRateLimit(`register:${clientIP}`, RATE_LIMITS.REGISTER)
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
    } catch (err) {
      authLogger.error('Firebase user verification failed', err)
      return NextResponse.json(
        { ok: false, error: 'فشل التحقق من المستخدم' },
        { status: 400 }
      )
    }

    // Use service_role to access database
    const supabase = getSupabaseAdmin()

    // Check if user already exists
    const { data: existingUser } = await supabase
      .from('users')
      .select('id')
      .eq('email', email.toLowerCase())
      .single()

    if (existingUser) {
      return NextResponse.json(
        { ok: false, error: 'البريد الإلكتروني مسجل بالفعل' },
        { status: 400 }
      )
    }

    // Hash password
    const passwordHash = await hashPassword(password)

    // Generate UUID for database (Supabase will auto-generate if we don't provide one)
    // Store Firebase UID in firebase_uid field for mapping
    const { data: newUser, error: insertError } = await supabase
      .from('users')
      .insert({
        // Don't set 'id' - let Supabase auto-generate UUID
        firebase_uid: verifiedUid,
        email: email.toLowerCase(),
        password_hash: passwordHash,
        full_name: fullName,
        phone_number: phoneNumber || '',
        is_phone_verified: false,
        is_verified: false,
        is_active: false, // Not active until code verification
      })
      .select()
      .single()

    if (insertError || !newUser) {
      authLogger.error('Failed to create user in database', insertError)

      // Rollback: Delete Firebase user
      try {
        await adminAuth.deleteUser(verifiedUid)
        authLogger.warn('Deleted orphaned Firebase user', { uid: verifiedUid })
      } catch (rollbackErr) {
        authLogger.error('Failed to delete orphaned Firebase user', rollbackErr)
      }

      return NextResponse.json(
        { ok: false, error: 'فشل في إكمال بيانات الحساب' },
        { status: 500 }
      )
    }

    // Create reading progress record
    const { error: progressError } = await supabase
      .from('reading_progress')
      .insert({
        user_id: newUser.id,
        current_page: 1,
        total_pages: TOTAL_BOOK_PAGES,
        bookmarks: [],
        completed_chapters: [],
        completion_percentage: 0,
      })
    if (progressError) {
      authLogger.error('Failed to create reading_progress', progressError)
    }

    // Handle referral code if provided
    if (referralCode) {
      try {
        // Find referrer by referral_code
        const { data: referrer } = await supabase
          .from('users')
          .select('id, referral_code')
          .eq('referral_code', referralCode.toUpperCase())
          .single()

        if (referrer && referrer.id !== newUser.id) {
          // Create referral record
          const { error: refError } = await supabase
            .from('referrals')
            .insert({
              referrer_id: referrer.id,
              referred_email: email.toLowerCase(),
              referred_user_id: newUser.id,
              referral_code: referralCode.toUpperCase(),
              status: 'registered',
              reward_type: 'discount',
              reward_value: 50,
            })
          if (refError) {
            authLogger.error('Failed to record referral', refError)
          }
          authLogger.info('Referral recorded', {
            referrerId: referrer.id,
            referredUserId: newUser.id,
          })
        }
      } catch (refErr) {
        // Don't fail registration for referral errors
        authLogger.warn('Referral processing failed', refErr)
      }
    }

    // Create session so user stays logged in after registration
    const sessionToken = crypto.randomUUID()
    const expiresAt = new Date(Date.now() + SESSION_DURATION_MS).toISOString()
    const deviceId = `reg-${crypto.randomUUID().substring(0, 8)}`

    await supabase.from('sessions').insert({
      user_id: newUser.id,
      session_token: sessionToken,
      device_id: deviceId,
      expires_at: expiresAt,
    })

    // Register device
    try {
      await (supabase.from('devices') as any).upsert({
        user_id: newUser.id,
        device_id: deviceId,
        device_fingerprint: deviceId,
        device_info: { type: 'Registration', browser: 'Unknown', os: 'Unknown' },
        last_used: new Date().toISOString(),
        is_active: true,
      }, { onConflict: 'user_id,device_id' })
    } catch {
      // Device registration is non-critical
    }

    authLogger.info('User registered successfully', {
      userId: newUser.id,
      email: email.toLowerCase(),
    })

    // Send Lead event to Meta Conversions API (server-side).
    // Shared event_id with the browser Pixel Lead so Meta deduplicates the pair.
    sendCAPILead({
      eventId: leadEventId(newUser.id),
      email: email.toLowerCase(),
      phone: phoneNumber,
      clientIp: clientIP,
      userAgent: request.headers.get('user-agent') || undefined,
      fbp: request.cookies.get('_fbp')?.value || undefined,
      fbc: request.cookies.get('_fbc')?.value || undefined,
    }).catch(() => { /* non-critical */ })

    // Provision an email_preferences row (guarantees a real unsubscribe_token so
    // every lifecycle email has a working unsubscribe link) and send the welcome
    // email. Fire-and-forget — never blocks or fails registration.
    ;(async () => {
      try {
        await ensureEmailPreferences(newUser.id)
        const { data: prefs } = await supabase
          .from('email_preferences')
          .select('unsubscribe_token')
          .eq('user_id', newUser.id)
          .maybeSingle()
        await sendWelcomeEmail(
          { id: newUser.id, email: newUser.email, full_name: newUser.full_name },
          (prefs as { unsubscribe_token?: string } | null)?.unsubscribe_token || newUser.id
        )
      } catch (welcomeErr) {
        authLogger.error('Welcome email / preferences provisioning failed (non-critical)', welcomeErr)
      }
    })()

    // Set cookies on the response so user is logged in immediately
    const response = NextResponse.json({
      ok: true,
      userId: newUser.id,
      needsPayment: true,
      message: 'تم إنشاء الحساب بنجاح! يرجى إتمام عملية الدفع لتفعيل حسابك',
    })

    const cookieMaxAge = SESSION_DURATION_MS / 1000
    const secure = process.env.NODE_ENV === 'production'
    response.cookies.set('ebook_user_id', newUser.id, {
      httpOnly: false, secure, sameSite: 'lax', maxAge: cookieMaxAge, path: '/',
    })
    response.cookies.set('ebook_session_token', sessionToken, {
      httpOnly: true, secure, sameSite: 'lax', maxAge: cookieMaxAge, path: '/',
    })
    response.cookies.set('ebook_device_id', deviceId, {
      httpOnly: false, secure, sameSite: 'lax', maxAge: cookieMaxAge, path: '/',
    })

    return response
  } catch (error) {
    authLogger.error('Registration API error', error)
    return NextResponse.json(
      { ok: false, error: 'حدث خطأ غير متوقع' },
      { status: 500 }
    )
  }
}
