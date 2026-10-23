import { getSupabaseAdmin } from '@/lib/supabase-admin'
import { getAuthenticatedUser } from '@/lib/auth-middleware'

/**
 * Unified admin verification — uses cookie-based auth (consistent with other admin routes).
 * Returns the admin's user id, or null when not signed in or not an admin.
 */
export async function verifyAdmin(): Promise<string | null> {
    const userId = await getAuthenticatedUser()
    if (!userId) return null

    const supabase = getSupabaseAdmin()
    const { data: user } = await supabase
        .from('users')
        .select('is_admin')
        .eq('id', userId)
        .single() as { data: { is_admin: boolean } | null }

    return user?.is_admin ? userId : null
}
