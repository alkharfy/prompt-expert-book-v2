'use client'

import { motion } from 'framer-motion'

const features = [
    {
        icon: '🎯',
        title: 'نظام عمل ثابت',
        description: 'Pipeline واضح يعتمد على برومبتات قصيرة متسلسلة بدلاً من برومبت واحد مربك'
    },
    {
        icon: '📋',
        title: 'قوالب جاهزة للنسخ',
        description: '50+ قالب عملي لـ: المواقع، التطبيقات، المواصفات، المحتوى، والاختبار'
    },
    {
        icon: '🗺️',
        title: 'خرائط وتدفقات',
        description: 'تعلم بناء Sitemap و User Flow احترافي لأي مشروع'
    },
    {
        icon: '✍️',
        title: 'كتابة UX احترافية',
        description: 'Microcopy وصفحات بيع تحوّل الزوار إلى عملاء'
    },
    {
        icon: '🔧',
        title: 'برومبتات الإصلاح',
        description: 'Debug Prompts لتصحيح الأخطاء عندما تسوء النتائج'
    },
    {
        icon: '✅',
        title: 'قوائم فحص الجودة',
        description: 'Checklists للتأكد من الاتساق والقابلية للتنفيذ'
    }
]

const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
        opacity: 1,
        transition: {
            staggerChildren: 0.1
        }
    }
}

const itemVariants = {
    hidden: { opacity: 0, y: 30 },
    visible: {
        opacity: 1,
        y: 0,
        transition: { duration: 0.5 }
    }
}

export default function WhatYouLearn() {
    return (
        <section className="what-you-learn-section">
            <div className="container">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.6 }}
                    className="section-header"
                >
                    <span className="section-badge">📚 محتوى الكتاب</span>
                    <h2 className="section-title">ماذا ستتعلم؟</h2>
                    <p className="section-subtitle">
                        89 صفحة من المحتوى العملي القابل للتطبيق فوراً
                    </p>
                </motion.div>

                <motion.div
                    variants={containerVariants}
                    initial="hidden"
                    whileInView="visible"
                    viewport={{ once: true }}
                    className="features-grid"
                >
                    {features.map((feature, index) => (
                        <motion.div
                            key={index}
                            variants={itemVariants}
                            className="feature-card"
                        >
                            <div className="feature-icon">{feature.icon}</div>
                            <h3 className="feature-title">{feature.title}</h3>
                            <p className="feature-description">{feature.description}</p>
                        </motion.div>
                    ))}
                </motion.div>
            </div>

            <style jsx>{`
                .what-you-learn-section {
                    padding: 100px 0;
                    background: linear-gradient(180deg, rgba(26, 26, 46, 0.95) 0%, rgba(22, 33, 62, 0.98) 100%);
                    position: relative;
                }

                .what-you-learn-section::before {
                    content: '';
                    position: absolute;
                    top: 0;
                    left: 0;
                    right: 0;
                    height: 1px;
                    background: linear-gradient(90deg, transparent, rgba(255, 107, 53, 0.3), transparent);
                }

                .container {
                    max-width: 1200px;
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
                    background: linear-gradient(135deg, #fff 0%, #FF6B35 100%);
                    -webkit-background-clip: text;
                    -webkit-text-fill-color: transparent;
                    background-clip: text;
                }

                .section-subtitle {
                    font-size: 1.1rem;
                    color: rgba(255, 255, 255, 0.7);
                    max-width: 500px;
                    margin: 0 auto;
                }

                .features-grid {
                    display: grid;
                    grid-template-columns: repeat(3, 1fr);
                    gap: 30px;
                }

                .feature-card {
                    background: rgba(255, 255, 255, 0.03);
                    border: 1px solid rgba(255, 255, 255, 0.08);
                    border-radius: 20px;
                    padding: 35px 30px;
                    text-align: center;
                    transition: all 0.3s ease;
                    position: relative;
                    overflow: hidden;
                }

                .feature-card::before {
                    content: '';
                    position: absolute;
                    top: 0;
                    left: 0;
                    right: 0;
                    height: 3px;
                    background: linear-gradient(90deg, #FF6B35, #FF8C42);
                    opacity: 0;
                    transition: opacity 0.3s;
                }

                .feature-card:hover {
                    transform: translateY(-5px);
                    border-color: rgba(255, 107, 53, 0.3);
                    background: rgba(255, 107, 53, 0.05);
                }

                .feature-card:hover::before {
                    opacity: 1;
                }

                .feature-icon {
                    font-size: 3rem;
                    margin-bottom: 20px;
                    display: inline-block;
                }

                .feature-title {
                    font-size: 1.2rem;
                    font-weight: 700;
                    color: white;
                    margin-bottom: 12px;
                }

                .feature-description {
                    font-size: 0.95rem;
                    color: rgba(255, 255, 255, 0.6);
                    line-height: 1.7;
                }

                @media (max-width: 992px) {
                    .features-grid {
                        grid-template-columns: repeat(2, 1fr);
                    }
                }

                @media (max-width: 576px) {
                    .what-you-learn-section {
                        padding: 60px 0;
                    }

                    .section-title {
                        font-size: 1.8rem;
                    }

                    .features-grid {
                        grid-template-columns: 1fr;
                        gap: 20px;
                    }

                    .feature-card {
                        padding: 25px 20px;
                    }
                }
            `}</style>
        </section>
    )
}
