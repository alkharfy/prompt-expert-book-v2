import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase-admin'
import { authLogger } from '@/lib/logger'
import { checkRateLimit, getClientIP, RATE_LIMITS } from '@/lib/rate-limit'

/**
 * Verify activation code and activate user account
 * POST /api/auth/verify-code
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { userId, code } = body

    // Validate inputs
    if (!userId || !code) {
      return NextResponse.json(
        { ok: false, error: 'جميع الحقول مطلوبة' },
        { status: 400 }
      )
    }

    // Server-side rate limiting — per IP+userId
    const clientIP = getClientIP(request)
    const rateLimitResult = checkRateLimit(`verify-code:${clientIP}:${userId}`, RATE_LIMITS.VERIFY_CODE)
    if (!rateLimitResult.allowed) {
      return NextResponse.json(
        { ok: false, error: `تم تجاوز عدد المحاولات. حاول مجدداً بعد ${rateLimitResult.retryAfter} ثانية` },
        { status: 429 }
      )
    }

    // SECURITY: Also rate limit per userId only (prevents IP rotation attacks)
    const userRateLimitResult = checkRateLimit(`verify-code-user:${userId}`, { maxRequests: 10, windowSeconds: 30 * 60 })
    if (!userRateLimitResult.allowed) {
      return NextResponse.json(
        { ok: false, error: `تم تجاوز عدد المحاولات لهذا الحساب. حاول مجدداً بعد ${userRateLimitResult.retryAfter} ثانية` },
        { status: 429 }
      )
    }

    // Use service_role to access database (bypasses RLS)
    const supabase = getSupabaseAdmin()

    // Verify the code from database
    const { data: verificationData, error: verifyError } = await supabase
      .from('verification_codes')
      .select('id, user_id, code, created_at, is_used')
      .eq('user_id', userId)
      .eq('code', code)
      .eq('is_used', false)
      .single()

    if (verifyError || !verificationData) {
      return NextResponse.json(
        { ok: false, error: 'الكود غير صحيح أو منتهي الصلاحية' },
        { status: 400 }
      )
    }

    // Check if code is expired (24 hours)
    const createdAt = new Date((verificationData as any).created_at)
    const now = new Date()
    const hoursDiff = (now.getTime() - createdAt.getTime()) / (1000 * 60 * 60)

    if (hoursDiff > 24) {
      return NextResponse.json(
        { ok: false, error: 'انتهت صلاحية الكود، يرجى التواصل مع الدعم' },
        { status: 400 }
      )
    }

    // Mark code as used
    await supabase
      .from('verification_codes')
      .update({ is_used: true, used_at: new Date().toISOString() } as any)
      .eq('id', (verificationData as any).id)

    // Activate user account (verify email only — is_active requires payment)
    await supabase
      .from('users')
      .update({ is_verified: true } as any)
      .eq('id', userId)

    authLogger.info('User email verified via verification code', { userId })

    return NextResponse.json({
      ok: true,
      message: 'تم تفعيل الحساب بنجاح',
    })
  } catch (error) {
    authLogger.error('Verify code API error', error)
    return NextResponse.json(
      { ok: false, error: 'حدث خطأ غير متوقع' },
      { status: 500 }
    )
  }
}
