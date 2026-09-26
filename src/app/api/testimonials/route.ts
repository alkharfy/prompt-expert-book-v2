import { NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase-admin'

/**
 * Public API — جلب الشهادات المنشورة (is_visible = true)
 * يستخدم service_role لتجاوز RLS
 * لا يحتاج auth لأنه بيانات عامة
 */
export async function GET() {
    const supabase = getSupabaseAdmin()
    const { data, error } = await supabase
        .from('testimonials')
        .select('*')
        .eq('is_visible', true)
        .order('display_order', { ascending: true })

    if (error) {
        return NextResponse.json({ data: [] }, { status: 200 })
    }

    return NextResponse.json({ data: data || [] })
}
