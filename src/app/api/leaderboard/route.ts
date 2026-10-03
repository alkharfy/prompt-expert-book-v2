import 'server-only'
import { NextRequest, NextResponse } from 'next/server'
import { getAuthenticatedUser } from '@/lib/auth-middleware'
import { getSupabaseAdmin } from '@/lib/supabase-admin'
import { userHasFeature } from '@/lib/subscription'
import { dbLogger } from '@/lib/logger'

const orderColumns = {
    points: 'total_points',
    streak: 'current_streak',
    exercises: 'exercises_completed',
} as const

type LeaderboardRecord = {
    user_id: string
    total_points: number | null
    current_level: number | null
    current_streak: number | null
    exercises_completed: number | null
}

const response = (body: unknown, status = 200) => NextResponse.json(body, {
    status, headers: { 'Cache-Control': 'private, no-store' },
})

function count(value: unknown, fallback = 0): number {
    return typeof value === 'number' && Number.isSafeInteger(value) && value >= 0 ? value : fallback
}

function displayName(value: unknown): string {
    if (typeof value !== 'string' || value.includes('@')) return 'متعلم'
    return value.trim().slice(0, 80) || 'متعلم'
}

export async function GET(request: NextRequest) {
    try {
        const userId = await getAuthenticatedUser()
        if (!userId) return response({ error: 'يرجى تسجيل الدخول لعرض لوحة المتصدرين' }, 401)
        if (!await userHasFeature(userId, 'leaderboard')) {
            return response({ error: 'لوحة المتصدرين متاحة مع اشتراك نشط في Pro أو VIP' }, 403)
        }

        const tab = new URL(request.url).searchParams.get('tab') ?? 'points'
        if (!Object.prototype.hasOwnProperty.call(orderColumns, tab)) {
            return response({ error: 'تبويب المتصدرين غير صالح' }, 400)
        }

        const db = getSupabaseAdmin()
        const { data, error } = await (db.from('user_gamification') as any)
            .select('user_id, total_points, current_level, current_streak, exercises_completed')
            .order(orderColumns[tab as keyof typeof orderColumns], { ascending: false })
            .order('user_id', { ascending: true })
            .limit(50)
        if (error) throw error
        const records: LeaderboardRecord[] = data || []
        if (!records.length) return response({ entries: [] })

        const userIds = records.map(record => record.user_id)
        const [users, badges] = await Promise.all([
            (db.from('users') as any).select('id, full_name').in('id', userIds),
            (db.from('user_badges') as any).select('user_id').in('user_id', userIds),
        ])
        if (users.error) throw users.error
        if (badges.error) throw badges.error
        const names = new Map<string, unknown>((users.data || []).map((user: { id: string; full_name: unknown }) => [user.id, user.full_name]))
        const badgeCounts = new Map<string, number>()
        for (const badge of badges.data || []) {
            badgeCounts.set(badge.user_id, (badgeCounts.get(badge.user_id) || 0) + 1)
        }

        // The viewer needs a flag for their own row, never other users' UUIDs or emails.
        return response({ entries: records.map((record, index) => ({
            displayName: displayName(names.get(record.user_id)),
            total_points: count(record.total_points),
            current_level: Math.min(count(record.current_level, 1) || 1, 10),
            current_streak: count(record.current_streak),
            exercises_completed: count(record.exercises_completed),
            badges_count: badgeCounts.get(record.user_id) || 0,
            rank: index + 1,
            isCurrentUser: record.user_id === userId,
        })) })
    } catch (error) {
        dbLogger.error('Leaderboard request failed', error)
        return response({ error: 'تعذّر تحميل لوحة المتصدرين؛ حاول لاحقًا' }, 503)
    }
}
