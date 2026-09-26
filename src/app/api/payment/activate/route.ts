import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase-admin'
import { getAuthenticatedUser } from '@/lib/auth-middleware'
import { getUserSubscription } from '@/lib/subscription'
import { verifyPaymentSession } from '@/lib/kashier'
import { activateStoredPayment, paymentAmountMatches } from '@/lib/payment-activation'
import { checkRateLimitAsync, getClientIP, RATE_LIMITS } from '@/lib/rate-limit'
import { dbLogger } from '@/lib/logger'

/** Recover verified checkouts without extending an old term or hiding upgrades. */
export async function POST(request: NextRequest) {
  try {
    const userId = await getAuthenticatedUser({ skipActiveCheck: true })
    if (!userId) return NextResponse.json({ success: false, error: 'يرجى تسجيل الدخول' }, { status: 401 })
    const limit = await checkRateLimitAsync('payment-activate:' + userId + ':' + getClientIP(request), RATE_LIMITS.PAYMENT_ACTIVATE)
    if (!limit.allowed) return NextResponse.json({ success: false, error: 'حاول مرة أخرى بعد قليل' }, { status: 429 })
    const supabase = getSupabaseAdmin()
    const { data: payment, error } = await (supabase.from('payments') as any)
      .select('id, status, plan_id, amount, paid_at, kashier_session_id, kashier_order_id')
      .eq('user_id', userId).in('status', ['pending', 'success'])
      .order('created_at', { ascending: false }).limit(1).maybeSingle()
    if (error) throw new Error('Payment lookup failed')
    if (payment?.status === 'pending' && payment.kashier_session_id) {
      const verified = await verifyPaymentSession(payment.kashier_session_id)
      if (verified.ok && verified.paid) {
        if (!paymentAmountMatches(verified.data?.amount, payment.amount)) {
          return NextResponse.json({ success: false, error: 'مبلغ الدفع غير مطابق للطلب' }, { status: 400 })
        }
        const paidAt = payment.paid_at || new Date().toISOString()
        const { error: updateError } = await (supabase.from('payments') as any)
          .update({ status: 'success', paid_at: paidAt }).eq('id', payment.id).eq('user_id', userId)
        if (updateError) throw new Error('Payment update failed')
        payment.status = 'success'
      }
    }
    if (payment?.status === 'success') {
      const activation = await activateStoredPayment(userId, payment.id, 'activate')
      if (!activation.ok && !['subscription_expired', 'subscription_inactive', 'upgrade_subscription_expired'].includes(activation.error || '')) {
        throw new Error(activation.error || 'Activation failed')
      }
    }
    const subscription = await getUserSubscription(userId)
    const hasPaid = subscription?.status === 'active' && !!subscription.expires_at && new Date(subscription.expires_at).getTime() > Date.now()
    return NextResponse.json({
      success: !!hasPaid, hasPaid: !!hasPaid, plan: hasPaid ? subscription?.plan_id : null,
      planId: hasPaid ? subscription?.plan_id : null,
      amount: hasPaid && payment?.status === 'success' ? payment.amount : null,
      orderId: hasPaid && payment?.status === 'success' ? payment.kashier_order_id : null,
      message: hasPaid ? 'الاشتراك مفعل' : 'لا يوجد اشتراك نشط؛ يمكنك اختيار باقة جديدة',
    })
  } catch (error) {
    dbLogger.error('[activate] Recovery failed:', error)
    return NextResponse.json({ success: false, error: 'تعذّر التحقق من الاشتراك. حاول مرة أخرى أو تواصل مع الدعم.' }, { status: 500 })
  }
}
