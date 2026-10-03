'use server'

import { getAuthenticatedUser } from '@/lib/auth-middleware'
import { getSupabaseAdmin } from '@/lib/supabase-admin'
import { userHasFeature } from '@/lib/subscription'
import { CERTIFICATE_COURSE_NAME, CERTIFICATE_CHAPTER_COUNT, getMainChapterCompletion } from '@/lib/reading-completion'

interface CertificateResult {
    success: boolean
    certificateId?: string
    issuedAt?: string
    userName?: string
    courseName?: string
    previousRequirements?: boolean
    error?: string
}

/**
 * إنشاء أو جلب شهادة المستخدم
 * - لو الشهادة موجودة: يرجع سجل إصدارها كما هو
 * - إصدار جديد: ميزة الشهادة + اسم ثلاثي + سجل إتمام الفصول الأساسية كلها
 * - الشهادات السابقة وثائق تاريخية تبقى متاحة وفق متطلبات إصدارها
 * - الشهادة إتمام قراءة ذاتي؛ ليست اعتماداً مهنياً أو اختبار مهارة
 * - مستخدم واحد = شهادة واحدة فقط (محمي من السيرفر)
 */
export async function getOrCreateCertificate(): Promise<CertificateResult> {
    try {
        const userId = await getAuthenticatedUser()
        if (!userId) {
            return { success: false, error: 'غير مصرح' }
        }

        const supabase = getSupabaseAdmin()

        // Preserve historical certificates; a later curriculum change or an
        // expired subscription must not invalidate an already-issued record.
        const { data: existingCert, error: existingError } = await supabase
            .from('certificates')
            .select('certificate_id, issued_at, user_name, course_name')
            .eq('user_id', userId)
            .maybeSingle()
        if (existingError) return { success: false, error: 'تعذّر التحقق من الشهادة الحالية' }
        if (existingCert) return {
            success: true,
            certificateId: existingCert.certificate_id,
            issuedAt: existingCert.issued_at,
            userName: existingCert.user_name,
            courseName: existingCert.course_name,
            previousRequirements: existingCert.course_name !== CERTIFICATE_COURSE_NAME,
        }

        if (!await userHasFeature(userId, 'certificate')) {
            return { success: false, error: 'إصدار شهادة جديدة يتطلب اشتراك المتقدمة أو VIP نشطًا' }
        }

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

        // Only distinct, known main chapter IDs count. Intro and appendices
        // cannot substitute for a missing main chapter.
        const { data: progressData, error: progressError } = await supabase
            .from('reading_progress')
            .select('completed_chapters, current_page')
            .eq('user_id', userId)
            .maybeSingle()

        if (progressError) return { success: false, error: 'تعذّر التحقق من سجل القراءة' }
        const completion = getMainChapterCompletion(progressData?.completed_chapters)
        if (!completion.eligible) {
            return { success: false, error: `سجّل إتمام قراءة الفصول الأساسية ${CERTIFICATE_CHAPTER_COUNT} كلها للحصول على الشهادة` }
        }

        // 5. إنشاء شهادة جديدة (أول مرة فقط)
        const newCertId = `CERT-${Date.now().toString(36).toUpperCase()}-${userId.substring(0, 4).toUpperCase()}`

        const { data: newCert, error: insertError } = await supabase
            .from('certificates')
            .insert({
                user_id: userId,
                certificate_id: newCertId,
                user_name: userName,
                course_name: CERTIFICATE_COURSE_NAME,
                issued_at: new Date().toISOString(),
                completion_percentage: completion.percentage,
                is_public: true,
            })
            .select('certificate_id, issued_at, user_name, course_name')
            .single()

        if (insertError) {
            // لو الخطأ بسبب تكرار (UNIQUE constraint) - يعني شهادة موجودة بالفعل
            if (insertError.message?.includes('unique') || insertError.message?.includes('duplicate')) {
                // إعادة جلب الشهادة الموجودة
                const { data: retryData } = await supabase
                    .from('certificates')
                    .select('certificate_id, issued_at, user_name, course_name')
                    .eq('user_id', userId)
                    .single()

                if (retryData) {
                    return {
                        success: true,
                        certificateId: retryData.certificate_id,
                        issuedAt: retryData.issued_at,
                        userName: retryData.user_name,
                        courseName: retryData.course_name,
                        previousRequirements: retryData.course_name !== CERTIFICATE_COURSE_NAME,
                    }
                }
            }
            return { success: false, error: 'فشل في إنشاء الشهادة' }
        }

        return {
            success: true,
            certificateId: newCert.certificate_id,
            issuedAt: newCert.issued_at,
            userName: newCert.user_name,
            courseName: newCert.course_name,
            previousRequirements: false,
        }
    } catch (err) {
        console.error('Certificate error:', err)
        return { success: false, error: 'حدث خطأ غير متوقع' }
    }
}
