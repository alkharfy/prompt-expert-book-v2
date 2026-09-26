'use client'

/**
 * Subscription Context
 *
 * يوفر حالة الاشتراك لجميع المكونات في التطبيق.
 * يجلب بيانات الاشتراك من API ويوفر helpers للتحقق من الميزات.
 *
 * @module context/SubscriptionContext
 */

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react'
import type { PlanId, FeatureKey, SubscriptionStatus } from '@/types/subscription'

// ─────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────

interface SubscriptionContextValue {
  /** الباقة الحالية (null إذا لا يوجد اشتراك) */
  currentPlan: PlanId | null
  /** تاريخ انتهاء الاشتراك */
  expiresAt: string | null
  /** حالة الاشتراك */
  status: SubscriptionStatus | null
  /** قائمة الميزات المتاحة للمستخدم */
  features: FeatureKey[]
  /** هل البيانات قيد التحميل */
  isLoading: boolean
  /** التحقق من ميزة معينة */
  hasFeature: (feature: FeatureKey) => boolean
  /** إعادة تحميل بيانات الاشتراك */
  refreshSubscription: () => Promise<void>
}

interface SubscriptionResponse {
  plan_id: PlanId | null
  expires_at: string | null
  status: SubscriptionStatus | null
  features: FeatureKey[]
}

// ─────────────────────────────────────────────
// Context Creation
// ─────────────────────────────────────────────

const SubscriptionContext = createContext<SubscriptionContextValue | undefined>(undefined)

// ─────────────────────────────────────────────
// Provider Component
// ─────────────────────────────────────────────

export function SubscriptionProvider({ children }: { children: React.ReactNode }) {
  const [currentPlan, setCurrentPlan] = useState<PlanId | null>(null)
  const [expiresAt, setExpiresAt] = useState<string | null>(null)
  const [status, setStatus] = useState<SubscriptionStatus | null>(null)
  const [features, setFeatures] = useState<FeatureKey[]>([])
  const [isLoading, setIsLoading] = useState(true)

  /**
   * جلب بيانات الاشتراك من API
   */
  const fetchSubscription = useCallback(async () => {
    try {
      setIsLoading(true)

      const response = await fetch('/api/subscription/status', {
        method: 'GET',
        credentials: 'include', // إرسال الكوكيز
        cache: 'no-store', // عدم الكاش — نريد البيانات الحديثة دائماً
      })

      if (!response.ok) {
        console.error('[SubscriptionContext] API error:', response.status)
        // في حالة الخطأ — نفترض لا يوجد اشتراك
        setCurrentPlan(null)
        setExpiresAt(null)
        setStatus(null)
        setFeatures([])
        return
      }

      const data: SubscriptionResponse = await response.json()

      setCurrentPlan(data.plan_id)
      setExpiresAt(data.expires_at)
      setStatus(data.status)
      setFeatures(data.features)
    } catch (error) {
      console.error('[SubscriptionContext] Fetch error:', error)
      // في حالة الخطأ — تعيين قيم افتراضية آمنة
      setCurrentPlan(null)
      setExpiresAt(null)
      setStatus(null)
      setFeatures([])
    } finally {
      setIsLoading(false)
    }
  }, [])

  /**
   * التحميل التلقائي عند تحميل المكون
   * يتحقق من وجود كوكي المستخدم قبل إرسال الطلب
   */
  useEffect(() => {
    // تحقق من وجود ebook_user_id cookie قبل إرسال طلب API
    const hasUser = document.cookie.split(';').some(c => c.trim().startsWith('ebook_user_id='))
    if (hasUser) {
      fetchSubscription()
    } else {
      setIsLoading(false)
    }
  }, [fetchSubscription])

  /**
   * التحقق من ميزة معينة
   */
  const hasFeature = useCallback(
    (feature: FeatureKey): boolean => {
      return features.includes(feature)
    },
    [features]
  )

  /**
   * إعادة تحميل بيانات الاشتراك (للاستخدام بعد الدفع مثلاً)
   */
  const refreshSubscription = useCallback(async () => {
    await fetchSubscription()
  }, [fetchSubscription])

  const value: SubscriptionContextValue = {
    currentPlan,
    expiresAt,
    status,
    features,
    isLoading,
    hasFeature,
    refreshSubscription,
  }

  return (
    <SubscriptionContext.Provider value={value}>
      {children}
    </SubscriptionContext.Provider>
  )
}

// ─────────────────────────────────────────────
// Custom Hook
// ─────────────────────────────────────────────

/**
 * استخدام context الاشتراك
 *
 * @throws إذا تم استخدامه خارج SubscriptionProvider
 *
 * @example
 * ```tsx
 * function MyComponent() {
 *   const { currentPlan, hasFeature } = useSubscription()
 *
 *   if (hasFeature('chat')) {
 *     return <ChatInterface />
 *   }
 *
 *   return <UpgradePrompt />
 * }
 * ```
 */
export function useSubscription() {
  const context = useContext(SubscriptionContext)

  if (context === undefined) {
    throw new Error('useSubscription must be used within SubscriptionProvider')
  }

  return context
}
