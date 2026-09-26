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

/**
 * التحقق من أن المستخدم لديه اشتراك نشط.
 * يُستخدم في API routes المدفوعة لمنع الوصول بدون اشتراك.
 * 
 * @param userId - معرّف المستخدم
 * @returns true إذا كان لديه اشتراك نشط
 */
export async function hasActiveSubscription(userId: string): Promise<boolean> {
    const supabase = getSupabaseAdmin()

    // Strategy 1: Check subscriptions table for active subscription
    const { data: subscription } = await (supabase as any)
        .from('subscriptions')
        .select('id, expires_at')
        .eq('user_id', userId)
        .eq('status', 'active')
        .maybeSingle()

    if (subscription && subscription.expires_at && new Date(subscription.expires_at) > new Date()) {
        return true
    }

    // Strategy 2: Check users table for current_plan with valid expiry
    const { data: user } = await (supabase as any)
        .from('users')
        .select('current_plan, plan_expires_at')
        .eq('id', userId)
        .maybeSingle()

    if (user && user.current_plan && user.plan_expires_at && new Date(user.plan_expires_at) > new Date()) {
        return true
    }

    return false
}
