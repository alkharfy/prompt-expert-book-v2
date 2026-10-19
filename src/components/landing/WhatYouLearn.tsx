'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { SECTION_REGISTRY } from '@/config/sections'
import { MONTHLY_PRICE_EGP, PRODUCT_STATS } from '@/lib/pricing'

const LIVE_LESSONS = SECTION_REGISTRY.filter(section => section.id === 'section-1' || section.id === 'section-2').reduce((total, section) => total + section.pageCount, 0)

/** The public promise of each level (docs/curriculum/levels-2-5/map.md); only 1 and 2 are out. */
const levels = [
    { n: 1, name: 'بتستخدمه صح', open: true, result: 'تطلب شغل يتسلّم، وتعرف إمتى الـ AI بيألّف، وتراجع النتيجة بدليل قبل ما تسلّمها.' },
    { n: 2, name: 'بتطلب زي المحترف', open: true, result: 'طلبات جاهزة لأكتر حاجات بتعملها، وتشتغل بالصور والفويس والملفات.' },
    { n: 3, name: 'بتجهّزه لشغلك', open: false, result: 'تعلّمه طريقة شغلك مرة، فيعمل المهمة اللي بتتكرر من غير ما تشرح كل مرة.' },
    { n: 4, name: 'بيشتغل معاك', open: false, result: 'تسلّمه مهمة فيها كذا خطوة، وتراقبه، وتوقّفه لو غلط.' },
    { n: 5, name: 'نظام شغلك', open: false, result: 'طريقة شغل بالـ AI ليك أو لفريقك، وتقيس وفّرت قد إيه.' },
]

const tools = [
    { icon: '📂', title: 'ملفات شغل مصرية', text: 'فواتير موردين، وكشف بنك، وشكاوى عملاء، وصور إيصالات. بتتمرّن على حاجة شبه شغلك، مش على أمثلة أجنبي.' },
    { icon: '✅', title: '«المستر بيصحّح»', text: 'تلزق الطلب اللي كتبته، فيقولك إيه اللي ناقص فيه بالظبط، وتصلّحه قبل ما تستخدمه.' },
    { icon: '🎒', title: '«شنطة طلباتك»', text: 'الطلب اللي يعجبك في الدروس تحفظه بضغطة في حسابك، وتنسخه في شغلك وقت ما تحتاجه.' },
]

const industries = [
    {
        emoji: '📊',
        name: 'الحسابات والبيانات',
        outcomes: [
            'تنظيم شيتات الإكسل وتلخيص المصاريف',
            'معادلات إكسل مشروحة خطوة بخطوة',
            'مراجعة الأرقام قبل ما تسلّم التقرير',
        ],
    },
    {
        emoji: '🧑‍💼',
        name: 'الإدارة والـ HR',
        outcomes: [
            'إيميلات رسمية ومحاضر اجتماعات',
            'إعلانات وظايف وأسئلة إنترفيو',
            'تقارير أسبوعية منظمة',
        ],
    },
    {
        emoji: '👩‍🏫',
        name: 'التدريس',
        outcomes: [
            'شرح الدرس بمستويات مختلفة',
            'أسئلة وامتحانات بالإجابات',
            'خطط مراجعة للطلبة',
        ],
    },
    {
        emoji: '📣',
        name: 'التسويق',
        outcomes: [
            'خطة بوستات وإعلانات خطوة بخطوة',
            'محتوى مكتوب بلغة جمهورك',
            'صور إعلانية بالـ AI',
        ],
    },
    {
        emoji: '🤝',
        name: 'المبيعات وخدمة العملاء',
        outcomes: [
            'رسايل متابعة مخصصة لكل عميل',
            'ردود على الاعتراضات المتكررة',
            'مساعد بيرد على الأسئلة المتكررة — تحت مراجعتك',
        ],
    },
    {
        emoji: '🎓',
        name: 'الطلبة والباحثين عن شغل',
        outcomes: [
            'تلخيص ومذاكرة بأسئلة تختبر فهمك',
            'CV مكتوب أحسن لنفس خبرتك',
            'تدريب على أسئلة الإنترفيو',
        ],
    },
    {
        emoji: '💻',
        name: 'البرمجة',
        outcomes: [
            'كتابة ومراجعة كود مع AI',
            'تصحيح الأخطاء خطوة بخطوة',
            'توثيق المشاريع',
        ],
    },
]

const stats = [
    { val: String(LIVE_LESSONS), label: 'درس متاح دلوقتي' },
    { val: String(PRODUCT_STATS.exercises), label: 'تمرين' },
    { val: String(PRODUCT_STATS.templates), label: 'قالب جاهز' },
    { val: String(MONTHLY_PRICE_EGP), label: 'جنيه في الشهر' },
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
                    <span className="wyl-badge">🪜 الكورس 5 مستويات</span>
                    <h2 className="wyl-title">من كل مستوى بتطلع بحاجة في إيدك</h2>
                    <p className="wyl-sub">كل درس فيه تمرين على ملف شغل حقيقي، وفي آخر كل مستوى مشروع صغير تقدر توريه لمديرك.</p>
                </motion.div>

                <ol className="wyl-levels" aria-label="مستويات الكورس">
                    {levels.map(level => (
                        <li key={level.n} className={`wyl-level${level.open ? ' wyl-level-open' : ''}`}>
                            <span className="wyl-level-n" aria-hidden="true">{level.n}</span>
                            <div>
                                <p className="wyl-level-name">
                                    المستوى {level.n}: {level.name}
                                    <span className={`wyl-level-tag${level.open ? ' on' : ''}`}>{level.open ? 'متاح دلوقتي' : 'بينزل قريب'}</span>
                                </p>
                                <p className="wyl-level-result">{level.result}</p>
                            </div>
                        </li>
                    ))}
                </ol>
                <p className="wyl-note">ولحد ما المستويات 3–5 تنزل، الفصول 3–10 من كتاب PromptMaster مفتوحة للمشتركين.</p>

                <p className="wyl-section-label">حاجات مش هتلاقيها في فيديو على يوتيوب</p>
                <div className="wyl-tools">
                    {tools.map(tool => (
                        <div key={tool.title} className="wyl-tool glass-card">
                            <span className="wyl-tool-icon" aria-hidden="true">{tool.icon}</span>
                            <p className="wyl-tool-title">{tool.title}</p>
                            <p className="wyl-tool-text">{tool.text}</p>
                        </div>
                    ))}
                </div>

                <div className="glass-card wyl-example">
                    <p className="wyl-example-label">مثال من المستوى 2: صورة إيصالات</p>
                    <p><strong>الطلب:</strong> «دي صورة 3 إيصالات مصروفات. طلّعلي جدول: التاريخ، المكان، المبلغ. لو رقم مش واضح اكتب [مش واضح] ومتخمّنش.»</p>
                    <p><strong>اللي بتتعلّمه:</strong> إيصال البنزين رقمه باهت، والأداة ممكن تكتب رقم من عندها بثقة. الجملة الأخيرة بتطلب منها تقول «مش واضح» بدل ما تخمّن، وبرضه بتطابق كل رقم بالإيصال قبل ما تعتمده.</p>
                </div>

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
                    حسب شغلك
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
                    font-size: 0.95rem;
                    font-weight: 700;
                    letter-spacing: 0;
                    color: rgba(255, 255, 255, 0.6);
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
            
                /* Levels ladder */
                .wyl-levels { list-style: none; margin: 0 auto 10px; padding: 0; max-width: 720px; display: grid; gap: 10px; }
                .wyl-level { display: flex; gap: 14px; align-items: flex-start; padding: 14px 16px; border-radius: 16px; background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.08); }
                .wyl-level-open { background: rgba(255,107,53,0.07); border-color: rgba(255,107,53,0.35); }
                .wyl-level-n { flex-shrink: 0; width: 34px; height: 34px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-weight: 800; color: #fff; background: #333; }
                .wyl-level-open .wyl-level-n { background: linear-gradient(135deg, #FF6B35, #FF8C42); }
                .wyl-level-name { margin: 0 0 4px; font-weight: 800; color: #fff; font-size: 1.02rem; display: flex; flex-wrap: wrap; gap: 8px; align-items: center; }
                .wyl-level-tag { font-size: 0.8rem; font-weight: 700; padding: 2px 10px; border-radius: 999px; color: #aaa; border: 1px solid rgba(255,255,255,0.15); }
                .wyl-level-tag.on { color: #4ade80; border-color: rgba(74,222,128,0.4); background: rgba(74,222,128,0.08); }
                .wyl-level-result { margin: 0; color: rgba(255,255,255,0.72); line-height: 1.8; font-size: 0.95rem; }
                .wyl-note { text-align: center; color: rgba(255,255,255,0.5); font-size: 0.88rem; margin: 0 auto 30px; max-width: 560px; line-height: 1.8; }
                .wyl-tools { display: grid; grid-template-columns: repeat(3, 1fr); gap: 14px; margin: 0 auto 24px; max-width: 900px; }
                .wyl-tool { padding: 18px; text-align: center; }
                .wyl-tool-icon { font-size: 1.8rem; }
                .wyl-tool-title { margin: 8px 0 6px; font-weight: 800; color: #fff; }
                .wyl-tool-text { margin: 0; color: rgba(255,255,255,0.65); line-height: 1.8; font-size: 0.92rem; }
                .wyl-example { padding: 20px 22px; margin: 0 auto 28px; max-width: 720px; line-height: 1.9; }
                .wyl-example p { margin: 0 0 8px; color: rgba(255,255,255,0.8); }
                .wyl-example-label { color: #FFB800 !important; font-weight: 800; }
                @media (max-width: 768px) { .wyl-tools { grid-template-columns: 1fr; } }
`}</style>
        </section>
    )
}
