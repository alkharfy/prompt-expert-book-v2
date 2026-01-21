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
        <section className="faq-section">
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
                            className={`faq-item ${openIndex === index ? 'open' : ''}`}
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
                    initial={{ opacity: 0 }}
                    whileInView={{ opacity: 1 }}
                    viewport={{ once: true }}
                    transition={{ delay: 0.5 }}
                    className="faq-cta"
                >
                    <p>لديك سؤال آخر؟</p>
                    <a href="mailto:support@promptexpert.com" className="contact-link">
                        تواصل معنا 📧
                    </a>
                </motion.div>
            </div>

            <style jsx>{`
                .faq-section {
                    padding: 100px 0;
                    background: linear-gradient(180deg, rgba(26, 26, 46, 0.95) 0%, rgba(22, 33, 62, 0.98) 100%);
                }

                .container {
                    max-width: 800px;
                    margin: 0 auto;
                    padding: 0 20px;
                }

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
                }

                .section-subtitle {
                    font-size: 1.1rem;
                    color: rgba(255, 255, 255, 0.7);
                }

                .faq-list {
                    display: flex;
                    flex-direction: column;
                    gap: 15px;
                }

                .faq-item {
                    background: rgba(255, 255, 255, 0.03);
                    border: 1px solid rgba(255, 255, 255, 0.08);
                    border-radius: 16px;
                    overflow: hidden;
                    transition: all 0.3s ease;
                }

                .faq-item:hover {
                    border-color: rgba(255, 107, 53, 0.3);
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
                    padding: 22px 25px;
                    background: none;
                    border: none;
                    color: white;
                    font-size: 1.05rem;
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
                    text-align: center;
                    margin-top: 50px;
                    padding: 30px;
                    background: rgba(255, 255, 255, 0.03);
                    border-radius: 16px;
                    border: 1px solid rgba(255, 255, 255, 0.08);
                }

                .faq-cta p {
                    color: rgba(255, 255, 255, 0.7);
                    margin-bottom: 10px;
                }

                .contact-link {
                    color: #FF6B35;
                    font-weight: 600;
                    text-decoration: none;
                    font-size: 1.1rem;
                    transition: all 0.3s;
                }

                .contact-link:hover {
                    color: #FF8C42;
                }

                @media (max-width: 576px) {
                    .faq-section {
                        padding: 60px 0;
                    }

                    .section-title {
                        font-size: 1.8rem;
                    }

                    .faq-question {
                        font-size: 0.95rem;
                        padding: 18px 20px;
                    }

                    .faq-answer {
                        padding: 0 20px 18px;
                    }
                }
            `}</style>
        </section>
    )
}
