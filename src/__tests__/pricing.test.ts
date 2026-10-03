import { describe, it, expect, vi } from 'vitest'
import {
  FALLBACK_PLAN_PRICES,
  PRODUCT_STATS,
  AI56_FINAL_PRICE,
  applyPromoDiscount,
  normalizePricingPlans,
  fetchPricingPlans,
} from '@/lib/pricing'

describe('pricing constants (single source of truth)', () => {
  it('internal estimates match the current ladder 299/499/999', () => {
    expect(FALLBACK_PLAN_PRICES).toEqual({ basic: 299, pro: 499, vip: 999 })
  })

  it('canonical product stats match the real data', () => {
    expect(PRODUCT_STATS.templates).toBe(95)
    expect(PRODUCT_STATS.exercises).toBe(45)
    expect(PRODUCT_STATS.freePages).toBe(23)
  })

  it('AI56 intro offer is 5 EGP', () => {
    expect(AI56_FINAL_PRICE).toBe(5)
  })
})

describe('public pricing without a stale fallback', () => {
  it('uses decimal prices from the database and canonical entitlements', () => {
    const plans = normalizePricingPlans([{ id: 'vip', price: '1200.50' }, { id: 'basic', price: '350' }])
    expect(plans.map(p => p.price)).toEqual([350, 1200.5])
    expect(plans[0].features_ar).toContain('45 تمرينًا تفاعليًا')
    expect(plans[1].features_ar).toContain('شهادة إتمام من PromptMaster')
    expect(plans[1].features_ar).toContain('المحادثة الذكية حتى 30 رسالة خلال 24 ساعة')
    expect(plans[1].features_ar).toContain('أدوات البرومبت؛ تشخيص AI حتى 10 مرات خلال 24 ساعة')
    expect(plans[1].features_ar).not.toContain('تحديثات AI')
    expect(plans[1].features_ar).not.toContain('مكتبة المصادر')
    expect(plans[0].cta_link).toBe('/payment?plan=basic')
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
