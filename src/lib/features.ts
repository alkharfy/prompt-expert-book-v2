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

import type { PlanId, FeatureKey } from '@/types/subscription'

// ─────────────────────────────────────────────
// Constants
// ─────────────────────────────────────────────

/**
 * خريطة الميزات لكل باقة.
 * يجب أن تتطابق تماماً مع جدول plan_features في قاعدة البيانات.
 * 
 * - basic: القراءة والإشارات المرجعية والمكتبة وتتبع التقدم
 * - pro:   كل ميزات basic + التمارين والإنجازات ولوحة المتصدرين والشهادة
 * - vip:   كل ميزات pro + الأدوات والمحادثة الذكية
 */
export const PLAN_FEATURES: Record<PlanId, readonly FeatureKey[]> = {
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
        'resources',
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
        'resources',
        'ai_updates',
    ],
} as const

/**
 * أسماء الباقات بالعربية
 */
const PLAN_NAMES: Record<PlanId, string> = {
    basic: 'الباقة الأساسية',
    pro: 'الباقة الاحترافية',
    vip: 'الباقة المميزة',
} as const

/**
 * أسماء الميزات بالعربية — للعرض في واجهة المستخدم
 */
export const FEATURE_NAMES: Record<FeatureKey, string> = {
    reading: 'قراءة الكتاب',
    bookmarks: 'الإشارات المرجعية',
    library: 'المكتبة',
    progress_tracking: 'تتبع التقدم',
    exercises: 'التمارين التفاعلية',
    gamification: 'نظام الإنجازات',
    leaderboard: 'لوحة المتصدرين',
    certificate: 'الشهادة',
    tools: 'أدوات البرومبت',
    chat: 'المحادثة الذكية',
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
 * getPlanName('vip') // 'الباقة المميزة'
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
 * getFeatureName('chat') // 'المحادثة الذكية'
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
