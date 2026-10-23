// ─────────────────────────────────────────────────────────────────────────────
// WS6 — single source of truth for ad / conversion tracking.
// The Pixel ID literal lives ONLY here. Shared event-id builders guarantee the
// browser Pixel and the server CAPI fire the SAME event_id so Meta deduplicates
// the paired events (otherwise every Purchase/Lead/IC is double-counted).
// ─────────────────────────────────────────────────────────────────────────────
/** Meta Pixel ID — public by nature (rendered in the page). */
export const META_PIXEL_ID =
  process.env.NEXT_PUBLIC_META_PIXEL_ID || process.env.META_PIXEL_ID || '981605484819613'

// Deterministic, shared event ids — browser + CAPI MUST agree for dedup.
export const purchaseEventId = (orderId: string) => `purchase_${orderId}`
export const checkoutEventId = (orderId: string) => `ic_${orderId}`
export const leadEventId = (userId: string) => `lead_${userId}`
