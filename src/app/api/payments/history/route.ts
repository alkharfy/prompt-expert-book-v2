import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase-admin'

export async function GET(request: NextRequest) {
    try {
        const userId = request.cookies.get('ebook_user_id')?.value
        if (!userId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const supabase = getSupabaseAdmin()

        const { data: payments, error } = await supabase
            .from('payments')
            .select('id, plan_id, amount, status, created_at, kashier_order_id')
            .eq('user_id', userId)
            .order('created_at', { ascending: false })
            .limit(20)

        if (error) {
            console.error('[payments/history] DB error:', error.message)
            return NextResponse.json({ payments: [] })
        }

        return NextResponse.json({
            payments: (payments || []).map(p => ({
                id: p.id,
                plan_id: p.plan_id,
                amount: p.amount,
                status: p.status,
                created_at: p.created_at,
                order_id: p.kashier_order_id,
            })),
        })
    } catch {
        return NextResponse.json({ error: 'Internal error' }, { status: 500 })
    }
}
