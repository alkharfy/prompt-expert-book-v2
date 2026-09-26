/**
 * Meta Pixel (Facebook Pixel) — Event Tracking
 * Pixel ID: centralized in src/lib/tracking-config (META_PIXEL_ID)
 * 
 * Usage:
 *   import { trackMetaEvent } from '@/lib/meta-pixel'
 *   trackMetaEvent('ViewContent', { content_name: 'PromptMaster Book' })
 */

import { META_PIXEL_ID, purchaseEventId } from '@/lib/tracking-config'

declare global {
  interface Window {
    fbq?: (...args: unknown[]) => void
    _fbq?: (...args: unknown[]) => void
  }
}

const PIXEL_ID = META_PIXEL_ID

// ── Core ────────────────────────────────────────

/** Fire a standard or custom Meta Pixel event */
export function trackMetaEvent(eventName: string, params?: Record<string, unknown>) {
  if (typeof window !== 'undefined' && typeof window.fbq === 'function') {
    window.fbq('track', eventName, params)
  }
}

/** Fire a standard event with a unique event_id for CAPI deduplication */
export function trackMetaEventWithId(eventName: string, eventId: string, params?: Record<string, unknown>) {
  if (typeof window !== 'undefined' && typeof window.fbq === 'function') {
    window.fbq('track', eventName, params, { eventID: eventId })
  }
}

/** Track a PageView — called on initial load and on SPA route changes */
export function trackPageView() {
  if (typeof window !== 'undefined' && typeof window.fbq === 'function') {
    window.fbq('track', 'PageView')
  }
}

// ── Standard Events ─────────────────────────────

/** ViewContent — user views book details / table of contents.
 *  No monetary value: a page view is not revenue, and there is no server CAPI
 *  twin to deduplicate against (the dead sendCAPIViewContent was removed). */
export function trackViewContent() {
  trackMetaEvent('ViewContent', {
    content_name: 'PromptMaster Book',
    content_type: 'product',
    content_ids: ['promptmaster-book'],
  })
}

/** Lead — user signs up for a new account.
 *  Pass the shared leadEventId(userId) so the server CAPI Lead deduplicates. */
export function trackLead(eventId?: string) {
  const params = {
    content_name: 'PromptMaster Registration',
    value: 0,
    currency: 'EGP',
  }
  if (eventId) trackMetaEventWithId('Lead', eventId, params)
  else trackMetaEvent('Lead', params)
}

/** CompleteRegistration — user completes account creation */
export function trackCompleteRegistration() {
  trackMetaEvent('CompleteRegistration', {
    content_name: 'PromptMaster Account',
    status: 'complete',
  })
}

/** InitiateCheckout — user starts payment.
 *  `value` is REQUIRED (real EGP amount); pass checkoutEventId(orderId) so the
 *  server CAPI InitiateCheckout deduplicates. */
export function trackInitiateCheckout(value: number, eventId?: string) {
  const params = {
    content_name: 'PromptMaster Book',
    content_ids: ['promptmaster-book'],
    value,
    currency: 'EGP',
    num_items: 1,
  }
  if (eventId) trackMetaEventWithId('InitiateCheckout', eventId, params)
  else trackMetaEvent('InitiateCheckout', params)
}

/**
 * Purchase — payment completed successfully (MOST IMPORTANT EVENT)
 * Uses sessionStorage flag to prevent duplicate fires on refresh/back navigation.
 * Uses event_id for CAPI deduplication.
 */
export function trackPurchase(value: number, orderId?: string) {
  if (typeof window === 'undefined') return

  // Deduplicate: only fire once per order
  const storageKey = orderId ? `fbq_purchase_${orderId}` : 'fbq_purchase_done'
  if (sessionStorage.getItem(storageKey)) return

  // MUST equal the server CAPI event_id (purchaseEventId) or Meta double-counts.
  const eventId = orderId ? purchaseEventId(orderId) : `purchase_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`

  trackMetaEventWithId('Purchase', eventId, {
    content_name: 'PromptMaster Book',
    content_type: 'product',
    content_ids: ['promptmaster-book'],
    value,
    currency: 'EGP',
    num_items: 1,
  })

  sessionStorage.setItem(storageKey, '1')

  // Return eventId for CAPI deduplication
  return eventId
}

/** Search — user searches for content */
export function trackSearch(searchString: string) {
  trackMetaEvent('Search', {
    search_string: searchString,
    content_category: 'Book Content',
  })
}

// ── Helpers ─────────────────────────────────────

/** Get fbp cookie value for CAPI */
export function getFbpCookie(): string | null {
  if (typeof document === 'undefined') return null
  const match = document.cookie.match(/(?:^|;\s*)_fbp=([^;]*)/)
  return match ? decodeURIComponent(match[1]) : null
}

/** Get fbc cookie value for CAPI */
export function getFbcCookie(): string | null {
  if (typeof document === 'undefined') return null
  const match = document.cookie.match(/(?:^|;\s*)_fbc=([^;]*)/)
  return match ? decodeURIComponent(match[1]) : null
}

/** Get the Pixel ID */
export function getPixelId(): string {
  return PIXEL_ID
}
