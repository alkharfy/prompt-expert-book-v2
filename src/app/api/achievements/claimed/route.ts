import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase-admin'
import { checkRateLimit } from '@/lib/rate-limit'
import { getAuthenticatedUser } from '@/lib/auth-middleware'
import { dbLogger } from '@/lib/logger'

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

        const body = await request.json()
        const { rewardId } = body

        if (!rewardId || typeof rewardId !== 'string' || rewardId.length > 100) {
            return NextResponse.json({ error: 'معرف المكافأة غير صالح' }, { status: 400 })
        }

        const supabase = getSupabaseAdmin()

        // التحقق من عدم المطالبة سابقاً
        const { data: existing } = await supabase
            .from('user_claimed_rewards')
            .select('id')
            .eq('user_id', userId)
            .eq('reward_id', rewardId)
            .maybeSingle()

        if (existing) {
            return NextResponse.json({ success: true, alreadyClaimed: true })
        }

        // تسجيل المطالبة — handle duplicate gracefully (race condition / double-click)
        const { error } = await supabase
            .from('user_claimed_rewards')
            .insert({
                user_id: userId,
                reward_id: rewardId,
            })

        if (error) {
            // 23505 = unique constraint violation (already claimed via race condition)
            if (error.code === '23505') {
                return NextResponse.json({ success: true, alreadyClaimed: true })
            }
            dbLogger.error('Error claiming reward:', error)
            return NextResponse.json({ error: 'خطأ في تسجيل المكافأة' }, { status: 500 })
        }

        return NextResponse.json({ success: true })
    } catch (err) {
        dbLogger.error('Claimed rewards POST error:', err)
        return NextResponse.json({ error: 'خطأ في الخادم' }, { status: 500 })
    }
}

// PUT: مزامنة مكافآت localStorage القديمة إلى الخادم (migration)
// Body: { rewardIds: string[] }
export async function PUT(request: NextRequest) {
    try {
        const userId = await getAuthenticatedUser()

        if (!userId) {
            return NextResponse.json({ error: 'غير مصرح' }, { status: 401 })
        }

        const body = await request.json()
        const { rewardIds } = body

        if (!Array.isArray(rewardIds) || rewardIds.length === 0) {
            return NextResponse.json({ success: true, synced: 0 })
        }

        // حد أقصى 50 مكافأة للمزامنة
        const validIds = rewardIds
            .filter((id: unknown) => typeof id === 'string' && id.length <= 100)
            .slice(0, 50)

        if (validIds.length === 0) {
            return NextResponse.json({ success: true, synced: 0 })
        }

        const supabase = getSupabaseAdmin()

        // إدراج دفعة واحدة مع تجاهل التكرارات
        const rows = validIds.map((rewardId: string) => ({
            user_id: userId,
            reward_id: rewardId,
        }))

        const { error } = await (supabase as any)
            .from('user_claimed_rewards')
            .upsert(rows, { onConflict: 'user_id,reward_id', ignoreDuplicates: true })

        if (error) {
            dbLogger.error('Error syncing claimed rewards:', error)
            return NextResponse.json({ error: 'خطأ في المزامنة' }, { status: 500 })
        }

        return NextResponse.json({ success: true, synced: validIds.length })
    } catch (err) {
        dbLogger.error('Claimed rewards PUT error:', err)
        return NextResponse.json({ error: 'خطأ في الخادم' }, { status: 500 })
    }
}
