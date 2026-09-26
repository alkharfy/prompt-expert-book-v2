/**
 * Subscription Service — Server-side
 * 
 * خدمة الاشتراكات على الخادم — تستخدم service_role key لتجاوز RLS.
 * ⚠️ هذا الملف للاستخدام من الخادم فقط (API routes, server actions).
 * لا تستورده في مكونات العميل (client components).
 * 
 * @module lib/subscription
 */

import 'server-only'
import { getSupabaseAdmin } from '@/lib/supabase-admin'
import type { PlanId, FeatureKey, UserPlan, SubscriptionStatus } from '@/types/subscription'

// ─────────────────────────────────────────────
// Supabase Admin Client — uses shared singleton
// ─────────────────────────────────────────────

// Re-exported from @/lib/supabase-admin for backward compat
export { getSupabaseAdmin } from '@/lib/supabase-admin'

// ─────────────────────────────────────────────
// Public API
// ─────────────────────────────────────────────

/**
 * الحصول على الاشتراك النشط للمستخدم.
 * يستدعي دالة SQL: get_user_plan(p_user_id)
 * 
 * @param userId - معرّف المستخدم (UUID)
 * @returns كائن UserPlan أو null إذا لا يوجد اشتراك نشط
 * 
 * @example
 * ```ts
 * const plan = await getUserSubscription('user-uuid-here')
 * if (plan) {
 *   console.log(plan.plan_id)    // 'basic' | 'pro' | 'vip'
 *   console.log(plan.expires_at) // '2027-02-14T...'
 * }
 * ```
 */
export async function getUserSubscription(userId: string): Promise<UserPlan | null> {
    try {
        const supabaseAdmin = getSupabaseAdmin()

        // Strategy 1: Try RPC function (requires supabase_subscription_functions.sql)
        try {
            const { data, error } = await (supabaseAdmin.rpc as any)('get_user_plan', {
                p_user_id: userId,
            })

            if (!error) {
                const row = Array.isArray(data) ? data[0] : data
                if (row && row.plan_id) {
                    return {
                        plan_id: row.plan_id as PlanId,
                        expires_at: row.expires_at ?? null,
                        status: (row.status as SubscriptionStatus) ?? null,
                    }
                }
            } else {
                console.warn('[subscription] get_user_plan RPC not available:', error.message)
            }
        } catch {
            console.warn('[subscription] get_user_plan RPC failed, using fallback')
        }

        // Strategy 2: Direct query on subscriptions table
        try {
            const { data: sub } = await (supabaseAdmin.from('subscriptions') as any)
                .select('plan_id, expires_at, status')
                .eq('user_id', userId)
                .eq('status', 'active')
                .gt('expires_at', new Date().toISOString())
                .order('created_at', { ascending: false })
                .limit(1)
                .maybeSingle()

            if (sub && sub.plan_id) {
                return {
                    plan_id: sub.plan_id as PlanId,
                    expires_at: sub.expires_at ?? null,
                    status: sub.status as SubscriptionStatus,
                }
            }
        } catch {
            console.warn('[subscription] subscriptions table query failed')
        }

        // Strategy 3: Check users table for current_plan (fallback)
        try {
            const { data: user } = await (supabaseAdmin.from('users') as any)
                .select('current_plan, plan_expires_at, is_active')
                .eq('id', userId)
                .maybeSingle()

            if (user && user.current_plan) {
                // Only consider active if plan hasn't expired
                const isValid = user.plan_expires_at && new Date(user.plan_expires_at) > new Date()
                return {
                    plan_id: user.current_plan as PlanId,
                    expires_at: user.plan_expires_at ?? null,
                    status: (user.is_active && isValid) ? 'active' as SubscriptionStatus : null,
                }
            }
        } catch {
            console.warn('[subscription] users table fallback failed')
        }

        // A successful payment alone cannot override a cancelled/expired subscription.
        // Recovery creates an entitlement through the verified activation path.
        return null
    } catch (err) {
        console.error('[subscription] Unexpected error in getUserSubscription:', err)
        return null
    }
}

/**
 * التحقق من أن المستخدم يملك ميزة معينة حسب باقته.
 * يستدعي دالة SQL: user_has_feature(p_user_id, p_feature)
 * 
 * @param userId - معرّف المستخدم (UUID)
 * @param feature - مفتاح الميزة المراد التحقق منها
 * @returns true إذا كانت الميزة متاحة للمستخدم
 * 
 * @example
 * ```ts
 * const canChat = await userHasFeature('user-uuid', 'chat')
 * if (!canChat) {
 *   // عرض رسالة ترقية الباقة
 * }
 * ```
 */
export async function userHasFeature(userId: string, feature: FeatureKey): Promise<boolean> {
    try {
        const supabaseAdmin = getSupabaseAdmin()

        const { data, error } = await (supabaseAdmin.rpc as any)('user_has_feature', {
            p_user_id: userId,
            p_feature: feature,
        })

        if (error) {
            console.error('[subscription] Error calling user_has_feature:', error.message)
            return false
        }

        return data === true
    } catch (err) {
        console.error('[subscription] Unexpected error in userHasFeature:', err)
        return false
    }
}

/**
 * التحقق من أن المستخدم لديه اشتراك نشط (أي باقة).
 * يجمع بين فحص الحالة وتاريخ الانتهاء.
 * 
 * @param userId - معرّف المستخدم (UUID)
 * @returns true إذا كان الاشتراك نشطاً وغير منتهي
 * 
 * @example
 * ```ts
 * const active = await hasActiveSubscription('user-uuid')
 * if (!active) {
 *   // توجيه المستخدم لصفحة الدفع
 * }
 * ```
 */
export async function hasActiveSubscription(userId: string): Promise<boolean> {
    try {
        const plan = await getUserSubscription(userId)

        if (!plan || !plan.expires_at) {
            return false
        }

        // التحقق من أن الاشتراك لم ينتهِ بعد
        const expiresAt = new Date(plan.expires_at)
        const now = new Date()

        return plan.status === 'active' && expiresAt > now
    } catch (err) {
        console.error('[subscription] Unexpected error in hasActiveSubscription:', err)
        return false
    }
}
