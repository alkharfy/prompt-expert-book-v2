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
 * GET /api/admin/promos - Get all promo codes
 */
export async function GET(request: NextRequest) {
    try {
        const adminId = await verifyAdmin()
        if (!adminId) {
            return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 })
        }

        const supabase = getSupabaseAdmin()
        // SECURITY: Select specific columns instead of SELECT *
        const { data: promos, error } = await (supabase as any)
            .from('promo_codes')
            .select('id, code, description, discount_type, discount_value, max_uses, current_uses, min_amount, max_discount, allowed_plans, starts_at, expires_at, is_active, created_at')
            .order('created_at', { ascending: false })

        if (error) {
            dbLogger.error('Failed to fetch promos:', error)
            return NextResponse.json({ ok: false, error: 'Failed to fetch promos' }, { status: 500 })
        }

        return NextResponse.json({ ok: true, promos })
    } catch (error) {
        dbLogger.error('Promos API error:', error)
        return NextResponse.json({ ok: false, error: 'Internal server error' }, { status: 500 })
    }
}

/**
 * POST /api/admin/promos - Create new promo code
 */
export async function POST(request: NextRequest) {
    try {
        const adminId = await verifyAdmin()
        if (!adminId) {
            return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 })
        }

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
        } = body

        // Validation
        if (!code || !discount_value) {
            return NextResponse.json({ ok: false, error: 'الكود ونسبة الخصم مطلوبان' }, { status: 400 })
        }

        const cleanCode = code.trim().toUpperCase()

        if (cleanCode.length < 3 || cleanCode.length > 30) {
            return NextResponse.json({ ok: false, error: 'الكود يجب أن يكون بين 3 و 30 حرف' }, { status: 400 })
        }

        if (discount_type === 'percentage' && (discount_value < 1 || discount_value > 100)) {
            return NextResponse.json({ ok: false, error: 'نسبة الخصم يجب أن تكون بين 1% و 100%' }, { status: 400 })
        }

        if (discount_type === 'fixed' && discount_value < 1) {
            return NextResponse.json({ ok: false, error: 'مبلغ الخصم يجب أن يكون أكبر من 0' }, { status: 400 })
        }

        const supabase = getSupabaseAdmin()

        // Check if code already exists
        const { data: existing } = await (supabase as any)
            .from('promo_codes')
            .select('id')
            .eq('code', cleanCode)
            .single()

        if (existing) {
            return NextResponse.json({ ok: false, error: 'هذا الكود موجود بالفعل' }, { status: 409 })
        }

        const insertData: any = {
            code: cleanCode,
            description: description || null,
            discount_type: discount_type || 'percentage',
            discount_value,
            max_uses: max_uses || null,
            min_amount: min_amount || 0,
            max_discount: max_discount || null,
            allowed_plans: allowed_plans && allowed_plans.length > 0 ? allowed_plans : null,
            starts_at: starts_at || new Date().toISOString(),
            expires_at: expires_at || null,
            is_active: true,
            current_uses: 0,
        }

        const { data: promo, error } = await (supabase as any)
            .from('promo_codes')
            .insert(insertData)
            .select()
            .single()

        if (error) {
            dbLogger.error('Failed to create promo:', error)
            return NextResponse.json({ ok: false, error: 'فشل إنشاء الكود' }, { status: 500 })
        }

        return NextResponse.json({ ok: true, promo })
    } catch (error) {
        dbLogger.error('Create promo API error:', error)
        return NextResponse.json({ ok: false, error: 'Internal server error' }, { status: 500 })
    }
}
