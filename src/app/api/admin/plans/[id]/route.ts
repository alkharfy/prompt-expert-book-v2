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
 * PUT /api/admin/plans/:id - Update plan (Admin only)
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const adminId = await verifyAdmin()
    if (!adminId) {
      return NextResponse.json(
        { ok: false, error: 'Unauthorized or not admin' },
        { status: 403 }
      )
    }

    const supabase = getSupabaseAdmin()
    const { id } = await params
    const planId = id
    const body = await request.json()
    const { name, name_ar, price, features, features_ar, is_active, display_order } = body

    // Build update object (only update provided fields)
    const updates: any = {}
    if (name !== undefined) updates.name = name
    if (name_ar !== undefined) updates.name_ar = name_ar
    if (price !== undefined) updates.price = price
    if (features !== undefined) updates.features = features
    if (features_ar !== undefined) updates.features_ar = features_ar
    if (is_active !== undefined) updates.is_active = is_active
    if (display_order !== undefined) updates.display_order = display_order

    if (Object.keys(updates).length === 0) {
      return NextResponse.json(
        { ok: false, error: 'No fields to update' },
        { status: 400 }
      )
    }

    const { data: updatedPlan, error } = await supabase
      .from('plans' as any)
      .update(updates)
      .eq('id', planId)
      .select()
      .single()

    if (error) {
      dbLogger.error('Failed to update plan:', error)
      return NextResponse.json(
        { ok: false, error: 'Failed to update plan' },
        { status: 500 }
      )
    }

    return NextResponse.json({ ok: true, plan: updatedPlan })
  } catch (error) {
    dbLogger.error('Update plan API error:', error)
    return NextResponse.json(
      { ok: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/admin/plans/:id - Deactivate plan (Admin only)
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const adminId = await verifyAdmin()
    if (!adminId) {
      return NextResponse.json(
        { ok: false, error: 'Unauthorized or not admin' },
        { status: 403 }
      )
    }

    const supabase = getSupabaseAdmin()
    const { id } = await params
    const planId = id

    // Deactivate instead of deleting (soft delete)
    const { error } = await supabase
      .from('plans' as any)
      .update({ is_active: false })
      .eq('id', planId)

    if (error) {
      dbLogger.error('Failed to deactivate plan:', error)
      return NextResponse.json(
        { ok: false, error: 'Failed to deactivate plan' },
        { status: 500 }
      )
    }

    return NextResponse.json({ ok: true, message: 'Plan deactivated' })
  } catch (error) {
    dbLogger.error('Delete plan API error:', error)
    return NextResponse.json(
      { ok: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}
