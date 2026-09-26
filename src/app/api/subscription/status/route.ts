/**
 * Subscription Status API
 *
 * GET /api/subscription/status
 * يعيد حالة اشتراك المستخدم الحالي مع قائمة الميزات المتاحة.
 *
 * @module api/subscription/status
 */

import { NextRequest, NextResponse } from 'next/server'
import { getUserSubscription } from '@/lib/subscription'
import { getPlanFeatures } from '@/lib/features'
import type { FeatureKey } from '@/types/subscription'
import { getAuthenticatedUser } from '@/lib/auth-middleware'
import { dbLogger } from '@/lib/logger'

/**
 * GET /api/subscription/status
 *
 * يعيد:
 * - plan_id: الباقة الحالية
 * - expires_at: تاريخ الانتهاء
 * - status: حالة الاشتراك
 * - features: قائمة الميزات المتاحة
 */
export async function GET(request: NextRequest) {
  try {
    // 1. استخراج معرّف المستخدم مع التحقق من الجلسة
    const userId = await getAuthenticatedUser()

    if (!userId) {
      // لا يوجد مستخدم مسجّل دخول — إعادة استجابة "لا اشتراك"
      return NextResponse.json(
        {
          plan_id: null,
          expires_at: null,
          status: null,
          features: [],
        },
        { status: 200 }
      )
    }

    // 2. جلب بيانات الاشتراك من قاعدة البيانات
    const subscription = await getUserSubscription(userId)

    if (!subscription || !subscription.plan_id) {
      // لا يوجد اشتراك نشط
      return NextResponse.json(
        {
          plan_id: null,
          expires_at: null,
          status: null,
          features: [],
        },
        { status: 200 }
      )
    }

    // 3. جلب قائمة الميزات المتاحة لهذه الباقة
    const planFeatures = getPlanFeatures(subscription.plan_id)

    // 4. إعادة الاستجابة
    return NextResponse.json(
      {
        plan_id: subscription.plan_id,
        expires_at: subscription.expires_at,
        status: subscription.status,
        features: planFeatures as FeatureKey[],
      },
      {
        status: 200,
        headers: {
          // عدم الكاش — البيانات ديناميكية
          'Cache-Control': 'no-store, must-revalidate',
        },
      }
    )
  } catch (error) {
    dbLogger.error('[API /subscription/status] Error:', error)

    // في حالة الخطأ — إعادة 500 لكن مع بيانات افتراضية آمنة
    return NextResponse.json(
      {
        plan_id: null,
        expires_at: null,
        status: null,
        features: [],
        error: 'Failed to fetch subscription status',
      },
      { status: 500 }
    )
  }
}
