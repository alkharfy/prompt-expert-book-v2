import { describe, expect, it } from 'vitest'
import { getCheckoutBasePrice } from '@/lib/payment-pricing'

const prices = { basic: 299, pro: 499, vip: 999 }
const now = Date.parse('2026-09-26T00:00:00Z')
const active = { plan_id: 'basic', status: 'active', expires_at: '2027-01-01T00:00:00Z' }

describe('server-authoritative checkout price', () => {
  it('uses the managed full price for a new subscriber', () => {
    expect(getCheckoutBasePrice(prices, 'basic', false, null, now)).toBe(299)
  })
  it('uses the actual active subscription for upgrade credit', () => {
    expect(getCheckoutBasePrice(prices, 'pro', true, active, now)).toBe(200)
    expect(getCheckoutBasePrice(prices, 'vip', true, active, now)).toBe(700)
  })
  it.each([null, { ...active, status: 'cancelled' }, { ...active, expires_at: '2026-01-01' }, { ...active, expires_at: 'bad' }])
    ('rejects upgrade credit without an active, unexpired subscription (%j)', subscription => {
      expect(() => getCheckoutBasePrice(prices, 'pro', true, subscription, now)).toThrow()
    })
  it('rejects duplicate purchases, equal tiers and downgrades', () => {
    expect(() => getCheckoutBasePrice(prices, 'basic', false, active, now)).toThrow()
    expect(() => getCheckoutBasePrice(prices, 'basic', true, active, now)).toThrow()
    expect(() => getCheckoutBasePrice(prices, 'pro', true, { ...active, plan_id: 'vip' }, now)).toThrow()
  })
  it('allows full-price renewal after expiry and rejects invalid prices', () => {
    expect(getCheckoutBasePrice(prices, 'basic', false, { ...active, expires_at: '2026-01-01' }, now)).toBe(299)
    expect(() => getCheckoutBasePrice({ basic: NaN }, 'basic', false, null, now)).toThrow()
    expect(() => getCheckoutBasePrice(prices, 'toString', false, null, now)).toThrow()
  })
})
