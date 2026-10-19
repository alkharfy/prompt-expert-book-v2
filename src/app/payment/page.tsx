'use client'

import { useState, useEffect, useMemo, useRef, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Navigation from '@/components/Navigation'
import { checkoutKind, fetchPricingPlans, planLabel, type PublicPricingPlan } from '@/lib/pricing'
import { useSubscription } from '@/context/SubscriptionContext'
import SubscriptionGateModal from '@/components/SubscriptionGateModal'
import { trackInitiateCheckout } from '@/lib/meta-pixel'
import { checkoutEventId } from '@/lib/tracking-config'
import { PAYMENT_METHODS_TEXT, SUPPORT_WHATSAPP_DISPLAY, refundDaysFor, refundDaysLabel, supportWhatsAppUrl } from '@/lib/config'
import '@/app/auth.css'
import './payment.css'

const FEATURE_NAMES: Record<string, string> = {
    exercises: 'التمارين',
    tools: 'أدوات البرومبت',
    chat: 'المساعد الذكي',
    gamification: 'الإنجازات',
    certificate: 'شهادة الإتمام',
    leaderboard: 'ترتيب المتعلمين',
}

/** The lowest plan that opens a feature (matches PLAN_FEATURES). */
const FEATURE_MIN_PLAN: Record<string, string> = {
    exercises: 'monthly',
    tools: 'pro',
    chat: 'vip',
    gamification: 'pro',
    certificate: 'pro',
    leaderboard: 'pro',
}

const formatDate = (iso: string | null) => iso ? new Date(iso).toLocaleDateString('ar-EG-u-nu-latn', { day: 'numeric', month: 'long', year: 'numeric' }) : ''

function PaymentContent() {
    const router = useRouter()
    const searchParams = useSearchParams()
    // SECURITY: Read userId from cookie instead of URL param to prevent IDOR
    const [userId, setUserId] = useState<string | null>(null)
    const planParam = searchParams.get('plan')
    const requiredFeature = searchParams.get('feature')
    const redirectPath = searchParams.get('redirect')

    const { currentPlan: currentPlanId, expiresAt, status, isLoading: subLoading, refreshSubscription } = useSubscription()
    const current = useMemo(() => ({ plan_id: currentPlanId, expires_at: expiresAt, status }), [currentPlanId, expiresAt, status])
    const kindOf = (planId: string) => checkoutKind(current, planId)
    const hasActive = kindOf('basic') !== 'new'
    const onMonthly = hasActive && currentPlanId === 'monthly'
    const onYearly = hasActive && !onMonthly

    const [plans, setPlans] = useState<PublicPricingPlan[]>([])
    const [plansLoading, setPlansLoading] = useState(true)
    const [selectedPlan, setSelectedPlan] = useState<string>(planParam || '')
    const [isLoading, setIsLoading] = useState(false)
    const [error, setError] = useState('')
    const [showGateModal, setShowGateModal] = useState(!!(redirectPath || requiredFeature))

    // A yearly subscriber only sees the plans above theirs; everyone else sees every plan.
    const visiblePlans = plans.filter(plan => kindOf(plan.id) !== 'blocked')
    const selected = visiblePlans.find(plan => plan.id === selectedPlan) || null
    const selectedKind = selected ? kindOf(selected.id) : 'new'
    const isUpgrade = selectedKind === 'upgrade'
    const currentPrice = plans.find(plan => plan.id === currentPlanId)?.price ?? 0
    const basePrice = selected ? (isUpgrade ? selected.price - currentPrice : selected.price) : 0

    // Pick a sensible plan once prices and the subscription are known.
    useEffect(() => {
        if (plansLoading || subLoading || !visiblePlans.length) return
        if (visiblePlans.some(plan => plan.id === selectedPlan)) return
        const wanted = requiredFeature ? FEATURE_MIN_PLAN[requiredFeature] : null
        const pick = visiblePlans.find(plan => plan.id === wanted)
            || (onYearly ? visiblePlans[0] : visiblePlans.find(plan => plan.id === 'monthly') || visiblePlans[0])
        setSelectedPlan(pick.id)
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [plansLoading, subLoading, plans, currentPlanId, expiresAt, status, requiredFeature])

    useEffect(() => {
        import('@/lib/analytics').then(({ trackPaymentPageView, trackFunnelStep }) => {
            trackPaymentPageView(planParam || 'none')
            trackFunnelStep('payment', 5)
        })
    }, [planParam])

    // Record payment intent for abandoned cart recovery (only for a plan this person can actually buy)
    const intentPlan = !subLoading && selected ? selected.id : ''
    useEffect(() => {
        if (!userId || !intentPlan) return
        fetch('/api/payment/intent', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ plan: intentPlan }),
        }).catch(() => { /* non-critical */ })
    }, [userId, intentPlan])

    const handleGateModalClose = () => {
        setShowGateModal(false)
        if (redirectPath) router.back()
    }

    const handleGateModalSelectPlan = (planId: string) => {
        setShowGateModal(false)
        setSelectedPlan(planId)
        setTimeout(() => window.scrollTo({ top: 0, behavior: 'smooth' }), 100)
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

    // A payment that went through but never opened the account gets activated here.
    useEffect(() => {
        if (!userId) return
        fetch('/api/payment/activate', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({}) })
            .then(res => res.json())
            .then(data => { if (data.success && data.hasPaid) refreshSubscription() })
            .catch(() => { /* show the page normally */ })
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [userId])

    useEffect(() => {
        fetchPricingPlans()
            .then(setPlans)
            .catch(() => setError('مقدرناش نحمّل الأسعار. اعمل تحديث للصفحة قبل ما تدفع.'))
            .finally(() => setPlansLoading(false))
    }, [])

    // A promo result belongs to one plan and one kind of purchase: drop it (and any late reply) when either changes.
    const quoteKey = `${selected?.id || ''}:${selectedKind}:${basePrice}`
    const quoteKeyRef = useRef(quoteKey)
    useEffect(() => {
        quoteKeyRef.current = quoteKey
        setPromoResult(null)
        setPromoCode('')
    }, [quoteKey])

    const handleApplyPromo = async () => {
        if (!promoCode.trim() || !selected || !userId) return
        const askedFor = quoteKey
        setPromoValidating(true)
        setPromoResult(null)
        try {
            const response = await fetch('/api/promo/validate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ code: promoCode.trim(), planId: selected.id, isUpgrade }),
            })
            const data = await response.json()
            if (askedFor !== quoteKeyRef.current) return
            setPromoResult(data)
            if (data.valid && data.final_amount != null) {
                import('@/lib/analytics').then(({ trackPromoApplied, trackPromoCodeUsed }) => {
                    const discount = basePrice - (data.final_amount ?? 0)
                    trackPromoApplied(promoCode.trim(), discount)
                    trackPromoCodeUsed(promoCode.trim(), discount)
                })
            }
        } catch {
            setPromoResult({ valid: false, error: 'حصلت مشكلة وإحنا بنراجع الكود. جرّب تاني.' })
        } finally {
            setPromoValidating(false)
        }
    }

    const handleRemovePromo = () => {
        setPromoCode('')
        setPromoResult(null)
    }

    const total = promoResult?.valid && promoResult.final_amount != null ? promoResult.final_amount : basePrice

    const handlePayment = async () => {
        if (!userId || !selected) return
        setError('')
        setIsLoading(true)

        const { trackPaymentStarted } = await import('@/lib/analytics')
        trackPaymentStarted(selected.id, total)

        try {
            const payload: Record<string, unknown> = { planId: selected.id }
            if (isUpgrade) payload.isUpgrade = true
            if (promoResult?.valid && promoCode.trim()) payload.promoCode = promoCode.trim()

            const response = await fetch('/api/payment/create-session', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            })
            const data = await response.json()

            if (data.success && data.sessionUrl) {
                const checkoutAmount = Number(data.amount)
                if (!Number.isFinite(checkoutAmount) || checkoutAmount <= 0) throw new Error('Invalid checkout amount')
                // Never send someone to pay an amount different from the one on the screen without asking.
                if (Math.abs(checkoutAmount - total) > 0.01 && !window.confirm(`المبلغ النهائي ${checkoutAmount} جنيه، مش ${total}. نكمّل الدفع؟`)) {
                    setError(`المبلغ اتغيّر وبقى ${checkoutAmount} جنيه. راجع الباقة والكود، أو كلّمنا على واتساب.`)
                    setIsLoading(false)
                    return
                }
                // Shared event_id (checkoutEventId(orderId)) dedups against the server CAPI InitiateCheckout fired in create-session.
                trackInitiateCheckout(checkoutAmount, data.orderId ? checkoutEventId(data.orderId) : undefined)
                import('@/lib/analytics').then(({ trackBeginCheckout }) => trackBeginCheckout(checkoutAmount))
                window.location.href = data.sessionUrl
            } else {
                setError(data.error || 'مقدرناش نفتح صفحة الدفع. جرّب تاني.')
                setIsLoading(false)
            }
        } catch {
            setError('النت فصل؟ جرّب تاني.')
            setIsLoading(false)
        }
    }

    if (!userId) return null

    const everythingOpen = onYearly && !plansLoading && plans.length > 0 && visiblePlans.length === 0

    return (
        <main className="auth-container">
            <Navigation />

            {showGateModal && (
                <SubscriptionGateModal
                    feature={requiredFeature}
                    currentPlan={currentPlanId}
                    redirectPath={redirectPath}
                    isUpgrade={onYearly}
                    onClose={handleGateModalClose}
                    onSelectPlan={handleGateModalSelectPlan}
                />
            )}

            <div className="payment-page">
                {requiredFeature && FEATURE_NAMES[requiredFeature] && hasActive && (
                    <div className="payment-note payment-note-warn">
                        <strong>{FEATURE_NAMES[requiredFeature]} مش في باقتك.</strong>
                        <span>هتلاقيها في {planLabel(FEATURE_MIN_PLAN[requiredFeature])} أو أعلى.</span>
                    </div>
                )}

                {onMonthly && (
                    <div className="payment-note">
                        <strong>اشتراكك الشهري شغال لحد {formatDate(expiresAt)}.</strong>
                        <span>لو دفعت شهر كمان أو سنة، المدة الجديدة بتتحسب بعد ما شهرك الحالي يخلص، فمش هتخسر ولا يوم.</span>
                    </div>
                )}

                {everythingOpen && (
                    <div className="payment-note payment-note-ok">
                        <strong>باقتك {planLabel(currentPlanId)} شغالة لحد {formatDate(expiresAt)}، وفيها كل حاجة.</strong>
                        <button type="button" className="payment-note-btn" onClick={() => router.push('/toc')}>ارجع للكورس</button>
                    </div>
                )}

                {/* Nothing left to buy: the note above says so; no "upgrade" title over an empty list */}
                {!everythingOpen && <div className="payment-header">
                    <div className="payment-icon">💳</div>
                    <h1 className="payment-title">{onYearly ? 'رقّي باقتك' : onMonthly ? 'جدّد أو حوّل لسنوي' : 'اختار باقتك'}</h1>
                    <p className="payment-subtitle">
                        {onYearly
                            ? 'هتدفع الفرق بس، ونهاية اشتراكك هتفضل زي ما هي.'
                            : 'بتدفع مرة واحدة، ومفيش تجديد تلقائي.'}
                    </p>
                </div>}

                {error && <div className="auth-global-error" role="alert">{error}</div>}

                {plansLoading || subLoading ? (
                    <div className="text-center py-8">
                        <div className="auth-loader mx-auto" />
                        <p className="text-gray-600 mt-4">بنحمّل الباقات…</p>
                    </div>
                ) : (
                    <>
                        <div className="plans-grid">
                            {visiblePlans.map(plan => {
                                const kind = kindOf(plan.id)
                                const diff = kind === 'upgrade' ? plan.price - currentPrice : 0
                                return (
                                    <div
                                        key={plan.id}
                                        role="radio"
                                        aria-checked={selectedPlan === plan.id}
                                        tabIndex={0}
                                        className={`plan-card ${selectedPlan === plan.id ? 'selected' : ''} ${plan.is_popular ? 'popular' : ''}`}
                                        onClick={() => setSelectedPlan(plan.id)}
                                        onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setSelectedPlan(plan.id) } }}
                                    >
                                        {plan.is_popular && <span className="popular-badge">الأنسب للبداية</span>}
                                        <h3 className="plan-name">{plan.name_ar}</h3>
                                        <div className="plan-price">
                                            {kind === 'upgrade' ? (
                                                <>
                                                    <span className="price-amount" style={{ textDecoration: 'line-through', opacity: 0.5, fontSize: '1rem' }}>{plan.price}</span>
                                                    <span className="price-amount" style={{ color: '#27c93f', marginRight: '0.5rem' }}>{diff}</span>
                                                    <span className="price-currency">ج.م فرق الترقية</span>
                                                </>
                                            ) : (
                                                <>
                                                    <span className="price-amount">{plan.price}</span>
                                                    <span className="price-currency">ج.م / {plan.period}</span>
                                                </>
                                            )}
                                        </div>
                                        {kind === 'renew' && <p className="plan-kind">شهر كمان بعد شهرك الحالي</p>}
                                        {kind === 'switch' && <p className="plan-kind">مميزاتها تشتغل النهارده، والسنة بتتحسب بعد شهرك الحالي</p>}
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

                        {selected && (
                            <>
                                <div className="promo-section">
                                    <div className="promo-header">
                                        <span className="promo-icon">🏷️</span>
                                        <span>معاك كود خصم؟</span>
                                    </div>
                                    {promoResult?.valid ? (
                                        <div className="promo-applied">
                                            <div className="promo-applied-info">
                                                <span className="promo-check">✅</span>
                                                <div>
                                                    <strong style={{ color: '#10b981' }}>الكود اتطبّق: {promoCode}</strong>
                                                    <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--color-text-secondary)' }}>
                                                        خصم {promoResult.discount_type === 'percentage' ? `${promoResult.discount_value}%` : `${promoResult.discount_amount} ج.م`}
                                                    </p>
                                                </div>
                                            </div>
                                            <button className="promo-remove-btn" onClick={handleRemovePromo}>شيل الكود</button>
                                        </div>
                                    ) : (
                                        <div className="promo-input-row">
                                            <input
                                                type="text"
                                                value={promoCode}
                                                onChange={e => { setPromoCode(e.target.value.toUpperCase()); setPromoResult(null) }}
                                                placeholder="اكتب الكود هنا"
                                                aria-label="كود الخصم"
                                                className="promo-input"
                                                onKeyDown={e => { if (e.key === 'Enter') handleApplyPromo() }}
                                            />
                                            <button className="promo-apply-btn" onClick={handleApplyPromo} disabled={promoValidating || !promoCode.trim()}>
                                                {promoValidating ? '...' : 'طبّق'}
                                            </button>
                                        </div>
                                    )}
                                    {promoResult && !promoResult.valid && (
                                        <p className="promo-error">{promoResult.error || 'الكود ده مش شغال'}</p>
                                    )}
                                </div>

                                <div className="payment-summary">
                                    <div className="summary-row">
                                        <span>الباقة</span>
                                        <span className="summary-value">{selected.name_ar} ({selected.period === 'شهر' ? 'شهر' : 'سنة'})</span>
                                    </div>
                                    {isUpgrade ? (
                                        <>
                                            <div className="summary-row">
                                                <span>سعر الباقة الجديدة</span>
                                                <span className="summary-value">{selected.price} ج.م</span>
                                            </div>
                                            <div className="summary-row discount">
                                                <span>باقتك الحالية ({planLabel(currentPlanId)})</span>
                                                <span className="summary-value discount-value">- {currentPrice} ج.م</span>
                                            </div>
                                        </>
                                    ) : (
                                        <div className="summary-row">
                                            <span>السعر</span>
                                            <span className="summary-value">{selected.price} ج.م</span>
                                        </div>
                                    )}
                                    {promoResult?.valid && promoResult.discount_amount ? (
                                        <div className="summary-row discount">
                                            <span>الخصم ({promoCode})</span>
                                            <span className="summary-value discount-value">- {promoResult.discount_amount} ج.م</span>
                                        </div>
                                    ) : null}
                                    <div className="summary-row total">
                                        <span>هتدفع</span>
                                        <span className="summary-value">{total} ج.م</span>
                                    </div>
                                </div>
                            </>
                        )}
                    </>
                )}

                {!everythingOpen && (
                    <button className="payment-btn" onClick={handlePayment} disabled={isLoading || subLoading || plansLoading || !selected}>
                        {isLoading ? (
                            <div className="payment-btn-loading">
                                <div className="auth-loader" />
                                <span>بنحوّلك لصفحة الدفع…</span>
                            </div>
                        ) : (
                            <>
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <rect x="1" y="4" width="22" height="16" rx="2" ry="2"></rect>
                                    <line x1="1" y1="10" x2="23" y2="10"></line>
                                </svg>
                                {selected ? `ادفع ${total} ج.م` : 'اختار باقة الأول'}
                            </>
                        )}
                    </button>
                )}

                {!everythingOpen && <div className="payment-secure">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
                        <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
                    </svg>
                    <span>
                        بتدفع {PAYMENT_METHODS_TEXT}، من صفحة كاشير الآمنة.
                        {selected && <> ولو الكورس معجبكش، فلوسك بترجعلك كاملة خلال {refundDaysLabel(refundDaysFor(selected.id))} من الدفع.</>}
                    </span>
                </div>}

                <div className="whatsapp-support">
                    <p className="whatsapp-support-text">محتاج مساعدة في الدفع؟ خدمة العملاء على واتساب: <span dir="ltr">{SUPPORT_WHATSAPP_DISPLAY}</span></p>
                    <a
                        href={supportWhatsAppUrl(`السلام عليكم، محتاج مساعدة في الاشتراك في PromptMaster${selected ? ` (${selected.name_ar})` : ''}`)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="whatsapp-support-btn"
                        onClick={() => {
                            import('@/lib/analytics').then(({ trackEvent }) => {
                                trackEvent('whatsapp_support_clicked', { page: 'payment', selectedPlan })
                            })
                        }}
                    >
                        💬 كلّمنا على واتساب
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
