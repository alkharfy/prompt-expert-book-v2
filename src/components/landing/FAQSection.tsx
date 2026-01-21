'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

const faqs = [
    {
        question: 'هل أحتاج خبرة برمجية لاستخدام هذا الكتاب؟',
        answer: 'لا، الكتاب مصمم للمبتدئين تماماً. لا تحتاج أي خبرة برمجية. الهدف هو تعليمك كيف تفكر وتخطط بشكل احترافي، ثم تستخدم الذكاء الاصطناعي لتنفيذ أفكارك.'
    },
    {
        question: 'كم يستغرق إنهاء الكتاب؟',
        answer: 'صممنا خطة 7 أيام مكثفة للانتهاء من الكتاب مع تطبيق عملي. لكن يمكنك أخذ وقتك والتعلم بالسرعة المناسبة لك. الوصول للمحتوى متاح لمدة سنة كاملة.'
    },
    {
        question: 'ما الذي أحصل عليه بالضبط؟',
        answer: 'تحصل على الكتاب الإلكتروني كاملاً (89 صفحة)، تمارين تفاعلية، وفي الخطة المتقدمة: 50+ قالب جاهز للنسخ وشهادة إتمام معتمدة. في خطة VIP تحصل على استشارة خاصة ودعم أولوية.'
    },
    {
        question: 'هل يمكنني استرداد أموالي إذا لم أكن راضياً؟',
        answer: 'نعم! نقدم ضمان استرداد الأموال لمدة 30 يوماً. إذا لم تكن راضياً عن المحتوى لأي سبب، تواصل معنا وسنرد لك المبلغ كاملاً بدون أسئلة.'
    },
    {
        question: 'هل المحتوى يُحدَّث؟',
        answer: 'نعم، نحدث المحتوى باستمرار مع تطور أدوات الذكاء الاصطناعي. مشتركو الخطة المتقدمة و VIP يحصلون على جميع التحديثات مجاناً مدى الحياة.'
    }
]

export default function FAQSection() {
    const [openIndex, setOpenIndex] = useState<number | null>(0)

    return (
        <section className="landing-section landing-section-darker">
            <div className="landing-glow" style={{ top: '30%', right: '10%' }} />
            <div className="container">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.6 }}
                    className="section-header"
                >
                    <span className="section-badge">❓ أسئلة شائعة</span>
                    <h2 className="section-title">الأسئلة المتكررة</h2>
                    <p className="section-subtitle">
                        إجابات على أكثر الأسئلة شيوعاً
                    </p>
                </motion.div>

                <div className="faq-list">
                    {faqs.map((faq, index) => (
                        <motion.div
                            key={index}
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ delay: index * 0.1 }}
                            className={`faq-item glass-card ${openIndex === index ? 'open' : ''}`}
                        >
                            <button
                                className="faq-question"
                                onClick={() => setOpenIndex(openIndex === index ? null : index)}
                            >
                                <span>{faq.question}</span>
                                <span className="faq-icon">
                                    {openIndex === index ? '−' : '+'}
                                </span>
                            </button>

                            <AnimatePresence>
                                {openIndex === index && (
                                    <motion.div
                                        initial={{ height: 0, opacity: 0 }}
                                        animate={{ height: 'auto', opacity: 1 }}
                                        exit={{ height: 0, opacity: 0 }}
                                        transition={{ duration: 0.3 }}
                                        className="faq-answer-wrapper"
                                    >
                                        <p className="faq-answer">{faq.answer}</p>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </motion.div>
                    ))}
                </div>

                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: 0.5 }}
                    className="faq-cta glass-card"
                >
                    <div className="faq-cta-content">
                        <div className="faq-cta-icon">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="28" height="28">
                                <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                                <polyline points="22,6 12,13 2,6" />
                            </svg>
                        </div>
                        <div className="faq-cta-text">
                            <h3>لديك سؤال آخر؟</h3>
                            <p>فريقنا مستعد للإجابة على جميع استفساراتك في أي وقت.</p>
                        </div>
                    </div>
                    <a href="mailto:support@promptexpert.com" className="contact-btn">
                        تواصل معنا الآن
                    </a>
                </motion.div>
            </div>

            <style jsx>{`
                .section-header {
                    text-align: center;
                    margin-bottom: 50px;
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

                .faq-list {
                    display: flex;
                    flex-direction: column;
                    gap: 25px;
                    max-width: 800px;
                    margin: 0 auto;
                }

                .faq-item {
                    overflow: hidden;
                    border-radius: 16px;
                }

                .faq-item.open {
                    border-color: rgba(255, 107, 53, 0.5);
                    background: rgba(255, 107, 53, 0.05);
                }

                .faq-question {
                    width: 100%;
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                    gap: 20px;
                    padding: 28px 32px;
                    background: none;
                    border: none;
                    color: white;
                    font-size: 1.1rem;
                    font-weight: 600;
                    text-align: right;
                    cursor: pointer;
                    transition: all 0.3s;
                }

                .faq-question:hover {
                    color: #FF6B35;
                }

                .faq-icon {
                    flex-shrink: 0;
                    width: 30px;
                    height: 30px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    background: rgba(255, 107, 53, 0.15);
                    border-radius: 50%;
                    color: #FF6B35;
                    font-size: 1.3rem;
                    font-weight: 300;
                    transition: all 0.3s;
                }

                .faq-item.open .faq-icon {
                    background: #FF6B35;
                    color: white;
                }

                .faq-answer-wrapper {
                    overflow: hidden;
                }

                .faq-answer {
                    padding: 0 25px 22px;
                    color: rgba(255, 255, 255, 0.7);
                    font-size: 0.95rem;
                    line-height: 1.8;
                }

                .faq-cta {
                    display: grid;
                    grid-template-columns: 1fr auto;
                    align-items: center;
                    max-width: 900px;
                    margin: 80px auto 0;
                    padding: 35px 45px !important;
                    gap: 40px;
                    border: 1px solid rgba(255, 107, 53, 0.2) !important;
                    background: rgba(255, 107, 53, 0.05) !important;
                    text-align: right;
                    position: relative;
                    z-index: 1;
                }

                .faq-cta-content {
                    display: flex;
                    align-items: center;
                    gap: 25px;
                    min-width: 0; /* Allow shrinking */
                }

                .faq-cta-icon {
                    color: #FF6B35;
                    background: rgba(255, 107, 53, 0.1);
                    width: 65px;
                    height: 65px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    border-radius: 18px;
                    flex-shrink: 0;
                    border: 1px solid rgba(255, 107, 53, 0.2);
                    box-shadow: 0 8px 16px rgba(0, 0, 0, 0.2);
                }

                .faq-cta-text {
                    flex: 1;
                    min-width: 0;
                }

                .faq-cta-text h3 {
                    color: white;
                    font-size: 1.4rem;
                    font-weight: 800;
                    margin-bottom: 8px;
                }

                .faq-cta-text p {
                    color: rgba(255, 255, 255, 0.8);
                    font-size: 1rem;
                    margin: 0;
                    line-height: 1.6;
                }

                .contact-btn {
                    background: linear-gradient(135deg, #FF6B35, #FF8C42);
                    color: white;
                    padding: 12px 28px;
                    border-radius: 12px;
                    font-weight: 700;
                    text-decoration: none;
                    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
                    white-space: nowrap;
                    box-shadow: 0 10px 25px rgba(255, 107, 53, 0.3);
                    font-size: 0.95rem;
                    display: inline-block;
                }

                .contact-btn:hover {
                    transform: translateY(-3px);
                    box-shadow: 0 15px 35px rgba(255, 107, 53, 0.4);
                    filter: brightness(1.1);
                }

                @media (max-width: 992px) {
                    .faq-cta {
                        grid-template-columns: 1fr;
                        text-align: center;
                        gap: 25px;
                        padding: 40px 30px !important;
                    }
                    .faq-cta-content {
                        flex-direction: column;
                        text-align: center;
                        gap: 20px;
                    }
                    .contact-btn {
                        width: auto;
                        min-width: 200px;
                        max-width: 260px;
                        margin: 10px auto 0;
                    }
                }

                @media (max-width: 768px) {
                    .faq-cta {
                        margin-top: 60px;
                        padding: 35px 20px !important;
                    }
                    .section-title {
                        font-size: 1.8rem;
                    }
                    .faq-question {
                        font-size: 1rem;
                        padding: 22px 25px;
                    }
                    .faq-cta-text h3 {
                        font-size: 1.25rem;
                    }
                    .faq-cta-text p {
                        font-size: 0.95rem;
                    }
                }
            `}</style>
        </section>
    )
}
