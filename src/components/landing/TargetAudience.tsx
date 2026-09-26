'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

const BusinessIcon = () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="2" y="7" width="20" height="14" rx="2" ry="2" />
        <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
    </svg>
)

const CreatorIcon = () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 20h9" />
        <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" />
    </svg>
)

const DesignerIcon = () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="13.5" cy="6.5" r=".5" />
        <circle cx="17.5" cy="10.5" r=".5" />
        <circle cx="8.5" cy="7.5" r=".5" />
        <circle cx="6.5" cy="12.5" r=".5" />
        <path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10c.926 0 1.648-.746 1.648-1.688 0-.437-.18-.835-.437-1.125-.29-.289-.438-.652-.438-1.125a1.64 1.64 0 0 1 1.688-1.688h1.906c3.11 0 5.625-2.515 5.625-5.625 0-4.903-4.436-8.75-10-8.75z" />
    </svg>
)

const StartupIcon = () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M4.5 16.5c-1.5 1.26-2 5-2 5s3.74-.5 5-2c.71-.84.7-2.13-.09-2.91a2.18 2.18 0 0 0-2.91-.09z" />
        <path d="m12 15-3-3a22 22 0 0 1 2-3.95A12.88 12.88 0 0 1 22 2c0 2.72-.78 7.5-6 11a22.35 22.35 0 0 1-4 2z" />
        <path d="M9 12H4s.55-3.03 2-5c1.62-2.2 5-3 5-3" />
        <path d="M12 15v5s3.03-.55 5-2c2.2-1.62 3-5 3-5" />
    </svg>
)

const MarketingIcon = () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <line x1="18" y1="20" x2="18" y2="10" />
        <line x1="12" y1="20" x2="12" y2="4" />
        <line x1="6" y1="20" x2="6" y2="14" />
        <line x1="2" y1="20" x2="22" y2="20" />
    </svg>
)

const StudentIcon = () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M22 10v6M2 10l10-5 10 5-10 5z" />
        <path d="M6 12v5c3 3 9 3 12 0v-5" />
    </svg>
)

const audiences = [
    {
        icon: <BusinessIcon />,
        emoji: '💼',
        title: 'صاحب مشروع',
        subtitle: 'رائد أعمال أو مدير فريق',
        description: 'تريد استخدام AI لتسريع عملك: كتابة خطط التسويق، تحليل البيانات، بناء استراتيجيات المبيعات — بدون فريق تقني كامل',
        painPoints: ['تكاليف تسويق مرتفعة', 'بيانات بدون تحليل', 'منافسة شديدة'],
        gains: ['خفض تكاليف التسويق 60%', 'تقارير جاهزة في دقائق', 'ميزة تنافسية حقيقية'],
    },
    {
        icon: <CreatorIcon />,
        emoji: '✍️',
        title: 'صانع محتوى',
        subtitle: 'كاتب أو مؤثر رقمي',
        description: 'تبحث عن نظام عمل منظم لإنتاج محتوى احترافي بسرعة وكفاءة',
        painPoints: ['ضغط المواعيد', 'جودة غير متسقة', 'إرهاق إبداعي'],
        gains: ['محتوى أسرع 5 مرات', 'جودة ثابتة بقوالب ذكية', 'إبداع بلا حدود'],
    },
    {
        icon: <DesignerIcon />,
        emoji: '💻',
        title: 'مطوّر أو مصمم',
        subtitle: 'مبرمج أو مصمم UI/UX',
        description: 'تريد دمج AI في سير عملك اليومي من التخطيط إلى التنفيذ',
        painPoints: ['مهام متكررة', 'وقت ضائع في التوثيق', 'اختبار الجودة'],
        gains: ['أتمتة 70% من المهام', 'توثيق تلقائي بالـ AI', 'كود أنظف وأسرع'],
    }
]

export default function TargetAudience() {
    const [activeCard, setActiveCard] = useState<number | null>(null)
    const [flipped, setFlipped] = useState<number | null>(null)

    return (
        <section className="landing-section landing-section-darker">
            <div className="landing-glow" style={{ bottom: '10%', left: '5%' }} />
            <div className="container">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.6 }}
                    className="ta-header"
                >
                    <span className="ta-badge">🎯 لمن هذا الكتاب؟</span>
                    <h2 className="ta-title">هل أنت الشخص المستهدف؟</h2>
                    <p className="ta-subtitle">
                        صُمم هذا الكتاب خصيصاً ليساعدك على اختصار سنوات من التعلم
                    </p>
                </motion.div>

                <div className="ta-grid">
                    {audiences.map((audience, index) => (
                        <motion.div
                            key={index}
                            initial={{ opacity: 0, y: 30 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ delay: index * 0.12, type: 'spring', stiffness: 260, damping: 20 }}
                            className={`ta-card${activeCard === index ? ' ta-card-active' : ''}`}
                            onMouseEnter={() => setActiveCard(index)}
                            onMouseLeave={() => setActiveCard(null)}
                            onClick={() => setFlipped(flipped === index ? null : index)}
                        >
                            {/* Front side */}
                            <AnimatePresence mode="wait">
                                {flipped !== index ? (
                                    <motion.div
                                        key="front"
                                        className="ta-card-inner"
                                        initial={{ rotateY: 90, opacity: 0 }}
                                        animate={{ rotateY: 0, opacity: 1 }}
                                        exit={{ rotateY: -90, opacity: 0 }}
                                        transition={{ duration: 0.3 }}
                                    >
                                        {/* Top accent line */}
                                        <div className="ta-card-accent" />

                                        <div className="ta-icon-wrap">
                                            {audience.icon}
                                        </div>

                                        <div className="ta-card-label">{audience.subtitle}</div>
                                        <h3 className="ta-card-title">{audience.title}</h3>
                                        <p className="ta-card-desc">{audience.description}</p>

                                        <div className="ta-pain-section">
                                            <div className="ta-pain-label">
                                                <span className="ta-pain-icon">⚡</span>
                                                التحديات
                                            </div>
                                            {audience.painPoints.map((point, pIndex) => (
                                                <div key={pIndex} className="ta-pain-item">
                                                    <span className="ta-pain-dot" />
                                                    <span>{point}</span>
                                                </div>
                                            ))}
                                        </div>

                                        <div className="ta-flip-hint">
                                            <span>اضغط لرؤية الحلول</span>
                                            <span className="ta-flip-arrow">←</span>
                                        </div>
                                    </motion.div>
                                ) : (
                                    <motion.div
                                        key="back"
                                        className="ta-card-inner ta-card-back"
                                        initial={{ rotateY: -90, opacity: 0 }}
                                        animate={{ rotateY: 0, opacity: 1 }}
                                        exit={{ rotateY: 90, opacity: 0 }}
                                        transition={{ duration: 0.3 }}
                                    >
                                        <div className="ta-card-accent ta-card-accent-green" />

                                        <div className="ta-back-emoji">{audience.emoji}</div>
                                        <h3 className="ta-card-title ta-card-title-green">بعد الكتاب ✨</h3>
                                        <p className="ta-back-subtitle">كيف هيتغير شغلك كـ{audience.title}</p>

                                        <div className="ta-gains-section">
                                            {audience.gains.map((gain, gIndex) => (
                                                <motion.div
                                                    key={gIndex}
                                                    className="ta-gain-item"
                                                    initial={{ opacity: 0, x: 15 }}
                                                    animate={{ opacity: 1, x: 0 }}
                                                    transition={{ delay: gIndex * 0.1 + 0.2 }}
                                                >
                                                    <span className="ta-gain-check">✓</span>
                                                    <span>{gain}</span>
                                                </motion.div>
                                            ))}
                                        </div>

                                        <div className="ta-flip-hint ta-flip-hint-back">
                                            <span>اضغط للرجوع</span>
                                            <span className="ta-flip-arrow">→</span>
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </motion.div>
                    ))}
                </div>
            </div>

            <style jsx global>{`
                .ta-header {
                    text-align: center;
                    margin-bottom: 50px;
                }
                .ta-badge {
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
                .ta-title {
                    font-size: 2.4rem;
                    font-weight: 800;
                    margin-bottom: 14px;
                    background: linear-gradient(135deg, #fff 0%, #FF6B35 100%);
                    -webkit-background-clip: text;
                    -webkit-text-fill-color: transparent;
                    background-clip: text;
                }
                .ta-subtitle {
                    font-size: 1.05rem;
                    color: rgba(255, 255, 255, 0.6);
                    max-width: 480px;
                    margin: 0 auto;
                }

                /* Grid */
                .ta-grid {
                    display: grid;
                    grid-template-columns: repeat(3, 1fr);
                    gap: 24px;
                    max-width: 1100px;
                    margin: 0 auto;
                }

                /* Card */
                .ta-card {
                    position: relative;
                    border-radius: 20px;
                    background: rgba(255, 255, 255, 0.03);
                    backdrop-filter: blur(12px);
                    -webkit-backdrop-filter: blur(12px);
                    border: 1px solid rgba(255, 255, 255, 0.06);
                    overflow: hidden;
                    cursor: pointer;
                    transition: all 0.4s cubic-bezier(.4,0,.2,1);
                    min-height: 420px;
                }
                .ta-card:hover {
                    border-color: rgba(255, 107, 53, 0.3);
                    box-shadow:
                        0 8px 32px rgba(0, 0, 0, 0.3),
                        0 0 20px rgba(255, 107, 53, 0.08);
                    transform: translateY(-6px);
                }
                .ta-card-active {
                    border-color: rgba(255, 107, 53, 0.4);
                }

                /* Card accent line */
                .ta-card-accent {
                    height: 3px;
                    background: linear-gradient(90deg, #FF6B35, #ff8c42, #FF6B35);
                    border-radius: 0 0 4px 4px;
                }
                .ta-card-accent-green {
                    background: linear-gradient(90deg, #22c55e, #4ade80, #22c55e);
                }

                .ta-card-inner {
                    padding: 36px 30px 28px;
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    text-align: center;
                    height: 100%;
                }

                /* Icon */
                .ta-icon-wrap {
                    width: 64px;
                    height: 64px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    background: rgba(255, 107, 53, 0.08);
                    border-radius: 18px;
                    margin-bottom: 18px;
                    color: #FF6B35;
                    padding: 16px;
                    border: 1px solid rgba(255, 107, 53, 0.15);
                    transition: all 0.3s ease;
                }
                .ta-card:hover .ta-icon-wrap {
                    background: rgba(255, 107, 53, 0.15);
                    border-color: rgba(255, 107, 53, 0.35);
                    transform: scale(1.08);
                    box-shadow: 0 0 20px rgba(255, 107, 53, 0.15);
                }

                /* Card label */
                .ta-card-label {
                    font-size: 0.72rem;
                    color: rgba(255, 255, 255, 0.35);
                    letter-spacing: 0.04em;
                    margin-bottom: 6px;
                    font-weight: 500;
                }

                /* Card title */
                .ta-card-title {
                    font-size: 1.35rem;
                    font-weight: 800;
                    color: white;
                    margin-bottom: 12px;
                }
                .ta-card-title-green {
                    background: linear-gradient(135deg, #fff, #4ade80);
                    -webkit-background-clip: text;
                    -webkit-text-fill-color: transparent;
                    background-clip: text;
                }

                /* Card description */
                .ta-card-desc {
                    font-size: 0.9rem;
                    color: rgba(255, 255, 255, 0.55);
                    line-height: 1.65;
                    margin-bottom: 22px;
                }

                /* Pain points section */
                .ta-pain-section {
                    width: 100%;
                    background: rgba(0, 0, 0, 0.2);
                    padding: 18px 20px;
                    border-radius: 14px;
                    border: 1px solid rgba(255, 255, 255, 0.04);
                    margin-top: auto;
                }
                .ta-pain-label {
                    display: flex;
                    align-items: center;
                    gap: 6px;
                    font-size: 0.78rem;
                    font-weight: 700;
                    color: rgba(255, 255, 255, 0.5);
                    margin-bottom: 12px;
                    justify-content: center;
                    text-transform: uppercase;
                    letter-spacing: 0.05em;
                }
                .ta-pain-icon {
                    font-size: 0.85rem;
                }
                .ta-pain-item {
                    display: flex;
                    align-items: center;
                    gap: 10px;
                    font-size: 0.88rem;
                    color: rgba(255, 255, 255, 0.55);
                    margin-bottom: 8px;
                    justify-content: center;
                }
                .ta-pain-item:last-child { margin-bottom: 0; }
                .ta-pain-dot {
                    width: 5px;
                    height: 5px;
                    background: #FF6B35;
                    border-radius: 50%;
                    box-shadow: 0 0 6px rgba(255, 107, 53, 0.5);
                    flex-shrink: 0;
                }

                /* Flip hint */
                .ta-flip-hint {
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    gap: 6px;
                    margin-top: 18px;
                    font-size: 0.72rem;
                    color: rgba(255, 107, 53, 0.5);
                    transition: color 0.3s ease;
                }
                .ta-card:hover .ta-flip-hint {
                    color: rgba(255, 107, 53, 0.8);
                }
                .ta-flip-arrow {
                    font-size: 0.9rem;
                    transition: transform 0.3s ease;
                }
                .ta-card:hover .ta-flip-arrow {
                    transform: translateX(-4px);
                }
                .ta-flip-hint-back {
                    color: rgba(34, 197, 94, 0.5);
                }
                .ta-card:hover .ta-flip-hint-back {
                    color: rgba(34, 197, 94, 0.8);
                }

                /* Back side */
                .ta-card-back {
                    justify-content: center;
                }
                .ta-back-emoji {
                    font-size: 2.5rem;
                    margin-bottom: 14px;
                }
                .ta-back-subtitle {
                    font-size: 0.88rem;
                    color: rgba(255, 255, 255, 0.45);
                    margin-bottom: 24px;
                }

                /* Gains section */
                .ta-gains-section {
                    width: 100%;
                    background: rgba(34, 197, 94, 0.06);
                    padding: 20px 22px;
                    border-radius: 14px;
                    border: 1px solid rgba(34, 197, 94, 0.12);
                }
                .ta-gain-item {
                    display: flex;
                    align-items: center;
                    gap: 10px;
                    font-size: 0.92rem;
                    color: rgba(255, 255, 255, 0.8);
                    margin-bottom: 12px;
                    justify-content: center;
                }
                .ta-gain-item:last-child { margin-bottom: 0; }
                .ta-gain-check {
                    color: #22c55e;
                    font-weight: 700;
                    font-size: 0.85rem;
                    width: 22px;
                    height: 22px;
                    display: inline-flex;
                    align-items: center;
                    justify-content: center;
                    background: rgba(34, 197, 94, 0.12);
                    border-radius: 50%;
                    flex-shrink: 0;
                }

                @media (max-width: 992px) {
                    .ta-grid {
                        grid-template-columns: 1fr;
                        max-width: 440px;
                        margin: 0 auto;
                        gap: 20px;
                    }
                    .ta-card { min-height: auto; }
                }
                @media (max-width: 576px) {
                    .ta-title { font-size: 1.8rem; }
                    .ta-subtitle { font-size: 0.92rem; }
                    .ta-card-inner { padding: 28px 22px 22px; }
                    .ta-card-title { font-size: 1.2rem; }
                    .ta-card-desc { font-size: 0.85rem; }
                    .ta-header { margin-bottom: 36px; }
                }
            `}</style>
        </section>
    )
}
