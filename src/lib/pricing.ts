/** Public prices come only from the admin-managed plans table. */

import type { PlanId } from '@/types/subscription'
import { SECTION_REGISTRY } from '@/config/sections'
import { BOOK_PAGES_DISPLAY } from '@/lib/config'

// Estimates for internal reports only. Public prices always come from the API.
export const FALLBACK_PLAN_PRICES: Record<string, number> = { monthly: 100, basic: 299, pro: 499, vip: 999 }
export const PLAN_NAMES_AR: Record<string, string> = { monthly: 'الشهري', basic: 'الأساسية', pro: 'المتقدمة', vip: 'VIP' }
/** Rank for upgrades. The monthly plan sits under every yearly plan but is never "upgraded": moving to a yearly plan is a new purchase. */
export const PLAN_ORDER: Record<string, number> = { monthly: 0, basic: 1, pro: 2, vip: 3 }

/** Name to show for any stored plan id (never guess «VIP» for an id we don't know). */
export function planLabel(id: string | null | undefined): string {
  return id && PLAN_NAMES_AR[id] ? PLAN_NAMES_AR[id] : 'باقتك'
}

/** Live online lectures per month (owner decisions 2026-10-16 and 2026-10-18: none in the monthly plan). */
export const LIVE_LECTURES_PER_MONTH: Record<PlanId, number> = { monthly: 0, basic: 1, pro: 2, vip: 4 }

export function liveLecturesLabel(id: PlanId): string {
  const count = LIVE_LECTURES_PER_MONTH[id]
  const lectures = count === 1 ? 'محاضرة أونلاين مباشرة' : count === 2 ? 'محاضرتين أونلاين مباشرين' : `${count} محاضرات أونلاين مباشرة`
  return `${lectures} كل شهر طول السنة`
}

/** The "full book for 5 EGP" intro offer (promo code AI56, discount_type 'fixed_final'). */
export const AI56_FINAL_PRICE = 5

/** Canonical product stats — verified against the actual data files. */
export const PRODUCT_STATS = {
  templates: 95,      // libraryData cards
  exercises: 45,      // interactive exercisesData entries
  readingPages: BOOK_PAGES_DISPLAY, // Real pages, including all references.
  chapters: 10,
  freePages: SECTION_REGISTRY.reduce((total, section) => total
    + (section.id === 'intro' ? section.pageCount : Math.min(section.freePageLimit, section.pageCount)), 0),
} as const

/** «المستر بيصحّح» checks per subscriber per 24 hours; src/app/api/grade enforces this same constant. */
export const GRADER_DAILY_LIMIT = 10

/** The monthly price said in copy (hero, FAQ, buttons). Change it together with the plans row (admin) and the migration. */
export const MONTHLY_PRICE_EGP = 100

const hasOwn = (object: object, key: string) => Object.prototype.hasOwnProperty.call(object, key)

export interface PublicPricingPlan {
  id: PlanId
  name: string
  name_ar: string
  price: number
  features: string[]
  features_ar: string[]
  duration: string
  /** «شهر» or «سنة», for «/ شهر» next to the price */
  period: 'شهر' | 'سنة'
  is_popular: boolean
  description: string
  cta_link: string
  cta_text: string
}

/** What every plan opens: the course itself, said as results, not page counts. */
export const COURSE_OUTCOMES: string[] = [
  'المستويات الخمسة كاملين، من أول «بتستخدمه صح» لحد «نظام شغلك»',
  'تمارين على ملفات شغل مصرية: فواتير، كشف بنك، شكاوى عملاء',
  `«المستر بيصحّح» طلباتك ويقولك تصلّح إيه: لحد ${GRADER_DAILY_LIMIT} مرات كل 24 ساعة`,
  '«شنطة طلباتك»: تحفظ فيها الطلبات اللي كتبتها، وتنسخها في شغلك',
  `${PRODUCT_STATS.exercises} تمرين و${PRODUCT_STATS.templates} قالب جاهز`,
]

const PLAN_COPY: Record<PlanId, { description: string; features: string[]; cta: string }> = {
  monthly: {
    description: 'الكورس كله بسعر شهر. ابدأ النهارده وكمّل على راحتك.',
    features: [...COURSE_OUTCOMES, 'من غير تجديد تلقائي: بتدفع الشهر اللي عايزه بس'],
    cta: `ابدأ بـ${MONTHLY_PRICE_EGP} جنيه`,
  },
  basic: {
    description: 'الكورس كله سنة كاملة، ومعاه محاضرة مباشرة كل شهر.',
    features: ['كل اللي في الشهري، لمدة سنة', liveLecturesLabel('basic')],
    cta: 'اختار الأساسية',
  },
  pro: {
    description: 'للي عايز متابعة أكتر وشهادة في الآخر.',
    features: ['كل اللي في الأساسية', liveLecturesLabel('pro'), 'شهادة إتمام من PromptMaster', 'أدوات البرومبت: تشخيص طلبك لحد 10 مرات كل 24 ساعة', 'الإنجازات وترتيب المتعلمين'],
    cta: 'اختار المتقدمة',
  },
  vip: {
    description: 'للي عايز حد يسأله وهو شغال.',
    features: ['كل اللي في المتقدمة', liveLecturesLabel('vip'), 'المساعد الذكي: لحد 30 رسالة في اليوم تسأله في شغلك'],
    cta: 'اختار VIP',
  },
}

/** The card bullets for one plan, for places that list plans outside the pricing cards. */
export function planCopyFeatures(id: PlanId): string[] {
  return [...PLAN_COPY[id].features]
}

export function normalizePricingPlans(rows: unknown): PublicPricingPlan[] {
  if (!Array.isArray(rows) || rows.length === 0) throw new Error('تعذّر تحميل الأسعار الحالية. حاول مرة أخرى.')
  const seen = new Set<string>()
  const plans: PublicPricingPlan[] = []
  for (const row of rows) {
    // A plan this code doesn't know (added to the table before a deploy) is skipped, never shown half-built.
    if (!row || typeof row !== 'object' || typeof row.id !== 'string' || !hasOwn(PLAN_COPY, row.id)) continue
    if (seen.has(row.id) || !['number', 'string'].includes(typeof row.price) || !Number.isFinite(Number(row.price)) || Number(row.price) <= 0) {
      throw new Error('تعذّر التحقق من أسعار الباقات. حاول مرة أخرى.')
    }
    seen.add(row.id)
    const id = row.id as PlanId
    const copy = PLAN_COPY[id]
    const monthly = id === 'monthly'
    // «كل اللي في الشهري» only makes sense next to a monthly card
    const features = id === 'basic' && !rows.some(r => r && (r as { id?: unknown }).id === 'monthly')
      ? [...COURSE_OUTCOMES, liveLecturesLabel('basic')]
      : copy.features
    plans.push({
      id, name: PLAN_NAMES_AR[id], name_ar: PLAN_NAMES_AR[id], price: Number(row.price),
      features, features_ar: features,
      duration: monthly ? 'شهر' : 'سنة', period: monthly ? 'شهر' : 'سنة',
      is_popular: monthly,
      description: copy.description,
      cta_link: `/payment?plan=${id}`, cta_text: copy.cta,
    })
  }
  if (!plans.length) throw new Error('تعذّر التحقق من أسعار الباقات. حاول مرة أخرى.')
  return plans.sort((a, b) => PLAN_ORDER[a.id] - PLAN_ORDER[b.id])
}

/** 100 EGP is already the entry price: a promo code works on the monthly plan only when the admin listed it for 'monthly'. */
export function promoAppliesToPlan(allowedPlans: string[] | null | undefined, planId: string): boolean {
  if (planId === 'monthly') return !!allowedPlans?.includes('monthly')
  return !allowedPlans?.length || allowedPlans.includes(planId)
}

/**
 * What buying `target` means for someone whose current term is `current`:
 * - 'new'      no active plan
 * - 'renew'    an active monthly plan, buying another month (the month is added after the current one)
 * - 'switch'   an active monthly plan, buying a yearly plan at its full price (the year starts after the current month)
 * - 'upgrade'  an active yearly plan, moving to a higher yearly plan (pays the difference, keeps the end date)
 * - 'blocked'  an active yearly plan, buying the same/lower plan or the monthly one
 */
/** A paid term running right now, on any plan. */
export function hasActivePlan(
  current: { plan_id: string | null; expires_at: string | null; status: string | null } | null,
  now = Date.now(),
): boolean {
  return !!current?.plan_id && current.status === 'active' && !!current.expires_at && new Date(current.expires_at).getTime() > now
}

export function checkoutKind(
  current: { plan_id: string | null; expires_at: string | null; status: string | null } | null,
  target: string,
  now = Date.now(),
): 'new' | 'renew' | 'switch' | 'upgrade' | 'blocked' {
  const active = hasActivePlan(current, now)
  // No running term, or one on a plan id this code doesn't know (sell normally; activation stacks it)
  if (!active || !hasOwn(PLAN_ORDER, current!.plan_id!)) return 'new'
  if (current!.plan_id === 'monthly') return target === 'monthly' ? 'renew' : 'switch'
  if (target === 'monthly') return 'blocked'
  return PLAN_ORDER[target] > PLAN_ORDER[current!.plan_id!] ? 'upgrade' : 'blocked'
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
