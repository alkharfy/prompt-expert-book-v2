import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase-admin'
import { dbLogger } from '@/lib/logger'

/**
 * Admin Testimonials API — CRUD عبر service_role لتجاوز RLS
 * محمي بالتحقق من is_admin عبر cookies
 */

async function verifyAdmin(request: NextRequest): Promise<string | null> {
    const userId = request.cookies.get('ebook_user_id')?.value
    const sessionToken = request.cookies.get('ebook_session_token')?.value

    if (!userId || !sessionToken) return null

    const supabase = getSupabaseAdmin()

    const { data: session } = await (supabase as any)
        .from('sessions')
        .select('id')
        .eq('user_id', userId)
        .eq('session_token', sessionToken)
        .gt('expires_at', new Date().toISOString())
        .maybeSingle()

    if (!session) return null

    const { data: user } = await supabase
        .from('users')
        .select('is_admin')
        .eq('id', userId)
        .single() as { data: { is_admin: boolean } | null; error: any }

    if (!user?.is_admin) return null

    return userId
}

// GET — جلب جميع الشهادات (للأدمن)
export async function GET(request: NextRequest) {
    const adminId = await verifyAdmin(request)
    if (!adminId) {
        return NextResponse.json({ error: 'غير مصرح' }, { status: 401 })
    }

    const supabase = getSupabaseAdmin()
    const { data, error } = await supabase
        .from('testimonials')
        .select('*')
        .order('display_order', { ascending: true })

    if (error) {
        dbLogger.error('[testimonials API] GET error:', error)
        return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ data: data || [] })
}

// POST — إنشاء شهادة جديدة
export async function POST(request: NextRequest) {
    const adminId = await verifyAdmin(request)
    if (!adminId) {
        return NextResponse.json({ error: 'غير مصرح' }, { status: 401 })
    }

    const body = await request.json()
    const supabase = getSupabaseAdmin()

    const { data, error } = await supabase
        .from('testimonials')
        .insert([{
            name: body.name,
            title: body.title || null,
            photo_url: body.photo_url || null,
            content: body.content,
            rating: body.rating || 5,
            is_visible: body.is_visible ?? true,
            display_order: body.display_order || 0,
        }])
        .select()
        .single()

    if (error) {
        dbLogger.error('[testimonials API] POST error:', error)
        return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ data })
}

// PUT — تعديل شهادة
export async function PUT(request: NextRequest) {
    const adminId = await verifyAdmin(request)
    if (!adminId) {
        return NextResponse.json({ error: 'غير مصرح' }, { status: 401 })
    }

    const body = await request.json()
    if (!body.id) {
        return NextResponse.json({ error: 'missing id' }, { status: 400 })
    }

    const supabase = getSupabaseAdmin()

    const updateData: any = { updated_at: new Date().toISOString() }
    if (body.name !== undefined) updateData.name = body.name
    if (body.title !== undefined) updateData.title = body.title
    if (body.content !== undefined) updateData.content = body.content
    if (body.rating !== undefined) updateData.rating = body.rating
    if (body.photo_url !== undefined) updateData.photo_url = body.photo_url
    if (body.is_visible !== undefined) updateData.is_visible = body.is_visible
    if (body.display_order !== undefined) updateData.display_order = body.display_order

    const { data, error } = await supabase
        .from('testimonials')
        .update(updateData)
        .eq('id', body.id)
        .select()
        .single()

    if (error) {
        dbLogger.error('[testimonials API] PUT error:', error)
        return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ data })
}

// DELETE — حذف شهادة
export async function DELETE(request: NextRequest) {
    const adminId = await verifyAdmin(request)
    if (!adminId) {
        return NextResponse.json({ error: 'غير مصرح' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')
    if (!id) {
        return NextResponse.json({ error: 'missing id' }, { status: 400 })
    }

    const supabase = getSupabaseAdmin()
    const { error } = await supabase
        .from('testimonials')
        .delete()
        .eq('id', id)

    if (error) {
        dbLogger.error('[testimonials API] DELETE error:', error)
        return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true })
}
