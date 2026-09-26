import { NextRequest, NextResponse } from 'next/server'
import { verifyPaymentSession } from '@/lib/kashier'
import { getSupabaseAdmin } from '@/lib/supabase-admin'
import { dbLogger } from '@/lib/logger'
import { getAuthenticatedUser } from '@/lib/auth-middleware'
import { checkRateLimitAsync, getClientIP, RATE_LIMITS } from '@/lib/rate-limit'

/**
 * Verify payment by userId - finds latest pending payment and verifies it
 * POST /api/payment/verify-by-user
 */
export async function POST(request: NextRequest) {
    try {
        // استخراج userId من cookies مع التحقق من الجلسة
        const userId = await getAuthenticatedUser({ skipActiveCheck: true })

        if (!userId) {
            return NextResponse.json(
                { error: 'غير مصرح - يرجى تسجيل الدخول' },
                { status: 401 }
            )
        }

        // SECURITY: Rate limit
        const clientIP = getClientIP(request)
        const rateLimitResult = await checkRateLimitAsync(`payment-verify-user:${userId}:${clientIP}`, RATE_LIMITS.PAYMENT_VERIFY)
        if (!rateLimitResult.allowed) {
            return NextResponse.json(
                { error: `تم تجاوز عدد المحاولات. حاول مجدداً بعد ${rateLimitResult.retryAfter} ثانية` },
                { status: 429 }
            )
        }

        const supabase = getSupabaseAdmin()
        const { data: existingSuccess } = await (supabase
            .from('payments') as any)
            .select('id')
            .eq('user_id', userId)
            .eq('status', 'success')
            .maybeSingle()

        if (existingSuccess) {
            return NextResponse.json({
                success: true,
                status: 'SUCCESS',
                message: 'تم الدفع بنجاح مسبقاً',
                userId
            })
        }

        // Find the latest pending payment for this user
        const { data: payments, error: dbError } = await (supabase
            .from('payments') as any)
            .select('id, kashier_session_id, status, plan_id, kashier_order_id')
            .eq('user_id', userId)
            .eq('status', 'pending')
            .order('created_at', { ascending: false })
            .limit(1)

        if (dbError || !payments || payments.length === 0) {
            return NextResponse.json(
                { error: 'لم يتم العثور على عملية دفع معلقة' },
                { status: 404 }
            )
        }

        const payment = payments[0]

        // Verify with Kashier
        if (payment.kashier_session_id) {
            const verifyResult = await verifyPaymentSession(payment.kashier_session_id)

            if (verifyResult.ok && verifyResult.paid) {
                // Update payment status
                await (supabase.from('payments') as any)
                    .update({
                        status: 'success',
                        paid_at: new Date().toISOString(),
                        payment_method: verifyResult.data?.method || null
                    })
                    .eq('id', payment.id)

                // Create subscription
                const startsAt = new Date()
                const expiresAt = new Date(startsAt)
                expiresAt.setDate(expiresAt.getDate() + 365)

                const { data: existingSub } = await (supabase as any)
                    .from('subscriptions')
                    .select('id')
                    .eq('payment_id', payment.id)
                    .maybeSingle()

                if (!existingSub) {
                    await (supabase as any)
                        .from('subscriptions')
                        .insert({
                            user_id: userId,
                            plan_id: payment.plan_id,
                            payment_id: payment.id,
                            status: 'active',
                            starts_at: startsAt.toISOString(),
                            expires_at: expiresAt.toISOString(),
                        })
                }

                // Always ensure user is marked active + verified + plan updated
                await (supabase as any)
                    .from('users')
                    .update({
                        current_plan: payment.plan_id,
                        plan_expires_at: expiresAt.toISOString(),
                        is_active: true,
                        is_verified: true,
                    })
                    .eq('id', userId)

                return NextResponse.json({
                    success: true,
                    status: 'SUCCESS',
                    message: 'تم الدفع بنجاح',
                    userId
                })
            }

            return NextResponse.json({
                success: false,
                status: verifyResult.status || 'UNKNOWN',
                error: 'لم يتم الدفع بنجاح'
            })
        }

        return NextResponse.json({
            success: false,
            error: 'لم يتم العثور على جلسة دفع'
        })
    } catch (error) {
        dbLogger.error('Payment verify-by-user error:', error)
        return NextResponse.json(
            { error: 'حدث خطأ في التحقق من الدفع' },
            { status: 500 }
        )
    }
}
