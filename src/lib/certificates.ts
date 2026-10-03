/**
 * Certificates module
 * 
 * Client-safe public verification through the server endpoint. Issued records
 * remain historical documents, including those with earlier requirements.
 */
import { dbLogger } from './logger'

export interface Certificate {
    id: string
    certificate_id: string
    user_name: string
    course_name: string
    issued_at: string
    completion_percentage: number
    is_public: boolean
    created_at: string
    previous_requirements: boolean
}

// Get certificate by public ID
export async function getCertificateByPublicId(certificateId: string): Promise<Certificate | null> {
    try {
        const response = await fetch(`/api/certificates/${encodeURIComponent(certificateId)}`, { cache: 'no-store' })
        if (!response.ok) return null
        return (await response.json()).certificate || null
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
