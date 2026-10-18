import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase-admin'
import { buildFunnelReport, type FunnelInput } from '@/lib/funnel'

/**
 * Funnel API — «الناس بتقف فين؟» (admin only, aggregates only: no emails, names or phones leave the server).
 * GET ?days=7|30|90|all — cohort = accounts created in that window.
 */

async function verifyAdmin(request: NextRequest): Promise<boolean> {
    const userId = request.cookies.get('ebook_user_id')?.value
    const sessionToken = request.cookies.get('ebook_session_token')?.value
    if (!userId || !sessionToken) return false

    const supabase = getSupabaseAdmin()
    const { data: session } = await (supabase as any)
        .from('sessions')
        .select('id')
        .eq('user_id', userId)
        .eq('session_token', sessionToken)
        .gt('expires_at', new Date().toISOString())
        .maybeSingle()
    if (!session) return false

    const { data: user } = await supabase
        .from('users')
        .select('is_admin')
        .eq('id', userId)
        .single() as { data: { is_admin: boolean } | null; error: unknown }
    return !!user?.is_admin
}

export async function GET(request: NextRequest) {
    if (!(await verifyAdmin(request))) {
        return NextResponse.json({ error: 'غير مصرح' }, { status: 401 })
    }

    const daysParam = request.nextUrl.searchParams.get('days') || '30'
    const days = daysParam === 'all' ? null : Math.min(Math.max(Number(daysParam) || 30, 1), 3650)
    const since = days ? new Date(Date.now() - days * 86_400_000).toISOString() : null

    const db = getSupabaseAdmin() as any
    let usersQuery = db.from('users').select('id, created_at, is_admin').limit(20000)
    if (since) usersQuery = usersQuery.gte('created_at', since)

    const [users, preferences, progress, intents, payments] = await Promise.all([
        usersQuery,
        db.from('user_learning_preferences').select('user_id, onboarding_status, profession').limit(20000),
        db.from('reading_progress').select('user_id, current_page, completed_chapters, updated_at').limit(20000),
        db.from('payment_intents').select('user_id').limit(50000),
        db.from('payments').select('user_id, status').limit(50000),
    ])
    const failed = [users, preferences, progress, intents, payments].find(r => r.error)
    if (failed) {
        return NextResponse.json({ error: 'تعذّر تحميل البيانات' }, { status: 500 })
    }

    const report = buildFunnelReport({
        users: users.data,
        preferences: preferences.data,
        progress: progress.data,
        intents: intents.data,
        payments: payments.data,
    } as FunnelInput)

    return NextResponse.json({ days: days ?? 'all', generatedAt: new Date().toISOString(), ...report })
}
