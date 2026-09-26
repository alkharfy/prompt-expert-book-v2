import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase-admin'
import { dbLogger } from '@/lib/logger'
import { getAuthenticatedUser } from '@/lib/auth-middleware'
import { checkRateLimitAsync, getClientIP, RATE_LIMITS } from '@/lib/rate-limit'

/**
 * Self-service activation — check if user has a successful payment and activate subscription
 * Also checks Kashier if there's a pending payment that might have been paid
 *
 * POST /api/payment/activate
 */
export async function POST(request: NextRequest) {
    try {
        // استخراج userId من cookies مع التحقق من الجلسة
        const userId = await getAuthenticatedUser({ skipActiveCheck: true })

        if (!userId) {
            return NextResponse.json({ success: false, error: 'غير مصرح - يرجى تسجيل الدخول' }, { status: 401 })
        }

        // SECURITY: Rate limit
        const clientIP = getClientIP(request)
        const rateLimitResult = await checkRateLimitAsync(`payment-activate:${userId}:${clientIP}`, RATE_LIMITS.PAYMENT_ACTIVATE)
        if (!rateLimitResult.allowed) {
            return NextResponse.json(
                { success: false, error: `تم تجاوز عدد المحاولات. حاول مجدداً بعد ${rateLimitResult.retryAfter} ثانية` },
                { status: 429 }
            )
        }

        const supabase = getSupabaseAdmin()
        const { data: existingSub } = await (supabase as any)
            .from('subscriptions')
            .select('id, plan_id, status')
            .eq('user_id', userId)
            .eq('status', 'active')
            .maybeSingle()

        if (existingSub) {
            // Make sure user table is synced
            await (supabase as any)
                .from('users')
                .update({
                    current_plan: existingSub.plan_id,
                    is_active: true,
                })
                .eq('id', userId)

            // Look up the matching successful payment for analytics fields.
            const { data: paid } = await (supabase as any)
                .from('payments')
                .select('amount, kashier_order_id')
                .eq('user_id', userId)
                .eq('status', 'success')
                .order('created_at', { ascending: false })
                .limit(1)
                .maybeSingle()

            return NextResponse.json({
                success: true,
                hasPaid: true,
                plan: existingSub.plan_id,
                planId: existingSub.plan_id,
                amount: paid?.amount ?? null,
                orderId: paid?.kashier_order_id ?? null,
                message: 'الاشتراك مفعل بالفعل'
            })
        }

        // 2. Check for successful payment without subscription
        const { data: successPayment } = await (supabase as any)
            .from('payments')
            .select('id, plan_id, status, amount, kashier_order_id')
            .eq('user_id', userId)
            .eq('status', 'success')
            .order('created_at', { ascending: false })
            .limit(1)
            .maybeSingle()

        if (successPayment) {
            // Payment exists but no subscription — create one
            const planId = successPayment.plan_id || 'basic'
            await createSubscription(supabase, userId, successPayment.id, planId)

            return NextResponse.json({
                success: true,
                hasPaid: true,
                plan: planId,
                planId,
                amount: successPayment.amount ?? null,
                orderId: successPayment.kashier_order_id ?? null,
                message: 'تم تفعيل الاشتراك بنجاح'
            })
        }

        // 3. Check for pending payment — might have been paid on Kashier
        const { data: pendingPayment } = await (supabase as any)
            .from('payments')
            .select('id, kashier_session_id, kashier_order_id, plan_id, status, amount')
            .eq('user_id', userId)
            .eq('status', 'pending')
            .order('created_at', { ascending: false })
            .limit(1)
            .maybeSingle()

        if (pendingPayment && pendingPayment.kashier_session_id) {
            // Try to verify via Kashier API
            try {
                const { verifyPaymentSession } = await import('@/lib/kashier')
                const result = await verifyPaymentSession(pendingPayment.kashier_session_id)

                if (result.ok && result.paid) {
                    // Payment was actually successful! Update and activate
                    await (supabase as any)
                        .from('payments')
                        .update({
                            status: 'success',
                            paid_at: new Date().toISOString(),
                        })
                        .eq('id', pendingPayment.id)

                    const planId = pendingPayment.plan_id || 'basic'
                    await createSubscription(supabase, userId, pendingPayment.id, planId)

                    dbLogger.info(`[activate] Recovered payment ${pendingPayment.id} for user ${userId}`)
                    return NextResponse.json({
                        success: true,
                        hasPaid: true,
                        plan: planId,
                        planId,
                        amount: pendingPayment.amount ?? null,
                        orderId: pendingPayment.kashier_order_id ?? null,
                        message: 'تم استعادة الدفع وتفعيل الاشتراك بنجاح'
                    })
                }
            } catch (err) {
                dbLogger.error('[activate] Kashier verify error:', err)
            }
        }

        // 4. Check if user record has a valid current_plan with non-expired date
        const { data: user } = await (supabase as any)
            .from('users')
            .select('current_plan, plan_expires_at, is_active')
            .eq('id', userId)
            .maybeSingle()

        if (user && user.current_plan && user.plan_expires_at && new Date(user.plan_expires_at) > new Date()) {
            return NextResponse.json({
                success: true,
                hasPaid: true,
                plan: user.current_plan,
                message: 'الحساب مفعل'
            })
        }

        // No payment found
        return NextResponse.json({
            success: false,
            hasPaid: false,
            message: 'لا توجد عملية دفع ناجحة'
        })
    } catch (error) {
        dbLogger.error('[activate] Unexpected error:', error)
        return NextResponse.json(
            { success: false, error: 'حدث خطأ' },
            { status: 500 }
        )
    }
}

async function createSubscription(supabase: any, userId: string, paymentId: string, planId: string) {
    try {
        // SECURITY: Idempotency check — prevent duplicate subscription creation (race condition)
        const { data: existingSub } = await (supabase as any)
            .from('subscriptions')
            .select('id')
            .eq('payment_id', paymentId)
            .maybeSingle()

        if (existingSub) {
            dbLogger.info(`[activate] Subscription already exists for payment ${paymentId}, skipping`)
            return
        }

        // For upgrades: deactivate any existing active subscriptions
        const { data: activeSubs } = await (supabase as any)
            .from('subscriptions')
            .select('id, plan_id')
            .eq('user_id', userId)
            .eq('status', 'active')

        if (activeSubs && activeSubs.length > 0) {
            for (const sub of activeSubs) {
                await (supabase as any)
                    .from('subscriptions')
                    .update({ status: 'upgraded', updated_at: new Date().toISOString() })
                    .eq('id', sub.id)
                dbLogger.info(`[activate] Deactivated old subscription ${sub.id} (plan: ${sub.plan_id}) for upgrade`)
            }
        }

        const startsAt = new Date()
        const expiresAt = new Date(startsAt)
        expiresAt.setDate(expiresAt.getDate() + 365)

        // Create subscription
        await (supabase as any)
            .from('subscriptions')
            .insert({
                user_id: userId,
                plan_id: planId,
                payment_id: paymentId,
                status: 'active',
                starts_at: startsAt.toISOString(),
                expires_at: expiresAt.toISOString(),
            })

        // Update user's current_plan + entitlement flags
        await (supabase as any)
            .from('users')
            .update({
                current_plan: planId,
                plan_expires_at: expiresAt.toISOString(),
                is_active: true,
                is_verified: true,
            })
            .eq('id', userId)

        dbLogger.info(`[activate] Created subscription for user ${userId}, plan ${planId}`)
    } catch (err) {
        dbLogger.error('[activate] Subscription creation error:', err)
    }
}
