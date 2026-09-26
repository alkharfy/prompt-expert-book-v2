'use server'

import { createClient } from '@supabase/supabase-js'
import { cookies } from 'next/headers'

function getServiceClient() {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

    if (!url || !serviceKey) {
        throw new Error('Missing Supabase environment variables')
    }

    return createClient(url, serviceKey)
}

async function getUserId(): Promise<string | null> {
    const cookieStore = await cookies()
    const userId = cookieStore.get('ebook_user_id')?.value
    const sessionToken = cookieStore.get('ebook_session_token')?.value

    if (!userId || !sessionToken) return null

    // SECURITY: Verify session token to prevent IDOR via forged cookie
    const supabase = getServiceClient()
    const { data: session } = await supabase
        .from('sessions')
        .select('user_id')
        .eq('user_id', userId)
        .eq('session_token', sessionToken)
        .gt('expires_at', new Date().toISOString())
        .single()

    return session ? session.user_id : null
}

interface CertificateResult {
    success: boolean
    certificateId?: string
    issuedAt?: string
    error?: string
}

/**
 * إنشاء أو جلب شهادة المستخدم
 * - لو الشهادة موجودة: يرجعها (ويحدّث الاسم لو اتغير)
 * - لو مش موجودة: ينشئ واحدة جديدة (بشرط الاسم ثلاثي + إكمال 9 فصول)
 * - مستخدم واحد = شهادة واحدة فقط (محمي من السيرفر)
 */
export async function getOrCreateCertificate(): Promise<CertificateResult> {
    try {
        const userId = await getUserId()
        if (!userId) {
            return { success: false, error: 'غير مصرح' }
        }

        const supabase = getServiceClient()

        // 1. جلب بيانات المستخدم
        const { data: userData, error: userError } = await supabase
            .from('users')
            .select('full_name, email')
            .eq('id', userId)
            .single()

        if (userError || !userData) {
            return { success: false, error: 'لم يتم العثور على بيانات المستخدم' }
        }

        const userName = userData.full_name || userData.email?.split('@')[0] || ''

        // 2. التحقق من الاسم الثلاثي
        const nameParts = userName.trim().split(/\s+/)
        if (nameParts.length < 3) {
            return { success: false, error: 'يجب أن يكون الاسم ثلاثي على الأقل (الاسم الأول + اسم الأب + اسم العائلة) لإصدار الشهادة' }
        }

        // 3. التحقق من إكمال الكتاب (9 فصول على الأقل)
        const { data: progressData } = await supabase
            .from('reading_progress')
            .select('completed_chapters, current_page')
            .eq('user_id', userId)
            .maybeSingle()

        const completedChapters = (progressData?.completed_chapters as string[] || []).length
        if (completedChapters < 9) {
            return { success: false, error: 'يجب إكمال 9 فصول على الأقل للحصول على الشهادة' }
        }

        // 4. البحث عن شهادة موجودة
        const { data: existingCert } = await supabase
            .from('certificates')
            .select('*')
            .eq('user_id', userId)
            .maybeSingle()

        if (existingCert) {
            // تحديث الاسم لو اتغير
            if (existingCert.user_name !== userName) {
                await supabase
                    .from('certificates')
                    .update({ user_name: userName })
                    .eq('id', existingCert.id)
            }

            return {
                success: true,
                certificateId: existingCert.certificate_id,
                issuedAt: existingCert.issued_at,
            }
        }

        // 5. إنشاء شهادة جديدة (أول مرة فقط)
        const newCertId = `CERT-${Date.now().toString(36).toUpperCase()}-${userId.substring(0, 4).toUpperCase()}`

        const { data: newCert, error: insertError } = await supabase
            .from('certificates')
            .insert({
                user_id: userId,
                certificate_id: newCertId,
                user_name: userName,
                course_name: 'PromptMaster',
                issued_at: new Date().toISOString(),
                completion_percentage: 100,
                is_public: true,
            })
            .select('certificate_id, issued_at')
            .single()

        if (insertError) {
            // لو الخطأ بسبب تكرار (UNIQUE constraint) - يعني شهادة موجودة بالفعل
            if (insertError.message?.includes('unique') || insertError.message?.includes('duplicate')) {
                // إعادة جلب الشهادة الموجودة
                const { data: retryData } = await supabase
                    .from('certificates')
                    .select('certificate_id, issued_at')
                    .eq('user_id', userId)
                    .single()

                if (retryData) {
                    return {
                        success: true,
                        certificateId: retryData.certificate_id,
                        issuedAt: retryData.issued_at,
                    }
                }
            }
            return { success: false, error: 'فشل في إنشاء الشهادة' }
        }

        return {
            success: true,
            certificateId: newCert.certificate_id,
            issuedAt: newCert.issued_at,
        }
    } catch (err) {
        console.error('Certificate error:', err)
        return { success: false, error: 'حدث خطأ غير متوقع' }
    }
}
