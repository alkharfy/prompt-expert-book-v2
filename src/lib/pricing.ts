/**
 * Central product facts — single source of truth for prices & marketing stats.
 *
 * IMPORTANT: The AUTHORITATIVE price is the admin-managed `plans` table in the
 * database. It is read server-side by create-session and /api/promo/validate,
 * and fetched by the payment page. The constants here are:
 *   - FALLBACK_PLAN_PRICES: for static display surfaces that don't fetch the DB
 *     (admin dashboard MRR estimate, gate modal, paywall "from X" anchor). If an
 *     admin changes a price in the dashboard, update these too (or have the
 *     surface fetch /api/admin/plans).
 *   - PRODUCT_STATS / AI56_FINAL_PRICE: real, canonical numbers used everywhere
 *     so the funnel never shows conflicting figures.
 */

export const FALLBACK_PLAN_PRICES: Record<string, number> = { basic: 99, pro: 199, vip: 399 }
export const PLAN_NAMES_AR: Record<string, string> = { basic: 'الأساسية', pro: 'المتقدمة', vip: 'VIP' }
export const PLAN_ORDER: Record<string, number> = { basic: 1, pro: 2, vip: 3 }

/** The "full book for 5 EGP" intro offer (promo code AI56, discount_type 'fixed_final'). */
export const AI56_FINAL_PRICE = 5

/** Canonical product stats — verified against the actual data files. */
export const PRODUCT_STATS = {
  templates: 95,      // libraryData cards
  exercises: 48,      // exercisesData entries
  readingPages: 188,  // book reading pages
  chapters: 10,
  freePages: 23,      // intro (6) + full chapter 1 (17) — see src/config/sections.ts
} as const

/**
 * Single source of truth for promo discount math. Used by BOTH the payment
 * money path (create-session) and the price preview (/api/promo/validate) so
 * the displayed discount can never diverge from the charged one.
 *
 * - 'percentage'  → percent off, optionally capped by max_discount
 * - 'fixed'       → flat amount off
 * - 'fixed_final' → discount_value is the TARGET final price (e.g. AI56 = 5 EGP);
 *                   the discount is computed dynamically from the current price,
 *                   so it stays correct even if the admin changes the price.
 * Non-fixed_final codes never drive the price below 1 (Kashier rejects 0).
 */
export function applyPromoDiscount(
  basePrice: number,
  promo: { discount_type: string; discount_value: number | string; max_discount?: number | string | null }
): { discountAmount: number; finalAmount: number } {
  const value = Number(promo.discount_value) || 0
  let discountAmount = 0
  if (promo.discount_type === 'percentage') {
    discountAmount = Math.round(basePrice * (value / 100))
    const cap = promo.max_discount != null ? Number(promo.max_discount) : null
    if (cap != null && discountAmount > cap) discountAmount = cap
  } else if (promo.discount_type === 'fixed_final') {
    discountAmount = Math.max(0, basePrice - Math.max(0, value))
  } else {
    discountAmount = value
  }
  if (promo.discount_type !== 'fixed_final' && discountAmount >= basePrice) {
    discountAmount = basePrice - 1
  }
  discountAmount = Math.round(discountAmount * 100) / 100
  const finalAmount = Math.round(Math.max(0, basePrice - discountAmount) * 100) / 100
  return { discountAmount, finalAmount }
}
