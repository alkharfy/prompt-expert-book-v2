// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { purchaseEventId, checkoutEventId, leadEventId } from '@/lib/tracking-config'
import { trackPurchase, trackInitiateCheckout, trackLead } from '@/lib/meta-pixel'

/**
 * WS6 dedup contract: the browser Pixel and the server CAPI MUST fire the same
 * event_id for each revenue event, and with the REAL value (no 5.00/50.00
 * defaults). These tests fail if either side drifts.
 */
describe('tracking event-id dedup contract', () => {
  beforeEach(() => {
    ;(window as unknown as { fbq: ReturnType<typeof vi.fn> }).fbq = vi.fn()
    sessionStorage.clear()
  })

  const callFor = (event: string) =>
    (window as unknown as { fbq: { mock: { calls: unknown[][] } } }).fbq.mock.calls.find(
      (c) => c[1] === event
    )

  it('event-id builders are deterministic and match the cross-side convention', () => {
    // purchaseEventId MUST equal meta-capi sendCAPIPurchase default `purchase_${orderId}`
    expect(purchaseEventId('ORD1')).toBe('purchase_ORD1')
    expect(checkoutEventId('ORD1')).toBe('ic_ORD1')
    expect(leadEventId('U1')).toBe('lead_U1')
  })

  it('browser Purchase fires with the shared purchaseEventId and the real value', () => {
    trackPurchase(99, 'ORD1')
    const call = callFor('Purchase')
    expect(call).toBeTruthy()
    expect((call![2] as { value: number }).value).toBe(99) // not a 5.00 default
    expect(call![3]).toEqual({ eventID: purchaseEventId('ORD1') })
  })

  it('browser InitiateCheckout fires with the shared checkoutEventId', () => {
    trackInitiateCheckout(199, checkoutEventId('ORD2'))
    const call = callFor('InitiateCheckout')
    expect(call).toBeTruthy()
    expect((call![2] as { value: number }).value).toBe(199)
    expect(call![3]).toEqual({ eventID: 'ic_ORD2' })
  })

  it('browser Lead fires with the shared leadEventId', () => {
    trackLead(leadEventId('U9'))
    const call = callFor('Lead')
    expect(call).toBeTruthy()
    expect(call![3]).toEqual({ eventID: 'lead_U9' })
  })
})
