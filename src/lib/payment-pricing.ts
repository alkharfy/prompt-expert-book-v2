import { checkoutKind, PLAN_ORDER } from './pricing'

/**
 * The amount to charge, from the server's own subscription read.
 * - a new plan, a monthly renewal, or a monthly → yearly switch: the full price
 * - a yearly → higher yearly upgrade: the price difference (the end date stays)
 */
export function getCheckoutBasePrice(
  prices: Record<string, number>, targetPlan: string,
  upgrade: boolean, subscription: { plan_id: string | null; expires_at: string | null; status: string | null } | null,
  now = Date.now(),
): number {
  const price = prices[targetPlan]
  if (!Object.prototype.hasOwnProperty.call(PLAN_ORDER, targetPlan) || !Number.isFinite(price) || price < 1) throw new Error('باقة غير صالحة')
  const kind = checkoutKind(subscription, targetPlan, now)
  if (!upgrade) {
    if (kind === 'new' || kind === 'renew' || kind === 'switch') return price
    throw new Error(kind === 'upgrade'
      ? 'اشتراكك نشط بالفعل. اختار الترقية بدل اشتراك مكرر.'
      : 'اشتراكك السنوي لسه شغال. تقدر ترقّي لباقة أعلى بس.')
  }
  if (kind !== 'upgrade') {
    throw new Error(kind === 'new'
      ? 'الترقية محتاجة اشتراك نشط. اختار اشتراك جديد أو جدّد باقتك.'
      : kind === 'renew' || kind === 'switch' ? 'الاشتراك الشهري مبيترقّاش: اختار الباقة السنوية وادفعها كاملة، وهتبدأ بعد شهرك الحالي.'
      : 'اختار باقة أعلى من باقتك الحالية للترقية')
  }
  const credit = prices[subscription!.plan_id!]
  if (!Number.isFinite(credit) || credit <= 0 || price <= credit) {
    throw new Error('اختار باقة أعلى من باقتك الحالية للترقية')
  }
  return Math.round((price - credit) * 100) / 100
}
