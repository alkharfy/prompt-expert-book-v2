import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase-admin'
import { dbLogger } from '@/lib/logger'

/**
 * GET /api/admin/subscriptions - Fetch all subscriptions (admin only)
 *
 * Uses service_role to bypass RLS and join subscriptions with users/payments.
 * Auth: cookie-based (ebook_user_id + ebook_session_token) + is_admin check.
 */
export async function GET(request: NextRequest) {
    try {
        const userId = request.cookies.get('ebook_user_id')?.value
        const sessionToken = request.cookies.get('ebook_session_token')?.value

        if (!userId || !sessionToken) {
            return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 })
        }

        const supabase = getSupabaseAdmin()

        // Verify session
        const { data: session, error: sessionError } = await (supabase as any)
            .from('sessions')
            .select('id')
            .eq('user_id', userId)
            .eq('session_token', sessionToken)
            .gt('expires_at', new Date().toISOString())
            .maybeSingle()

        if (sessionError || !session) {
            return NextResponse.json({ ok: false, error: 'Invalid session' }, { status: 401 })
        }

        // Verify admin
        const { data: adminUser } = await supabase
            .from('users')
            .select('is_admin')
            .eq('id', userId)
            .single() as { data: { is_admin: boolean } | null }

        if (!adminUser?.is_admin) {
            return NextResponse.json({ ok: false, error: 'Forbidden' }, { status: 403 })
        }

        // Fetch subscriptions with user and payment info
        const { data: subscriptions, error } = await (supabase as any)
            .from('subscriptions')
            .select(`
                *,
                users!inner(email, full_name),
                payments(amount, currency)
            `)
            .order('created_at', { ascending: false })

        if (error) {
            dbLogger.error('[admin/subscriptions] Fetch error:', error)
            return NextResponse.json({ ok: false, error: 'Failed to fetch subscriptions' }, { status: 500 })
        }

        return NextResponse.json({ ok: true, subscriptions: subscriptions || [] })
    } catch (err) {
        dbLogger.error('[admin/subscriptions] Error:', err)
        return NextResponse.json({ ok: false, error: 'Internal server error' }, { status: 500 })
    }
}
