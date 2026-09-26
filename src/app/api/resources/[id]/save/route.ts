import { getAuthenticatedUser } from '@/lib/auth-middleware'
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// POST /api/resources/[id]/save — حفظ مصدر
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const userId = await getAuthenticatedUser()
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id: resourceId } = await params

    const { error } = await supabaseAdmin
      .from('user_saved_resources')
      .upsert({ user_id: userId, resource_id: resourceId }, { onConflict: 'user_id,resource_id' })

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ ok: true, saved: true })
  } catch {
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}

// DELETE /api/resources/[id]/save — إزالة من المحفوظات
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const userId = await getAuthenticatedUser()
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id: resourceId } = await params

    const { error } = await supabaseAdmin
      .from('user_saved_resources')
      .delete()
      .eq('user_id', userId)
      .eq('resource_id', resourceId)

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ ok: true, saved: false })
  } catch {
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}
