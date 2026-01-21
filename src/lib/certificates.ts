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

export interface CertificateInput {
    user_id: string
    user_name: string
    course_name?: string
    is_public?: boolean
}

// Generate a unique certificate ID
function generateCertificateId(): string {
    const year = new Date().getFullYear()
    const randomPart = Math.random().toString(36).substring(2, 8).toUpperCase()
    return `CERT-${year}-${randomPart}`
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
            dbLogger.error('Error', certificateId)
            return null
        }

        return data
    } catch (err) {
        dbLogger.error('Error', err)
        return null
    }
}

// Get certificate by user ID
export async function getCertificateByUserId(userId: string): Promise<Certificate | null> {
    try {
        const { data, error } = await supabase
            .from('certificates')
            .select('*')
            .eq('user_id', userId)
            .single()

        if (error || !data) {
            return null
        }

        return data
    } catch (err) {
        dbLogger.error('Error', err)
        return null
    }
}

// Check if user has certificate
export async function userHasCertificate(userId: string): Promise<boolean> {
    const cert = await getCertificateByUserId(userId)
    return cert !== null
}

// Create a new certificate
export async function createCertificate(input: CertificateInput): Promise<Certificate | null> {
    try {
        // Check if user already has a certificate
        const existing = await getCertificateByUserId(input.user_id)
        if (existing) {
            dbLogger.debug('User already has a certificate')
            return existing
        }

        const certificateId = generateCertificateId()

        const { data, error } = await (supabase
            .from('certificates') as any)
            .insert([{
                user_id: input.user_id,
                certificate_id: certificateId,
                user_name: input.user_name,
                course_name: input.course_name || 'خبير البرومبتات: بناء المواقع والتطبيقات بالذكاء الاصطناعي',
                completion_percentage: 100,
                is_public: input.is_public ?? true,
                issued_at: new Date().toISOString()
            }])
            .select()
            .single()

        if (error) {
            dbLogger.error('Error', error)
            return null
        }

        return data
    } catch (err) {
        dbLogger.error('Error', err)
        return null
    }
}

// Toggle certificate visibility - يجب التحقق من ملكية المستخدم
export async function toggleCertificateVisibility(
    certificateId: string, 
    isPublic: boolean, 
    userId: string
): Promise<boolean> {
    try {
        // التحقق من أن الشهادة تخص المستخدم
        const { data: cert } = await supabase
            .from('certificates')
            .select('user_id')
            .eq('certificate_id', certificateId)
            .single() as { data: { user_id: string } | null }

        if (!cert || cert.user_id !== userId) {
            dbLogger.error('Error')
            return false
        }

        const { error } = await (supabase
            .from('certificates') as any)
            .update({ is_public: isPublic })
            .eq('certificate_id', certificateId)
            .eq('user_id', userId)  // تأكيد إضافي للملكية

        if (error) {
            dbLogger.error('Error', error)
            return false
        }

        return true
    } catch (err) {
        dbLogger.error('Error', err)
        return false
    }
}

// Format certificate date for display
export function formatCertificateDate(dateString: string): string {
    const date = new Date(dateString)
    return date.toLocaleDateString('ar-EG', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    })
}

// Get certificate share URL
export function getCertificateShareUrl(certificateId: string): string {
    if (typeof window !== 'undefined') {
        return `${window.location.origin}/certificate/${certificateId}`
    }
    return `/certificate/${certificateId}`
}

// Verify certificate exists and is valid
export async function verifyCertificate(certificateId: string): Promise<{ valid: boolean; certificate?: Certificate }> {
    const certificate = await getCertificateByPublicId(certificateId)
    
    if (!certificate) {
        return { valid: false }
    }

    return { valid: true, certificate }
}
