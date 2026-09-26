import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase-admin'
import { dbLogger } from '@/lib/logger'
import { getAuthenticatedUser } from '@/lib/auth-middleware'

/**
 * Admin Action: Cancel Subscription
 *
 * يلغي اشتراك نشط.
 *
 * Request Body:
 * {
 *   "subscriptionId": "uuid",
 *   "reason": "string (optional)"
 * }
 *
 * Security:
 * - Requires admin authentication (is_admin = true)
 * - Logs action to audit log
 *
 * @module api/admin/subscriptions/cancel
 */

export async function POST(request: NextRequest) {
    try {
        // 1. التحقق من صلاحية admin
        const userId = await getAuthenticatedUser()
        if (!userId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const supabase = getSupabaseAdmin()

        // التحقق من أن المستخدم admin
        const { data: adminUser } = await supabase
            .from('users')
            .select('is_admin')
            .eq('id', userId)
            .single() as { data: { is_admin: boolean } | null }

        if (!adminUser || !adminUser.is_admin) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
        }

        // 2. استخراج البيانات
        const body = await request.json()
        const { subscriptionId, reason } = body

        if (!subscriptionId) {
            return NextResponse.json(
                { error: 'Missing subscriptionId' },
                { status: 400 }
            )
        }

        // 3. جلب الاشتراك الحالي
        const { data: subscription, error: fetchError } = await (supabase as any)
            .from('subscriptions')
            .select('id, user_id, status')
            .eq('id', subscriptionId)
            .single()

        if (fetchError || !subscription) {
            dbLogger.error('[Admin] Subscription not found:', subscriptionId)
            return NextResponse.json(
                { error: 'Subscription not found' },
                { status: 404 }
            )
        }

        // 4. تحديث حالة الاشتراك إلى 'cancelled'
        const { error: updateError } = await (supabase as any)
            .from('subscriptions')
            .update({ status: 'cancelled' })
            .eq('id', subscriptionId)

        if (updateError) {
            dbLogger.error('[Admin] Error cancelling subscription:', updateError)
            throw updateError
        }

        // Cancelling an old payment must preserve any other valid subscription.
        const { data: remaining, error: remainingError } = await (supabase as any)
            .from('subscriptions').select('plan_id, expires_at')
            .eq('user_id', subscription.user_id).eq('status', 'active')
            .gt('expires_at', new Date().toISOString())
            .order('created_at', { ascending: false }).limit(1).maybeSingle()
        if (remainingError) throw remainingError
        const { error: userUpdateError } = await (supabase as any)
            .from('users')
            .update({
                current_plan: remaining?.plan_id || null,
                plan_expires_at: remaining?.expires_at || null,
                is_active: !!remaining,
            })
            .eq('id', subscription.user_id)
        if (userUpdateError) throw userUpdateError

        dbLogger.info(`[Admin] Cancelled subscription ${subscriptionId}. Reason: ${reason || 'N/A'}`)

        return NextResponse.json({
            success: true,
            message: 'Subscription cancelled successfully',
            subscription: {
                id: subscriptionId,
                user_id: subscription.user_id,
                old_status: subscription.status,
                new_status: 'cancelled',
                reason: reason || null,
            },
        })
    } catch (error) {
        dbLogger.error('[Admin] Cancel subscription error:', error)
        return NextResponse.json(
            { error: 'Failed to cancel subscription' },
            { status: 500 }
        )
    }
}
