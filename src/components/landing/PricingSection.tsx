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
            <section className="landing-section landing-section-dark">
                <div className="container">
                    <div className="loading">جاري التحميل...</div>
                </div>
            </section>
        )
    }

    return (
        <section id="pricing" className="landing-section landing-section-dark">
            <div className="landing-glow" style={{ top: '20%', left: '10%' }} />
            <div className="container">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.6 }}
                    className="section-header"
                >
                    <span className="section-badge">💰 باقات الاشتراك</span>
                    <h2 className="section-title">استثمر في مستقبلك</h2>
                    <p className="section-subtitle">
                        اختر الخطة التي تناسب احتياجاتك وابدأ رحلة الاحتراف اليوم
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
                                transition={{ delay: index * 0.1 }}
                                className={`pricing-card glass-card ${plan.is_popular ? 'popular' : ''}`}
                            >
                                {plan.is_popular && (
                                    <div className="popular-badge">الأكثر شيوعاً ✨</div>
                                )}

                                <div className="plan-header">
                                    <h3 className="plan-name">{plan.name}</h3>
                                    <div className="plan-price">
                                        <span className="amount">{discountedPrice}</span>
                                        <span className="currency">ج.م</span>
                                        {promo && (
                                            <span className="original-price">{plan.price} ج.م</span>
                                        )}
                                    </div>
                                    <p className="plan-desc">{plan.description}</p>
                                </div>

                                <ul className="plan-features">
                                    {plan.features.map((feature, fIndex) => (
                                        <li key={fIndex}>
                                            <span className="check-icon">✓</span>
                                            {feature}
                                        </li>
                                    ))}
                                </ul>

                                <Link
                                    href={plan.cta_link || '/register'}
                                    className={`cta-button ${plan.is_popular ? 'primary' : 'secondary'}`}
                                >
                                    {plan.cta_text || 'ابدأ رحلتي الآن'}
                                </Link>
                            </motion.div>
                        )
                    })}
                </div>

                {/* Guarantee */}
                <motion.div
                    initial={{ opacity: 0 }}
                    whileInView={{ opacity: 1 }}
                    viewport={{ once: true }}
                    transition={{ delay: 0.5 }}
                    className="guarantee-box glass-card"
                >
                    <div className="guarantee-icon">🛡️</div>
                    <div className="guarantee-text">
                        <h4>ضمان استرداد الأموال لمدة 30 يوماً</h4>
                        <p>إذا لم تكن راضياً عن المحتوى، سنعيد لك مبلغك كاملاً بدون أسئلة.</p>
                    </div>
                </motion.div>
            </div>

            <style jsx>{`
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
                    background: linear-gradient(135deg, #fff 0%, #FF6B35 100%);
                    -webkit-background-clip: text;
                    -webkit-text-fill-color: transparent;
                    background-clip: text;
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
                    gap: 40px;
                    align-items: stretch;
                    margin-bottom: 60px;
                }

                .pricing-card {
                    padding: 60px 40px 50px;
                    display: flex;
                    flex-direction: column;
                }

                .pricing-card.popular {
                    border-color: var(--color-orange-primary);
                    background: rgba(255, 107, 53, 0.05);
                    transform: scale(1.05);
                    z-index: 10;
                }
                
                .pricing-card.popular:hover {
                    transform: scale(1.08) translateY(-5px);
                }

                .popular-badge {
                    position: absolute;
                    top: 20px;
                    right: 20px;
                    background: var(--color-orange-primary);
                    color: white;
                    padding: 6px 15px;
                    border-radius: 20px;
                    font-size: 0.8rem;
                    font-weight: 700;
                }

                .plan-header {
                    text-align: center;
                    margin-bottom: 30px;
                    padding-bottom: 25px;
                    border-bottom: 1px solid rgba(255, 255, 255, 0.1);
                }

                .plan-name {
                    font-size: 1.3rem;
                    font-weight: 700;
                    color: white;
                    margin-bottom: 15px;
                }

                .plan-price {
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    gap: 5px;
                    margin-bottom: 15px;
                }

                .currency {
                    font-size: 1.2rem;
                    color: var(--color-orange-primary);
                    font-weight: 700;
                }

                .amount {
                    font-size: 3.5rem;
                    font-weight: 800;
                    color: white;
                }

                .original-price {
                    font-size: 1.1rem;
                    color: rgba(255, 255, 255, 0.3);
                    text-decoration: line-through;
                    margin-left: 10px;
                }

                .plan-desc {
                    font-size: 0.95rem;
                    color: rgba(255, 255, 255, 0.6);
                    line-height: 1.6;
                }

                .plan-features {
                    list-style: none;
                    padding: 0;
                    margin: 0 0 40px 0;
                    flex-grow: 1;
                }

                .plan-features li {
                    display: flex;
                    align-items: center;
                    gap: 12px;
                    color: rgba(255, 255, 255, 0.8);
                    font-size: 0.95rem;
                    margin-bottom: 15px;
                    text-align: right;
                }

                .check-icon {
                    color: #4CAF50;
                    font-weight: bold;
                }

                .cta-button {
                    display: block;
                    width: 100%;
                    padding: 16px;
                    border-radius: 14px;
                    text-align: center;
                    font-weight: 700;
                    text-decoration: none;
                    transition: all 0.3s;
                }

                .cta-button.primary {
                    background: var(--color-orange-primary);
                    color: white;
                    box-shadow: 0 10px 20px rgba(255, 107, 53, 0.3);
                }

                .cta-button.primary:hover {
                    background: var(--color-orange-glow);
                    transform: translateY(-2px);
                    box-shadow: 0 15px 25px rgba(255, 107, 53, 0.4);
                }

                .cta-button.secondary {
                    background: rgba(255, 255, 255, 0.05);
                    color: white;
                    border: 1px solid rgba(255, 255, 255, 0.1);
                }

                .cta-button.secondary:hover {
                    background: rgba(255, 255, 255, 0.1);
                    border-color: var(--color-orange-primary);
                }

                .guarantee-box {
                    max-width: 600px;
                    margin: 0 auto;
                    padding: 25px;
                    display: flex;
                    align-items: center;
                    gap: 20px;
                    background: rgba(76, 175, 80, 0.03);
                    border-color: rgba(76, 175, 80, 0.1);
                }
                
                .guarantee-box:hover {
                    border-color: rgba(76, 175, 80, 0.3);
                }

                .guarantee-box::after {
                    background: linear-gradient(90deg, #4CAF50, #81C784);
                }

                .guarantee-icon {
                    font-size: 2.5rem;
                }

                .guarantee-text h4 {
                    font-size: 1.1rem;
                    color: #81C784;
                    margin-bottom: 5px;
                }

                .guarantee-text p {
                    font-size: 0.9rem;
                    color: rgba(255, 255, 255, 0.6);
                }

                .loading {
                    text-align: center;
                    color: rgba(255, 255, 255, 0.6);
                    padding: 60px;
                }

                @media (max-width: 992px) {
                    .pricing-grid {
                        grid-template-columns: 1fr;
                        max-width: 450px;
                        margin-left: auto;
                        margin-right: auto;
                        gap: 40px;
                    }
                    
                    .pricing-card.popular {
                        transform: scale(1);
                    }
                }

                @media (max-width: 576px) {
                    .section-title {
                        font-size: 1.8rem;
                    }
                }
            `}</style>
        </section>
    )
}
