import 'server-only'
import { cookies } from 'next/headers'
import { getSupabaseAdmin } from '@/lib/supabase-admin'

/**
 * استخراج userId من cookies مع التحقق من صحة الجلسة عبر قاعدة البيانات.
 * يتحقق من وجود ebook_user_id و ebook_session_token ثم يتأكد
 * من أن الجلسة صالحة وغير منتهية الصلاحية.
 *
 * NOTE: is_active is NOT checked here — unpaid users can still authenticate.
 * Premium feature access is controlled by middleware + subscription checks.
 *
 * @param _options - Deprecated, kept for backward compatibility
 * @returns userId إذا كانت الجلسة صالحة، أو null
 */
export async function getAuthenticatedUser(_options?: { skipActiveCheck?: boolean }): Promise<string | null> {
    const cookieStore = await cookies()
    const userId = cookieStore.get('ebook_user_id')?.value
    const sessionToken = cookieStore.get('ebook_session_token')?.value

    if (!userId || !sessionToken) return null

    const supabase = getSupabaseAdmin()
    const { data: session } = await (supabase as any)
        .from('sessions')
        .select('id')
        .eq('user_id', userId)
        .eq('session_token', sessionToken)
        .gt('expires_at', new Date().toISOString())
        .maybeSingle()

    if (!session) return null

    // NOTE: is_active=false means unpaid account, NOT disabled/deactivated.
    // Authentication should NOT be blocked by payment status.
    // Premium feature access is controlled by middleware + subscription checks.

    return userId
}
