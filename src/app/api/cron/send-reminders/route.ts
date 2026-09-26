import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase-admin'
import { apiLogger } from '@/lib/logger'
import crypto from 'crypto'
import {
    sendStreakReminder,
    sendMissionReminder,
    sendWeeklyRecap,
    getWeeklyStats,
    type UserEmailInfo,
} from '@/lib/email'

// =====================================================
// API: /api/cron/send-reminders — GET
// يُستدعى كل ساعة عبر Vercel Cron أو external cron
// =====================================================

export async function GET(request: NextRequest) {
    try {
        // SECURITY: Verify cron secret with timing-safe comparison
        const authHeader = request.headers.get('authorization')
        const cronSecret = process.env.CRON_SECRET

        if (!cronSecret || !authHeader) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const expectedHeader = `Bearer ${cronSecret}`
        const headerBuf = Buffer.from(authHeader)
        const expectedBuf = Buffer.from(expectedHeader)
        if (headerBuf.length !== expectedBuf.length || !crypto.timingSafeEqual(headerBuf, expectedBuf)) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const supabase = getSupabaseAdmin()
        const now = new Date()
        const currentHour = now.getUTCHours()
        const dayOfWeek = now.getUTCDay() // 0 = Sunday, 5 = Friday
        const todayStr = now.toISOString().split('T')[0]

        let emailsSent = 0
        let errors = 0

        // Get all users with email preferences enabled
        const { data: prefs } = await supabase
            .from('email_preferences')
            .select(`
                user_id,
                reminders_enabled,
                reminder_frequency,
                preferred_time,
                streak_reminders,
                mission_reminders,
                weekly_recap,
                last_email_sent_at,
                total_emails_sent,
                unsubscribe_token
            `)
            .eq('reminders_enabled', true)

        if (!prefs || prefs.length === 0) {
            return NextResponse.json({ ok: true, message: 'No users to email', sent: 0 })
        }

        for (const pref of prefs) {
            try {
                // Check: max 1 email/day (except milestones)
                if (pref.last_email_sent_at) {
                    const lastSentDate = new Date(pref.last_email_sent_at).toISOString().split('T')[0]
                    if (lastSentDate === todayStr) continue
                }

                // Check: max 3 emails/week
                const oneWeekAgo = new Date(now)
                oneWeekAgo.setDate(oneWeekAgo.getDate() - 7)
                const { data: weeklyEmails } = await supabase
                    .from('email_log')
                    .select('id')
                    .eq('user_id', pref.user_id)
                    .gte('sent_at', oneWeekAgo.toISOString())

                if ((weeklyEmails?.length || 0) >= 3) continue

                // Check preferred time (± 1 hour)
                const prefHour = parseInt(pref.preferred_time?.split(':')[0] || '18')
                // Simple timezone offset (Cairo = UTC+2)
                const cairoHour = (currentHour + 2) % 24
                if (Math.abs(cairoHour - prefHour) > 1 && Math.abs(cairoHour - prefHour) < 23) continue

                // Get user info
                const { data: user } = await supabase
                    .from('users')
                    .select('id, email, full_name')
                    .eq('id', pref.user_id)
                    .single()

                if (!user) continue

                // Get gamification data
                const { data: gamData } = await supabase
                    .from('user_gamification')
                    .select('current_streak, total_points, chapters_completed, last_activity_date')
                    .eq('user_id', pref.user_id)
                    .maybeSingle()

                const userInfo: UserEmailInfo = {
                    id: user.id,
                    email: user.email,
                    full_name: user.full_name || 'قارئ',
                    current_streak: (gamData as Record<string, unknown>)?.current_streak as number || 0,
                    total_points: (gamData as Record<string, unknown>)?.total_points as number || 0,
                    chapters_completed: (gamData as Record<string, unknown>)?.chapters_completed as number || 0,
                    last_activity_date: (gamData as Record<string, unknown>)?.last_activity_date as string || null,
                }

                // Check if user is active today — if so, skip
                if (userInfo.last_activity_date === todayStr) continue

                // Smart frequency algorithm
                let sent = false

                // 1. Friday → weekly recap
                if (dayOfWeek === 5 && pref.weekly_recap) {
                    const stats = await getWeeklyStats(pref.user_id)
                    sent = await sendWeeklyRecap(userInfo, stats, pref.unsubscribe_token)
                }

                // 2. Streak reminder (streak >= 3 + no activity today, after 6pm)
                if (!sent && pref.streak_reminders && userInfo.current_streak! >= 3 && cairoHour >= 18) {
                    sent = await sendStreakReminder(userInfo, pref.unsubscribe_token)
                }

                // 3. Mission reminder (after 4pm)
                if (!sent && pref.mission_reminders && cairoHour >= 16) {
                    // Check if user has incomplete missions today
                    const { data: missions } = await supabase
                        .from('user_daily_missions')
                        .select('status')
                        .eq('user_id', pref.user_id)
                        .eq('mission_date', todayStr)
                        .eq('status', 'active')

                    if (missions && missions.length > 0) {
                        sent = await sendMissionReminder(userInfo, pref.unsubscribe_token)
                    }
                }

                if (sent) emailsSent++
            } catch (userError) {
                errors++
                apiLogger.error(`Error processing reminders for user ${pref.user_id}`, userError)
            }
        }

        apiLogger.info(`Cron: sent ${emailsSent} emails, ${errors} errors`)
        return NextResponse.json({ ok: true, sent: emailsSent, errors, total: prefs.length })
    } catch (error) {
        apiLogger.error('Cron send-reminders error', error)
        return NextResponse.json({ error: 'Internal error' }, { status: 500 })
    }
}
