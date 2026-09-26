import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase-admin'
import { dbLogger } from '@/lib/logger'
import crypto from 'crypto'

/**
 * Auto-Expiry Cron Job — Stage 5
 *
 * يفحص الاشتراكات المنتهية ويحدث حالتها تلقائياً.
 * يُشغل يومياً عبر Vercel Cron أو external cron service.
 *
 * Usage:
 * - Vercel Cron: Add to vercel.json
 * - Manual: curl https://your-domain.com/api/cron/check-expirations?secret=YOUR_SECRET
 *
 * Security:
 * - Protected by CRON_SECRET environment variable
 * - Only processes subscriptions with status='active'
 *
 * @module api/cron/check-expirations
 */

export async function GET(request: NextRequest) {
    try {
        // 1. SECURITY: Verify CRON_SECRET with timing-safe comparison
        const authHeader = request.headers.get('authorization')
        const cronSecret = process.env.CRON_SECRET

        if (!cronSecret || !authHeader) {
            dbLogger.warn('[Cron] Unauthorized access attempt to check-expirations')
            return NextResponse.json(
                { error: 'Unauthorized' },
                { status: 401 }
            )
        }

        const expectedHeader = `Bearer ${cronSecret}`
        const headerBuf = Buffer.from(authHeader)
        const expectedBuf = Buffer.from(expectedHeader)
        if (headerBuf.length !== expectedBuf.length || !crypto.timingSafeEqual(headerBuf, expectedBuf)) {
            dbLogger.warn('[Cron] Unauthorized access attempt to check-expirations')
            return NextResponse.json(
                { error: 'Unauthorized' },
                { status: 401 }
            )
        }

        // 2. إنشاء admin client
        const supabase = getSupabaseAdmin()

        // 3. جلب الاشتراكات المنتهية (expires_at < NOW() AND status='active')
        const now = new Date().toISOString()

        const { data: expiredSubs, error: fetchError } = await (supabase as any)
            .from('subscriptions')
            .select('id, user_id, plan_id, expires_at')
            .eq('status', 'active')
            .lt('expires_at', now)

        if (fetchError) {
            dbLogger.error('[Cron] Error fetching expired subscriptions:', fetchError)
            throw fetchError
        }

        if (!expiredSubs || expiredSubs.length === 0) {
            dbLogger.info('[Cron] No expired subscriptions found')
            return NextResponse.json({
                success: true,
                message: 'No expired subscriptions',
                count: 0,
            })
        }

        dbLogger.info(`[Cron] Found ${expiredSubs.length} expired subscriptions`)

        // 4. تحديث حالة الاشتراكات إلى 'expired'
        const expiredIds = expiredSubs.map((sub: any) => sub.id)

        const { error: updateError } = await (supabase as any)
            .from('subscriptions')
            .update({ status: 'expired' })
            .in('id', expiredIds)

        if (updateError) {
            dbLogger.error('[Cron] Error updating subscription status:', updateError)
            throw updateError
        }

        // Clear only an expired user term. An older expired subscription must
        // not revoke a renewal/upgrade that is still active.
        const userIds = expiredSubs.map((sub: any) => sub.user_id)

        const { error: userUpdateError } = await (supabase as any)
            .from('users')
            .update({ current_plan: null, plan_expires_at: null, is_active: false })
            .in('id', userIds)
            .lt('plan_expires_at', now)
        if (userUpdateError) throw userUpdateError

        dbLogger.info(`[Cron] Successfully expired ${expiredSubs.length} subscriptions`)

        // SECURITY: Don't return user data in response — only return count
        return NextResponse.json({
            success: true,
            message: `Expired ${expiredSubs.length} subscriptions`,
            count: expiredSubs.length,
        })
    } catch (error) {
        dbLogger.error('[Cron] check-expirations error:', error)
        return NextResponse.json(
            { error: 'Failed to process expirations' },
            { status: 500 }
        )
    }
}
