/**
 * Certificates module
 * 
 * ⚠️ NOTE: This module uses the anon-key Supabase client.
 * If REVOKE ALL has been applied to the anon role, these operations
 * may fail. Ensure certificates table has public-read RLS policy
 * for is_public=true rows, or route through server API / supabaseProxy.
 */
import { supabase } from './supabase'
import { dbLogger } from './logger'

export interface Certificate {
    id: string
    user_id: string
    certificate_id: string
    user_name: string
    course_name: string
    issued_at: string
    completion_percentage: number
    is_public: boolean
    created_at: string
}

// Get certificate by public ID
export async function getCertificateByPublicId(certificateId: string): Promise<Certificate | null> {
    try {
        const { data, error } = await supabase
            .from('certificates')
            .select('*')
            .eq('certificate_id', certificateId)
            .eq('is_public', true)
            .single()

        if (error || !data) {
            // Only log as error if it's not a "not found" case
            if (error && !error.message?.includes('0 rows')) {
                dbLogger.error('Error fetching certificate', { certificateId, error: error.message })
            }
            return null
        }

        return data
    } catch (err) {
        dbLogger.error('Error in getCertificateByPublicId', err)
        return null
    }
}

// Get certificate share URL
export function getCertificateShareUrl(certificateId: string): string {
    if (typeof window !== 'undefined') {
        return `${window.location.origin}/certificate/${certificateId}`
    }
    return `/certificate/${certificateId}`
}
