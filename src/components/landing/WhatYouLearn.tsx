'use client'

import { motion } from 'framer-motion'

const SystemIcon = () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10" />
        <circle cx="12" cy="12" r="6" />
        <circle cx="12" cy="12" r="2" />
    </svg>
)

const TemplatesIcon = () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" />
        <rect x="8" y="2" width="8" height="4" rx="1" ry="1" />
        <path d="M12 11h4" /><path d="M12 16h4" /><path d="M8 11h.01" /><path d="M8 16h.01" />
    </svg>
)

const MappingIcon = () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="m3 6 6-3 6 3 6-3v15l-6 3-6-3-6 3V6z" />
        <path d="M9 3v15" /><path d="M15 6v15" />
    </svg>
)

const WritingIcon = () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 20h9" /><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" />
    </svg>
)

const DebugIcon = () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z" />
    </svg>
)

const QualityIcon = () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
        <polyline points="22 4 12 14.01 9 11.01" />
    </svg>
)

const features = [
    {
        icon: <SystemIcon />,
        title: 'نظام عمل ثابت',
        description: 'Pipeline واضح يعتمد على برومبتات قصيرة متسلسلة بدلاً من برومبت واحد مربك'
    },
    {
        icon: <TemplatesIcon />,
        title: 'قوالب جاهزة للنسخ',
        description: '50+ قالب عملي لـ: المواقع، التطبيقات، المواصفات، المحتوى، والاختبار'
    },
    {
        icon: <MappingIcon />,
        title: 'خرائط وتدفقات',
        description: 'تعلم بناء Sitemap و User Flow احترافي لأي مشروع'
    },
    {
        icon: <WritingIcon />,
        title: 'كتابة UX احترافية',
        description: 'Microcopy وصفحات بيع تحوّل الزوار إلى عملاء'
    },
    {
        icon: <DebugIcon />,
        title: 'برومبتات الإصلاح',
        description: 'Debug Prompts لتصحيح الأخطاء عندما تسوء النتائج'
    },
    {
        icon: <QualityIcon />,
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
        <section className="landing-section landing-section-dark">
            <div className="landing-glow" style={{ top: '10%', right: '5%' }} />
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
                            whileHover={{ y: -5 }}
                            className="feature-card glass-card"
                        >
                            <div className="feature-icon">{feature.icon}</div>
                            <h3 className="feature-title" style={{ fontSize: '1.4rem', marginBottom: '15px', color: 'white' }}>{feature.title}</h3>
                            <p className="feature-description" style={{ fontSize: '1.05rem', lineHeight: '1.7', color: 'rgba(255, 255, 255, 0.7)' }}>{feature.description}</p>
                        </motion.div>
                    ))}
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
                    max-width: 500px;
                    margin: 0 auto;
                }

                .feature-icon {
                    width: 65px;
                    height: 65px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    background: rgba(255, 107, 53, 0.1);
                    border-radius: 18px;
                    margin: 0 auto 25px auto;
                    color: #FF6B35;
                    padding: 15px;
                    border: 1px solid rgba(255, 107, 53, 0.2);
                    transition: all 0.3s ease;
                }

                .feature-card:hover .feature-icon {
                    background: rgba(255, 107, 53, 0.2);
                    transform: scale(1.1);
                    box-shadow: 0 0 20px rgba(255, 107, 53, 0.3);
                }
            `}</style>
        </section>
    )
}
