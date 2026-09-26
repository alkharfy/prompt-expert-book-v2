import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase-admin'

/**
 * Site Stats API — إحصائيات الصفحة الرئيسية
 * GET: جلب عام (بدون auth)
 * PUT: تعديل (admin only)
 */

const STATS_KEY = 'landing_stats'

const DEFAULT_STATS = [
    { id: 'learners', value: 500, suffix: '+', label: 'متعلم', icon: '👥' },
    { id: 'rating', value: 4.9, suffix: '', label: 'تقييم', icon: '⭐' },
    { id: 'pages', value: 143, suffix: '+', label: 'صفحة', icon: '📖' },
    { id: 'achievements', value: 60, suffix: '+', label: 'إنجاز', icon: '🏆' },
]

async function verifyAdmin(request: NextRequest): Promise<boolean> {
    const userId = request.cookies.get('ebook_user_id')?.value
    const sessionToken = request.cookies.get('ebook_session_token')?.value
    if (!userId || !sessionToken) return false

    const supabase = getSupabaseAdmin()

    const { data: session } = await (supabase as any)
        .from('sessions')
        .select('id')
        .eq('user_id', userId)
        .eq('session_token', sessionToken)
        .gt('expires_at', new Date().toISOString())
        .maybeSingle()

    if (!session) return false

    const { data: user } = await supabase
        .from('users')
        .select('is_admin')
        .eq('id', userId)
        .single() as { data: { is_admin: boolean } | null; error: any }

    return !!user?.is_admin
}

// GET — جلب الإحصائيات (عام)
export async function GET() {
    const supabase = getSupabaseAdmin()
    const { data } = await supabase
        .from('site_settings')
        .select('value')
        .eq('key', STATS_KEY)
        .single()

    if (data?.value) {
        return NextResponse.json({ data: data.value })
    }

    return NextResponse.json({ data: DEFAULT_STATS })
}

// PUT — تعديل الإحصائيات (admin only)
export async function PUT(request: NextRequest) {
    const isAdmin = await verifyAdmin(request)
    if (!isAdmin) {
        return NextResponse.json({ error: 'غير مصرح' }, { status: 401 })
    }

    const body = await request.json()
    const supabase = getSupabaseAdmin()

    const { data, error } = await supabase
        .from('site_settings')
        .upsert({
            key: STATS_KEY,
            value: body.stats,
            updated_at: new Date().toISOString(),
        }, { onConflict: 'key' })
        .select()
        .single()

    if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ data: data.value })
}
