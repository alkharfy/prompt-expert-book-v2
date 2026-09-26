import { NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase-admin'
import { getAuthenticatedUser } from '@/lib/auth-middleware'
import { checkRateLimit } from '@/lib/rate-limit'
import { dbLogger } from '@/lib/logger'

interface GamificationRow {
    current_streak: number
    longest_streak: number
    last_activity_date: string | null
    current_level: number
    total_points: number
}

// GET: Fetch current streak status
export async function GET() {
    try {
        const userId = await getAuthenticatedUser()

        if (!userId) {
            return NextResponse.json({ error: 'غير مصرح' }, { status: 401 })
        }

        const supabase = getSupabaseAdmin()

        const { data, error } = await supabase
            .from('user_gamification')
            .select('current_streak, longest_streak, last_activity_date, current_level, total_points')
            .eq('user_id', userId)
            .maybeSingle() as { data: GamificationRow | null; error: { message: string } | null }

        if (error) {
            dbLogger.error('Error fetching streak:', error)
            return NextResponse.json({ error: 'خطأ في جلب بيانات الـ streak' }, { status: 500 })
        }

        const today = new Date().toISOString().split('T')[0]
        const lastActivity = data?.last_activity_date
        const isActiveToday = lastActivity === today

        // Calculate if streak is at risk (active yesterday but not today)
        let streakAtRisk = false
        if (!isActiveToday && data?.current_streak && data.current_streak > 0) {
            streakAtRisk = true
        }

        return NextResponse.json({
            data: {
                current_streak: data?.current_streak || 0,
                longest_streak: data?.longest_streak || 0,
                last_activity_date: lastActivity || null,
                current_level: data?.current_level || 1,
                total_points: data?.total_points || 0,
                is_active_today: isActiveToday,
                streak_at_risk: streakAtRisk,
            }
        })
    } catch (err) {
        dbLogger.error('Streak GET error:', err)
        return NextResponse.json({ error: 'خطأ في الخادم' }, { status: 500 })
    }
}

// POST: Record daily activity and update streak
export async function POST() {
    try {
        const userId = await getAuthenticatedUser()

        if (!userId) {
            return NextResponse.json({ error: 'غير مصرح' }, { status: 401 })
        }

        // SECURITY: Rate limit streak updates
        const rateLimit = checkRateLimit(`streak-post-${userId}`, { maxRequests: 10, windowSeconds: 60 })
        if (!rateLimit.allowed) {
            return NextResponse.json(
                { error: 'طلبات كثيرة، حاول بعد قليل', retryAfter: rateLimit.retryAfter },
                { status: 429 }
            )
        }

        const supabase = getSupabaseAdmin()

        // Call the database function to update streak atomically
        const { error: rpcError } = await supabase.rpc('update_user_streak', {
            p_user_id: userId
        })

        if (rpcError) {
            dbLogger.error('Error updating streak via RPC:', rpcError)
            return NextResponse.json({ error: 'خطأ في تحديث الـ streak' }, { status: 500 })
        }

        // Fetch updated data to return
        const { data, error } = await supabase
            .from('user_gamification')
            .select('current_streak, longest_streak, last_activity_date, current_level, total_points')
            .eq('user_id', userId)
            .maybeSingle() as { data: GamificationRow | null; error: { message: string } | null }

        if (error) {
            dbLogger.error('Error fetching updated streak:', error)
            return NextResponse.json({ error: 'خطأ في جلب بيانات الـ streak' }, { status: 500 })
        }

        const today = new Date().toISOString().split('T')[0]

        return NextResponse.json({
            success: true,
            data: {
                current_streak: data?.current_streak || 1,
                longest_streak: data?.longest_streak || 1,
                last_activity_date: data?.last_activity_date || today,
                current_level: data?.current_level || 1,
                total_points: data?.total_points || 0,
                is_active_today: true,
                streak_at_risk: false,
            }
        })
    } catch (err) {
        dbLogger.error('Streak POST error:', err)
        return NextResponse.json({ error: 'خطأ في الخادم' }, { status: 500 })
    }
}

