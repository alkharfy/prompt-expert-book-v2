'use client'

import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Navigation from '@/components/Navigation'
import { fetchPricingPlans } from '@/lib/pricing'
import SubscriptionGateModal from '@/components/SubscriptionGateModal'
import { trackInitiateCheckout } from '@/lib/meta-pixel'
import { checkoutEventId } from '@/lib/tracking-config'
import '@/app/auth.css'
import './payment.css'

interface PlanInfo {
    id: string
    name_ar: string
    price: number
    features_ar: string[]
}

function PaymentContent() {
    const router = useRouter()
    const searchParams = useSearchParams()
    // SECURITY: Read userId from cookie instead of URL param to prevent IDOR
    const [userId, setUserId] = useState<string | null>(null)
    const planParam = searchParams.get('plan')
    const [currentPlanId, setCurrentPlanId] = useState<string | null>(null)
    const isUpgrade = searchParams.get('upgrade') === 'true' || !!currentPlanId
    const requiredFeature = searchParams.get('feature')

    // Feature names in Arabic
    const FEATURE_NAMES: Record<string, string> = {
        exercises: 'التمارين التفاعلية',
        tools: 'صندوق الأدوات',
        chat: 'المحادثة الذكية',
        gamification: 'الإنجازات والشهادات',
        certificate: 'شهادة الإتمام',
        leaderboard: 'لوحة المتصدرين',
    }

    // Which plan unlocks which feature
    const FEATURE_MIN_PLAN: Record<string, string> = {
        exercises: 'basic',
        tools: 'pro',
        chat: 'vip',
        gamification: 'pro',
        certificate: 'pro',
        leaderboard: 'pro',
    }

    // Plan hierarchy for upgrade filtering
    const PLAN_ORDER: Record<string, number> = { basic: 1, pro: 2, vip: 3 }
    // Prices come from the admin-managed `plans` table (loaded into `plans` state).
    // No hardcoded price ladder — displayed price must equal the charged price.

    const [plans, setPlans] = useState<PlanInfo[]>([])
    const suggestedPlan = requiredFeature ? (FEATURE_MIN_PLAN[requiredFeature] || 'pro') : 'pro'
    const [selectedPlan, setSelectedPlan] = useState<string>(['basic', 'pro', 'vip'].includes(planParam || '') ? planParam! : (isUpgrade ? suggestedPlan : 'basic'))
    const [isLoading, setIsLoading] = useState(false)
    const [plansLoading, setPlansLoading] = useState(true)
    const [error, setError] = useState('')

    // Promo code state
    // Auto-activate: check if user already paid but subscription wasn't created
    const [alreadyPaid, setAlreadyPaid] = useState(false)

    // Gate modal state — appears when user is redirected from a protected route
    const redirectPath = searchParams.get('redirect')
    const [showGateModal, setShowGateModal] = useState(false)

    useEffect(() => {
        // Show gate modal when user arrives via middleware redirect (only if not already paid)
        if (redirectPath || requiredFeature) {
            setShowGateModal(true)
        }

        // Track payment page view
        import('@/lib/analytics').then(({ trackPaymentPageView, trackFunnelStep }) => {
            trackPaymentPageView(selectedPlan)
            trackFunnelStep('payment', 5)
        })

        // Record payment intent for abandoned cart recovery
        if (userId && selectedPlan) {
            fetch('/api/payment/intent', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ plan: selectedPlan }),
            }).catch(() => { /* non-critical */ })
        }
    }, [redirectPath, requiredFeature, alreadyPaid])

    const handleGateModalClose = () => {
        setShowGateModal(false)
        // Go back to where the user came from, or home
        if (redirectPath) {
            router.back()
        }
    }

    const handleGateModalSelectPlan = (planId: string) => {
        setShowGateModal(false)
        setSelectedPlan(planId)
        // Scroll to payment section smoothly
        setTimeout(() => {
            window.scrollTo({ top: 0, behavior: 'smooth' })
        }, 100)
    }

    const [promoCode, setPromoCode] = useState('')
    const [promoValidating, setPromoValidating] = useState(false)
    const [promoResult, setPromoResult] = useState<{
        valid: boolean
        promo_id?: string
        discount_type?: string
        discount_value?: number
        discount_amount?: number
        original_amount?: number
        final_amount?: number
        error?: string
    } | null>(null)

    // Get userId from cookie (secure, not from URL)
    useEffect(() => {
        const cookieUserId = document.cookie
            .split('; ')
            .find(row => row.startsWith('ebook_user_id='))
            ?.split('=')[1]
        
        if (cookieUserId) {
            setUserId(cookieUserId)
        } else {
            // Preserve buy-intent across signup: come back to /payment with the plan.
            const returnPath = '/payment' + (searchParams.toString() ? '?' + searchParams.toString() : '')
            router.push('/register?next=' + encodeURIComponent(returnPath))
        }
    }, [router, planParam, searchParams])

    // Auto-activate: check if user already paid but subscription wasn't created
    useEffect(() => {
        if (!userId) return
        const tryActivate = async () => {
            try {
                const res = await fetch('/api/payment/activate', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({})
                })
                const data = await res.json()
                if (data.success && data.hasPaid) {
                    setAlreadyPaid(true)
                    setCurrentPlanId(data.planId || data.plan || null)
                    if (data.planId === "vip" || data.plan === "vip") setError("باقتك VIP نشطة وتشمل جميع المزايا الحالية. يمكنك العودة إلى الكتاب.")
                }
            } catch { /* ignore, show payment page normally */ }
        }
        tryActivate()
    }, [userId])

    // Fetch plans from API
    useEffect(() => {
        const fetchPlans = async () => {
            try {
                setPlans(await fetchPricingPlans())
            } catch (error) {
                setError('تعذّر تحميل الأسعار الحالية. أعد تحميل الصفحة قبل الدفع.')
            } finally {
                setPlansLoading(false)
            }
        }

        fetchPlans()
    }, [])

    useEffect(() => {
        if (!isUpgrade || !currentPlanId || !plans.length) return
        if ((PLAN_ORDER[selectedPlan] || 0) <= (PLAN_ORDER[currentPlanId] || 0)) {
            const next = plans.find(p => (PLAN_ORDER[p.id] || 0) > (PLAN_ORDER[currentPlanId] || 0))
            if (next) setSelectedPlan(next.id)
        }
    // Plan ranks are a static lookup.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isUpgrade, currentPlanId, selectedPlan, plans])

    const currentPlan = plans.find(p => p.id === selectedPlan && (!isUpgrade || !currentPlanId || PLAN_ORDER[p.id] > PLAN_ORDER[currentPlanId]))

    // Reset promo when plan changes
    useEffect(() => {
        if (promoResult) {
            setPromoResult(null)
            setPromoCode('')
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [selectedPlan])

    const handleApplyPromo = async () => {
        if (!promoCode.trim() || !currentPlan || !userId || isUpgrade && !currentPlanId) return
        setPromoValidating(true)
        setPromoResult(null)

        try {
            const response = await fetch('/api/promo/validate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    code: promoCode.trim(),
                    planId: selectedPlan,
                    isUpgrade,
                }),
            })

            const data = await response.json()
            setPromoResult(data)
            if (data.valid && data.final_amount != null) {
                import('@/lib/analytics').then(({ trackPromoApplied, trackPromoCodeUsed }) => {
                    const discount = (currentPlan?.price ?? 0) - (data.final_amount ?? 0)
                    trackPromoApplied(promoCode.trim(), discount)
                    trackPromoCodeUsed(promoCode.trim(), discount)
                })
            }
        } catch {
            setPromoResult({ valid: false, error: 'حدث خطأ في التحقق من الكود' })
        } finally {
            setPromoValidating(false)
        }
    }

    const handleRemovePromo = () => {
        setPromoCode('')
        setPromoResult(null)
    }

    const handlePayment = async () => {
        if (!userId || !currentPlan || isUpgrade && !currentPlanId) return
        setError('')
        setIsLoading(true)

        // Track payment start
        const { trackPaymentStarted } = await import('@/lib/analytics')
        trackPaymentStarted(selectedPlan, promoResult?.valid ? (promoResult.final_amount ?? currentPlan.price) : (isUpgrade && currentPlanId ? currentPlan.price - (plans.find(p => p.id === currentPlanId)?.price ?? 0) : currentPlan.price))

        try {
            const payload: any = {
                planId: selectedPlan,
            }

            // Include upgrade info
            if (isUpgrade && currentPlanId) {
                payload.isUpgrade = true
            }

            // Include promo code if validated
            if (promoResult?.valid && promoCode.trim()) {
                payload.promoCode = promoCode.trim()
            }

            const response = await fetch('/api/payment/create-session', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            })

            const data = await response.json()

            if (data.success && data.sessionUrl) {
                const checkoutAmount = Number(data.amount)
                if (!Number.isFinite(checkoutAmount) || checkoutAmount <= 0) throw new Error('Invalid checkout amount')
                // Track checkout initiation in Meta Pixel + GA4.
                // Shared event_id (checkoutEventId(orderId)) dedups against the
                // server CAPI InitiateCheckout fired in create-session.
                const icValue = checkoutAmount
                trackInitiateCheckout(icValue, data.orderId ? checkoutEventId(data.orderId) : undefined)
                import('@/lib/analytics').then(({ trackBeginCheckout }) => {
                    trackBeginCheckout(checkoutAmount)
                })
                // التوجيه لصفحة كاشير للدفع
                window.location.href = data.sessionUrl
            } else {
                setError(data.error || 'فشل في إنشاء جلسة الدفع')
                setIsLoading(false)
            }
        } catch {
            setError('حدث خطأ في الاتصال. حاول مرة أخرى')
            setIsLoading(false)
        }
    }

    if (!userId) return null

    return (
        <main className="auth-container">
            <Navigation />

            {/* Subscription Gate Modal — shown when redirected from protected route */}
            {showGateModal && (
                <SubscriptionGateModal
                    feature={requiredFeature}
                    currentPlan={currentPlanId}
                    redirectPath={redirectPath}
                    isUpgrade={isUpgrade}
                    onClose={handleGateModalClose}
                    onSelectPlan={handleGateModalSelectPlan}
                />
            )}

            <div className="payment-page">
                {alreadyPaid && !isUpgrade && (
                    <div style={{
                        background: 'linear-gradient(135deg, #27c93f22, #1fa32e22)',
                        border: '1px solid #27c93f55',
                        borderRadius: '12px',
                        padding: '1.5rem',
                        margin: '1rem auto 2rem',
                        maxWidth: '600px',
                        textAlign: 'center',
                    }}>
                        <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>✅</div>
                        <h3 style={{ color: '#27c93f', margin: '0 0 0.5rem' }}>تم الدفع وتفعيل حسابك بنجاح!</h3>
                        <p style={{ color: '#ccc', fontSize: '0.9rem', margin: '0 0 1rem' }}>
                            باقتك مفعّلة. يمكنك الوصول لكل المحتوى المتاح في باقتك.
                        </p>
                        <button
                            onClick={() => window.location.href = '/toc'}
                            style={{
                                background: 'linear-gradient(135deg, #FF6B35, #FFB800)',
                                color: '#fff',
                                border: 'none',
                                borderRadius: '8px',
                                padding: '0.75rem 2rem',
                                fontSize: '1rem',
                                fontWeight: 'bold',
                                cursor: 'pointer',
                            }}
                        >
                            انتقل للفهرس وابدأ القراءة
                        </button>
                    </div>
                )}

                {isUpgrade && (
                    <div style={{
                        background: 'linear-gradient(135deg, #FF6B3522, #FFB80022)',
                        border: '1px solid #FF6B3555',
                        borderRadius: '16px',
                        padding: '2rem',
                        margin: '1rem auto 2rem',
                        maxWidth: '600px',
                        textAlign: 'center',
                    }}>
                        <div style={{ fontSize: '2.5rem', marginBottom: '0.75rem' }}>🔒</div>
                        <h3 style={{ color: '#FFB800', margin: '0 0 0.5rem', fontSize: '1.3rem' }}>
                            {requiredFeature && FEATURE_NAMES[requiredFeature]
                                ? `${FEATURE_NAMES[requiredFeature]} — ميزة متقدمة`
                                : 'هذه الميزة تحتاج ترقية'}
                        </h3>
                        <p style={{ color: '#ccc', fontSize: '0.95rem', margin: '0 0 0.5rem', lineHeight: '1.6' }}>
                            باقتك الحالية لا تشمل هذه الميزة.
                            <br />
                            قم بالترقية للباقة <strong style={{ color: '#FF6B35' }}>
                            {suggestedPlan === 'pro' ? 'المتقدمة' : suggestedPlan === 'vip' ? 'VIP' : 'الأساسية'}
                            </strong> أو أعلى للوصول إليها.
                        </p>
                        <p style={{ color: '#999', fontSize: '0.8rem', margin: '0.5rem 0 0' }}>
                            💡 اختر الباقة المناسبة أدناه وادفع الآن
                        </p>
                    </div>
                )}

                <div className="payment-header">
                    <div className="payment-icon">💳</div>
                    <h1 className="payment-title">{alreadyPaid ? 'ترقية الباقة' : 'اختر باقتك'}</h1>
                    <p className="payment-subtitle">
                        {alreadyPaid
                            ? 'يمكنك الترقية لباقة أعلى للوصول لمزيد من الميزات'
                            : 'أكمل عملية الدفع للوصول إلى محتوى الكتاب الكامل'}
                    </p>
                </div>

                {error && <div className="auth-global-error" role="alert">{error}</div>}

                {plansLoading ? (
                    <div className="text-center py-8">
                        <div className="auth-loader mx-auto" />
                        <p className="text-gray-600 mt-4">جاري تحميل الباقات...</p>
                    </div>
                ) : (
                    <>
                        <div className="plans-grid">
                            {plans
                                .filter((plan) => {
                                    // In upgrade mode, only show plans higher than current
                                    if (isUpgrade && currentPlanId) {
                                        return (PLAN_ORDER[plan.id] || 0) > (PLAN_ORDER[currentPlanId] || 0)
                                    }
                                    return true
                                })
                                .map((plan) => {
                                const upgradeDiff = isUpgrade && currentPlanId
                                    ? plan.price - (plans.find(p => p.id === currentPlanId)?.price ?? 0)
                                    : 0

                                return (
                                <div
                                    key={plan.id}
                                    className={`plan-card ${selectedPlan === plan.id ? 'selected' : ''} ${plan.id === 'pro' ? 'popular' : ''}`}
                                    onClick={() => setSelectedPlan(plan.id)}
                                >
                                    {plan.id === 'pro' && (
                                        <span className="popular-badge">أدوات وتدريب إضافي</span>
                                    )}
                                    <h3 className="plan-name">{plan.name_ar}</h3>
                                    <div className="plan-price">
                                        {isUpgrade && currentPlanId ? (
                                            <>
                                                <span className="price-amount" style={{ textDecoration: 'line-through', opacity: 0.5, fontSize: '1rem' }}>{plan.price}</span>
                                                <span className="price-amount" style={{ color: '#27c93f', marginRight: '0.5rem' }}>{upgradeDiff}</span>
                                                <span className="price-currency">ج.م فرق الترقية</span>
                                            </>
                                        ) : (
                                            <>
                                                <span className="price-amount">{plan.price}</span>
                                                <span className="price-currency">ج.م</span>
                                            </>
                                        )}
                                    </div>
                                    <ul className="plan-features">
                                        {plan.features_ar.map((feature, i) => (
                                            <li key={i}>
                                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                                    <polyline points="20 6 9 17 4 12"></polyline>
                                                </svg>
                                                {feature}
                                            </li>
                                        ))}
                                    </ul>
                                    <div className="plan-radio">
                                        <div className={`radio-dot ${selectedPlan === plan.id ? 'active' : ''}`} />
                                    </div>
                                </div>
                                )
                            })}
                        </div>

                        {currentPlan && (
                            <>
                                {/* Promo Code Section */}
                                <div className="promo-section">
                                    <div className="promo-header">
                                        <span className="promo-icon">🏷️</span>
                                        <span>هل لديك كود خصم؟</span>
                                    </div>
                                    {promoResult?.valid ? (
                                        <div className="promo-applied">
                                            <div className="promo-applied-info">
                                                <span className="promo-check">✅</span>
                                                <div>
                                                    <strong style={{ color: '#10b981' }}>تم تطبيق الكود: {promoCode}</strong>
                                                    <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--color-text-secondary)' }}>
                                                        خصم {promoResult.discount_type === 'percentage' ? `${promoResult.discount_value}%` : `${promoResult.discount_amount} ج.م`}
                                                    </p>
                                                </div>
                                            </div>
                                            <button className="promo-remove-btn" onClick={handleRemovePromo}>
                                                إزالة
                                            </button>
                                        </div>
                                    ) : (
                                        <div className="promo-input-row">
                                            <input
                                                type="text"
                                                value={promoCode}
                                                onChange={(e) => { setPromoCode(e.target.value.toUpperCase()); setPromoResult(null) }}
                                                placeholder="أدخل كود الخصم"
                                                className="promo-input"
                                                onKeyDown={(e) => { if (e.key === 'Enter') handleApplyPromo() }}
                                            />
                                            <button
                                                className="promo-apply-btn"
                                                onClick={handleApplyPromo}
                                                disabled={promoValidating || !promoCode.trim()}
                                            >
                                                {promoValidating ? '...' : 'تطبيق'}
                                            </button>
                                        </div>
                                    )}
                                    {promoResult && !promoResult.valid && (
                                        <p className="promo-error">{promoResult.error || 'كود الخصم غير صالح'}</p>
                                    )}
                                </div>

                                {/* Payment Summary */}
                                <div className="payment-summary">
                                    <div className="summary-row">
                                        <span>الباقة المختارة</span>
                                        <span className="summary-value">{currentPlan.name_ar}</span>
                                    </div>
                                    {isUpgrade && currentPlanId ? (
                                        <>
                                            <div className="summary-row">
                                                <span>سعر الباقة الجديدة</span>
                                                <span className="summary-value">{currentPlan.price} ج.م</span>
                                            </div>
                                            <div className="summary-row discount">
                                                <span>باقتك الحالية ({
                                                    currentPlanId === 'basic' ? 'الأساسية' :
                                                    currentPlanId === 'pro' ? 'المتقدمة' : 'VIP'
                                                })</span>
                                                <span className="summary-value discount-value">- {plans.find(p => p.id === currentPlanId)?.price ?? 0} ج.م</span>
                                            </div>
                                        </>
                                    ) : (
                                        <div className="summary-row">
                                            <span>السعر الأصلي</span>
                                            <span className="summary-value">{currentPlan.price} ج.م</span>
                                        </div>
                                    )}
                                    {promoResult?.valid && promoResult.discount_amount && (
                                        <div className="summary-row discount">
                                            <span>الخصم ({promoCode})</span>
                                            <span className="summary-value discount-value">- {promoResult.discount_amount} ج.م</span>
                                        </div>
                                    )}
                                    <div className="summary-row total">
                                        <span>المبلغ الإجمالي</span>
                                        <span className="summary-value">
                                            {(() => {
                                                let amount = currentPlan.price
                                                if (isUpgrade && currentPlanId) {
                                                    amount = currentPlan.price - (plans.find(p => p.id === currentPlanId)?.price ?? 0)
                                                }
                                                if (promoResult?.valid && promoResult.final_amount != null) {
                                                    // Promo final_amount is calculated on the upgrade difference on server
                                                    return promoResult.final_amount
                                                }
                                                return amount
                                            })()} ج.م
                                        </span>
                                    </div>
                                </div>
                            </>
                        )}
                    </>
                )}

                <button
                    className="payment-btn"
                    onClick={handlePayment}
                    disabled={isLoading || !currentPlan || isUpgrade && !currentPlanId}
                >
                    {isLoading ? (
                        <div className="payment-btn-loading">
                            <div className="auth-loader" />
                            <span>جاري التحويل لصفحة الدفع...</span>
                        </div>
                    ) : (
                        <>
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <rect x="1" y="4" width="22" height="16" rx="2" ry="2"></rect>
                                <line x1="1" y1="10" x2="23" y2="10"></line>
                            </svg>
                            {isUpgrade ? 'ادفع فرق الترقية عبر كاشير' : 'ادفع الآن عبر كاشير'}
                        </>
                    )}
                </button>

                <div className="payment-secure">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
                        <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
                    </svg>
                    <span>دفع آمن ومشفر عبر منصة كاشير</span>
                </div>

                {/* WhatsApp Support Button */}
                <div className="whatsapp-support">
                    <p className="whatsapp-support-text">محتاج مساعدة في الدفع أو عندك سؤال؟</p>
                    <a
                        href={`https://wa.me/${process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || '201029010778'}?text=${encodeURIComponent('مرحباً، محتاج مساعدة في الاشتراك في PromptMaster')}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="whatsapp-support-btn"
                        onClick={() => {
                            import('@/lib/analytics').then(({ trackEvent }) => {
                                trackEvent('whatsapp_support_clicked', {
                                    page: 'payment',
                                    selectedPlan: selectedPlan
                                })
                            })
                        }}
                    >
                        💬 كلمنا على WhatsApp
                    </a>
                </div>
            </div>
        </main>
    )
}

export default function PaymentPage() {
    return (
        <Suspense fallback={<div className="auth-container"><div className="auth-loader"></div></div>}>
            <PaymentContent />
        </Suspense>
    )
}
