'use client'

import { useState } from 'react'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import { REFUND_DAYS, SUPPORT_EMAIL, SUPPORT_WHATSAPP_DISPLAY, refundDaysLabel, supportWhatsAppUrl } from '@/lib/config'
import { MONTHLY_PRICE_EGP, PRODUCT_STATS } from '@/lib/pricing'

const faqs = [
    {
        icon: '🤷',
        question: 'أنا عمري ما استخدمت AI. هينفع معايا؟',
        answer: 'أيوه. التمهيد والمستوى 1 معمولين للي بيبدأ من الصفر، من غير مصطلحات ولا برمجة. كل درس فيه خطوة بخطوة، وتمرين على ملف شبه شغلك، والنسخة المجانية من ChatGPT أو Gemini بتكفي لمعظم التمارين.',
    },
    {
        icon: '🪜',
        question: 'الكورس فيه إيه بالظبط؟',
        answer: '5 مستويات. المستوى 1 «بتستخدمه صح» والمستوى 2 «بتطلب زي المحترف» والمستوى 3 «بتجهّزه لشغلك» والمستوى 4 «بيشتغل معاك» والمستوى 5 «نظام شغلك»، كل واحد من ساعتين ونص لـ 3 ساعات. وجنبهم ورش قصيرة (الصور والفيديو ببلاش للكل)، والفصول 6–10 من كتاب PromptMaster للمشتركين. ومعاهم ' + PRODUCT_STATS.exercises + ' تمرين و' + PRODUCT_STATS.templates + ' قالب جاهز.',
    },
    {
        icon: '🗓️',
        question: 'إيه الفرق بين الشهري والسنوي؟',
        answer: 'الشهري بـ' + MONTHLY_PRICE_EGP + ' جنيه فيه الكورس كله: المستويات والتمارين والقوالب و«المستر بيصحّح». السنوي فيه نفس الحاجات لمدة سنة، وزيادة عليها محاضرات أونلاين مباشرة كل شهر. والمتقدمة وVIP بيزوّدوا شهادة إتمام وأدوات ومساعد ذكي.',
    },
    {
        icon: '🔁',
        question: 'الشهري بيتجدد لوحده؟',
        answer: 'لأ. مفيش تجديد تلقائي ومحدش هيسحب من كارتك. لما شهرك يقرّب يخلص، تجدّده بنفسك لو حابب. ولو جدّدت أو حوّلت لسنوي قبل ما يخلص، المدة الجديدة بتبدأ بعد شهرك، فمش هتخسر أيام.',
    },
    {
        icon: '💳',
        question: 'أدفع إزاي؟',
        answer: 'بالفيزا أو الكريدت كارد، أو بمحفظة الموبايل، من صفحة دفع كاشير الآمنة. ولو وقفت معاك حاجة، كلّم خدمة العملاء على واتساب ' + SUPPORT_WHATSAPP_DISPLAY + '.',
    },
    {
        icon: '💰',
        question: 'لو الكورس معجبنيش؟',
        answer: 'عندك ضمان استرداد: خلال ' + refundDaysLabel(REFUND_DAYS.monthly) + ' من الدفع في الشهري، وخلال ' + refundDaysLabel(REFUND_DAYS.yearly) + ' في السنوي. كلّمنا على واتساب أو الإيميل، وبنرجّعلك فلوسك كاملة من غير أسئلة. التفاصيل في صفحة سياسة الاسترداد.',
    },
    {
        icon: '📱',
        question: 'ينفع أذاكر من الموبايل؟',
        answer: 'أيوه، الكورس معمول للموبايل الأول. التمارين بتتعمل من الموبايل، ولو هتشتغل على ملف إكسل كبير، شاشة الكمبيوتر هتريّحك أكتر.',
    },
    {
        icon: '🎯',
        question: 'هطلع من الكورس محترف؟',
        answer: 'هتطلع بحاجات في إيدك: طلبات جاهزة لشغلك، وطريقة تراجع بيها أي رد قبل ما تسلّمه. الاحتراف بييجي من إنك تستخدم ده كل يوم في شغلك. ابدأ بالتمهيد ببلاش وشوف الشرح يناسبك ولا لأ.',
    },
]

export default function FAQSection() {
    const [openIndex, setOpenIndex] = useState<number | null>(0)

    return (
        <section id="faq" className="landing-section landing-section-darker">
            <div className="landing-glow" style={{ top: '30%', right: '10%' }} />
            <div className="container">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.6 }}
                    className="fq-header"
                >
                    <span className="fq-badge">❓ أسئلة بتتسأل كتير</span>
                    <h2 className="fq-title">الأسئلة المتكررة</h2>
                    <p className="fq-subtitle">
                        اللي الناس بتسأل عنه قبل ما تشترك
                    </p>
                </motion.div>

                <div className="fq-container">
                    <div className="fq-list">
                        {faqs.map((faq, index) => {
                            const isOpen = openIndex === index
                            return (
                                <motion.div
                                    key={index}
                                    initial={{ opacity: 0, y: 20 }}
                                    whileInView={{ opacity: 1, y: 0 }}
                                    viewport={{ once: true }}
                                    transition={{ delay: index * 0.08 }}
                                    className={`fq-item ${isOpen ? 'fq-item--open' : ''}`}
                                >
                                    <button
                                        className="fq-question"
                                        onClick={() => setOpenIndex(isOpen ? null : index)}
                                        aria-expanded={isOpen}
                                    >
                                        <span className="fq-question-icon">{faq.icon}</span>
                                        <span className="fq-question-text">{faq.question}</span>
                                        <span className={`fq-chevron ${isOpen ? 'fq-chevron--open' : ''}`}>
                                            <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                                                <path d="M5 7.5L10 12.5L15 7.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                            </svg>
                                        </span>
                                    </button>

                                    <AnimatePresence>
                                        {isOpen && (
                                            <motion.div
                                                initial={{ height: 0, opacity: 0 }}
                                                animate={{ height: 'auto', opacity: 1 }}
                                                exit={{ height: 0, opacity: 0 }}
                                                transition={{ duration: 0.3, ease: 'easeInOut' }}
                                                className="fq-answer-wrapper"
                                            >
                                                <div className="fq-answer">
                                                    <div className="fq-answer-line" />
                                                    <p>{faq.answer}</p>
                                                </div>
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                </motion.div>
                            )
                        })}
                    </div>

                    {/* Side decoration */}
                    <div className="fq-side-decor">
                        <div className="fq-side-card">
                            <div className="fq-side-icon">🗓️</div>
                            <div className="fq-side-stat">{MONTHLY_PRICE_EGP}</div>
                            <div className="fq-side-label">جنيه في الشهر</div>
                        </div>
                        <div className="fq-side-card">
                            <div className="fq-side-icon">✏️</div>
                            <div className="fq-side-stat">{PRODUCT_STATS.exercises}</div>
                            <div className="fq-side-label">تمرين عملي</div>
                        </div>
                        <Link href="/refund-policy" className="fq-side-card">
                            <div className="fq-side-icon">🛡️</div>
                            <div className="fq-side-stat">{refundDaysLabel(REFUND_DAYS.monthly)}</div>
                            <div className="fq-side-label">ضمان استرداد للشهري</div>
                        </Link>
                    </div>
                </div>

                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: 0.4 }}
                    className="fq-cta"
                >
                    <div className="fq-cta-glow" />
                    <div className="fq-cta-content">
                        <div className="fq-cta-icon">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="28" height="28">
                                <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                                <polyline points="22,6 12,13 2,6" />
                            </svg>
                        </div>
                        <div className="fq-cta-text">
                            <h3>عندك سؤال تاني؟</h3>
                            <p>كلّم خدمة العملاء على واتساب: <span dir="ltr">{SUPPORT_WHATSAPP_DISPLAY}</span>، أو ابعت على {SUPPORT_EMAIL}</p>
                        </div>
                    </div>
                    <a href={supportWhatsAppUrl('السلام عليكم، عندي سؤال عن PromptMaster')} target="_blank" rel="noopener noreferrer" className="fq-contact-btn">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="18" height="18">
                            <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                            <polyline points="22,6 12,13 2,6" />
                        </svg>
                        كلّمنا على واتساب
                    </a>
                </motion.div>
            </div>

            <style jsx global>{`
                @property --fq-border-angle {
                    syntax: '<angle>';
                    initial-value: 0deg;
                    inherits: false;
                }

                @keyframes fq-border-spin {
                    to { --fq-border-angle: 360deg; }
                }

                @keyframes fq-pulse-glow {
                    0%, 100% { opacity: 0.4; }
                    50% { opacity: 0.8; }
                }

                .fq-header {
                    text-align: center;
                    margin-bottom: 55px;
                }

                .fq-badge {
                    display: inline-block;
                    background: rgba(255, 107, 53, 0.12);
                    color: #FF6B35;
                    padding: 8px 22px;
                    border-radius: 30px;
                    font-size: 0.9rem;
                    font-weight: 600;
                    margin-bottom: 20px;
                    border: 1px solid rgba(255, 107, 53, 0.25);
                    backdrop-filter: blur(10px);
                }

                .fq-title {
                    font-size: 2.5rem;
                    font-weight: 800;
                    color: white;
                    margin-bottom: 15px;
                    background: linear-gradient(135deg, #fff 0%, #FF6B35 100%);
                    -webkit-background-clip: text;
                    -webkit-text-fill-color: transparent;
                    background-clip: text;
                }

                .fq-subtitle {
                    font-size: 1.1rem;
                    color: rgba(255, 255, 255, 0.65);
                    max-width: 520px;
                    margin: 0 auto;
                    line-height: 1.7;
                }

                /* Container: FAQ list + side decoration */
                .fq-container {
                    display: grid;
                    grid-template-columns: 1fr 220px;
                    gap: 40px;
                    max-width: 1000px;
                    margin: 0 auto;
                    align-items: start;
                }

                /* FAQ List */
                .fq-list {
                    display: flex;
                    flex-direction: column;
                    gap: 16px;
                }

                .fq-item {
                    position: relative;
                    border-radius: 16px;
                    overflow: hidden;
                    background: rgba(255, 255, 255, 0.03);
                    border: 1px solid rgba(255, 255, 255, 0.08);
                    transition: all 0.35s cubic-bezier(0.4, 0, 0.2, 1);
                }

                .fq-item:hover {
                    border-color: rgba(255, 107, 53, 0.25);
                    background: rgba(255, 255, 255, 0.05);
                }

                .fq-item--open {
                    background: rgba(255, 107, 53, 0.04) !important;
                    border-color: transparent !important;
                    box-shadow: 0 8px 32px rgba(255, 107, 53, 0.1);
                }

                /* Rotating border for open item */
                .fq-item--open::before {
                    content: '';
                    position: absolute;
                    inset: -1px;
                    border-radius: 17px;
                    padding: 1.5px;
                    background: conic-gradient(
                        from var(--fq-border-angle),
                        #FF6B35 0%,
                        #FF8C42 25%,
                        rgba(255, 107, 53, 0.2) 50%,
                        #FF8C42 75%,
                        #FF6B35 100%
                    );
                    -webkit-mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
                    -webkit-mask-composite: xor;
                    mask-composite: exclude;
                    animation: fq-border-spin 4s linear infinite;
                    pointer-events: none;
                    z-index: 1;
                }

                .fq-question {
                    width: 100%;
                    display: flex;
                    align-items: center;
                    gap: 16px;
                    padding: 24px 28px;
                    background: none;
                    border: none;
                    color: white;
                    font-size: 1.05rem;
                    font-weight: 600;
                    text-align: right;
                    cursor: pointer;
                    transition: all 0.3s;
                    direction: rtl;
                }

                .fq-question:hover {
                    color: #FF6B35;
                }

                .fq-question-icon {
                    flex-shrink: 0;
                    width: 42px;
                    height: 42px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    background: rgba(255, 107, 53, 0.1);
                    border-radius: 12px;
                    font-size: 1.2rem;
                    border: 1px solid rgba(255, 107, 53, 0.15);
                    transition: all 0.3s;
                }

                .fq-item--open .fq-question-icon {
                    background: rgba(255, 107, 53, 0.2);
                    border-color: rgba(255, 107, 53, 0.4);
                    transform: scale(1.05);
                }

                .fq-question-text {
                    flex: 1;
                }

                .fq-chevron {
                    flex-shrink: 0;
                    width: 32px;
                    height: 32px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    background: rgba(255, 255, 255, 0.06);
                    border-radius: 50%;
                    color: rgba(255, 255, 255, 0.5);
                    transition: all 0.35s cubic-bezier(0.4, 0, 0.2, 1);
                }

                .fq-chevron--open {
                    transform: rotate(180deg);
                    background: rgba(255, 107, 53, 0.2);
                    color: #FF6B35;
                }

                .fq-answer-wrapper {
                    overflow: hidden;
                }

                .fq-answer {
                    padding: 0 28px 24px;
                    padding-right: 86px;
                    direction: rtl;
                }

                .fq-answer-line {
                    width: 40px;
                    height: 3px;
                    background: linear-gradient(90deg, #FF6B35, transparent);
                    border-radius: 2px;
                    margin-bottom: 14px;
                }

                .fq-answer p {
                    color: rgba(255, 255, 255, 0.72);
                    font-size: 0.95rem;
                    line-height: 1.9;
                    margin: 0;
                }

                /* Side decoration cards */
                .fq-side-decor {
                    display: flex;
                    flex-direction: column;
                    gap: 16px;
                    position: sticky;
                    top: 120px;
                }

                .fq-side-card {
                    background: rgba(255, 255, 255, 0.04);
                    border: 1px solid rgba(255, 255, 255, 0.08);
                    border-radius: 16px;
                    padding: 24px 20px;
                    text-align: center;
                    transition: all 0.3s;
                    backdrop-filter: blur(10px);
                }

                .fq-side-card:hover {
                    border-color: rgba(255, 107, 53, 0.3);
                    background: rgba(255, 107, 53, 0.05);
                    transform: translateY(-2px);
                }

                .fq-side-icon {
                    font-size: 1.8rem;
                    margin-bottom: 10px;
                }

                .fq-side-stat {
                    font-size: 1.5rem;
                    font-weight: 800;
                    color: #FF6B35;
                    margin-bottom: 4px;
                    font-feature-settings: 'tnum';
                }

                .fq-side-label {
                    font-size: 0.82rem;
                    color: rgba(255, 255, 255, 0.55);
                    font-weight: 600;
                }

                /* CTA Section */
                .fq-cta {
                    position: relative;
                    display: grid;
                    grid-template-columns: 1fr auto;
                    align-items: center;
                    max-width: 900px;
                    margin: 70px auto 0;
                    padding: 32px 40px;
                    gap: 30px;
                    text-align: right;
                    border-radius: 20px;
                    overflow: hidden;
                    background: rgba(255, 107, 53, 0.04);
                    border: 1px solid transparent;
                    z-index: 1;
                }

                /* Rotating border on CTA */
                .fq-cta::before {
                    content: '';
                    position: absolute;
                    inset: -1px;
                    border-radius: 21px;
                    padding: 1.5px;
                    background: conic-gradient(
                        from var(--fq-border-angle),
                        #FF6B35 0%,
                        #4ECDC4 25%,
                        rgba(255, 255, 255, 0.1) 50%,
                        #4ECDC4 75%,
                        #FF6B35 100%
                    );
                    -webkit-mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
                    -webkit-mask-composite: xor;
                    mask-composite: exclude;
                    animation: fq-border-spin 5s linear infinite;
                    pointer-events: none;
                    z-index: -1;
                }

                .fq-cta-glow {
                    position: absolute;
                    top: 50%;
                    left: 50%;
                    transform: translate(-50%, -50%);
                    width: 300px;
                    height: 150px;
                    background: radial-gradient(ellipse, rgba(255, 107, 53, 0.15), transparent 70%);
                    pointer-events: none;
                    animation: fq-pulse-glow 3s ease-in-out infinite;
                    z-index: -1;
                }

                .fq-cta-content {
                    display: flex;
                    align-items: center;
                    gap: 20px;
                    min-width: 0;
                }

                .fq-cta-icon {
                    color: #FF6B35;
                    background: rgba(255, 107, 53, 0.12);
                    width: 58px;
                    height: 58px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    border-radius: 16px;
                    flex-shrink: 0;
                    border: 1px solid rgba(255, 107, 53, 0.2);
                }

                .fq-cta-text {
                    flex: 1;
                    min-width: 0;
                }

                .fq-cta-text h3 {
                    color: white;
                    font-size: 1.3rem;
                    font-weight: 800;
                    margin: 0 0 6px 0;
                }

                .fq-cta-text p {
                    color: rgba(255, 255, 255, 0.65);
                    font-size: 0.92rem;
                    margin: 0;
                    line-height: 1.6;
                }

                .fq-contact-btn {
                    display: inline-flex;
                    align-items: center;
                    gap: 8px;
                    background: linear-gradient(135deg, #FF6B35, #FF8C42);
                    color: white;
                    padding: 13px 28px;
                    border-radius: 12px;
                    font-weight: 700;
                    text-decoration: none;
                    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
                    white-space: nowrap;
                    box-shadow: 0 8px 24px rgba(255, 107, 53, 0.3);
                    font-size: 0.95rem;
                }

                .fq-contact-btn:hover {
                    transform: translateY(-3px);
                    box-shadow: 0 14px 32px rgba(255, 107, 53, 0.4);
                    filter: brightness(1.1);
                }

                /* Responsive */
                @media (max-width: 992px) {
                    .fq-container {
                        grid-template-columns: 1fr;
                        gap: 30px;
                    }
                    .fq-side-decor {
                        flex-direction: row;
                        justify-content: center;
                        position: static;
                        order: -1;
                    }
                    .fq-side-card {
                        flex: 1;
                        max-width: 200px;
                    }
                    .fq-cta {
                        grid-template-columns: 1fr;
                        text-align: center;
                        gap: 20px;
                        padding: 35px 28px;
                    }
                    .fq-cta-content {
                        flex-direction: column;
                        text-align: center;
                        gap: 16px;
                    }
                    .fq-contact-btn {
                        margin: 0 auto;
                    }
                }

                @media (max-width: 768px) {
                    .fq-title {
                        font-size: 1.8rem;
                    }
                    .fq-question {
                        font-size: 0.97rem;
                        padding: 20px 22px;
                        gap: 12px;
                    }
                    .fq-question-icon {
                        width: 36px;
                        height: 36px;
                        font-size: 1rem;
                        border-radius: 10px;
                    }
                    .fq-answer {
                        padding-right: 70px;
                    }
                    .fq-side-decor {
                        flex-wrap: wrap;
                    }
                    .fq-side-card {
                        min-width: 120px;
                        padding: 18px 14px;
                    }
                    .fq-side-stat {
                        font-size: 1.2rem;
                    }
                    .fq-side-label {
                        font-size: 0.75rem;
                    }
                    .fq-cta {
                        margin-top: 50px;
                        padding: 30px 18px;
                    }
                    .fq-cta-text h3 {
                        font-size: 1.15rem;
                    }
                    .fq-cta-text p {
                        font-size: 0.88rem;
                    }
                }

                @media (max-width: 480px) {
                    .fq-answer {
                        padding-right: 22px;
                    }
                    .fq-side-card {
                        min-width: 90px;
                        padding: 14px 10px;
                    }
                }
            `}</style>
        </section>
    )
}
