import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase-admin'
import { authLogger } from '@/lib/logger'
import { cookies } from 'next/headers'
import { checkRateLimit, getClientIP } from '@/lib/rate-limit'
import { SITE_URL } from '@/lib/config'

function getSupabase() {
    return getSupabaseAdmin()
}

async function getUserIdFromCookies(): Promise<string | null> {
    const cookieStore = await cookies()
    const userId = cookieStore.get('ebook_user_id')?.value
    const sessionToken = cookieStore.get('ebook_session_token')?.value

    if (!userId || !sessionToken) return null

    const supabase = getSupabase()
    const { data: session } = await supabase
        .from('sessions')
        .select('user_id')
        .eq('user_id', userId)
        .eq('session_token', sessionToken)
        .gt('expires_at', new Date().toISOString())
        .maybeSingle()

    return session ? session.user_id : null
}

/**
 * Generate a unique referral code from user name
 */
function generateReferralCode(fullName: string, userId: string): string {
    // Take first name (or first part), uppercase
    const namePart = (fullName || 'USER').split(' ')[0].toUpperCase().substring(0, 6)
    // Add random suffix from userId
    const suffix = userId.substring(0, 4).toUpperCase()
    return `${namePart}-${suffix}`
}

/**
 * GET /api/referral — Get user's referral code + stats
 */
export async function GET() {
    try {
        const userId = await getUserIdFromCookies()
        if (!userId) {
            return NextResponse.json(
                { ok: false, error: 'غير مصرح' },
                { status: 401 }
            )
        }

        const supabase = getSupabase()

        // Get user info
        const { data: user, error: userError } = await (supabase as any)
            .from('users')
            .select('id, full_name, referral_code')
            .eq('id', userId)
            .single()

        if (userError || !user) {
            authLogger.error('Failed to fetch user for referral', userError)
            return NextResponse.json(
                { ok: false, error: 'المستخدم غير موجود' },
                { status: 404 }
            )
        }

        let referralCode = user.referral_code as string | null

        // Generate referral code if not exists
        if (!referralCode) {
            referralCode = generateReferralCode(user.full_name || '', userId)

            // Check for uniqueness, add extra chars if needed
            const { data: existing } = await (supabase as any)
                .from('users')
                .select('id')
                .eq('referral_code', referralCode)
                .neq('id', userId)
                .maybeSingle()

            if (existing) {
                const bytes = crypto.getRandomValues(new Uint8Array(2))
                const extra = Array.from(bytes, b => b.toString(36).padStart(2, '0')).join('').substring(0, 2).toUpperCase()
                referralCode = `${referralCode}${extra}`
            }

            // Save to user record (may fail if column doesn't exist — non-critical)
            try {
                await (supabase as any)
                    .from('users')
                    .update({ referral_code: referralCode })
                    .eq('id', userId)
            } catch (saveErr) {
                authLogger.error('Failed to save referral code', saveErr)
            }
        }

        // Get referral stats (table may not exist yet — handle gracefully)
        let referrals: any[] | null = null
        try {
            const { data } = await (supabase as any)
                .from('referrals')
                .select('id, referred_email, referred_user_id, status, reward_value, created_at')
                .eq('referrer_id', userId)
                .order('created_at', { ascending: false })
            referrals = data
        } catch {
            // referrals table may not exist — that's ok
            referrals = []
        }

        const stats = {
            total: referrals?.length || 0,
            registered: referrals?.filter(r => r.status === 'registered' || r.status === 'paid' || r.status === 'rewarded').length || 0,
            paid: referrals?.filter(r => r.status === 'paid' || r.status === 'rewarded').length || 0,
            totalEarnings: referrals?.filter(r => r.status === 'rewarded').reduce((sum, r) => sum + (r.reward_value || 0), 0) || 0,
        }

        const siteUrl = SITE_URL

        return NextResponse.json({
            ok: true,
            referralCode,
            referralLink: `${siteUrl}/register?ref=${referralCode}`,
            stats,
            referrals: referrals?.map(r => ({
                email: r.referred_email ? r.referred_email.replace(/(.{2})(.*)(@.*)/, '$1***$3') : 'غير معروف',
                status: r.status,
                reward: r.reward_value || 50,
                date: r.created_at,
            })) || [],
        })
    } catch (error) {
        authLogger.error('Referral GET error', error)
        return NextResponse.json(
            { ok: false, error: 'حدث خطأ غير متوقع' },
            { status: 500 }
        )
    }
}

/**
 * POST /api/referral — Validate a referral code (used during registration)
 */
export async function POST(request: NextRequest) {
    try {
        // SECURITY: Rate limit referral submissions
        const clientIP = getClientIP(request)
        const rateLimit = checkRateLimit(`referral-post:${clientIP}`, { maxRequests: 10, windowSeconds: 60 })
        if (!rateLimit.allowed) {
            return NextResponse.json(
                { ok: false, error: 'طلبات كثيرة، حاول بعد قليل' },
                { status: 429 }
            )
        }

        const body = await request.json()
        const { referralCode, referredEmail, referredUserId } = body

        if (!referralCode) {
            return NextResponse.json(
                { ok: false, error: 'كود الإحالة مطلوب' },
                { status: 400 }
            )
        }

        // SECURITY: Validate referral code format
        if (typeof referralCode !== 'string' || referralCode.length > 30) {
            return NextResponse.json(
                { ok: false, error: 'كود الإحالة غير صالح' },
                { status: 400 }
            )
        }

        // SECURITY: Validate email format if provided
        if (referredEmail && (typeof referredEmail !== 'string' || referredEmail.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(referredEmail))) {
            return NextResponse.json(
                { ok: false, error: 'البريد الإلكتروني غير صالح' },
                { status: 400 }
            )
        }

        const supabase = getSupabase()

        // Find the referrer by referral_code
        const { data: referrer } = await supabase
            .from('users')
            .select('id, full_name, referral_code')
            .eq('referral_code', referralCode.toUpperCase())
            .single()

        if (!referrer) {
            return NextResponse.json(
                { ok: false, error: 'كود الإحالة غير صالح' },
                { status: 404 }
            )
        }

        // Don't allow self-referral
        if (referredUserId && referrer.id === referredUserId) {
            return NextResponse.json(
                { ok: false, error: 'لا يمكنك استخدام كودك الخاص' },
                { status: 400 }
            )
        }

        // Check if this email was already referred
        if (referredEmail) {
            const { data: existingReferral } = await supabase
                .from('referrals')
                .select('id')
                .eq('referred_email', referredEmail.toLowerCase())
                .maybeSingle()

            if (existingReferral) {
                return NextResponse.json(
                    { ok: false, error: 'هذا البريد مسجل بالفعل من خلال إحالة' },
                    { status: 400 }
                )
            }
        }

        // Create referral record
        const { error: insertError } = await supabase
            .from('referrals')
            .insert({
                referrer_id: referrer.id,
                referred_email: referredEmail?.toLowerCase() || null,
                referred_user_id: referredUserId || null,
                referral_code: referralCode.toUpperCase(),
                status: referredUserId ? 'registered' : 'pending',
                reward_type: 'discount',
                reward_value: 50,
            })

        if (insertError) {
            authLogger.error('Failed to create referral', insertError)
            return NextResponse.json(
                { ok: false, error: 'فشل في تسجيل الإحالة' },
                { status: 500 }
            )
        }

        return NextResponse.json({
            ok: true,
            message: 'تم تسجيل الإحالة بنجاح',
            referrerName: referrer.full_name?.split(' ')[0] || 'صديقك',
            discount: 50,
        })
    } catch (error) {
        authLogger.error('Referral POST error', error)
        return NextResponse.json(
            { ok: false, error: 'حدث خطأ غير متوقع' },
            { status: 500 }
        )
    }
}
