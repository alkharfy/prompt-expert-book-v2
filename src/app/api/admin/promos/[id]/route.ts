import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase-admin'
import { getAuthenticatedUser } from '@/lib/auth-middleware'
import { dbLogger } from '@/lib/logger'

/**
 * Unified admin verification — uses cookie-based auth (consistent with other admin routes)
 */
async function verifyAdmin() {
    const userId = await getAuthenticatedUser()
    if (!userId) return null

    const supabase = getSupabaseAdmin()
    const { data: user } = await supabase
        .from('users')
        .select('is_admin')
        .eq('id', userId)
        .single() as { data: { is_admin: boolean } | null }

    return user?.is_admin ? userId : null
}

/**
 * PUT /api/admin/promos/:id - Update promo code
 */
export async function PUT(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const adminId = await verifyAdmin()
        if (!adminId) {
            return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 })
        }

        const { id: promoId } = await params
        const body = await request.json()
        const {
            code,
            description,
            discount_type,
            discount_value,
            max_uses,
            min_amount,
            max_discount,
            allowed_plans,
            starts_at,
            expires_at,
            is_active,
        } = body

        const updates: any = {}
        if (code !== undefined) updates.code = code.trim().toUpperCase()
        if (description !== undefined) updates.description = description
        if (discount_type !== undefined) updates.discount_type = discount_type
        if (discount_value !== undefined) updates.discount_value = discount_value
        if (max_uses !== undefined) updates.max_uses = max_uses
        if (min_amount !== undefined) updates.min_amount = min_amount
        if (max_discount !== undefined) updates.max_discount = max_discount
        if (allowed_plans !== undefined) updates.allowed_plans = allowed_plans && allowed_plans.length > 0 ? allowed_plans : null
        if (starts_at !== undefined) updates.starts_at = starts_at
        if (expires_at !== undefined) updates.expires_at = expires_at
        if (is_active !== undefined) updates.is_active = is_active

        if (Object.keys(updates).length === 0) {
            return NextResponse.json({ ok: false, error: 'No fields to update' }, { status: 400 })
        }

        const supabase = getSupabaseAdmin()
        const { data: promo, error } = await (supabase as any)
            .from('promo_codes')
            .update(updates)
            .eq('id', promoId)
            .select()
            .single()

        if (error) {
            dbLogger.error('Failed to update promo:', error)
            return NextResponse.json({ ok: false, error: 'فشل تحديث الكود' }, { status: 500 })
        }

        return NextResponse.json({ ok: true, promo })
    } catch (error) {
        dbLogger.error('Update promo API error:', error)
        return NextResponse.json({ ok: false, error: 'Internal server error' }, { status: 500 })
    }
}

/**
 * DELETE /api/admin/promos/:id - Delete promo code
 */
export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const adminId = await verifyAdmin()
        if (!adminId) {
            return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 })
        }

        const { id: promoId } = await params
        const supabase = getSupabaseAdmin()

        const { error } = await (supabase as any)
            .from('promo_codes')
            .delete()
            .eq('id', promoId)

        if (error) {
            dbLogger.error('Failed to delete promo:', error)
            return NextResponse.json({ ok: false, error: 'فشل حذف الكود' }, { status: 500 })
        }

        return NextResponse.json({ ok: true })
    } catch (error) {
        dbLogger.error('Delete promo API error:', error)
        return NextResponse.json({ ok: false, error: 'Internal server error' }, { status: 500 })
    }
}
