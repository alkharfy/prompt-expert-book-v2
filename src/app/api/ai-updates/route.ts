import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// GET /api/ai-updates — جلب تحديثات AI
export async function GET() {
  try {
    const { data, error } = await supabaseAdmin
      .from('ai_changelog')
      .select('*')
      .eq('is_active', true)
      .order('published_at', { ascending: false })
      .limit(20)

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ updates: data || [] })
  } catch {
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}
