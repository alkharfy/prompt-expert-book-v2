import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase-admin'
import { checkRateLimit } from '@/lib/rate-limit'
import { getAuthenticatedUser } from '@/lib/auth-middleware'
import { dbLogger } from '@/lib/logger'
import { getReadingReward } from '@/lib/server/reading-rewards'
import { userHasFeature } from '@/lib/subscription'

// GET: جلب المكافآت المطالب بها للمستخدم الحالي
export async function GET() {
    try {
        const userId = await getAuthenticatedUser()

        if (!userId) {
            return NextResponse.json({ error: 'غير مصرح' }, { status: 401 })
        }

        const supabase = getSupabaseAdmin()

        const { data, error } = await supabase
            .from('user_claimed_rewards')
            .select('reward_id')
            .eq('user_id', userId)

        if (error) {
            dbLogger.error('Error fetching claimed rewards:', error)
            return NextResponse.json({ error: 'خطأ في الخادم' }, { status: 500 })
        }

        const rewardIds = (data || []).map((r: { reward_id: string }) => r.reward_id)

        return NextResponse.json({ rewards: rewardIds })
    } catch (err) {
        dbLogger.error('Claimed rewards GET error:', err)
        return NextResponse.json({ error: 'خطأ في الخادم' }, { status: 500 })
    }
}

// POST: تسجيل مطالبة بمكافأة جديدة
// Body: { rewardId: string }
export async function POST(request: NextRequest) {
    try {
        const userId = await getAuthenticatedUser()

        if (!userId) {
            return NextResponse.json({ error: 'غير مصرح' }, { status: 401 })
        }

        const rateLimit = checkRateLimit(`claimed-rewards-${userId}`, { maxRequests: 30, windowSeconds: 60 })
        if (!rateLimit.allowed) {
            return NextResponse.json(
                { error: 'طلبات كثيرة، حاول بعد قليل', retryAfter: rateLimit.retryAfter },
                { status: 429 }
            )
        }

        let body: unknown
        try { body = await request.json() } catch {
            return NextResponse.json({ error: 'بيانات غير صالحة' }, { status: 400 })
        }
        if (!body || typeof body !== 'object' || Array.isArray(body)) {
            return NextResponse.json({ error: 'بيانات غير صالحة' }, { status: 400 })
        }
        const { rewardId } = body as { rewardId?: unknown }

        if (!rewardId || typeof rewardId !== 'string' || rewardId.length > 100) {
            return NextResponse.json({ error: 'معرف المكافأة غير صالح' }, { status: 400 })
        }

        const reward = getReadingReward(rewardId)
        if (!reward) return NextResponse.json({ error: 'معرف المكافأة غير صالح' }, { status: 400 })
        if (reward.requiresReading && !await userHasFeature(userId, 'reading')) {
            return NextResponse.json({ error: 'يلزم اشتراك نشط لهذا التدريب' }, { status: 403 })
        }

        const supabase = getSupabaseAdmin()

        // Claim + XP + history commit in one database transaction. There is no
        // non-atomic fallback when the required migration is missing.
        const { data, error } = await (supabase.rpc as any)('claim_learning_reward', {
            p_user_id: userId, p_reward_id: rewardId, p_points: reward.points,
        })
        if (error || !data || typeof data.alreadyClaimed !== 'boolean'
            || data.pointsEarned !== (data.alreadyClaimed ? 0 : reward.points)) {
            return NextResponse.json({ error: 'تعذّر حفظ المكافأة والنقاط معًا؛ حاول لاحقًا' }, { status: 503 })
        }
        return NextResponse.json({ success: true, alreadyClaimed: data.alreadyClaimed, pointsEarned: data.pointsEarned })
    } catch (err) {
        dbLogger.error('Claimed rewards POST error:', err)
        return NextResponse.json({ error: 'خطأ في الخادم' }, { status: 500 })
    }
}

// Historical server records remain intact. Browser-local flags cannot create
// trusted claims or suppress the one-time award boundary.
export async function PUT() {
    if (!await getAuthenticatedUser()) return NextResponse.json({ error: 'غير مصرح' }, { status: 401 })
    return NextResponse.json({ error: 'سجل المكافآت يُحدّث بالمطالبة الفردية من الخادم فقط' }, { status: 403 })
}
