'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Navigation from '@/components/Navigation'
import { fetchPricingPlans } from '@/lib/pricing'
import { useSubscription } from '@/context/SubscriptionContext'
import '@/app/auth.css'

interface PaymentRecord {
    id: string
    plan_id: string
    amount: number
    status: string
    created_at: string
    order_id?: string
}

const PLAN_NAMES: Record<string, string> = {
    basic: 'الأساسية — Basic',
    pro: 'الاحترافية — Pro',
    vip: 'المميزة — VIP',
}


export default function SubscriptionPage() {
    const router = useRouter()
    const { currentPlan, expiresAt, status, features, isLoading: subLoading } = useSubscription()
    const [planPrices, setPlanPrices] = useState<Record<string, number>>({})
    useEffect(() => {
        fetchPricingPlans().then(plans => setPlanPrices(Object.fromEntries(plans.map(p => [p.id, p.price])))).catch(() => {})
    }, [])
    const [payments, setPayments] = useState<PaymentRecord[]>([])
    const [paymentsLoading, setPaymentsLoading] = useState(true)

    useEffect(() => {
        async function loadPayments() {
            try {
                const res = await fetch('/api/payments/history')
                if (res.ok) {
                    const data = await res.json()
                    setPayments(data.payments || [])
                }
            } catch { /* silent */ }
            finally { setPaymentsLoading(false) }
        }
        loadPayments()
    }, [])

    const planName = currentPlan ? (PLAN_NAMES[currentPlan] || currentPlan) : 'بدون اشتراك'
    const planPrice = currentPlan ? (planPrices[currentPlan] || 0) : 0
    const expiresDate = expiresAt ? new Date(expiresAt).toLocaleDateString('ar-EG', {
        year: 'numeric', month: 'long', day: 'numeric'
    }) : '—'

    const statusText = status === 'active' ? 'نشط ✅'
        : status === 'expired' ? 'منتهي ❌'
        : status === 'cancelled' ? 'ملغي'
        : 'بدون اشتراك'

    return (
        <>
            <Navigation />
            <main className="auth-page" style={{ minHeight: '100vh', paddingTop: 'calc(var(--header-h, 80px) + 30px)' }}>
                <div className="subscription-container">
                    <div className="subscription-header">
                        <Link href="/profile" className="back-link">
                            ← رجوع للملف الشخصي
                        </Link>
                        <h1 className="subscription-title">الاشتراك والدفع</h1>
                    </div>

                    {/* Current Plan Card */}
                    <div className="plan-card glass-card">
                        {subLoading ? (
                            <div className="loading-text">جاري التحميل...</div>
                        ) : (
                            <>
                                <div className="plan-info-grid">
                                    <div className="plan-info-item">
                                        <span className="plan-info-icon">📦</span>
                                        <div>
                                            <span className="plan-info-label">الخطة</span>
                                            <span className="plan-info-value">{planName}</span>
                                        </div>
                                    </div>
                                    <div className="plan-info-item">
                                        <span className="plan-info-icon">💳</span>
                                        <div>
                                            <span className="plan-info-label">السعر</span>
                                            <span className="plan-info-value">{planPrice > 0 ? `${planPrice || '—'} ج.م / سنة` : '—'}</span>
                                        </div>
                                    </div>
                                    <div className="plan-info-item">
                                        <span className="plan-info-icon">📅</span>
                                        <div>
                                            <span className="plan-info-label">التجديد</span>
                                            <span className="plan-info-value">{expiresDate}</span>
                                        </div>
                                    </div>
                                    <div className="plan-info-item">
                                        <span className="plan-info-icon">🔄</span>
                                        <div>
                                            <span className="plan-info-label">الحالة</span>
                                            <span className="plan-info-value">{statusText}</span>
                                        </div>
                                    </div>
                                </div>

                                {/* Features list */}
                                {features.length > 0 && (
                                    <div className="plan-features">
                                        <h3 className="features-title">الميزات المتاحة</h3>
                                        <div className="features-chips">
                                            {features.map((f) => (
                                                <span key={f} className="feature-chip">✓ {f}</span>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* Actions */}
                                <div className="plan-actions">
                                    {!currentPlan || status === 'expired' ? (
                                        <Link href="/payment" className="action-btn primary">
                                            اشترك الآن
                                        </Link>
                                    ) : currentPlan !== 'vip' ? (
                                        <Link href={`/payment?upgrade=true&currentPlan=${currentPlan}`} className="action-btn primary">
                                            ترقية الخطة
                                        </Link>
                                    ) : null}
                                    <Link href="/profile" className="action-btn secondary">
                                        رجوع للملف الشخصي
                                    </Link>
                                </div>
                            </>
                        )}
                    </div>

                    {/* Payment History */}
                    <div className="history-section">
                        <h2 className="history-title">سجل المدفوعات</h2>
                        {paymentsLoading ? (
                            <div className="loading-text">جاري التحميل...</div>
                        ) : payments.length === 0 ? (
                            <p className="no-payments">لا يوجد مدفوعات سابقة</p>
                        ) : (
                            <div className="payments-list">
                                {payments.map((p) => (
                                    <div key={p.id} className="payment-row glass-card">
                                        <div className="payment-date">
                                            {new Date(p.created_at).toLocaleDateString('ar-EG', {
                                                year: 'numeric', month: 'short', day: 'numeric'
                                            })}
                                        </div>
                                        <div className="payment-plan">
                                            {PLAN_NAMES[p.plan_id] || p.plan_id}
                                        </div>
                                        <div className="payment-amount">
                                            {p.amount} ج.م
                                        </div>
                                        <div className={`payment-status ${p.status}`}>
                                            {p.status === 'completed' ? '✅' : p.status === 'pending' ? '⏳' : '❌'}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </main>

            <style jsx>{`
                .subscription-container {
                    max-width: 700px;
                    margin: 0 auto;
                    padding: 0 20px 60px;
                }

                .subscription-header {
                    margin-bottom: 30px;
                }

                .back-link {
                    color: rgba(255, 255, 255, 0.5);
                    text-decoration: none;
                    font-size: 0.9rem;
                    display: inline-block;
                    margin-bottom: 15px;
                    transition: color 0.2s;
                }

                .back-link:hover {
                    color: #FF6B35;
                }

                .subscription-title {
                    font-size: 1.8rem;
                    font-weight: 800;
                    color: white;
                    background: linear-gradient(135deg, #fff 0%, #FF6B35 100%);
                    -webkit-background-clip: text;
                    -webkit-text-fill-color: transparent;
                    background-clip: text;
                }

                .plan-card {
                    padding: 35px 30px;
                    margin-bottom: 35px;
                }

                .loading-text {
                    color: rgba(255, 255, 255, 0.5);
                    text-align: center;
                    padding: 20px;
                }

                .plan-info-grid {
                    display: grid;
                    grid-template-columns: 1fr 1fr;
                    gap: 22px;
                    margin-bottom: 25px;
                }

                .plan-info-item {
                    display: flex;
                    align-items: center;
                    gap: 12px;
                }

                .plan-info-icon {
                    font-size: 1.5rem;
                    flex-shrink: 0;
                }

                .plan-info-item div {
                    display: flex;
                    flex-direction: column;
                }

                .plan-info-label {
                    font-size: 0.8rem;
                    color: rgba(255, 255, 255, 0.45);
                    margin-bottom: 2px;
                }

                .plan-info-value {
                    font-size: 1rem;
                    color: white;
                    font-weight: 600;
                }

                .plan-features {
                    padding-top: 20px;
                    border-top: 1px solid rgba(255, 255, 255, 0.08);
                    margin-bottom: 25px;
                }

                .features-title {
                    font-size: 0.9rem;
                    color: rgba(255, 255, 255, 0.55);
                    margin-bottom: 12px;
                    font-weight: 600;
                }

                .features-chips {
                    display: flex;
                    flex-wrap: wrap;
                    gap: 8px;
                }

                .feature-chip {
                    background: rgba(255, 107, 53, 0.08);
                    color: rgba(255, 255, 255, 0.7);
                    padding: 5px 12px;
                    border-radius: 20px;
                    font-size: 0.8rem;
                    border: 1px solid rgba(255, 107, 53, 0.12);
                }

                .plan-actions {
                    display: flex;
                    gap: 12px;
                    flex-wrap: wrap;
                }

                .action-btn {
                    padding: 12px 24px;
                    border-radius: 12px;
                    font-size: 0.95rem;
                    font-weight: 700;
                    text-decoration: none;
                    text-align: center;
                    transition: all 0.3s ease;
                    min-height: 44px;
                    display: inline-flex;
                    align-items: center;
                    justify-content: center;
                }

                .action-btn.primary {
                    background: linear-gradient(135deg, #FF6B35, #FF8C42);
                    color: white;
                    flex: 1;
                }

                .action-btn.primary:hover {
                    transform: translateY(-1px);
                    box-shadow: 0 4px 15px rgba(255, 107, 53, 0.3);
                }

                .action-btn.secondary {
                    background: rgba(255, 255, 255, 0.06);
                    color: rgba(255, 255, 255, 0.7);
                    border: 1px solid rgba(255, 255, 255, 0.1);
                }

                .action-btn.secondary:hover {
                    background: rgba(255, 255, 255, 0.1);
                }

                .history-section {
                    margin-top: 10px;
                }

                .history-title {
                    font-size: 1.2rem;
                    font-weight: 700;
                    color: white;
                    margin-bottom: 20px;
                }

                .no-payments {
                    color: rgba(255, 255, 255, 0.4);
                    text-align: center;
                    padding: 30px;
                }

                .payments-list {
                    display: flex;
                    flex-direction: column;
                    gap: 10px;
                }

                .payment-row {
                    display: grid;
                    grid-template-columns: 1fr 1fr auto auto;
                    align-items: center;
                    gap: 15px;
                    padding: 16px 20px;
                }

                .payment-date {
                    font-size: 0.85rem;
                    color: rgba(255, 255, 255, 0.55);
                }

                .payment-plan {
                    font-size: 0.9rem;
                    color: rgba(255, 255, 255, 0.8);
                    font-weight: 600;
                }

                .payment-amount {
                    font-size: 0.95rem;
                    color: #FF6B35;
                    font-weight: 700;
                }

                .payment-status {
                    font-size: 1rem;
                }

                @media (max-width: 576px) {
                    .subscription-title {
                        font-size: 1.4rem;
                    }

                    .plan-info-grid {
                        grid-template-columns: 1fr;
                        gap: 16px;
                    }

                    .plan-card {
                        padding: 25px 18px;
                    }

                    .payment-row {
                        grid-template-columns: 1fr 1fr;
                        gap: 10px;
                        padding: 14px 16px;
                    }

                    .plan-actions {
                        flex-direction: column;
                    }
                }
            `}</style>
        </>
    )
}
