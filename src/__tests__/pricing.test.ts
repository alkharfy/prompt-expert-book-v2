import { describe, it, expect } from 'vitest'
import {
  FALLBACK_PLAN_PRICES,
  PRODUCT_STATS,
  AI56_FINAL_PRICE,
  applyPromoDiscount,
} from '@/lib/pricing'

describe('pricing constants (single source of truth)', () => {
  it('fallback plan prices are the real ladder 99/199/399', () => {
    expect(FALLBACK_PLAN_PRICES).toEqual({ basic: 99, pro: 199, vip: 399 })
  })

  it('canonical product stats match the real data', () => {
    expect(PRODUCT_STATS.templates).toBe(95)
    expect(PRODUCT_STATS.exercises).toBe(48)
    expect(PRODUCT_STATS.freePages).toBe(23)
  })

  it('AI56 intro offer is 5 EGP', () => {
    expect(AI56_FINAL_PRICE).toBe(5)
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
