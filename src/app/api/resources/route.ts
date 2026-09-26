import { getAuthenticatedUser } from '@/lib/auth-middleware'
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { LEARNING_RESOURCES, AI_CHANGELOG_SEEDS } from '@/data/learningResources'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// GET /api/resources — جلب المصادر مع فلترة
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const category = searchParams.get('category')
    const specialization = searchParams.get('specialization')
    const level = searchParams.get('level')
    const search = searchParams.get('search')
    const saved = searchParams.get('saved') === 'true'
    const userId = await getAuthenticatedUser()

    let query = supabaseAdmin
      .from('learning_resources')
      .select('*')
      .eq('is_active', true)
      .order('created_at', { ascending: false })

    if (category && category !== 'all') {
      query = query.eq('category', category)
    }

    if (specialization && specialization !== 'all') {
      query = query.contains('specialization', [specialization])
    }

    if (level && level !== 'all') {
      query = query.eq('level', level)
    }

    if (search) {
      query = query.or(`title_ar.ilike.%${search}%,description_ar.ilike.%${search}%,title_en.ilike.%${search}%`)
    }

    const { data: resources, error } = await query

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // إذا المستخدم مسجل دخول، جلب المحفوظات
    let savedIds: string[] = []
    if (userId) {
      const { data: savedData } = await supabaseAdmin
        .from('user_saved_resources')
        .select('resource_id')
        .eq('user_id', userId)

      savedIds = (savedData || []).map(s => s.resource_id)
    }

    // فلترة المحفوظات فقط
    let result = resources || []
    if (saved && userId) {
      result = result.filter(r => savedIds.includes(r.id))
    }

    return NextResponse.json({
      resources: result.map(r => ({ ...r, is_saved: savedIds.includes(r.id) })),
      total: result.length,
    })
  } catch {
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}

// POST /api/resources — seed المصادر الأولية (admin فقط)
export async function POST(request: NextRequest) {
  try {
    const userId = await getAuthenticatedUser()
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data: admin, error: adminError } = await supabaseAdmin.from('users').select('is_admin').eq('id', userId).maybeSingle()
    if (adminError || !admin?.is_admin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    const body = await request.json()

    if (body.action === 'seed') {
      // Seed resources
      const { data: existing } = await supabaseAdmin
        .from('learning_resources')
        .select('id')
        .limit(1)

      if (existing && existing.length > 0) {
        return NextResponse.json({ message: 'المصادر موجودة بالفعل', seeded: false })
      }

      const { error } = await supabaseAdmin
        .from('learning_resources')
        .insert(LEARNING_RESOURCES.map(r => ({
          title_ar: r.title_ar,
          title_en: r.title_en || null,
          description_ar: r.description_ar,
          url: r.url,
          category: r.category,
          specialization: r.specialization,
          level: r.level,
          related_sections: r.related_sections || null,
          is_free: r.is_free,
          language: r.language,
          freshness_status: r.freshness_status,
          is_model_specific: r.is_model_specific,
          ai_model_version: r.ai_model_version || null,
        })))

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 })
      }

      // Seed changelog
      const { error: clError } = await supabaseAdmin
        .from('ai_changelog')
        .insert(AI_CHANGELOG_SEEDS.map(c => ({
          title_ar: c.title_ar,
          content_ar: c.content_ar,
          category: c.category,
          importance: c.importance,
          source_url: c.source_url || null,
          published_at: c.published_at,
        })))

      if (clError) {
        return NextResponse.json({ error: clError.message }, { status: 500 })
      }

      return NextResponse.json({ message: 'تم إضافة المصادر والتحديثات', seeded: true })
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
  } catch {
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}
