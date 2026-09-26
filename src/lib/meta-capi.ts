/**
 * Meta Conversions API (CAPI) — Server-Side Event Tracking
 * 
 * Sends events to Meta from the server for reliable attribution,
 * especially for ad-blocked browsers.
 * 
 * Uses the same event_id as the browser Pixel for deduplication.
 * 
 * Requires env vars:
 *   META_PIXEL_ID           — centralized in src/lib/tracking-config
 *   META_CONVERSIONS_TOKEN  — Access token from Meta Events Manager
 */

import crypto from 'crypto'
import { SITE_URL } from '@/lib/config'
import { META_PIXEL_ID } from '@/lib/tracking-config'

const PIXEL_ID = META_PIXEL_ID
const ACCESS_TOKEN = process.env.META_CONVERSIONS_TOKEN || ''
const API_VERSION = 'v21.0'

interface UserData {
  email?: string       // will be SHA256 hashed
  phone?: string       // will be SHA256 hashed
  clientIp?: string
  userAgent?: string
  fbp?: string         // _fbp cookie
  fbc?: string         // _fbc cookie
}

interface CAPIEvent {
  eventName: string
  eventId?: string     // must match browser Pixel eventID for dedup
  eventTime?: number   // unix timestamp in seconds
  eventSourceUrl?: string
  userData?: UserData
  customData?: Record<string, unknown>
}

/** Hash a value with SHA256 (lowercase, trimmed) per Meta requirements */
function sha256(value: string): string {
  return crypto.createHash('sha256').update(value.trim().toLowerCase()).digest('hex')
}

/**
 * Send one or more events to Meta Conversions API.
 * Silently fails if META_CONVERSIONS_TOKEN is not set (graceful degradation).
 */
export async function sendCAPIEvent(events: CAPIEvent | CAPIEvent[]): Promise<boolean> {
  if (!ACCESS_TOKEN) {
    console.warn('[CAPI] META_CONVERSIONS_TOKEN not set — skipping server event')
    return false
  }

  const eventArray = Array.isArray(events) ? events : [events]

  const payload = {
    data: eventArray.map(evt => {
      const userData: Record<string, unknown> = {}

      if (evt.userData?.email) userData.em = [sha256(evt.userData.email)]
      if (evt.userData?.phone) userData.ph = [sha256(evt.userData.phone)]
      if (evt.userData?.clientIp) userData.client_ip_address = evt.userData.clientIp
      if (evt.userData?.userAgent) userData.client_user_agent = evt.userData.userAgent
      if (evt.userData?.fbp) userData.fbp = evt.userData.fbp
      if (evt.userData?.fbc) userData.fbc = evt.userData.fbc

      return {
        event_name: evt.eventName,
        event_time: evt.eventTime || Math.floor(Date.now() / 1000),
        event_id: evt.eventId,
        event_source_url: evt.eventSourceUrl,
        action_source: 'website',
        user_data: userData,
        custom_data: evt.customData,
      }
    }),
  }

  try {
    const url = `https://graph.facebook.com/${API_VERSION}/${PIXEL_ID}/events?access_token=${ACCESS_TOKEN}`
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })

    if (!res.ok) {
      const text = await res.text()
      console.error('[CAPI] Error response:', res.status, text)
      return false
    }

    return true
  } catch (err) {
    console.error('[CAPI] Network error:', err)
    return false
  }
}

/**
 * Helper: Send a Purchase event via CAPI (most important event).
 * Call this from the webhook after confirming a successful payment.
 */
export async function sendCAPIPurchase(opts: {
  value: number
  currency?: string
  orderId: string
  eventId?: string
  email?: string
  phone?: string
  clientIp?: string
  userAgent?: string
  fbp?: string
  fbc?: string
}) {
  return sendCAPIEvent({
    eventName: 'Purchase',
    eventId: opts.eventId || `purchase_${opts.orderId}`,
    eventSourceUrl: `${SITE_URL}/payment/callback`,
    userData: {
      email: opts.email,
      phone: opts.phone,
      clientIp: opts.clientIp,
      userAgent: opts.userAgent,
      fbp: opts.fbp,
      fbc: opts.fbc,
    },
    customData: {
      content_name: 'PromptMaster Book',
      content_type: 'product',
      content_ids: ['promptmaster-book'],
      value: opts.value,
      currency: opts.currency || 'EGP',
      num_items: 1,
      order_id: opts.orderId,
    },
  })
}

/**
 * Helper: Send a Lead event via CAPI (new registration).
 */
export async function sendCAPILead(opts: {
  eventId?: string
  email?: string
  phone?: string
  clientIp?: string
  userAgent?: string
  fbp?: string
  fbc?: string
}) {
  return sendCAPIEvent({
    eventName: 'Lead',
    eventId: opts.eventId,
    eventSourceUrl: `${SITE_URL}/register`,
    userData: {
      email: opts.email,
      phone: opts.phone,
      clientIp: opts.clientIp,
      userAgent: opts.userAgent,
      fbp: opts.fbp,
      fbc: opts.fbc,
    },
    customData: {
      content_name: 'PromptMaster Registration',
      value: 0,
      currency: 'EGP',
    },
  })
}

/**
 * Helper: Send an InitiateCheckout event via CAPI.
 */
export async function sendCAPIInitiateCheckout(opts: {
  value: number
  eventId?: string
  email?: string
  phone?: string
  clientIp?: string
  userAgent?: string
  fbp?: string
  fbc?: string
}) {
  return sendCAPIEvent({
    eventName: 'InitiateCheckout',
    eventId: opts.eventId,
    eventSourceUrl: `${SITE_URL}/payment`,
    userData: {
      email: opts.email,
      phone: opts.phone,
      clientIp: opts.clientIp,
      userAgent: opts.userAgent,
      fbp: opts.fbp,
      fbc: opts.fbc,
    },
    customData: {
      content_name: 'PromptMaster Book',
      content_type: 'product',
      content_ids: ['promptmaster-book'],
      value: opts.value,
      currency: 'EGP',
      num_items: 1,
    },
  })
}
