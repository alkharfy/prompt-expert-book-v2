import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase-admin'
import { dbLogger } from '@/lib/logger'
import { getAuthenticatedUser } from '@/lib/auth-middleware'

/**
 * Admin Action: Extend Subscription
 *
 * يمدد اشتراك موجود بعدد أيام محدد.
 *
 * Request Body:
 * {
 *   "subscriptionId": "uuid",
 *   "days": 30 | 60 | 90 | 365
 * }
 *
 * Security:
 * - Requires admin authentication (is_admin = true)
 * - Logs action to audit log
 *
 * @module api/admin/subscriptions/extend
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
        const { subscriptionId, days } = body

        if (!subscriptionId || !days) {
            return NextResponse.json(
                { error: 'Missing subscriptionId or days' },
                { status: 400 }
            )
        }

        // التحقق من أن days رقم صحيح
        const validDays = [7, 30, 60, 90, 180, 365]
        if (!validDays.includes(days)) {
            return NextResponse.json(
                { error: 'Invalid days value. Must be one of: 7, 30, 60, 90, 180, 365' },
                { status: 400 }
            )
        }

        // 3. جلب الاشتراك الحالي
        const { data: subscription, error: fetchError } = await (supabase as any)
            .from('subscriptions')
            .select('id, user_id, expires_at, status')
            .eq('id', subscriptionId)
            .single()

        if (fetchError || !subscription) {
            dbLogger.error('[Admin] Subscription not found:', subscriptionId)
            return NextResponse.json(
                { error: 'Subscription not found' },
                { status: 404 }
            )
        }

        // 4. حساب تاريخ الانتهاء الجديد
        const currentExpiry = new Date(subscription.expires_at)
        const newExpiry = new Date(currentExpiry)
        newExpiry.setDate(newExpiry.getDate() + days)

        // 5. تحديث الاشتراك
        const { error: updateError } = await (supabase as any)
            .from('subscriptions')
            .update({
                expires_at: newExpiry.toISOString(),
                status: 'active', // إعادة تفعيل إذا كان منتهي
            })
            .eq('id', subscriptionId)

        if (updateError) {
            dbLogger.error('[Admin] Error extending subscription:', updateError)
            throw updateError
        }

        // 6. تحديث users.plan_expires_at
        await (supabase as any)
            .from('users')
            .update({ plan_expires_at: newExpiry.toISOString() })
            .eq('id', subscription.user_id)

        dbLogger.info(`[Admin] Extended subscription ${subscriptionId} by ${days} days`)

        return NextResponse.json({
            success: true,
            message: `Subscription extended by ${days} days`,
            subscription: {
                id: subscriptionId,
                old_expiry: subscription.expires_at,
                new_expiry: newExpiry.toISOString(),
                days_added: days,
            },
        })
    } catch (error) {
        dbLogger.error('[Admin] Extend subscription error:', error)
        return NextResponse.json(
            { error: 'Failed to extend subscription' },
            { status: 500 }
        )
    }
}
