import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase-admin'
import { apiLogger } from '@/lib/logger'
import { getAuthenticatedUser } from '@/lib/auth-middleware'

// =====================================================
// API: /api/email/preferences — GET & PUT
// =====================================================

// GET: جلب تفضيلات الإيميل
export async function GET() {
    try {
        const userId = await getAuthenticatedUser()
        if (!userId) {
            return NextResponse.json({ error: 'غير مسجل الدخول' }, { status: 401 })
        }

        const supabase = getSupabaseAdmin()

        // Ensure preferences exist
        // SECURITY: لا نستخدم SELECT * لتجنب تسريب unsubscribe_token
        const safeColumns = 'user_id, reminders_enabled, reminder_frequency, preferred_time, timezone, streak_reminders, mission_reminders, milestone_notifications, weekly_recap, last_email_sent_at, total_emails_sent, created_at, updated_at'
        const { data: existing } = await supabase
            .from('email_preferences')
            .select(safeColumns)
            .eq('user_id', userId)
            .maybeSingle()

        if (!existing) {
            // Create default preferences
            const { data: newPrefs, error } = await supabase
                .from('email_preferences')
                .insert({ user_id: userId })
                .select(safeColumns)
                .single()

            if (error) {
                apiLogger.error('Error creating email preferences', error)
                return NextResponse.json({ error: 'فشل في إنشاء التفضيلات' }, { status: 500 })
            }
            return NextResponse.json({ ok: true, preferences: newPrefs })
        }

        return NextResponse.json({ ok: true, preferences: existing })
    } catch (error) {
        apiLogger.error('Error fetching email preferences', error)
        return NextResponse.json({ error: 'خطأ في الخادم' }, { status: 500 })
    }
}

// PUT: تحديث تفضيلات الإيميل
export async function PUT(request: NextRequest) {
    try {
        const userId = await getAuthenticatedUser()
        if (!userId) {
            return NextResponse.json({ error: 'غير مسجل الدخول' }, { status: 401 })
        }

        const body = await request.json()
        const {
            reminders_enabled,
            reminder_frequency,
            preferred_time,
            streak_reminders,
            mission_reminders,
            milestone_notifications,
            weekly_recap,
        } = body

        // Validate frequency
        const validFrequencies = ['daily', 'every_3_days', 'weekly', 'smart']
        if (reminder_frequency && !validFrequencies.includes(reminder_frequency)) {
            return NextResponse.json({ error: 'تكرار غير صالح' }, { status: 400 })
        }

        // Validate time format
        if (preferred_time && !/^\d{2}:\d{2}$/.test(preferred_time)) {
            return NextResponse.json({ error: 'صيغة وقت غير صالحة' }, { status: 400 })
        }

        const supabase = getSupabaseAdmin()

        const updateData: Record<string, unknown> = { updated_at: new Date().toISOString() }
        if (typeof reminders_enabled === 'boolean') updateData.reminders_enabled = reminders_enabled
        if (reminder_frequency) updateData.reminder_frequency = reminder_frequency
        if (preferred_time) updateData.preferred_time = preferred_time
        if (typeof streak_reminders === 'boolean') updateData.streak_reminders = streak_reminders
        if (typeof mission_reminders === 'boolean') updateData.mission_reminders = mission_reminders
        if (typeof milestone_notifications === 'boolean') updateData.milestone_notifications = milestone_notifications
        if (typeof weekly_recap === 'boolean') updateData.weekly_recap = weekly_recap

        // Upsert - create if not exists
        const { data: existing } = await supabase
            .from('email_preferences')
            .select('id')
            .eq('user_id', userId)
            .maybeSingle()

        if (!existing) {
            const { error: insertError } = await supabase.from('email_preferences').insert({ user_id: userId, ...updateData })
            if (insertError) {
                apiLogger.error('Error inserting email preferences', insertError)
                return NextResponse.json({ error: 'فشل في حفظ التفضيلات' }, { status: 500 })
            }
        } else {
            const { error: updateError } = await supabase
                .from('email_preferences')
                .update(updateData)
                .eq('user_id', userId)
            if (updateError) {
                apiLogger.error('Error updating email preferences', updateError)
                return NextResponse.json({ error: 'فشل في تحديث التفضيلات' }, { status: 500 })
            }
        }

        return NextResponse.json({ ok: true, message: 'تم تحديث التفضيلات' })
    } catch (error) {
        apiLogger.error('Error updating email preferences', error)
        return NextResponse.json({ error: 'خطأ في الخادم' }, { status: 500 })
    }
}
