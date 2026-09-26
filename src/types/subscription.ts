/**
 * Subscription Types
 * 
 * أنواع TypeScript لنظام الاشتراكات والباقات.
 * هذا الملف يحتوي على جميع التعريفات المشتركة بين العميل والخادم.
 * 
 * @module types/subscription
 */

// ─────────────────────────────────────────────
// Type Aliases
// ─────────────────────────────────────────────

/** معرّف الباقة — يطابق قيود CHECK في قاعدة البيانات */
export type PlanId = 'basic' | 'pro' | 'vip'

/** حالة الاشتراك — يطابق قيود CHECK في جدول subscriptions */
export type SubscriptionStatus = 'active' | 'expired' | 'cancelled' | 'upgraded'

/** مفتاح الميزة — يطابق البذر في جدول plan_features */
export type FeatureKey =
    | 'reading'
    | 'bookmarks'
    | 'library'
    | 'progress_tracking'
    | 'exercises'
    | 'gamification'
    | 'leaderboard'
    | 'certificate'
    | 'tools'
    | 'chat'
    | 'resources'
    | 'ai_updates'

// ─────────────────────────────────────────────
// Constants
// ─────────────────────────────────────────────

/** قائمة معرّفات الباقات المتاحة */
export const PLAN_IDS = ['basic', 'pro', 'vip'] as const

/** قائمة جميع مفاتيح الميزات */
export const FEATURE_KEYS = [
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
] as const

/** مدة الاشتراك بالأيام */
export const SUBSCRIPTION_DURATION_DAYS = 365

// ─────────────────────────────────────────────
// Interfaces
// ─────────────────────────────────────────────

/**
 * سجل اشتراك من جدول subscriptions
 * يمثل صفاً كاملاً من قاعدة البيانات
 */
export interface Subscription {
    /** المعرّف الفريد (UUID) */
    id: string
    /** معرّف المستخدم (UUID) */
    user_id: string
    /** الباقة المشترك بها */
    plan_id: PlanId
    /** معرّف الدفعة المرتبطة (قد يكون null للاشتراكات اليدوية) */
    payment_id: string | null
    /** حالة الاشتراك */
    status: SubscriptionStatus
    /** تاريخ بداية الاشتراك (ISO 8601) */
    starts_at: string
    /** تاريخ انتهاء الاشتراك (ISO 8601) */
    expires_at: string
    /** معرّف الاشتراك السابق عند الترقية */
    upgraded_from: string | null
    /** تاريخ الإنشاء (ISO 8601) */
    created_at: string
    /** تاريخ آخر تحديث (ISO 8601) */
    updated_at: string
}

/**
 * ميزة مرتبطة بباقة من جدول plan_features
 */
export interface PlanFeature {
    /** المعرّف الفريد (UUID) */
    id: string
    /** الباقة */
    plan_id: PlanId
    /** مفتاح الميزة */
    feature_key: FeatureKey
    /** هل الميزة مفعّلة */
    is_enabled: boolean
}

/**
 * نتيجة دالة get_user_plan — الباقة الحالية للمستخدم
 * تُستخدم في التطبيق لعرض حالة الاشتراك وفحص الصلاحيات
 */
export interface UserPlan {
    /** الباقة الحالية (null إذا لا يوجد اشتراك نشط) */
    plan_id: PlanId | null
    /** تاريخ الانتهاء (null إذا لا يوجد اشتراك) */
    expires_at: string | null
    /** حالة الاشتراك (null إذا لا يوجد اشتراك) */
    status: SubscriptionStatus | null
}
