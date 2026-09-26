import 'server-only'
import { createClient, SupabaseClient } from '@supabase/supabase-js'

/**
 * Shared Supabase Admin (service_role) client.
 * 
 * Cached at module level — safe to call repeatedly.
 * Throws a descriptive error if env vars are missing,
 * instead of crashing with an unhelpful TypeError.
 * 
 * Usage:
 *   import { getSupabaseAdmin } from '@/lib/supabase-admin'
 *   const supabase = getSupabaseAdmin()
 */

let _client: SupabaseClient | null = null

export function getSupabaseAdmin(): SupabaseClient {
    if (_client) return _client

    const url = process.env.NEXT_PUBLIC_SUPABASE_URL
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY

    if (!url || !key) {
        throw new Error(
            'Missing Supabase environment variables: ' +
            (!url ? 'NEXT_PUBLIC_SUPABASE_URL ' : '') +
            (!key ? 'SUPABASE_SERVICE_ROLE_KEY' : '') +
            '. Check your .env.local file.'
        )
    }

    _client = createClient(url, key, {
        auth: { persistSession: false, autoRefreshToken: false },
    })

    return _client
}
