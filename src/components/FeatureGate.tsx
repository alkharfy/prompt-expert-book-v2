'use client'

/**
 * Feature Gate Component
 *
 * مكوّن قابل لإعادة الاستخدام للتحكم في الوصول للميزات حسب الباقة.
 * يخفي أو يعرض المحتوى بناءً على ما إذا كان المستخدم يملك الميزة المطلوبة.
 *
 * @module components/FeatureGate
 */

import React, { type ReactNode } from 'react'
import { useSubscription } from '@/context/SubscriptionContext'
import type { FeatureKey } from '@/types/subscription'

interface FeatureGateProps {
  /** الميزة المطلوبة للوصول */
  feature: FeatureKey
  /** المحتوى المعروض في حالة عدم توفر الميزة (افتراضياً: رسالة ترقية) */
  fallback?: ReactNode
  /** المحتوى المحمي */
  children: ReactNode
  /** وضع الـ loading (افتراضياً: null) */
  loadingFallback?: ReactNode
}

/**
 * Feature Gate
 *
 * @example
 * ```tsx
 * <FeatureGate feature="chat">
 *   <ChatInterface />
 * </FeatureGate>
 * ```
 *
 * @example مع fallback مخصص
 * ```tsx
 * <FeatureGate
 *   feature="tools"
 *   fallback={<CustomUpgradePrompt />}
 * >
 *   <ToolsInterface />
 * </FeatureGate>
 * ```
 */
export default function FeatureGate({
  feature,
  fallback,
  children,
  loadingFallback = null,
}: FeatureGateProps) {
  const { hasFeature, isLoading, currentPlan } = useSubscription()

  // أثناء التحميل — عرض loading fallback أو null
  if (isLoading) {
    return <>{loadingFallback}</>
  }

  // التحقق من الميزة
  const hasAccess = hasFeature(feature)

  if (hasAccess) {
    // المستخدم لديه الميزة — عرض المحتوى
    return <>{children}</>
  }

  // المستخدم ليس لديه الميزة — عرض fallback
  if (fallback) {
    return <>{fallback}</>
  }

  // fallback افتراضي — رسالة ترقية بسيطة
  return (
    <div className="feature-gate-fallback" style={defaultFallbackStyle}>
      <div className="feature-gate-icon">🔒</div>
      <h2 className="feature-gate-title">هذه الميزة غير متاحة</h2>
      <p className="feature-gate-message">
        {currentPlan
          ? `باقتك الحالية (${getPlanDisplayName(currentPlan)}) لا تتضمن هذه الميزة.`
          : 'تحتاج إلى اشتراك نشط للوصول لهذه الميزة.'}
      </p>
      <a href="/payment" className="feature-gate-button" style={buttonStyle}>
        {currentPlan ? 'ترقية الباقة' : 'الاشتراك الآن'}
      </a>
    </div>
  )
}

// ─────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────

function getPlanDisplayName(planId: string): string {
  const names: Record<string, string> = {
    basic: 'الباقة الأساسية',
    pro: 'الباقة الاحترافية',
    vip: 'الباقة المميزة',
  }
  return names[planId] || planId
}

// ─────────────────────────────────────────────
// Default Styles
// ─────────────────────────────────────────────

const defaultFallbackStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  minHeight: '400px',
  padding: '2rem',
  textAlign: 'center',
  backgroundColor: 'rgba(255, 255, 255, 0.05)',
  borderRadius: '8px',
  border: '1px solid rgba(255, 255, 255, 0.1)',
}

const buttonStyle: React.CSSProperties = {
  display: 'inline-block',
  marginTop: '1.5rem',
  padding: '0.75rem 2rem',
  backgroundColor: '#8B5CF6',
  color: 'white',
  textDecoration: 'none',
  borderRadius: '8px',
  fontWeight: 'bold',
  transition: 'background-color 0.2s',
}
