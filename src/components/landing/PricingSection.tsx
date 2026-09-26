'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import Link from 'next/link'
import { getPricingPlans, PricingPlan } from '@/lib/promo'
import { trackCtaClick } from '@/lib/analytics'

const PLAN_ICONS: Record<string, string> = { basic: '📖', pro: '🚀', vip: '👑' }
const PLAN_COLORS: Record<string, [string, string]> = {
    basic: ['#3B82F6', '#60A5FA'],
    pro: ['#FF6B35', '#FF8C42'],
    vip: ['#A855F7', '#C084FC'],
}

export default function PricingSection() {
    const [plans, setPlans] = useState<PricingPlan[]>([])
    const [loadError, setLoadError] = useState('')
    const [isLoading, setIsLoading] = useState(true)

    useEffect(() => {
        let cancelled = false
        getPricingPlans().then(data => {
            if (!cancelled) setPlans(data)
        }).catch(() => {
            if (!cancelled) setLoadError('تعذّر تحميل الأسعار الحالية. أعد تحميل الصفحة أو تواصل معنا قبل الدفع.')
        }).finally(() => { if (!cancelled) setIsLoading(false) })
        return () => { cancelled = true }
    }, [])

    if (loadError) return <section id="pricing" className="landing-section"><div className="container"><p role="alert">{loadError}</p><Link href="/contact">تواصل معنا</Link></div></section>

    if (isLoading) {
        return (
            <section id="pricing" className="landing-section landing-section-dark">
                <div className="container">
                    <div className="pr-loading">جاري التحميل...</div>
                </div>
            </section>
        )
    }

    // === NORMAL MODE: 3-plan grid ===
    return (
        <section id="pricing" className="landing-section pr-section">
            <div className="pr-bg-dots" />
            <div className="container">
                {/* Header */}
                <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.6 }} className="pr-header">
                    <span className="pr-badge">💰 باقات الاشتراك</span>
                    <h2 className="pr-title">ابدأ بالكتاب والتمارين</h2>
                    <p className="pr-subtitle">الأساسية تشمل القراءة والتمارين والقوالب. قارن المميزات ثم اختر ما تحتاجه.</p>
                </motion.div>

                {/* Trust bar — only verifiable claims; no inflated user counts */}
                <motion.div initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }} transition={{ delay: 0.2 }} className="pr-social-bar">
                    <span>🛡️ ضمان استرداد 30 يوم</span>
                    <span className="pr-social-sep" />
                    <span>📱 بطاقات بنكية ومحافظ إلكترونية</span>
                    <span className="pr-social-sep" />
                    <span>⏳ وصول لمدة سنة كاملة</span>
                </motion.div>

                {/* Plans grid */}
                <div className="pr-grid">
                    {plans.map((plan, index) => {
                        const colors = PLAN_COLORS[plan.id] || PLAN_COLORS.basic
                        const icon = PLAN_ICONS[plan.id] || '📖'

                        return (
                            <motion.div
                                key={plan.id}
                                initial={{ opacity: 0, y: 40 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                transition={{ delay: index * 0.12, duration: 0.6, ease: [0.25, 0.46, 0.45, 0.94] }}
                                className={`pr-card ${plan.is_popular ? 'pr-card-popular' : ''}`}
                            >
                                {/* Rotating border */}
                                <div className="pr-card-border" style={{ background: `conic-gradient(from var(--border-angle,0deg), transparent 0%, ${colors[0]} 20%, ${colors[1]} 40%, transparent 50%)` }} />

                                {/* Popular badge */}
                                {plan.is_popular && (
                                    <div className="pr-popular-badge">
                                        <span>✨</span> مناسبة للبدء
                                    </div>
                                )}

                                <div className="pr-card-body">
                                    {/* Glow */}
                                    {plan.is_popular && <div className="pr-card-glow" />}

                                    {/* Plan icon */}
                                    <div className="pr-plan-icon" style={{ background: `linear-gradient(135deg, ${colors[0]}20, ${colors[1]}10)`, borderColor: `${colors[0]}30` }}>
                                        <span>{icon}</span>
                                    </div>

                                    {/* Plan name */}
                                    <h3 className="pr-plan-name">{plan.name}</h3>
                                    <span className="pr-plan-duration">اشتراك سنوي</span>

                                    {/* Price — single honest sticker price */}
                                    <div className="pr-price">
                                        <span className="pr-price-amount" style={{ color: plan.is_popular ? colors[0] : 'white' }}>{plan.price}</span>
                                        <div className="pr-price-suffix">
                                            <span className="pr-price-currency" style={{ color: colors[0] }}>ج.م</span>
                                            <span className="pr-price-period">/ سنة</span>
                                        </div>
                                    </div>

                                    {/* Description */}
                                    <p className="pr-plan-desc">{plan.description}</p>

                                    {/* Divider */}
                                    <div className="pr-divider" style={{ background: `linear-gradient(90deg, transparent, ${colors[0]}40, transparent)` }} />

                                    {/* Features */}
                                    <ul className="pr-features">
                                        {plan.features.map((feature, fIdx) => (
                                            <li key={fIdx}>
                                                <span className="pr-check" style={{ color: colors[0] }}>✓</span>
                                                <span>{feature}</span>
                                            </li>
                                        ))}
                                    </ul>

                                    {/* CTA */}
                                    <Link
                                        href={plan.cta_link || `/payment?plan=${plan.id}`}
                                        className={`pr-cta ${plan.is_popular ? 'pr-cta-primary' : 'pr-cta-secondary'}`}
                                        style={plan.is_popular ? { background: `linear-gradient(135deg, ${colors[0]}, ${colors[1]})` } : { borderColor: `${colors[0]}40` }}
                                        onClick={() => trackCtaClick(plan.cta_text || 'ابدأ رحلتي الآن', 'pricing_section')}
                                    >
                                        {plan.cta_text || 'ابدأ رحلتي الآن'}
                                    </Link>
                                </div>
                            </motion.div>
                        )
                    })}
                </div>

                {/* Guarantee */}
                <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: 0.4 }} className="pr-guarantee">
                    <div className="pr-guarantee-border" />
                    <div className="pr-guarantee-inner">
                        <div className="pr-guarantee-icon">🛡️</div>
                        <div className="pr-guarantee-content">
                            <Link href="/refund-policy">
                                <h4>ضمان استرداد الأموال لمدة 30 يوماً</h4>
                                <p>إذا لم تكن راضياً عن المحتوى، سنعيد لك مبلغك كاملاً بدون أسئلة.</p>
                            </Link>
                        </div>
                        <div className="pr-guarantee-stamps">
                            <span>💳</span><span>🔒</span><span>✅</span>
                        </div>
                    </div>
                </motion.div>
            </div>

            <style jsx global>{`
                .pr-section { padding: 100px 0; position: relative; overflow: hidden; }
                .pr-bg-dots { position: absolute; inset: 0; background-image: radial-gradient(rgba(255,107,53,0.06) 1px, transparent 1px); background-size: 28px 28px; pointer-events: none; }
                .pr-header { text-align: center; margin-bottom: 32px; }
                .pr-badge { display: inline-block; background: rgba(255,107,53,0.12); color: #FF6B35; padding: 8px 22px; border-radius: 30px; font-size: 0.9rem; font-weight: 600; margin-bottom: 20px; border: 1px solid rgba(255,107,53,0.25); }
                .pr-title { font-size: 2.4rem; font-weight: 800; background: linear-gradient(135deg, #fff 20%, #FF6B35); -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text; margin-bottom: 14px; }
                .pr-subtitle { font-size: 1.05rem; color: rgba(255,255,255,0.55); }
                .pr-loading { text-align: center; color: rgba(255,255,255,0.5); padding: 60px; }

                /* Promo banner */
                .pr-promo-banner { text-align: center; padding: 14px 24px; background: rgba(255,107,53,0.08); border: 1px solid rgba(255,107,53,0.2); border-radius: 16px; color: #FF8C42; font-size: 1rem; font-weight: 600; margin: 0 auto 16px; max-width: 560px; animation: prPulse 3s ease-in-out infinite; }
                .pr-promo-banner-fire { margin-left: 6px; }
                @keyframes prPulse { 0%,100% { box-shadow: 0 0 0 0 rgba(255,107,53,0.2); } 50% { box-shadow: 0 0 24px 4px rgba(255,107,53,0.1); } }

                /* Social bar */
                .pr-social-bar { display: flex; align-items: center; justify-content: center; gap: 20px; margin: 0 auto 48px; color: rgba(255,255,255,0.5); font-size: 0.9rem; flex-wrap: wrap; }
                .pr-social-sep { width: 1px; height: 18px; background: rgba(255,255,255,0.1); }

                /* Grid */
                .pr-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 28px; align-items: stretch; margin-bottom: 60px; max-width: 1100px; margin-left: auto; margin-right: auto; }

                /* Card */
                .pr-card { position: relative; border-radius: 24px; padding: 2px; transition: transform 0.4s cubic-bezier(0.175,0.885,0.32,1.275); }
                .pr-card:hover { transform: translateY(-8px); }
                .pr-card-popular { z-index: 10; }
                .pr-card-popular .pr-card-border { opacity: 0.7; }
                .pr-card:hover .pr-card-border { opacity: 1; }

                .pr-card-border {
                    position: absolute; inset: 0; border-radius: 24px; padding: 2px;
                    -webkit-mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
                    mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
                    -webkit-mask-composite: xor; mask-composite: exclude;
                    animation: prBorderSpin 4s linear infinite; opacity: 0.35; transition: opacity 0.4s;
                }

                .pr-card-body {
                    position: relative; background: linear-gradient(165deg, rgba(20,14,10,0.97), rgba(12,10,22,0.98));
                    border-radius: 22px; padding: 44px 32px 36px; display: flex; flex-direction: column; align-items: center; text-align: center; min-height: 100%;
                    border: 1px solid rgba(255,255,255,0.04); overflow: hidden;
                }

                .pr-card-glow { position: absolute; top: -50px; left: 50%; transform: translateX(-50%); width: 200px; height: 100px; background: radial-gradient(ellipse, rgba(255,107,53,0.12) 0%, transparent 70%); pointer-events: none; }

                /* Popular badge */
                .pr-popular-badge { position: absolute; top: -1px; left: 50%; transform: translateX(-50%); background: linear-gradient(135deg, #FF6B35, #FF8C42); color: white; padding: 6px 22px; border-radius: 0 0 14px 14px; font-size: 0.78rem; font-weight: 700; z-index: 5; white-space: nowrap; display: flex; align-items: center; gap: 6px; }

                /* Ribbon */
                .pr-ribbon { position: absolute; top: 18px; left: -8px; background: linear-gradient(135deg, #22c55e, #4ade80); color: white; padding: 4px 18px 4px 12px; font-size: 0.72rem; font-weight: 700; z-index: 5; border-radius: 0 8px 8px 0; box-shadow: 2px 2px 8px rgba(0,0,0,0.3); }

                /* Plan icon */
                .pr-plan-icon { width: 64px; height: 64px; border-radius: 18px; display: flex; align-items: center; justify-content: center; font-size: 1.8rem; border: 1px solid; margin-bottom: 16px; }

                /* Plan details */
                .pr-plan-name { font-size: 1.35rem; font-weight: 800; color: white; margin-bottom: 6px; }
                .pr-plan-duration { display: inline-block; background: rgba(76,175,80,0.08); color: #81C784; padding: 4px 14px; border-radius: 20px; font-size: 0.72rem; font-weight: 700; border: 1px solid rgba(76,175,80,0.15); margin-bottom: 20px; }

                /* Price */
                .pr-price, .pr-price-promo { margin-bottom: 16px; }
                .pr-price { display: flex; align-items: center; justify-content: center; gap: 6px; }
                .pr-price-promo { text-align: center; }
                .pr-price-old { font-size: 1.1rem; color: rgba(255,255,255,0.25); text-decoration: line-through; }
                .pr-price-new { display: flex; align-items: center; justify-content: center; gap: 6px; margin-top: 4px; }
                .pr-price-amount { font-size: 3.2rem; font-weight: 900; line-height: 1; }
                .pr-price-suffix { display: flex; flex-direction: column; align-items: flex-start; gap: 0; }
                .pr-price-currency { font-size: 1rem; font-weight: 700; line-height: 1.2; }
                .pr-price-period { font-size: 0.72rem; color: rgba(255,255,255,0.35); line-height: 1.2; }

                /* Desc */
                .pr-plan-desc { font-size: 0.88rem; color: rgba(255,255,255,0.45); line-height: 1.6; margin-bottom: 20px; }

                /* Divider */
                .pr-divider { width: 100%; height: 1px; margin-bottom: 20px; }

                /* Features */
                .pr-features { list-style: none; padding: 0; margin: 0 0 28px; width: 100%; flex-grow: 1; }
                .pr-features li { display: flex; align-items: flex-start; gap: 10px; color: rgba(255,255,255,0.78); font-size: 0.9rem; margin-bottom: 14px; text-align: right; line-height: 1.6; }
                .pr-check { font-weight: 700; flex-shrink: 0; font-size: 0.85rem; margin-top: 2px; }

                /* CTA */
                .pr-cta { display: block; width: 100%; padding: 16px; border-radius: 14px; text-align: center; font-weight: 700; font-size: 1rem; text-decoration: none; transition: all 0.3s; }
                .pr-cta-primary { color: white; box-shadow: 0 8px 28px rgba(255,107,53,0.25); }
                .pr-cta-primary:hover { transform: translateY(-2px); box-shadow: 0 12px 36px rgba(255,107,53,0.4); filter: brightness(1.1); }
                .pr-cta-secondary { color: rgba(255,255,255,0.8); background: rgba(255,255,255,0.04); border: 1px solid; }
                .pr-cta-secondary:hover { background: rgba(255,255,255,0.08); transform: translateY(-2px); }

                /* Guarantee */
                .pr-guarantee { position: relative; max-width: 680px; margin: 0 auto; border-radius: 20px; padding: 2px; }
                .pr-guarantee-border { position: absolute; inset: 0; border-radius: 20px; padding: 2px; background: conic-gradient(from var(--border-angle,0deg), transparent 0%, #22c55e 20%, #4ade80 40%, transparent 50%); -webkit-mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0); mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0); -webkit-mask-composite: xor; mask-composite: exclude; animation: prBorderSpin 5s linear infinite; opacity: 0.5; }
                .pr-guarantee-inner { position: relative; background: linear-gradient(165deg, rgba(15,20,12,0.95), rgba(10,12,22,0.96)); border-radius: 18px; padding: 28px 32px; display: flex; align-items: center; gap: 20px; }
                .pr-guarantee-icon { font-size: 2.8rem; flex-shrink: 0; }
                .pr-guarantee-content { flex: 1; }
                .pr-guarantee-content h4 { font-size: 1.1rem; font-weight: 700; color: #81C784; margin-bottom: 6px; }
                .pr-guarantee-content p { font-size: 0.88rem; color: rgba(255,255,255,0.5); line-height: 1.65; margin: 0; }
                .pr-guarantee-stamps { display: flex; gap: 8px; font-size: 1.5rem; opacity: 0.5; flex-shrink: 0; }

                @property --border-angle { syntax: '<angle>'; initial-value: 0deg; inherits: false; }
                @keyframes prBorderSpin { to { --border-angle: 360deg; } }

                /* Responsive */
                @media (max-width: 992px) {
                    .pr-grid { grid-template-columns: 1fr; max-width: 420px; margin-left: auto; margin-right: auto; gap: 24px; }
                    .pr-card-popular { order: -1; }
                }
                @media (max-width: 768px) {
                    .pr-card-body { padding: 36px 24px 30px; }
                    .pr-guarantee-inner { flex-direction: column; text-align: center; padding: 24px 20px; }
                    .pr-guarantee-stamps { justify-content: center; }
                }
                @media (max-width: 576px) {
                    .pr-section { padding: 60px 0; }
                    .pr-title { font-size: 1.7rem; }
                    .pr-price-amount { font-size: 2.5rem; }
                    .pr-plan-icon { width: 52px; height: 52px; font-size: 1.4rem; border-radius: 14px; }
                    .pr-promo-banner { font-size: 0.88rem; padding: 12px 18px; }
                    .pr-cta { padding: 14px; font-size: 0.92rem; }
                }
            `}</style>
        </section>
    )
}
