'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { BOOK_PAGES_DISPLAY } from '@/lib/config'

const techniques = [
    '🎯 إطار GOLDS',
    '⛓️ Prompt Chaining',
    '🖼️ SSCT & SPICE',
    '🔧 Debug متقدم',
    '🤖 وكلاء AI',
    '📚 RAG',
    '📋 95 قالب',
]

const industries = [
    {
        emoji: '💼',
        name: 'التسويق',
        outcomes: [
            'بناء خطة تسويقية كاملة بـ Prompt Chaining',
            'كتابة محتوى سوشيال ميديا وإعلانات بإطار GOLDS',
            'تصميم صور إعلانية احترافية بإطار SPICE',
        ],
    },
    {
        emoji: '💰',
        name: 'المبيعات',
        outcomes: [
            'صياغة رسائل بيع مخصصة وعروض أسعار ذكية',
            'بناء وكيل AI للرد على العملاء 24/7',
            'تحليل بيانات العملاء واستهدافهم بدقة',
        ],
    },
    {
        emoji: '💻',
        name: 'البرمجة',
        outcomes: [
            'كتابة ومراجعة كود بكفاءة مع AI',
            'تصحيح أخطاء بتقنيات Self-Consistency و ReAct',
            'توثيق مشاريع كاملة وحل مشاكل تقنية',
        ],
    },
    {
        emoji: '📊',
        name: 'البيانات',
        outcomes: [
            'تحليل ملفات Excel وقواعد بيانات بأوامر ذكية',
            'تحويل بيانات خام لتقارير ورسوم بيانية',
            'استخراج رؤى وتوقعات من أي مجموعة بيانات',
        ],
    },
    {
        emoji: '🎓',
        name: 'التعليم',
        outcomes: [
            'إنشاء محتوى تعليمي وخطط دروس تفاعلية',
            'بناء اختبارات تقييم ومساعد ذكي للطلاب',
            'تلخيص أبحاث ومراجعات أكاديمية بالـ AI',
        ],
    },
    {
        emoji: '🎨',
        name: 'الإبداع',
        outcomes: [
            'إنشاء صور احترافية بإطار SPICE المتقدم',
            'كتابة سيناريوهات فيديو ونصوص إبداعية',
            'إنتاج محتوى صوتي ومرئي متكامل بالـ AI',
        ],
    },
    {
        emoji: '📁',
        name: 'المشاريع',
        outcomes: [
            'تخطيط مشاريع وتوزيع مهام بالـ AI',
            'إنشاء تقارير تقدم أوتوماتيكية',
            'أتمتة سير العمل بوكلاء AI ذكية',
        ],
    },
]

const stats = [
    { val: '10', label: 'فصول' },
    { val: '30+', label: 'قالب' },
    { val: '55+', label: 'تمرين' },
    { val: String(BOOK_PAGES_DISPLAY), label: 'صفحة' },
]

/* Staggered children animation */
const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
        opacity: 1,
        transition: { staggerChildren: 0.06, delayChildren: 0.1 },
    },
}
const childVariants = {
    hidden: { opacity: 0, y: 10, scale: 0.95 },
    visible: { opacity: 1, y: 0, scale: 1, transition: { type: 'spring', stiffness: 300, damping: 24 } },
}

export default function WhatYouLearn() {
    const [active, setActive] = useState(0)

    return (
        <section className="landing-section landing-section-dark">
            <div className="landing-glow" style={{ top: '10%', right: '5%' }} />
            <div className="container">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.6 }}
                    className="wyl-header"
                >
                    <span className="wyl-badge">📚 محتوى الكتاب</span>
                    <h2 className="wyl-title">ماذا ستتعلم؟</h2>
                    <p className="wyl-sub">محتوى حقيقي من 10 فصول يغطي كل مجال متأثر بالـ AI</p>
                </motion.div>

                {/* Section Label: Techniques */}
                <motion.p
                    className="wyl-section-label"
                    initial={{ opacity: 0 }}
                    whileInView={{ opacity: 1 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.4, delay: 0.1 }}
                >
                    التقنيات الأساسية
                </motion.p>

                {/* Core Techniques — staggered */}
                <motion.div
                    className="wyl-techs"
                    variants={containerVariants}
                    initial="hidden"
                    whileInView="visible"
                    viewport={{ once: true }}
                >
                    {techniques.map((t, i) => (
                        <motion.span key={i} className="wyl-tech" variants={childVariants}>{t}</motion.span>
                    ))}
                </motion.div>

                {/* Divider */}
                <div className="wyl-divider" />

                {/* Section Label: Industries */}
                <motion.p
                    className="wyl-section-label"
                    initial={{ opacity: 0 }}
                    whileInView={{ opacity: 1 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.4, delay: 0.15 }}
                >
                    التطبيقات العملية
                </motion.p>

                {/* Industry Tabs — with ARIA */}
                <motion.div
                    className="wyl-tabs"
                    role="tablist"
                    aria-label="مجالات التطبيق"
                    variants={containerVariants}
                    initial="hidden"
                    whileInView="visible"
                    viewport={{ once: true }}
                >
                    {industries.map((ind, i) => (
                        <motion.button
                            key={i}
                            role="tab"
                            aria-selected={active === i}
                            aria-controls={`wyl-panel-${i}`}
                            id={`wyl-tab-${i}`}
                            className={`wyl-tab${active === i ? ' wyl-tab-on' : ''}`}
                            onClick={() => setActive(i)}
                            variants={childVariants}
                            whileHover={{ scale: 1.06 }}
                            whileTap={{ scale: 0.96 }}
                        >
                            <span className="wyl-tab-emoji">{ind.emoji}</span>
                            <span>{ind.name}</span>
                        </motion.button>
                    ))}
                </motion.div>

                {/* Outcomes Panel — with pointer arrow */}
                <AnimatePresence mode="wait">
                    <motion.div
                        key={active}
                        id={`wyl-panel-${active}`}
                        role="tabpanel"
                        aria-labelledby={`wyl-tab-${active}`}
                        initial={{ opacity: 0, y: 12 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -8 }}
                        transition={{ type: 'spring', stiffness: 280, damping: 22 }}
                        className="wyl-panel glass-card"
                    >
                        <div className="wyl-panel-arrow" />
                        <div className="wyl-panel-head">
                            <span className="wyl-panel-emoji">{industries[active].emoji}</span>
                            <span>{industries[active].name}</span>
                        </div>
                        {industries[active].outcomes.map((o, i) => (
                            <motion.div
                                key={i}
                                className="wyl-outcome"
                                initial={{ opacity: 0, x: 10 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: i * 0.08, duration: 0.25 }}
                            >
                                <span className="wyl-check">✓</span>
                                <span>{o}</span>
                            </motion.div>
                        ))}
                    </motion.div>
                </AnimatePresence>

                {/* Stats */}
                <motion.div
                    className="wyl-stats"
                    initial={{ opacity: 0, y: 10 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.5, delay: 0.3 }}
                >
                    {stats.map((s, i) => (
                        <div key={i} className="wyl-stat">
                            <strong>{s.val}</strong>
                            <span>{s.label}</span>
                        </div>
                    ))}
                </motion.div>
            </div>

            <style jsx global>{`
                .wyl-header {
                    text-align: center;
                    margin-bottom: 30px;
                }
                .wyl-badge {
                    display: inline-block;
                    background: rgba(255, 107, 53, 0.15);
                    color: #FF6B35;
                    padding: 6px 18px;
                    border-radius: 30px;
                    font-size: 0.85rem;
                    font-weight: 600;
                    margin-bottom: 16px;
                    border: 1px solid rgba(255, 107, 53, 0.3);
                }
                .wyl-title {
                    font-size: 2.2rem;
                    font-weight: 800;
                    margin-bottom: 10px;
                    background: linear-gradient(135deg, #fff 0%, #FF6B35 100%);
                    -webkit-background-clip: text;
                    -webkit-text-fill-color: transparent;
                    background-clip: text;
                }
                .wyl-sub {
                    font-size: 1rem;
                    color: rgba(255, 255, 255, 0.65);
                    max-width: 440px;
                    margin: 0 auto;
                }

                /* Section Labels */
                .wyl-section-label {
                    text-align: center;
                    font-size: 0.75rem;
                    font-weight: 600;
                    letter-spacing: 0.06em;
                    color: rgba(255, 255, 255, 0.35);
                    text-transform: uppercase;
                    margin-bottom: 14px;
                }

                /* Divider between sections */
                .wyl-divider {
                    width: 60px;
                    height: 1px;
                    background: linear-gradient(90deg, transparent, rgba(255, 107, 53, 0.4), transparent);
                    margin: 10px auto 20px;
                }

                /* Technique Pills — Glassmorphism */
                .wyl-techs {
                    display: flex;
                    flex-wrap: wrap;
                    justify-content: center;
                    gap: 12px 10px;
                    margin-bottom: 18px;
                }
                .wyl-tech {
                    background: rgba(255, 255, 255, 0.05);
                    backdrop-filter: blur(12px) saturate(140%);
                    -webkit-backdrop-filter: blur(12px) saturate(140%);
                    border: 1px solid rgba(255, 255, 255, 0.1);
                    color: rgba(255, 255, 255, 0.82);
                    padding: 7px 18px;
                    border-radius: 20px;
                    font-size: 0.8rem;
                    white-space: nowrap;
                    transition: all 0.3s cubic-bezier(.4,0,.2,1);
                    cursor: default;
                    position: relative;
                }
                .wyl-tech:hover {
                    background: rgba(255, 107, 53, 0.1);
                    border-color: rgba(255, 107, 53, 0.35);
                    color: #fff;
                    box-shadow: 0 0 18px rgba(255, 107, 53, 0.15), inset 0 1px 0 rgba(255,255,255,0.08);
                    transform: translateY(-2px);
                }

                /* Industry Tabs */
                .wyl-tabs {
                    display: flex;
                    gap: 8px;
                    justify-content: center;
                    flex-wrap: wrap;
                    margin-bottom: 22px;
                }
                .wyl-tab {
                    display: flex;
                    align-items: center;
                    gap: 6px;
                    background: rgba(255, 255, 255, 0.04);
                    backdrop-filter: blur(8px);
                    -webkit-backdrop-filter: blur(8px);
                    border: 1px solid rgba(255, 255, 255, 0.08);
                    color: rgba(255, 255, 255, 0.55);
                    padding: 8px 16px;
                    border-radius: 25px;
                    font-size: 0.85rem;
                    cursor: pointer;
                    transition: all 0.3s cubic-bezier(.4,0,.2,1);
                    font-family: inherit;
                    position: relative;
                    outline: none;
                }
                .wyl-tab:focus-visible {
                    box-shadow: 0 0 0 2px #FF6B35;
                }
                .wyl-tab-emoji {
                    font-size: 1.1rem;
                    transition: transform 0.3s ease;
                }
                .wyl-tab:hover .wyl-tab-emoji {
                    transform: scale(1.2);
                }
                .wyl-tab:hover {
                    background: rgba(255, 107, 53, 0.08);
                    border-color: rgba(255, 107, 53, 0.3);
                    color: rgba(255, 255, 255, 0.85);
                    box-shadow: 0 2px 12px rgba(255, 107, 53, 0.1);
                }
                .wyl-tab:active {
                    background: rgba(255, 107, 53, 0.12);
                }

                /* Active tab — strong visual indicators */
                .wyl-tab-on {
                    background: rgba(255, 107, 53, 0.18) !important;
                    border-color: rgba(255, 107, 53, 0.7) !important;
                    color: #FF6B35 !important;
                    font-weight: 700;
                    box-shadow:
                        0 0 20px rgba(255, 107, 53, 0.2),
                        0 0 6px rgba(255, 107, 53, 0.15),
                        inset 0 1px 0 rgba(255, 255, 255, 0.06) !important;
                    text-shadow: 0 0 12px rgba(255, 107, 53, 0.3);
                }
                .wyl-tab-on .wyl-tab-emoji {
                    transform: scale(1.15);
                }

                /* Outcomes Panel */
                .wyl-panel {
                    max-width: 520px;
                    margin: 0 auto 28px;
                    padding: 24px 28px;
                    position: relative;
                    border: 1px solid rgba(255, 107, 53, 0.15);
                    background: rgba(255, 255, 255, 0.03);
                    backdrop-filter: blur(16px) saturate(160%);
                    -webkit-backdrop-filter: blur(16px) saturate(160%);
                    border-radius: 16px;
                }
                .wyl-panel-arrow {
                    position: absolute;
                    top: -6px;
                    left: 50%;
                    transform: translateX(-50%) rotate(45deg);
                    width: 12px;
                    height: 12px;
                    background: rgba(30, 25, 22, 0.9);
                    border-top: 1px solid rgba(255, 107, 53, 0.3);
                    border-left: 1px solid rgba(255, 107, 53, 0.3);
                }
                .wyl-panel-head {
                    display: flex;
                    align-items: center;
                    gap: 10px;
                    font-size: 1.1rem;
                    font-weight: 700;
                    color: white;
                    margin-bottom: 16px;
                    padding-bottom: 12px;
                    border-bottom: 1px solid rgba(255, 107, 53, 0.12);
                }
                .wyl-panel-emoji {
                    font-size: 1.4rem;
                    display: inline-flex;
                    align-items: center;
                    justify-content: center;
                    width: 36px;
                    height: 36px;
                    background: rgba(255, 107, 53, 0.1);
                    border-radius: 10px;
                    border: 1px solid rgba(255, 107, 53, 0.2);
                }
                .wyl-outcome {
                    display: flex;
                    align-items: flex-start;
                    gap: 10px;
                    padding: 9px 0;
                    font-size: 0.95rem;
                    color: rgba(255, 255, 255, 0.82);
                    line-height: 1.55;
                    transition: all 0.2s ease;
                }
                .wyl-outcome:hover {
                    color: rgba(255, 255, 255, 0.95);
                    padding-right: 4px;
                }
                .wyl-check {
                    color: #FF6B35;
                    font-weight: 700;
                    font-size: 1rem;
                    flex-shrink: 0;
                    margin-top: 2px;
                    width: 20px;
                    height: 20px;
                    display: inline-flex;
                    align-items: center;
                    justify-content: center;
                    background: rgba(255, 107, 53, 0.1);
                    border-radius: 50%;
                    font-size: 0.7rem;
                }

                /* Stats Bar */
                .wyl-stats {
                    display: flex;
                    justify-content: center;
                    gap: 32px;
                    flex-wrap: wrap;
                    padding-top: 8px;
                    border-top: 1px solid rgba(255, 255, 255, 0.05);
                }
                .wyl-stat {
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    gap: 2px;
                }
                .wyl-stat strong {
                    font-size: 1.3rem;
                    color: #FF6B35;
                    font-weight: 800;
                }
                .wyl-stat span {
                    font-size: 0.8rem;
                    color: rgba(255, 255, 255, 0.5);
                }

                @media (max-width: 640px) {
                    .wyl-title { font-size: 1.7rem; }
                    .wyl-section-label { font-size: 0.68rem; margin-bottom: 10px; }
                    .wyl-techs {
                        gap: 8px 6px;
                        padding: 0 8px;
                    }
                    .wyl-tech { font-size: 0.72rem; padding: 6px 12px; border-radius: 16px; }
                    .wyl-tabs {
                        gap: 8px 6px;
                        padding: 0 8px;
                    }
                    .wyl-tab { padding: 6px 12px; font-size: 0.78rem; gap: 4px; min-height: 44px; }
                    .wyl-tab-emoji { font-size: 0.95rem !important; }
                    .wyl-panel { padding: 18px 20px; margin-left: 12px; margin-right: 12px; }
                    .wyl-stats { gap: 20px; }
                    .wyl-divider { margin: 8px auto 16px; }
                }
                @media (max-width: 380px) {
                    .wyl-techs { gap: 6px 5px; }
                    .wyl-tech { font-size: 0.66rem; padding: 5px 10px; }
                    .wyl-tabs { gap: 6px 5px; }
                    .wyl-tab { padding: 5px 10px; font-size: 0.72rem; }
                }
            `}</style>
        </section>
    )
}
