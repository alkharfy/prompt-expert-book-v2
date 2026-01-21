'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import Link from 'next/link'
import { getPricingPlans, getPromoSettings, calculateDiscountedPrice, isPromoValid, PricingPlan, PromoSettings } from '@/lib/promo'

export default function PricingSection() {
    const [plans, setPlans] = useState<PricingPlan[]>([])
    const [promo, setPromo] = useState<PromoSettings | null>(null)
    const [isLoading, setIsLoading] = useState(true)

    useEffect(() => {
        async function loadData() {
            const [plansData, promoData] = await Promise.all([
                getPricingPlans(),
                getPromoSettings()
            ])
            setPlans(plansData)
            if (promoData.is_active && isPromoValid(promoData.end_date)) {
                setPromo(promoData)
            }
            setIsLoading(false)
        }
        loadData()
    }, [])

    if (isLoading) {
        return (
            <section className="pricing-section">
                <div className="container">
                    <div className="loading">جاري التحميل...</div>
                </div>
            </section>
        )
    }

    return (
        <section className="pricing-section" id="pricing">
            <div className="container">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.6 }}
                    className="section-header"
                >
                    <span className="section-badge">💰 الأسعار</span>
                    <h2 className="section-title">اختر الخطة المناسبة لك</h2>
                    <p className="section-subtitle">
                        استثمار بسيط لمهارة تدوم مدى الحياة
                    </p>
                    {promo && (
                        <div className="promo-badge">
                            🔥 خصم {promo.discount_percentage}% لفترة محدودة!
                        </div>
                    )}
                </motion.div>

                <div className="pricing-grid">
                    {plans.map((plan, index) => {
                        const discountedPrice = promo 
                            ? calculateDiscountedPrice(plan.price, promo.discount_percentage)
                            : plan.price

                        return (
                            <motion.div
                                key={plan.id}
                                initial={{ opacity: 0, y: 30 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                transition={{ delay: index * 0.15 }}
                                className={`pricing-card ${plan.is_popular ? 'popular' : ''}`}
                            >
                                {plan.is_popular && (
                                    <div className="popular-badge">⭐ الأكثر شيوعاً</div>
                                )}

                                <div className="plan-header">
                                    <h3 className="plan-name">{plan.name}</h3>
                                    <div className="plan-price">
                                        {promo && (
                                            <span className="original-price">{plan.price} ج.م</span>
                                        )}
                                        <span className="current-price">
                                            <span className="price-value">{discountedPrice}</span>
                                            <span className="price-currency">ج.م</span>
                                        </span>
                                        <span className="price-duration">/ {plan.duration}</span>
                                    </div>
                                </div>

                                <ul className="plan-features">
                                    {plan.features.map((feature, i) => (
                                        <li key={i}>
                                            <span className="feature-check">✓</span>
                                            {feature}
                                        </li>
                                    ))}
                                </ul>

                                <Link 
                                    href="/register" 
                                    className={`plan-cta ${plan.is_popular ? 'cta-primary' : 'cta-secondary'}`}
                                >
                                    ابدأ رحلتي الآن
                                </Link>

                                {promo && (
                                    <p className="savings-text">
                                        وفّر {plan.price - discountedPrice} ج.م
                                    </p>
                                )}
                            </motion.div>
                        )
                    })}
                </div>

                <motion.div
                    initial={{ opacity: 0 }}
                    whileInView={{ opacity: 1 }}
                    viewport={{ once: true }}
                    transition={{ delay: 0.5 }}
                    className="guarantee-section"
                >
                    <div className="guarantee-icon">🛡️</div>
                    <div className="guarantee-content">
                        <h4>ضمان استرداد الأموال 30 يوم</h4>
                        <p>جرّب المحتوى بدون مخاطرة. إذا لم تكن راضياً، استرد أموالك كاملة.</p>
                    </div>
                </motion.div>
            </div>

            <style jsx>{`
                .pricing-section {
                    padding: 100px 0;
                    background: linear-gradient(180deg, rgba(15, 15, 35, 1) 0%, rgba(26, 26, 46, 0.95) 100%);
                    position: relative;
                }

                .container {
                    max-width: 1100px;
                    margin: 0 auto;
                    padding: 0 20px;
                }

                .section-header {
                    text-align: center;
                    margin-bottom: 60px;
                }

                .section-badge {
                    display: inline-block;
                    background: rgba(255, 107, 53, 0.15);
                    color: #FF6B35;
                    padding: 8px 20px;
                    border-radius: 30px;
                    font-size: 0.9rem;
                    font-weight: 600;
                    margin-bottom: 20px;
                    border: 1px solid rgba(255, 107, 53, 0.3);
                }

                .section-title {
                    font-size: 2.5rem;
                    font-weight: 800;
                    color: white;
                    margin-bottom: 15px;
                }

                .section-subtitle {
                    font-size: 1.1rem;
                    color: rgba(255, 255, 255, 0.7);
                }

                .promo-badge {
                    display: inline-block;
                    background: linear-gradient(135deg, #FF6B35, #FF8C42);
                    color: white;
                    padding: 10px 25px;
                    border-radius: 30px;
                    font-weight: 700;
                    margin-top: 20px;
                    animation: pulse 2s infinite;
                }

                @keyframes pulse {
                    0%, 100% { transform: scale(1); }
                    50% { transform: scale(1.05); }
                }

                .pricing-grid {
                    display: grid;
                    grid-template-columns: repeat(3, 1fr);
                    gap: 30px;
                    align-items: stretch;
                }

                .pricing-card {
                    background: linear-gradient(145deg, rgba(255, 255, 255, 0.05) 0%, rgba(255, 255, 255, 0.02) 100%);
                    border: 1px solid rgba(255, 255, 255, 0.1);
                    border-radius: 24px;
                    padding: 40px 30px;
                    display: flex;
                    flex-direction: column;
                    position: relative;
                    transition: all 0.3s ease;
                }

                .pricing-card:hover {
                    transform: translateY(-5px);
                }

                .pricing-card.popular {
                    border-color: #FF6B35;
                    background: linear-gradient(145deg, rgba(255, 107, 53, 0.1) 0%, rgba(255, 107, 53, 0.02) 100%);
                    transform: scale(1.05);
                    z-index: 1;
                }

                .pricing-card.popular:hover {
                    transform: scale(1.05) translateY(-5px);
                }

                .popular-badge {
                    position: absolute;
                    top: -12px;
                    left: 50%;
                    transform: translateX(-50%);
                    background: linear-gradient(135deg, #FF6B35, #FF8C42);
                    color: white;
                    padding: 6px 20px;
                    border-radius: 20px;
                    font-size: 0.85rem;
                    font-weight: 700;
                    white-space: nowrap;
                }

                .plan-header {
                    text-align: center;
                    margin-bottom: 30px;
                    padding-bottom: 25px;
                    border-bottom: 1px solid rgba(255, 255, 255, 0.1);
                }

                .plan-name {
                    font-size: 1.5rem;
                    font-weight: 700;
                    color: white;
                    margin-bottom: 15px;
                }

                .plan-price {
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    gap: 5px;
                }

                .original-price {
                    font-size: 1.1rem;
                    color: rgba(255, 255, 255, 0.4);
                    text-decoration: line-through;
                }

                .current-price {
                    display: flex;
                    align-items: baseline;
                    gap: 5px;
                }

                .price-value {
                    font-size: 3rem;
                    font-weight: 800;
                    color: #FF6B35;
                    line-height: 1;
                }

                .price-currency {
                    font-size: 1.2rem;
                    color: rgba(255, 255, 255, 0.7);
                    font-weight: 600;
                }

                .price-duration {
                    font-size: 0.9rem;
                    color: rgba(255, 255, 255, 0.5);
                }

                .plan-features {
                    list-style: none;
                    padding: 0;
                    margin: 0 0 30px 0;
                    flex: 1;
                }

                .plan-features li {
                    display: flex;
                    align-items: flex-start;
                    gap: 10px;
                    padding: 10px 0;
                    color: rgba(255, 255, 255, 0.8);
                    font-size: 0.95rem;
                    border-bottom: 1px solid rgba(255, 255, 255, 0.05);
                }

                .plan-features li:last-child {
                    border-bottom: none;
                }

                .feature-check {
                    color: #4CAF50;
                    font-weight: bold;
                    flex-shrink: 0;
                }

                .plan-cta {
                    display: block;
                    text-align: center;
                    padding: 16px 30px;
                    border-radius: 12px;
                    font-weight: 700;
                    font-size: 1.1rem;
                    text-decoration: none;
                    transition: all 0.3s ease;
                }

                .cta-primary {
                    background: linear-gradient(135deg, #FF6B35, #FF8C42);
                    color: white;
                    box-shadow: 0 10px 30px rgba(255, 107, 53, 0.3);
                }

                .cta-primary:hover {
                    transform: translateY(-2px);
                    box-shadow: 0 15px 40px rgba(255, 107, 53, 0.4);
                }

                .cta-secondary {
                    background: rgba(255, 255, 255, 0.1);
                    color: white;
                    border: 1px solid rgba(255, 255, 255, 0.2);
                }

                .cta-secondary:hover {
                    background: rgba(255, 255, 255, 0.15);
                    border-color: rgba(255, 107, 53, 0.5);
                }

                .savings-text {
                    text-align: center;
                    margin-top: 15px;
                    font-size: 0.85rem;
                    color: #4CAF50;
                    font-weight: 600;
                }

                .guarantee-section {
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    gap: 20px;
                    margin-top: 60px;
                    padding: 30px;
                    background: rgba(76, 175, 80, 0.1);
                    border: 1px solid rgba(76, 175, 80, 0.3);
                    border-radius: 16px;
                }

                .guarantee-icon {
                    font-size: 3rem;
                }

                .guarantee-content h4 {
                    color: white;
                    font-size: 1.2rem;
                    margin-bottom: 5px;
                }

                .guarantee-content p {
                    color: rgba(255, 255, 255, 0.7);
                    font-size: 0.95rem;
                }

                .loading {
                    text-align: center;
                    color: rgba(255, 255, 255, 0.6);
                    padding: 60px;
                }

                @media (max-width: 992px) {
                    .pricing-grid {
                        grid-template-columns: 1fr;
                        max-width: 400px;
                        margin: 0 auto;
                    }

                    .pricing-card.popular {
                        transform: none;
                        order: -1;
                    }

                    .pricing-card.popular:hover {
                        transform: translateY(-5px);
                    }
                }

                @media (max-width: 576px) {
                    .pricing-section {
                        padding: 60px 0;
                    }

                    .section-title {
                        font-size: 1.8rem;
                    }

                    .pricing-card {
                        padding: 30px 20px;
                    }

                    .price-value {
                        font-size: 2.5rem;
                    }

                    .guarantee-section {
                        flex-direction: column;
                        text-align: center;
                    }
                }
            `}</style>
        </section>
    )
}
