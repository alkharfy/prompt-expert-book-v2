import { describe, it, expect, vi } from 'vitest'
import {
  FALLBACK_PLAN_PRICES,
  PRODUCT_STATS,
  AI56_FINAL_PRICE,
  applyPromoDiscount,
  normalizePricingPlans,
  fetchPricingPlans,
  checkoutKind,
  promoAppliesToPlan,
  planLabel,
} from '@/lib/pricing'

describe('pricing constants (single source of truth)', () => {
  it('internal estimates match the current ladder 100/299/499/999', () => {
    expect(FALLBACK_PLAN_PRICES).toEqual({ monthly: 100, basic: 299, pro: 499, vip: 999 })
  })

  it('canonical product stats match the real data', () => {
    expect(PRODUCT_STATS.templates).toBe(95)
    expect(PRODUCT_STATS.exercises).toBe(45)
    expect(PRODUCT_STATS.readingPages).toBe(202)
    expect(PRODUCT_STATS.freePages).toBe(3)
  })

  it('AI56 intro offer is 5 EGP', () => {
    expect(AI56_FINAL_PRICE).toBe(5)
  })
})

describe('public pricing without a stale fallback', () => {
  it('uses decimal prices from the database and canonical entitlements', () => {
    const plans = normalizePricingPlans([{ id: 'vip', price: '1200.50' }, { id: 'basic', price: '350' }])
    expect(plans.map(p => p.price)).toEqual([350, 1200.5])
    // No monthly row (before the migration, or switched off): basic lists the course itself
    expect(plans[0].features_ar.join(' ')).toContain('المستوى 1 والمستوى 2')
    expect(plans[0].features_ar.join(' ')).not.toContain('الشهري')
    expect(plans[1].features_ar).toContain('كل اللي في المتقدمة')
    expect(plans[1].features_ar).toContain('المساعد الذكي: لحد 30 رسالة في اليوم تسأله في شغلك')
    const withMonthly = normalizePricingPlans([{ id: 'monthly', price: 100 }, { id: 'basic', price: 350 }])
    expect(withMonthly[1].features_ar).toContain('كل اللي في الشهري، لمدة سنة')
    expect(plans.every(p => p.period === 'سنة')).toBe(true)
    expect(plans[1].features_ar).not.toContain('تحديثات AI')
    expect(plans[1].features_ar).not.toContain('مكتبة المصادر')
    expect(plans[0].cta_link).toBe('/payment?plan=basic')
  })
  it('promises 1, 2 and 4 live lectures a month for the subscription year, none in the monthly plan', () => {
    const plans = normalizePricingPlans([{ id: 'basic', price: 2900 }, { id: 'pro', price: 4900 }, { id: 'vip', price: 9900 }, { id: 'monthly', price: 100 }])
    expect(plans.map(p => p.id)).toEqual(['monthly', 'basic', 'pro', 'vip'])
    expect(plans.slice(1).map(p => p.features_ar[1])).toEqual([
      'محاضرة أونلاين مباشرة كل شهر طول السنة',
      'محاضرتين أونلاين مباشرين كل شهر طول السنة',
      '4 محاضرات أونلاين مباشرة كل شهر طول السنة',
    ])
    expect(plans[0].features_ar.join(' ')).not.toContain('محاضر')
  })
  it('sells the monthly plan as the course itself, for 100 a month, without auto-renewal', () => {
    const [monthly] = normalizePricingPlans([{ id: 'monthly', price: '100' }])
    expect(monthly).toMatchObject({ price: 100, period: 'شهر', is_popular: true, cta_link: '/payment?plan=monthly' })
    expect(monthly.features_ar.join(' ')).toContain('المستر بيصحّح')
    expect(monthly.features_ar.join(' ')).toContain('من غير تجديد تلقائي')
  })
  it('skips a plan row the code does not know yet instead of breaking the price list', () => {
    expect(normalizePricingPlans([{ id: 'family', price: 50 }, { id: 'basic', price: 2900 }]).map(p => p.id)).toEqual(['basic'])
  })
  it('names every plan and never guesses VIP for an unknown id', () => {
    expect(planLabel('monthly')).toBe('الشهري')
    expect(planLabel('weird')).toBe('باقتك')
    expect(planLabel(null)).toBe('باقتك')
  })
  it.each([[], null, [{ id: 'basic', price: true }], [{ id: 'basic', price: 0 }],
    [{ id: 'basic', price: 'not a number' }], [{ id: 'other', price: 99 }],
    [{ id: 'basic', price: 299 }, { id: 'basic', price: 399 }]])('rejects unavailable or malformed prices (%j)', rows => {
      expect(() => normalizePricingPlans(rows)).toThrow()
    })
  it('surfaces an API error instead of showing an invented price', async () => {
    vi.mocked(fetch).mockResolvedValueOnce({ ok: false } as Response)
    await expect(fetchPricingPlans()).rejects.toThrow()
  })
})

describe('what a purchase means for the current term', () => {
  const now = Date.parse('2026-10-18T00:00:00Z')
  const monthly = { plan_id: 'monthly', status: 'active', expires_at: '2026-11-10T00:00:00Z' }
  const basic = { plan_id: 'basic', status: 'active', expires_at: '2027-05-01T00:00:00Z' }
  it('tells new, renew, switch, upgrade and blocked apart', () => {
    expect(checkoutKind(null, 'monthly', now)).toBe('new')
    expect(checkoutKind({ ...monthly, expires_at: '2026-10-01' }, 'basic', now)).toBe('new')
    expect(checkoutKind(monthly, 'monthly', now)).toBe('renew')
    expect(checkoutKind(monthly, 'vip', now)).toBe('switch')
    expect(checkoutKind(basic, 'pro', now)).toBe('upgrade')
    expect(checkoutKind(basic, 'basic', now)).toBe('blocked')
    expect(checkoutKind(basic, 'monthly', now)).toBe('blocked')
  })
  it('keeps promo codes off the monthly plan unless the admin listed it', () => {
    expect(promoAppliesToPlan(null, 'monthly')).toBe(false)
    expect(promoAppliesToPlan([], 'monthly')).toBe(false)
    expect(promoAppliesToPlan(['monthly'], 'monthly')).toBe(true)
    expect(promoAppliesToPlan(null, 'basic')).toBe(true)
    expect(promoAppliesToPlan(['pro'], 'basic')).toBe(false)
  })
})

describe('invalid discount settings fail closed', () => {
  it.each([
    { discount_type: 'fixed', discount_value: -1 },
    { discount_type: 'fixed', discount_value: 'bad' },
    { discount_type: 'percentage', discount_value: 150 },
    { discount_type: 'percentage', discount_value: 25, max_discount: -2 },
    { discount_type: 'fixed_final', discount_value: 0 },
    { discount_type: 'unknown', discount_value: 25 },
  ])('rejects %j', promo => expect(() => applyPromoDiscount(299, promo)).toThrow())
  it('preserves cents in percentage pricing', () => {
    expect(applyPromoDiscount(299, { discount_type: 'percentage', discount_value: 15 }).finalAmount).toBe(254.15)
  })
})

describe('applyPromoDiscount — shared by create-session AND /api/promo/validate', () => {
  it('AI56 (fixed_final=5) lands at exactly 5 on basic=99 (not 1, not 0)', () => {
    const r = applyPromoDiscount(99, { discount_type: 'fixed_final', discount_value: 5 })
    expect(r.finalAmount).toBe(5)
    expect(r.discountAmount).toBe(94)
  })

  it('fixed_final stays at the target final price even if the admin changes the price', () => {
    expect(applyPromoDiscount(150, { discount_type: 'fixed_final', discount_value: 5 }).finalAmount).toBe(5)
    expect(applyPromoDiscount(199, { discount_type: 'fixed_final', discount_value: 5 }).finalAmount).toBe(5)
  })

  it('handles DB DECIMAL strings for discount_value', () => {
    expect(applyPromoDiscount(99, { discount_type: 'fixed_final', discount_value: '5' }).finalAmount).toBe(5)
  })

  it('percentage applies and respects max_discount', () => {
    expect(applyPromoDiscount(100, { discount_type: 'percentage', discount_value: 30 }).finalAmount).toBe(70)
    expect(applyPromoDiscount(100, { discount_type: 'percentage', discount_value: 90, max_discount: 50 }).finalAmount).toBe(50)
  })

  it('fixed amount applies', () => {
    expect(applyPromoDiscount(199, { discount_type: 'fixed', discount_value: 50 }).finalAmount).toBe(149)
  })

  it('never drives a non-fixed_final code below 1 (Kashier rejects 0)', () => {
    expect(applyPromoDiscount(99, { discount_type: 'fixed', discount_value: 999 }).finalAmount).toBe(1)
  })
})
