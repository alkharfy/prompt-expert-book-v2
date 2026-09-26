import { PLAN_ORDER } from './pricing'

/** Upgrade credit must be based on a current subscription read by the server. */
export function getCheckoutBasePrice(
  prices: Record<string, number>, targetPlan: string,
  upgrade: boolean, subscription: { plan_id: string | null; expires_at: string | null; status: string | null } | null,
  now = Date.now(),
): number {
  const price = prices[targetPlan]
  if (!['basic', 'pro', 'vip'].includes(targetPlan) || !Number.isFinite(price) || price < 1) throw new Error('باقة غير صالحة')
  if (!upgrade) {
    if (subscription?.status === 'active' && subscription.expires_at && new Date(subscription.expires_at).getTime() > now) {
      throw new Error('اشتراكك نشط بالفعل. اختر الترقية بدل شراء اشتراك مكرر.')
    }
    return price
  }
  const current = subscription?.plan_id
  if (!current || !['basic', 'pro', 'vip'].includes(current) || subscription?.status !== 'active' || !subscription.expires_at
    || !(new Date(subscription.expires_at).getTime() > now)) {
    throw new Error('الترقية تتطلب اشتراكًا نشطًا. اختر اشتراكًا جديدًا أو جدّد باقتك.')
  }
  const credit = prices[current]
  if (!Number.isFinite(credit) || credit <= 0 || PLAN_ORDER[targetPlan] <= PLAN_ORDER[current] || price <= credit) {
    throw new Error('اختر باقة أعلى من باقتك الحالية للترقية')
  }
  return Math.round((price - credit) * 100) / 100
}
