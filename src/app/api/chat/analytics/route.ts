import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase-admin'
import { dbLogger } from '@/lib/logger'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
    try {
        // Admin auth: cookie-based (billing admin panel)
        const userId = request.cookies.get('ebook_user_id')?.value
        const sessionToken = request.cookies.get('ebook_session_token')?.value

        let isAdmin = false

        if (userId && sessionToken) {
            const supabaseCheck = getSupabaseAdmin()
            if (supabaseCheck) {
                const { data: session } = await (supabaseCheck as any)
                    .from('sessions')
                    .select('id')
                    .eq('user_id', userId)
                    .eq('session_token', sessionToken)
                    .gt('expires_at', new Date().toISOString())
                    .maybeSingle()

                if (session) {
                    const { data: user } = await supabaseCheck
                        .from('users')
                        .select('is_admin')
                        .eq('id', userId)
                        .single() as { data: { is_admin: boolean } | null; error: any }

                    if (user?.is_admin) {
                        isAdmin = true
                    }
                }
            }
        }

        if (!isAdmin) {
            return NextResponse.json(
                { error: 'غير مصرح' },
                { status: 401 }
            )
        }

        const supabase = getSupabaseAdmin()
        if (!supabase) {
            return NextResponse.json(
                { error: 'خطأ في إعداد قاعدة البيانات' },
                { status: 500 }
            )
        }

        // Run all queries in parallel — use UTC consistently
        const now = new Date()
        const todayISO = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate())).toISOString()

        // 7 days ago (UTC)
        const sevenDaysAgo = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() - 7))

        const [
            totalMessagesResult,
            totalUsersResult,
            todayMessagesResult,
            modelUsageResult,
            positiveRatingsResult,
            negativeRatingsResult,
            recentMessagesResult,
        ] = await Promise.all([
            // Total messages
            supabase
                .from('chat_messages')
                .select('*', { count: 'exact', head: true }),

            // Total unique users (use distinct query)
            supabase.rpc('count_distinct_chat_users'),

            // Today's messages
            supabase
                .from('chat_messages')
                .select('*', { count: 'exact', head: true })
                .gte('created_at', todayISO),

            // Model usage (count only user messages to avoid double-counting)
            // PERFORMANCE: Reduced limit from 50K to 5K to prevent DoS
            supabase
                .from('chat_messages')
                .select('model')
                .eq('role', 'user')
                .not('model', 'is', null)
                .limit(5000),

            // Positive ratings
            supabase
                .from('chat_ratings')
                .select('*', { count: 'exact', head: true })
                .eq('rating', 1),

            // Negative ratings
            supabase
                .from('chat_ratings')
                .select('*', { count: 'exact', head: true })
                .eq('rating', -1),

            // Recent messages for daily usage (last 7 days)
            // PERFORMANCE: Added limit to prevent unbounded fetch
            supabase
                .from('chat_messages')
                .select('created_at')
                .gte('created_at', sevenDaysAgo.toISOString())
                .order('created_at', { ascending: true })
                .limit(10000),
        ])

        // Get unique users count from RPC
        const uniqueUsers = totalUsersResult.data ?? 0

        // Calculate model usage distribution
        const modelCounts: Record<string, number> = {}
        for (const row of modelUsageResult.data || []) {
            const m = (row as { model: string }).model
            if (m) {
                modelCounts[m] = (modelCounts[m] || 0) + 1
            }
        }
        const modelUsage = Object.entries(modelCounts)
            .map(([model, count]) => ({ model, count }))
            .sort((a, b) => b.count - a.count)

        // Calculate daily usage for last 7 days (UTC)
        const dailyMap: Record<string, number> = {}
        for (let i = 0; i < 7; i++) {
            const d = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() - i))
            dailyMap[d.toISOString().slice(0, 10)] = 0
        }
        for (const row of recentMessagesResult.data || []) {
            const date = (row as { created_at: string }).created_at.slice(0, 10)
            if (date in dailyMap) {
                dailyMap[date]++
            }
        }
        const dailyUsage = Object.entries(dailyMap)
            .map(([date, count]) => ({ date, count }))
            .sort((a, b) => b.date.localeCompare(a.date))

        return NextResponse.json({
            totalMessages: totalMessagesResult.count || 0,
            totalUsers: uniqueUsers,
            todayMessages: todayMessagesResult.count || 0,
            modelUsage,
            ratings: {
                positive: positiveRatingsResult.count || 0,
                negative: negativeRatingsResult.count || 0,
            },
            dailyUsage,
        })
    } catch (err) {
        dbLogger.error('Chat analytics error:', err)
        return NextResponse.json(
            { error: 'حدث خطأ غير متوقع' },
            { status: 500 }
        )
    }
}
