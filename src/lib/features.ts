/**
 * Plan Features — Client-safe helpers
 * 
 * دوال مساعدة للميزات والباقات — آمنة للاستخدام من العميل والخادم.
 * لا تتصل بقاعدة البيانات. تعمل كمرجع ثابت (static lookup).
 * 
 * ⚠️ يجب أن تتطابق هذه البيانات مع البذر في supabase_plan_features.sql
 * 
 * @module lib/features
 */

import type { PlanId, FeatureKey, UserPlan } from '@/types/subscription'

// ─────────────────────────────────────────────
// Constants
// ─────────────────────────────────────────────

/**
 * خريطة الميزات لكل باقة.
 * يجب أن تتطابق تماماً مع جدول plan_features في قاعدة البيانات.
 * 
 * - basic: القراءة والإشارات المرجعية والمكتبة والتقدم والتمارين
 * - pro:   كل ميزات basic + الأدوات والإنجازات ولوحة المتصدرين وشهادة القراءة
 * - vip:   كل ميزات pro + المحادثة الذكية
 * Resources and AI news are public, not subscription entitlements.
 */
export const PLAN_FEATURES: Record<PlanId, readonly FeatureKey[]> = {
    // The whole course, month by month: same content as basic; the yearly plans add the live lectures (and pro/vip the certificate).
    monthly: [
        'reading',
        'bookmarks',
        'library',
        'progress_tracking',
        'exercises',
    ],
    basic: [
        'reading',
        'bookmarks',
        'library',
        'progress_tracking',
        'exercises',
    ],
    pro: [
        'reading',
        'bookmarks',
        'library',
        'progress_tracking',
        'exercises',
        'gamification',
        'leaderboard',
        'certificate',
        'tools',
    ],
    vip: [
        'reading',
        'bookmarks',
        'library',
        'progress_tracking',
        'exercises',
        'gamification',
        'leaderboard',
        'certificate',
        'tools',
        'chat',
    ],
} as const

/** Shared by the client-facing status API, middleware and server entitlements. */
export function isActivePlanSubscription(subscription: UserPlan | null): subscription is UserPlan & {
    plan_id: PlanId; expires_at: string; status: 'active'
} {
    return !!subscription && !!subscription.plan_id && subscription.status === 'active'
        && !!subscription.expires_at && Object.hasOwn(PLAN_FEATURES, subscription.plan_id)
        && Date.parse(subscription.expires_at) > Date.now()
}

/**
 * أسماء الباقات بالعربية
 */
const PLAN_NAMES: Record<PlanId, string> = {
    monthly: 'الاشتراك الشهري',
    basic: 'الباقة الأساسية',
    pro: 'الباقة المتقدمة',
    vip: 'باقة VIP',
} as const

/**
 * أسماء الميزات بالعربية — للعرض في واجهة المستخدم
 */
export const FEATURE_NAMES: Record<FeatureKey, string> = {
    reading: 'دروس الكورس',
    bookmarks: 'حفظ الصفحات',
    library: 'المكتبة',
    progress_tracking: 'متابعة تقدّمك',
    exercises: 'التمارين',
    gamification: 'الإنجازات والنقاط',
    leaderboard: 'ترتيب المتعلمين',
    certificate: 'شهادة الإتمام',
    tools: 'أدوات البرومبت',
    chat: 'المساعد الذكي',
    resources: 'مكتبة المصادر',
    ai_updates: 'تحديثات AI',
} as const

// ─────────────────────────────────────────────
// Helper Functions
// ─────────────────────────────────────────────

/**
 * التحقق مما إذا كانت باقة معينة تتضمن ميزة.
 * فحص محلي بدون اتصال بقاعدة البيانات.
 * 
 * @param plan - معرّف الباقة
 * @param feature - مفتاح الميزة
 * @returns true إذا كانت الميزة متاحة في هذه الباقة
 * 
 * @example
 * ```ts
 * planHasFeature('basic', 'reading')   // true
 * planHasFeature('basic', 'chat')      // false
 * planHasFeature('vip', 'chat')        // true
 * ```
 */
export function planHasFeature(plan: PlanId, feature: FeatureKey): boolean {
    const features = PLAN_FEATURES[plan]
    return features.includes(feature)
}

/**
 * الحصول على جميع ميزات باقة معينة.
 * 
 * @param plan - معرّف الباقة
 * @returns مصفوفة القراءة فقط بمفاتيح الميزات
 * 
 * @example
 * ```ts
 * const features = getPlanFeatures('pro')
 * // ['reading', 'bookmarks', 'library', 'progress_tracking',
 * //  'exercises', 'gamification', 'leaderboard', 'certificate']
 * ```
 */
export function getPlanFeatures(plan: PlanId): readonly FeatureKey[] {
    return PLAN_FEATURES[plan]
}

/**
 * الحصول على اسم الباقة بالعربية.
 * 
 * @param plan - معرّف الباقة
 * @returns اسم الباقة بالعربية
 * 
 * @example
 * ```ts
 * getPlanName('vip') // 'باقة VIP'
 * ```
 */
export function getPlanName(plan: PlanId): string {
    return PLAN_NAMES[plan]
}

/**
 * الحصول على اسم الميزة بالعربية.
 * 
 * @param feature - مفتاح الميزة
 * @returns اسم الميزة بالعربية
 * 
 * @example
 * ```ts
 * getFeatureName('chat') // 'المساعد الذكي'
 * ```
 */
export function getFeatureName(feature: FeatureKey): string {
    return FEATURE_NAMES[feature]
}

/**
 * الحصول على الميزات الإضافية عند الترقية من باقة إلى أخرى.
 * مفيد لعرض مقارنة الباقات في صفحة الترقية.
 * 
 * @param fromPlan - الباقة الحالية
 * @param toPlan - الباقة المراد الترقية إليها
 * @returns الميزات الإضافية في الباقة الجديدة
 * 
 * @example
 * ```ts
 * getUpgradeFeatures('basic', 'pro')
 * // ['exercises', 'gamification', 'leaderboard', 'certificate']
 * ```
 */
export function getUpgradeFeatures(fromPlan: PlanId, toPlan: PlanId): FeatureKey[] {
    const currentFeatures = new Set(PLAN_FEATURES[fromPlan])
    return PLAN_FEATURES[toPlan].filter(f => !currentFeatures.has(f))
}
