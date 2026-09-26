import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase-admin'
import { dbLogger } from '@/lib/logger'

/**
 * API لفحص صلاحيات الأدمن بناءً على كوكي المستخدم + session token
 * يستخدم service_role key لتجاوز RLS
 */
export async function GET(request: NextRequest) {
    try {
        const userId = request.cookies.get('ebook_user_id')?.value
        const sessionToken = request.cookies.get('ebook_session_token')?.value

        if (!userId || !sessionToken) {
            return NextResponse.json({ isAdmin: false, reason: 'no_user' })
        }

        const supabase = getSupabaseAdmin()

        // التحقق من صحة الجلسة أولاً
        const { data: session, error: sessionError } = await (supabase as any)
            .from('sessions')
            .select('id')
            .eq('user_id', userId)
            .eq('session_token', sessionToken)
            .gt('expires_at', new Date().toISOString())
            .maybeSingle()

        if (sessionError || !session) {
            return NextResponse.json({ isAdmin: false, reason: 'invalid_session' })
        }

        const { data: user, error } = await supabase
            .from('users')
            .select('is_admin')
            .eq('id', userId)
            .single() as { data: { is_admin: boolean } | null; error: any }

        if (error || !user || !user.is_admin) {
            return NextResponse.json({ isAdmin: false, reason: 'not_admin' })
        }

        return NextResponse.json({ isAdmin: true })
    } catch (err) {
        dbLogger.error('[check-access] Error:', err)
        return NextResponse.json({ isAdmin: false, reason: 'error' })
    }
}
