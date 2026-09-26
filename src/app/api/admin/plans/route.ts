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
 * GET /api/admin/plans - Get all plans
 * Public route - anyone can view plans
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = getSupabaseAdmin()

    // SECURITY: Select specific safe columns — don't expose internal fields
    const { data: plans, error } = await supabase
      .from('plans' as any)
      .select('id, name, name_ar, price, features, features_ar, display_order')
      .eq('is_active', true)
      .order('display_order', { ascending: true })

    if (error) {
      dbLogger.error('Failed to fetch plans:', error)
      return NextResponse.json(
        { ok: false, error: 'Failed to fetch plans' },
        { status: 500 }
      )
    }

    return NextResponse.json({ ok: true, plans })
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
