import { NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase-admin'
import { CERTIFICATE_COURSE_NAME } from '@/lib/reading-completion'

// Public verification is independent of a later subscription renewal. Return
// only the fields intentionally published by the holder, never their user ID.
export async function GET(_request: Request, context: { params: Promise<{ id: string }> }) {
    try {
        const { id } = await context.params
        if (!id || id.length > 100) return NextResponse.json({ error: 'معرف غير صالح' }, { status: 400 })
        const { data, error } = await getSupabaseAdmin().from('certificates')
            .select('id, certificate_id, user_name, course_name, issued_at, completion_percentage, is_public, created_at')
            .eq('certificate_id', id).eq('is_public', true).maybeSingle()
        if (error) return NextResponse.json({ error: 'تعذّر التحقق من الشهادة' }, { status: 500 })
        if (!data) return NextResponse.json({ error: 'الشهادة غير موجودة' }, { status: 404 })
        return NextResponse.json({ certificate: {
            id: data.id,
            certificate_id: data.certificate_id,
            user_name: data.user_name,
            course_name: data.course_name,
            issued_at: data.issued_at,
            completion_percentage: data.completion_percentage,
            is_public: data.is_public,
            created_at: data.created_at,
            previous_requirements: data.course_name !== CERTIFICATE_COURSE_NAME,
        } }, { headers: { 'Cache-Control': 'no-store' } })
    } catch {
        return NextResponse.json({ error: 'تعذّر التحقق من الشهادة' }, { status: 500 })
    }
}
