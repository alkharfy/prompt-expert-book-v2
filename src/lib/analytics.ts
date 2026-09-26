/**
 * Google Analytics 4 — Event Tracking
 * 
 * Usage:
 *   import { trackEvent } from '@/lib/analytics'
 *   trackEvent('sign_up', { method: 'email' })
 */

declare global {
  interface Window {
    gtag?: (...args: unknown[]) => void
    dataLayer?: unknown[]
  }
}

export function trackEvent(eventName: string, params?: Record<string, unknown>) {
  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag('event', eventName, params)
  }
}

// ── GA4 Pageview (for SPA navigation) ──────────

export function trackPageview(url: string) {
  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag('config', process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID || '', {
      page_path: url,
    })
  }
}

// ── Conversion Events ──────────────────────────

/** User completed signup */
export function trackSignUp(method: string = 'email') {
  trackEvent('sign_up', { method })
}

/** User logged in */
export function trackLogin(method: string = 'email') {
  trackEvent('login', { method })
}

/** User hit a paywall (locked content) */
export function trackPaywallHit(section: string, page: number) {
  trackEvent('paywall_hit', { section, page })
}

/** User opened payment page */
export function trackPaymentPageView(plan?: string) {
  trackEvent('payment_page_view', { plan })
}

/** User selected a plan */
export function trackPlanSelected(plan: string, price: number) {
  trackEvent('plan_selected', { plan, price, currency: 'EGP' })
}

/** User applied a promo code */
export function trackPromoApplied(code: string, discount: number) {
  trackEvent('promo_applied', { code, discount })
}

/** User started payment (Kashier redirect) */
export function trackPaymentStarted(plan: string, amount: number) {
  trackEvent('payment_started', { plan, amount, currency: 'EGP' })
}

/** Payment completed successfully */
export function trackPaymentCompleted(plan: string, amount: number) {
  trackEvent('payment_completed', { plan, amount, currency: 'EGP' })
}

/** Payment failed */
export function trackPaymentFailed(plan: string, reason?: string) {
  trackEvent('payment_failed', { plan, reason })
}

// ── E-commerce Events (GA4 standard) ───────────

/** GA4 view_item — user views book/product details */
export function trackViewItem(price: number = 5.00) {
  trackEvent('view_item', {
    currency: 'EGP',
    value: price,
    items: [{
      item_id: 'promptmaster-book',
      item_name: 'PromptMaster Book',
      price,
      quantity: 1,
    }],
  })
}

/** GA4 begin_checkout — user starts payment */
export function trackBeginCheckout(price: number = 5.00) {
  trackEvent('begin_checkout', {
    currency: 'EGP',
    value: price,
    items: [{
      item_id: 'promptmaster-book',
      item_name: 'PromptMaster Book',
      price,
      quantity: 1,
    }],
  })
}

/**
 * GA4 purchase — payment completed (deduplicated)
 * Uses sessionStorage to prevent duplicate fires.
 */
export function trackPurchase(amount: number = 5.00, orderId?: string) {
  if (typeof window === 'undefined') return
  const storageKey = orderId ? `ga4_purchase_${orderId}` : 'ga4_purchase_done'
  if (sessionStorage.getItem(storageKey)) return

  trackEvent('purchase', {
    transaction_id: orderId || `purchase_${Date.now()}`,
    currency: 'EGP',
    value: amount,
    items: [{
      item_id: 'promptmaster-book',
      item_name: 'PromptMaster Book',
      price: amount,
      quantity: 1,
    }],
  })

  sessionStorage.setItem(storageKey, '1')
}

// ── Funnel Events ──────────────────────────────

/** Track user progress through conversion funnel */
export function trackFunnelStep(step: string, stepNumber: number) {
  trackEvent('funnel_step', { step, step_number: stepNumber })
}

// ── CTA / UI Events ────────────────────────────

/** Track CTA button clicks */
export function trackCtaClick(buttonText: string, buttonLocation: string) {
  trackEvent('cta_click', {
    button_text: buttonText,
    button_location: buttonLocation,
    page_path: typeof window !== 'undefined' ? window.location.pathname : '',
  })
}

/** Track WhatsApp link clicks */
export function trackWhatsAppClick(buttonLocation: string) {
  trackEvent('whatsapp_click', {
    page_path: typeof window !== 'undefined' ? window.location.pathname : '',
    button_location: buttonLocation,
  })
}

/** Track promo code usage with discount info */
export function trackPromoCodeUsed(code: string, discountValue: number) {
  trackEvent('promo_code_used', {
    code,
    discount_value: discountValue,
    currency: 'EGP',
  })
}

/** Track when the promo card is rendered/seen (impression). */
export function trackPromoViewed(planId: string, finalPrice: number, discountPct: number) {
  trackEvent('promo_viewed', {
    plan_id: planId,
    final_price: finalPrice,
    discount_pct: discountPct,
    currency: 'EGP',
  })
}

/** Fire a Google Ads conversion event after a verified purchase. */
export function trackGoogleAdsConversion(amount: number, orderId?: string) {
  if (typeof window === 'undefined' || !window.gtag) return
  const sendTo = process.env.NEXT_PUBLIC_GADS_CONVERSION_ID
  if (!sendTo) return
  window.gtag('event', 'conversion', {
    send_to: sendTo,
    value: amount,
    currency: 'EGP',
    transaction_id: orderId || `gads_${Date.now()}`,
  })
}

// ── Engagement Events ──────────────────────────

/** User completed an onboarding step */
export function trackOnboardingStep(step: number, totalSteps: number) {
  trackEvent('onboarding_step', { step, total_steps: totalSteps })
}

/** User completed an exercise */
export function trackExerciseCompleted(exerciseId: string, type: string) {
  trackEvent('exercise_completed', { exercise_id: exerciseId, type })
}

/** User completed a chapter */
export function trackChapterCompleted(section: string, pages: number) {
  trackEvent('chapter_completed', { section, pages })
}

/** User shared a referral link */
export function trackReferralShared(method: string) {
  trackEvent('referral_shared', { method })
}

/** User clicked a resource */
export function trackResourceClicked(resourceId: string, category: string) {
  trackEvent('resource_clicked', { resource_id: resourceId, category })
}

/** Guest user reading content (not registered) */
export function trackGuestReading(section: string, page: number) {
  trackEvent('guest_reading', { section, page })
}

// ── Web Vitals ─────────────────────────────────

/** Report Web Vitals to GA4 */
export function reportWebVitals(metric: { name: string; value: number; id: string }) {
  trackEvent('web_vitals', {
    metric_name: metric.name,
    metric_value: Math.round(metric.name === 'CLS' ? metric.value * 1000 : metric.value),
    metric_id: metric.id,
  })
}
