import { NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase-admin'
import { checkRateLimit } from '@/lib/rate-limit'
import { apiLogger } from '@/lib/logger'
import { generateDailyMissions, getTodayMissions } from '@/lib/missions'
import { getAuthenticatedUser } from '@/lib/auth-middleware'

// =====================================================
// API: /api/missions — GET (fetch or generate today's missions)
// =====================================================

/**
 * GET /api/missions
 * جلب مهام اليوم — إذا مفيش مهام لليوم يتم توليد 3 مهام عشوائية
 */
export async function GET() {
    try {
        const userId = await getAuthenticatedUser()

        if (!userId) {
            return NextResponse.json({ error: 'غير مصرح' }, { status: 401 })
        }

        // Rate limiting
        const rateLimit = checkRateLimit(`missions-get-${userId}`, { maxRequests: 30, windowSeconds: 60 })
        if (!rateLimit.allowed) {
            return NextResponse.json(
                { error: 'طلبات كثيرة، حاول بعد قليل', retryAfter: rateLimit.retryAfter },
                { status: 429 }
            )
        }

        // جلب المهام الموجودة
        let missions = await getTodayMissions(userId)

        // إذا مفيش مهام لليوم → توليد
        if (missions.length === 0) {
            // جلب مستوى وباقة المستخدم
            const supabase = getSupabaseAdmin()

            const { data: gamData } = await supabase
                .from('user_gamification')
                .select('current_level')
                .eq('user_id', userId)
                .maybeSingle() as { data: { current_level: number } | null }

            const { data: planData } = await supabase
                .rpc('get_user_plan', { p_user_id: userId }) as { data: { plan_id: string | null }[] | null }

            const userLevel = gamData?.current_level || 1
            const userPlan = planData?.[0]?.plan_id || null

            missions = await generateDailyMissions(userId, userLevel, userPlan)
        }

        // تجهيز الاستجابة
        const formattedMissions = missions.map(m => {
            const template = m.template
            const titleWithTarget = template?.title_ar?.replace('{target}', String(m.target_value)) || ''
            return {
                id: m.id,
                title: titleWithTarget,
                description: template?.description_ar || '',
                icon: template?.icon || '🎯',
                category: template?.category || 'reading',
                target_value: m.target_value,
                current_value: m.current_value,
                status: m.status,
                points_earned: m.points_earned,
                base_points: template?.base_points || 0,
                bonus_multiplier: template?.bonus_multiplier || 1,
                slot_number: m.slot_number,
                completed_at: m.completed_at,
            }
        })

        // حساب الإحصائيات
        const completedCount = formattedMissions.filter(m => m.status === 'completed').length
        const totalPoints = formattedMissions.reduce((sum, m) => sum + m.points_earned, 0)

        return NextResponse.json({
            data: formattedMissions,
            stats: {
                total: formattedMissions.length,
                completed: completedCount,
                total_points: totalPoints,
                all_clear: completedCount === 3,
            },
        })

    } catch (err: unknown) {
        apiLogger.error('Error in GET /api/missions', err)
        return NextResponse.json(
            { error: 'حدث خطأ في جلب المهام' },
            { status: 500 }
        )
    }
}
