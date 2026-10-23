import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase-admin'
import { dbLogger } from '@/lib/logger'
import { verifyAdmin } from '@/lib/admin-auth'

/**
 * GET /api/admin/plans - Get active plans (public)
 * GET /api/admin/plans?all=1 - Get every plan with its is_active flag (admin only),
 * so the admin page shows each plan's real status and can re-enable a disabled one.
 */
export async function GET(request: NextRequest) {
  try {
    const includeInactive = request.nextUrl.searchParams.get('all') === '1'
    if (includeInactive && !(await verifyAdmin())) {
      return NextResponse.json(
        { ok: false, error: 'Unauthorized or not admin' },
        { status: 403 }
      )
    }

    const supabase = getSupabaseAdmin()

    // SECURITY: Select specific safe columns — don't expose internal fields
    let query = supabase
      .from('plans' as any)
      .select(includeInactive
        ? 'id, name, name_ar, price, features, features_ar, display_order, is_active'
        : 'id, name, name_ar, price, features, features_ar, display_order')
    if (!includeInactive) query = query.eq('is_active', true)
    const { data: plans, error } = await query.order('display_order', { ascending: true })

    if (error) {
      dbLogger.error('Failed to fetch plans:', error)
      return NextResponse.json(
        { ok: false, error: 'Failed to fetch plans' },
        { status: 500 }
      )
    }

    return NextResponse.json({ ok: true, plans }, { headers: { 'Cache-Control': 'no-store' } })
  } catch (error) {
    dbLogger.error('Plans API error:', error)
    return NextResponse.json(
      { ok: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/admin/plans - Create new plan
 * Admin only
 */
export async function POST(request: NextRequest) {
  try {
    const adminId = await verifyAdmin()
    if (!adminId) {
      return NextResponse.json(
        { ok: false, error: 'Unauthorized or not admin' },
        { status: 403 }
      )
    }

    const supabase = getSupabaseAdmin()

    const body = await request.json()
    const { id, name, name_ar, price, features, features_ar, display_order } = body

    // Validate inputs
    if (!id || !name || !name_ar || price === undefined) {
      return NextResponse.json(
        { ok: false, error: 'Missing required fields' },
        { status: 400 }
      )
    }

    const { data: newPlan, error } = await supabase
      .from('plans' as any)
      .insert({
        id,
        name,
        name_ar,
        price,
        features: features || [],
        features_ar: features_ar || [],
        display_order: display_order || 0,
        is_active: true,
      })
      .select()
      .single()

    if (error) {
      dbLogger.error('Failed to create plan:', error)
      return NextResponse.json(
        { ok: false, error: 'Failed to create plan' },
        { status: 500 }
      )
    }

    return NextResponse.json({ ok: true, plan: newPlan })
  } catch (error) {
    dbLogger.error('Create plan API error:', error)
    return NextResponse.json(
      { ok: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}
