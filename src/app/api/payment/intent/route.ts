import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase-admin'

const VALID_PLANS = ['basic', 'pro', 'vip']

export async function POST(request: NextRequest) {
    try {
        // Get user ID from cookie
        const userId = request.cookies.get('ebook_user_id')?.value
        if (!userId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const body = await request.json()
        const plan = typeof body?.plan === 'string' ? body.plan.trim() : ''

        if (!VALID_PLANS.includes(plan)) {
            return NextResponse.json({ error: 'Invalid plan' }, { status: 400 })
        }

        const supabase = getSupabaseAdmin()

        // Upsert — only create if no recent pending intent (within 1 hour)
        const oneHourAgo = new Date(Date.now() - 3600_000).toISOString()
        const { data: existing } = await supabase
            .from('payment_intents')
            .select('id')
            .eq('user_id', userId)
            .eq('selected_plan', plan)
            .eq('completed', false)
            .gte('visited_at', oneHourAgo)
            .limit(1)

        if (existing && existing.length > 0) {
            // Already tracked recently
            return NextResponse.json({ success: true, existing: true })
        }

        await supabase.from('payment_intents').insert({
            user_id: userId,
            selected_plan: plan,
        })

        return NextResponse.json({ success: true })
    } catch {
        return NextResponse.json({ error: 'Internal error' }, { status: 500 })
    }
}
