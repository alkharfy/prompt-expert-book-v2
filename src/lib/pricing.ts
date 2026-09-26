/** Public prices come only from the admin-managed plans table. */

import { PLAN_FEATURES, FEATURE_NAMES } from './features'
import type { PlanId } from '@/types/subscription'

// Estimates for internal reports only. Public prices always come from the API.
export const FALLBACK_PLAN_PRICES: Record<string, number> = { basic: 299, pro: 499, vip: 999 }
export const PLAN_NAMES_AR: Record<string, string> = { basic: 'الأساسية', pro: 'المتقدمة', vip: 'VIP' }
export const PLAN_ORDER: Record<string, number> = { basic: 1, pro: 2, vip: 3 }

/** The "full book for 5 EGP" intro offer (promo code AI56, discount_type 'fixed_final'). */
export const AI56_FINAL_PRICE = 5

/** Canonical product stats — verified against the actual data files. */
export const PRODUCT_STATS = {
  templates: 95,      // libraryData cards
  exercises: 45,      // interactive exercisesData entries
  readingPages: 222,  // intro, chapters, library, appendix and glossary
  chapters: 10,
  freePages: 23,      // intro (6) + full chapter 1 (17) — see src/config/sections.ts
} as const

export interface PublicPricingPlan {
  id: PlanId
  name: string
  name_ar: string
  price: number
  features: string[]
  features_ar: string[]
  duration: string
  is_popular: boolean
  description: string
  cta_link: string
  cta_text: string
}

export function normalizePricingPlans(rows: unknown): PublicPricingPlan[] {
  if (!Array.isArray(rows) || rows.length === 0) throw new Error('تعذّر تحميل الأسعار الحالية. حاول مرة أخرى.')
  const seen = new Set<string>()
  return rows.map(row => {
    if (!row || typeof row !== 'object' || !['basic', 'pro', 'vip'].includes(row.id)
      || seen.has(row.id) || !['number', 'string'].includes(typeof row.price) || !Number.isFinite(Number(row.price)) || Number(row.price) <= 0) {
      throw new Error('تعذّر التحقق من أسعار الباقات. حاول مرة أخرى.')
    }
    seen.add(row.id)
    const id = row.id as PlanId
    const features = PLAN_FEATURES[id].map(feature => {
      if (feature === 'reading') return `${PRODUCT_STATS.readingPages} صفحة تعليمية تشمل الملاحق`
      if (feature === 'library') return `${PRODUCT_STATS.templates} قالب برومبت جاهز للتعديل`
      if (feature === 'exercises') return `${PRODUCT_STATS.exercises} تمرينًا تفاعليًا`
      if (feature === 'certificate') return 'شهادة إتمام من PromptMaster'
      return FEATURE_NAMES[feature]
    })
    features.push('وصول لمدة سنة؛ التحديثات المتاحة مشمولة خلال الاشتراك')
    return {
      id, name: PLAN_NAMES_AR[id], name_ar: PLAN_NAMES_AR[id], price: Number(row.price),
      features, features_ar: features, duration: 'سنة', is_popular: id === 'basic',
      description: id === 'basic' ? 'الكتاب والتمارين والقوالب لتبدأ التطبيق على الدراسة والعمل.'
        : id === 'pro' ? 'الأساسية مع أدوات البرومبت والإنجازات وشهادة الإتمام.'
        : 'المتقدمة مع المحادثة الذكية ومتابعة تحديثات AI.',
      cta_link: `/payment?plan=${id}`, cta_text: id === 'basic' ? 'ابدأ بالأساسية' : `اختر ${PLAN_NAMES_AR[id]}`,
    }
  }).sort((a, b) => PLAN_ORDER[a.id] - PLAN_ORDER[b.id])
}

export async function fetchPricingPlans(): Promise<PublicPricingPlan[]> {
  const response = await fetch('/api/admin/plans', { cache: 'no-store' })
  if (!response.ok) throw new Error('تعذّر تحميل الأسعار الحالية. حاول مرة أخرى.')
  const result = await response.json()
  if (!result.ok) throw new Error('تعذّر تحميل الأسعار الحالية. حاول مرة أخرى.')
  return normalizePricingPlans(result.plans)
}

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
  const value = Number(promo.discount_value)
  const cap = promo.max_discount == null ? null : Number(promo.max_discount)
  if (!Number.isFinite(basePrice) || basePrice < 1 || !Number.isFinite(value) || value < 0
    || !['percentage', 'fixed', 'fixed_final'].includes(promo.discount_type)
    || cap != null && (!Number.isFinite(cap) || cap < 0)
    || promo.discount_type === 'percentage' && value > 100
    || promo.discount_type === 'fixed_final' && value < 1) {
    throw new Error('إعدادات كود الخصم غير صالحة')
  }
  let discountAmount = 0
  if (promo.discount_type === 'percentage') {
    discountAmount = Math.round(basePrice * (value / 100) * 100) / 100
    if (cap != null && discountAmount > cap) discountAmount = cap
  } else if (promo.discount_type === 'fixed_final') {
    discountAmount = Math.max(0, basePrice - Math.max(1, value))
  } else {
    discountAmount = value
  }
  if (promo.discount_type !== 'fixed_final' && discountAmount >= basePrice) {
    discountAmount = basePrice - 1
  }
  discountAmount = Math.round(discountAmount * 100) / 100
  const finalAmount = Math.round(Math.max(1, basePrice - discountAmount) * 100) / 100
  return { discountAmount, finalAmount }
}
