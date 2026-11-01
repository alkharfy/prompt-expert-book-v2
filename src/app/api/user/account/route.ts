import { NextRequest, NextResponse } from 'next/server'
import { getAuthenticatedUser } from '@/lib/auth-middleware'
import { getSupabaseAdmin } from '@/lib/supabase-admin'
import { authLogger } from '@/lib/logger'
import { DELETE_CONFIRM_WORD } from '@/lib/account-delete'

/**
 * Everything kept per learner, checked against production on 2026-11-01. Payments, payment intents,
 * subscriptions, promo uses and live seats are NOT here: they stay for the books, tied to the anonymised row.
 */
const USER_TABLES = [
    'sessions', 'devices', 'reading_progress', 'email_preferences', 'email_log', 'user_gamification',
    'user_notes', 'user_daily_missions', 'points_history', 'user_learning_preferences', 'learning_plan_summary',
    'learning_plan_tasks', 'exercise_progress', 'user_exercise_stats', 'chat_messages', 'chat_ratings',
    'certificates', 'user_saved_resources', 'verification_codes', 'user_claimed_rewards', 'user_badges',
    'user_achievements', 'user_certificates',
] as const

/**
 * DELETE /api/user/account — the signed-in learner deletes their own account.
 * Their data goes; the users row stays (payments point at it) with nothing that identifies them,
 * and the Firebase login is removed so the email can sign up again from scratch.
 */
export async function DELETE(request: NextRequest) {
    const userId = await getAuthenticatedUser()
    if (!userId) {
        return NextResponse.json({ ok: false, error: 'سجّل دخولك الأول' }, { status: 401 })
    }

    const body = await request.json().catch(() => null) as { confirm?: unknown } | null
    if (typeof body?.confirm !== 'string' || body.confirm.trim() !== DELETE_CONFIRM_WORD) {
        return NextResponse.json({ ok: false, error: `اكتب «${DELETE_CONFIRM_WORD}» عشان نتأكد` }, { status: 400 })
    }

    const supabase = getSupabaseAdmin() as any
    const { data: user, error: readError } = await supabase
        .from('users')
        .select('id, email, firebase_uid, is_admin')
        .eq('id', userId)
        .maybeSingle()
    if (readError || !user) {
        return NextResponse.json({ ok: false, error: 'مش لاقيين الحساب' }, { status: 404 })
    }
    // An admin deleting themselves by mistake would lock the owner out of the dashboard.
    if (user.is_admin) {
        return NextResponse.json({ ok: false, error: 'ده حساب أدمن، ومينفعش يتحذف من هنا.' }, { status: 403 })
    }

    const failed: string[] = []
    for (const table of USER_TABLES) {
        const { error } = await supabase.from(table).delete().eq('user_id', userId)
        if (error) failed.push(table)
    }
    for (const column of ['referrer_id', 'referred_user_id']) {
        const { error } = await supabase.from('referrals').delete().eq(column, userId)
        if (error) failed.push(`referrals.${column}`)
    }
    if (user.email) {
        const { error } = await supabase.from('lead_magnet_subscribers').delete().eq('email', String(user.email).toLowerCase())
        if (error) failed.push('lead_magnet_subscribers')
    }

    // Nothing left that names the person. password_hash/full_name/email are NOT NULL, email is unique.
    const { error: anonError } = await supabase
        .from('users')
        .update({
            email: `deleted-${userId}@deleted.invalid`,
            full_name: 'حساب محذوف',
            phone_number: null,
            password_hash: '',
            firebase_uid: null,
            is_verified: false,
            is_phone_verified: false,
            is_active: false,
            updated_at: new Date().toISOString(),
        })
        .eq('id', userId)
    if (anonError) {
        authLogger.error('Account delete: anonymise failed', { userId, anonError, failed })
        return NextResponse.json({ ok: false, error: 'حصلت مشكلة وإحنا بنحذف الحساب. جرّب تاني أو كلّمنا.' }, { status: 500 })
    }

    if (user.firebase_uid) {
        try {
            const { adminAuth } = await import('@/lib/firebase_admin')
            await adminAuth.deleteUser(user.firebase_uid)
        } catch (error: any) {
            if (error?.code !== 'auth/user-not-found') failed.push('firebase')
        }
    }

    if (failed.length) authLogger.warn('Account delete: some data was not removed', { userId, failed })
    else authLogger.info('Account deleted', { userId })

    const response = NextResponse.json({ ok: true })
    response.cookies.set('ebook_session_token', '', { path: '/', maxAge: 0, httpOnly: true })
    response.cookies.set('ebook_user_id', '', { path: '/', maxAge: 0 })
    response.cookies.set('ebook_device_id', '', { path: '/', maxAge: 0 })
    return response
}
