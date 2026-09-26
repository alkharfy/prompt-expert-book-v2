'use client'

/**
 * Subscription Gate Modal
 *
 * نافذة منبثقة احترافية تظهر عندما يحاول مستخدم غير مشترك
 * الوصول لميزة محمية. تعرض خطط الاشتراك المتاحة مع الأسعار.
 *
 * @module components/SubscriptionGateModal
 */

import React, { useEffect, useState, useCallback } from 'react'
import './SubscriptionGateModal.css'

// ─────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────

interface SubscriptionGateModalProps {
  /** الميزة المطلوبة */
  feature?: string | null
  /** الباقة الحالية للمستخدم (null = لا يوجد اشتراك) */
  currentPlan?: string | null
  /** المسار الأصلي الذي حاول المستخدم الوصول إليه */
  redirectPath?: string | null
  /** هل هذا ترقية أم اشتراك جديد */
  isUpgrade?: boolean
  /** callback عند الإغلاق */
  onClose: () => void
  /** callback عند اختيار باقة */
  onSelectPlan: (planId: string) => void
}

// ─────────────────────────────────────────────
// Data
// ─────────────────────────────────────────────

const FEATURE_INFO: Record<string, { name: string; icon: string; description: string }> = {
  exercises: {
    name: 'التمارين التفاعلية',
    icon: '🧪',
    description: 'تمارين عملية تفاعلية لتطبيق ما تعلمته مع تقييم فوري',
  },
  tools: {
    name: 'صندوق الأدوات',
    icon: '🛠️',
    description: 'مجموعة أدوات ذكية لكتابة البرومبتات الاحترافية',
  },
  chat: {
    name: 'المحادثة الذكية',
    icon: '💬',
    description: 'تواصل مع مدرب AI شخصي للإجابة على أسئلتك',
  },
  gamification: {
    name: 'الإنجازات والألعاب',
    icon: '🏆',
    description: 'نظام إنجازات ونقاط تفاعلي يحفزك على التعلم',
  },
  certificate: {
    name: 'شهادة الإتمام',
    icon: '📜',
    description: 'احصل على شهادة رسمية معتمدة عند إتمام الكتاب',
  },
  leaderboard: {
    name: 'لوحة المتصدرين',
    icon: '📊',
    description: 'تنافس مع المتعلمين الآخرين وتصدّر القائمة',
  },
}

const PLANS = [
  {
    id: 'basic',
    name: 'الأساسية',
    price: 99,
    color: '#3B82F6',
    gradient: 'linear-gradient(135deg, #3B82F6, #1D4ED8)',
    icon: '📘',
    features: ['قراءة الكتاب كاملاً', 'العلامات المرجعية', 'تتبع التقدم', 'التمارين التفاعلية'],
    featureKeys: ['reading', 'bookmarks', 'library', 'progress_tracking', 'exercises'],
  },
  {
    id: 'pro',
    name: 'المتقدمة',
    price: 199,
    color: '#FF6B35',
    gradient: 'linear-gradient(135deg, #FF6B35, #FF8C42)',
    icon: '🚀',
    popular: true,
    features: [
      'كل مميزات الأساسية',
      'صندوق الأدوات الذكية',
      'الإنجازات والشهادات',
      'لوحة المتصدرين',
      'المشروع التطبيقي',
    ],
    featureKeys: ['reading', 'bookmarks', 'library', 'progress_tracking', 'exercises', 'gamification', 'leaderboard', 'certificate', 'tools'],
  },
  {
    id: 'vip',
    name: 'VIP',
    price: 399,
    color: '#A855F7',
    gradient: 'linear-gradient(135deg, #A855F7, #7C3AED)',
    icon: '👑',
    features: [
      'كل مميزات المتقدمة',
      'المحادثة الذكية مع AI',
      'أولوية الدعم الفني',
      'وصول مبكر للتحديثات',
    ],
    featureKeys: ['reading', 'bookmarks', 'library', 'progress_tracking', 'exercises', 'gamification', 'leaderboard', 'certificate', 'tools', 'chat'],
  },
]

const PLAN_ORDER: Record<string, number> = { basic: 1, pro: 2, vip: 3 }

// ─────────────────────────────────────────────
// Component
// ─────────────────────────────────────────────

export default function SubscriptionGateModal({
  feature,
  currentPlan,
  redirectPath,
  isUpgrade = false,
  onClose,
  onSelectPlan,
}: SubscriptionGateModalProps) {
  const [isVisible, setIsVisible] = useState(false)
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null)

  // Determine which plan the feature requires
  const featureInfo = feature ? FEATURE_INFO[feature] : null
  const requiredPlan = feature
    ? PLANS.find(p => p.featureKeys.includes(feature))
    : null

  // Auto-select the cheapest plan that unlocks the feature
  useEffect(() => {
    if (isUpgrade && currentPlan) {
      // For upgrades, suggest the next plan up that has the feature
      const plan = PLANS.find(
        p =>
          PLAN_ORDER[p.id] > (PLAN_ORDER[currentPlan] || 0) &&
          (!feature || p.featureKeys.includes(feature))
      )
      setSelectedPlan(plan?.id || 'pro')
    } else if (feature) {
      const plan = PLANS.find(p => p.featureKeys.includes(feature))
      setSelectedPlan(plan?.id || 'basic')
    } else {
      setSelectedPlan('pro')
    }
  }, [feature, currentPlan, isUpgrade])

  // Animate in
  useEffect(() => {
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        setIsVisible(true)
      })
    })
  }, [])

  // Close with animation
  const handleClose = useCallback(() => {
    setIsVisible(false)
    setTimeout(() => onClose(), 350)
  }, [onClose])

  // Handle backdrop click
  const handleBackdropClick = useCallback(
    (e: React.MouseEvent) => {
      if (e.target === e.currentTarget) handleClose()
    },
    [handleClose]
  )

  // Handle escape key
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') handleClose()
    }
    document.addEventListener('keydown', handleKey)
    return () => document.removeEventListener('keydown', handleKey)
  }, [handleClose])

  // Prevent body scroll when modal is open
  useEffect(() => {
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = ''
    }
  }, [])

  const handleSelectPlan = (planId: string) => {
    setSelectedPlan(planId)
  }

  const handleContinue = () => {
    if (selectedPlan) {
      onSelectPlan(selectedPlan)
    }
  }

  // Filter plans for upgrade mode
  const availablePlans = isUpgrade && currentPlan
    ? PLANS.filter(p => PLAN_ORDER[p.id] > (PLAN_ORDER[currentPlan] || 0))
    : PLANS

  return (
    <div
      className={`sgm-backdrop ${isVisible ? 'sgm-visible' : ''}`}
      onClick={handleBackdropClick}
      role="dialog"
      aria-modal="true"
      aria-labelledby="sgm-title"
    >
      <div className={`sgm-modal ${isVisible ? 'sgm-modal-visible' : ''}`}>
        {/* Close button */}
        <button className="sgm-close" onClick={handleClose} aria-label="إغلاق">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>

        {/* Decorative elements */}
        <div className="sgm-glow sgm-glow-1" />
        <div className="sgm-glow sgm-glow-2" />

        {/* Header */}
        <div className="sgm-header">
          <div className="sgm-lock-icon">
            {featureInfo ? (
              <span className="sgm-feature-icon">{featureInfo.icon}</span>
            ) : (
              <div className="sgm-lock-circle">
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                  <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                </svg>
              </div>
            )}
          </div>

          <h2 id="sgm-title" className="sgm-title">
            {isUpgrade
              ? 'ترقية باقتك'
              : featureInfo
                ? `${featureInfo.name}`
                : 'اشترك للوصول الكامل'}
          </h2>

          <p className="sgm-subtitle">
            {isUpgrade && currentPlan ? (
              <>
                باقتك الحالية{' '}
                <span className="sgm-highlight">
                  ({currentPlan === 'basic' ? 'الأساسية' : currentPlan === 'pro' ? 'المتقدمة' : 'VIP'})
                </span>
                {' '}لا تشمل هذه الميزة. قم بالترقية للوصول إليها.
              </>
            ) : featureInfo ? (
              <>
                {featureInfo.description}
                <br />
                <span className="sgm-highlight-subtle">اشترك الآن للوصول لهذه الميزة وأكثر</span>
              </>
            ) : (
              'اختر الباقة المناسبة لك وابدأ رحلتك في عالم البرومبتات'
            )}
          </p>
        </div>

        {/* Plans */}
        <div className={`sgm-plans ${availablePlans.length === 1 ? 'sgm-plans-single' : availablePlans.length === 2 ? 'sgm-plans-double' : ''}`}>
          {availablePlans.map((plan) => {
            const isSelected = selectedPlan === plan.id
            const hasFeature = !feature || plan.featureKeys.includes(feature)
            const priceDiff = isUpgrade && currentPlan
              ? plan.price - (PLANS.find(p => p.id === currentPlan)?.price || 0)
              : plan.price

            return (
              <button
                key={plan.id}
                className={`sgm-plan-card ${isSelected ? 'sgm-plan-selected' : ''} ${plan.popular ? 'sgm-plan-popular' : ''} ${!hasFeature ? 'sgm-plan-disabled' : ''}`}
                onClick={() => hasFeature && handleSelectPlan(plan.id)}
                disabled={!hasFeature}
                style={{
                  '--plan-color': plan.color,
                  '--plan-gradient': plan.gradient,
                } as React.CSSProperties}
              >
                {plan.popular && (
                  <span className="sgm-popular-tag">الأكثر شيوعاً</span>
                )}

                <div className="sgm-plan-icon">{plan.icon}</div>
                
                <div className="sgm-plan-content">
                  <h3 className="sgm-plan-name">{plan.name}</h3>

                  <div className="sgm-plan-price">
                    {isUpgrade && currentPlan ? (
                      <>
                        <span className="sgm-price-old">{plan.price}</span>
                        <span className="sgm-price-value">{priceDiff}</span>
                        <span className="sgm-price-unit">ج.م</span>
                        <span className="sgm-price-label">فرق الترقية</span>
                      </>
                    ) : (
                      <>
                        <span className="sgm-price-value">{plan.price}</span>
                        <span className="sgm-price-unit">ج.م</span>
                      </>
                    )}
                  </div>

                  <ul className="sgm-plan-features">
                    {plan.features.map((f, i) => (
                      <li key={i}>
                        <svg className="sgm-check" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                          <polyline points="20 6 9 17 4 12" />
                        </svg>
                        {f}
                      </li>
                    ))}
                  </ul>
                </div>

                {isSelected && (
                  <div className="sgm-plan-selected-indicator">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" />
                    </svg>
                  </div>
                )}
              </button>
            )
          })}
        </div>

        {/* CTA */}
        <div className="sgm-actions">
          <button
            className="sgm-cta-button"
            onClick={handleContinue}
            disabled={!selectedPlan}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="1" y="4" width="22" height="16" rx="2" ry="2" />
              <line x1="1" y1="10" x2="23" y2="10" />
            </svg>
            {isUpgrade ? 'ادفع فرق الترقية الآن' : 'اشترك الآن'}
          </button>

          <button className="sgm-back-button" onClick={handleClose}>
            العودة للصفحة السابقة
          </button>
        </div>

        {/* Security badge */}
        <div className="sgm-security">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
          </svg>
          دفع آمن ومشفر • ضمان استرداد خلال 7 أيام
        </div>
      </div>
    </div>
  )
}
