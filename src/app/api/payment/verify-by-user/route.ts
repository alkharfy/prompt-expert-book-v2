import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase-admin'
import { getAuthenticatedUser } from '@/lib/auth-middleware'
import { dbLogger } from '@/lib/logger'
import { POST as verifyByOrder } from '../verify-by-order/route'

/** Verify this user's latest checkout, including a pending upgrade. */
export async function POST(request: NextRequest) {
  try {
    const userId = await getAuthenticatedUser({ skipActiveCheck: true })
    if (!userId) return NextResponse.json({ error: 'يرجى تسجيل الدخول' }, { status: 401 })
    const { data: payment, error } = await (getSupabaseAdmin().from('payments') as any)
      .select('kashier_order_id').eq('user_id', userId).in('status', ['pending', 'success'])
      .order('created_at', { ascending: false }).limit(1).maybeSingle()
    if (error) return NextResponse.json({ error: 'تعذّر تحميل عملية الدفع' }, { status: 500 })
    if (!payment?.kashier_order_id) return NextResponse.json({ error: 'لم يتم العثور على عملية دفع' }, { status: 404 })
    return verifyByOrder(new NextRequest(new URL('/api/payment/verify-by-order', request.url), {
      method: 'POST', headers: request.headers, body: JSON.stringify({ orderId: payment.kashier_order_id }),
    }))
  } catch (error) {
    dbLogger.error('Payment verify-by-user error:', error)
    return NextResponse.json({ error: 'حدث خطأ في التحقق من الدفع' }, { status: 500 })
  }
}
