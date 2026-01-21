'use client'

import { motion } from 'framer-motion'

const audiences = [
    {
        icon: '💼',
        title: 'صاحب مشروع',
        description: 'تريد تحويل فكرتك إلى منتج رقمي حقيقي بدون الحاجة لفريق تقني كامل',
        painPoints: ['لا وقت لتعلم البرمجة', 'ميزانية محدودة', 'تحتاج نتائج سريعة']
    },
    {
        icon: '✏️',
        title: 'صانع محتوى',
        description: 'تبحث عن نظام عمل منظم لإنتاج محتوى احترافي بسرعة وكفاءة',
        painPoints: ['ضغط المواعيد', 'جودة غير متسقة', 'إرهاق إبداعي']
    },
    {
        icon: '🎨',
        title: 'مصمم UX/UI',
        description: 'تريد التفكير والتخطيط كمحترف قبل الانتقال للتصميم',
        painPoints: ['متطلبات غير واضحة', 'تغييرات مستمرة', 'توثيق ضعيف']
    },
    {
        icon: '🚀',
        title: 'رائد أعمال',
        description: 'تسعى لإطلاق MVP سريع لاختبار فكرتك في السوق',
        painPoints: ['سرعة الإطلاق', 'تكلفة التطوير', 'التحقق من الفكرة']
    }
]

const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
        opacity: 1,
        transition: {
            staggerChildren: 0.15
        }
    }
}

const itemVariants = {
    hidden: { opacity: 0, scale: 0.9 },
    visible: {
        opacity: 1,
        scale: 1,
        transition: { duration: 0.5 }
    }
}

export default function TargetAudience() {
    return (
        <section className="target-audience-section">
            <div className="container">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.6 }}
                    className="section-header"
                >
                    <span className="section-badge">🎯 الفئة المستهدفة</span>
                    <h2 className="section-title">هل هذا الكتاب مناسب لك؟</h2>
                    <p className="section-subtitle">
                        صُمم خصيصاً لمن يريد تحويل الأفكار إلى مخرجات حقيقية
                    </p>
                </motion.div>

                <motion.div
                    variants={containerVariants}
                    initial="hidden"
                    whileInView="visible"
                    viewport={{ once: true }}
                    className="audience-grid"
                >
                    {audiences.map((audience, index) => (
                        <motion.div
                            key={index}
                            variants={itemVariants}
                            className="audience-card"
                        >
                            <div className="audience-icon">{audience.icon}</div>
                            <h3 className="audience-title">{audience.title}</h3>
                            <p className="audience-description">{audience.description}</p>
                            
                            <div className="pain-points">
                                <span className="pain-label">التحديات:</span>
                                <ul>
                                    {audience.painPoints.map((point, i) => (
                                        <li key={i}>
                                            <span className="check-icon">✓</span>
                                            {point}
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        </motion.div>
                    ))}
                </motion.div>

                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: 0.5 }}
                    className="not-for-section"
                >
                    <p className="not-for-text">
                        <span className="not-for-icon">⚠️</span>
                        <strong>غير مناسب</strong> لمن يبحث عن شرح أكواد برمجية أو تطوير تفصيلي — هذا الكتاب عن <em>التفكير والتخطيط</em> لا البرمجة
                    </p>
                </motion.div>
            </div>

            <style jsx>{`
                .target-audience-section {
                    padding: 100px 0;
                    background: linear-gradient(180deg, rgba(22, 33, 62, 0.98) 0%, rgba(26, 26, 46, 0.95) 100%);
                    position: relative;
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
                }

                .section-subtitle {
                    font-size: 1.1rem;
                    color: rgba(255, 255, 255, 0.7);
                    max-width: 500px;
                    margin: 0 auto;
                }

                .audience-grid {
                    display: grid;
                    grid-template-columns: repeat(4, 1fr);
                    gap: 25px;
                }

                .audience-card {
                    background: linear-gradient(145deg, rgba(255, 255, 255, 0.05) 0%, rgba(255, 255, 255, 0.02) 100%);
                    border: 1px solid rgba(255, 255, 255, 0.1);
                    border-radius: 24px;
                    padding: 30px 25px;
                    text-align: center;
                    transition: all 0.3s ease;
                    position: relative;
                    overflow: hidden;
                }

                .audience-card::after {
                    content: '';
                    position: absolute;
                    bottom: 0;
                    left: 0;
                    right: 0;
                    height: 4px;
                    background: linear-gradient(90deg, #FF6B35, #FF8C42, #FFB347);
                    opacity: 0;
                    transition: opacity 0.3s;
                }

                .audience-card:hover {
                    transform: translateY(-8px);
                    border-color: rgba(255, 107, 53, 0.4);
                    box-shadow: 0 20px 40px rgba(255, 107, 53, 0.15);
                }

                .audience-card:hover::after {
                    opacity: 1;
                }

                .audience-icon {
                    font-size: 3.5rem;
                    margin-bottom: 20px;
                    display: block;
                }

                .audience-title {
                    font-size: 1.3rem;
                    font-weight: 700;
                    color: white;
                    margin-bottom: 12px;
                }

                .audience-description {
                    font-size: 0.9rem;
                    color: rgba(255, 255, 255, 0.6);
                    line-height: 1.6;
                    margin-bottom: 20px;
                }

                .pain-points {
                    text-align: right;
                    background: rgba(0, 0, 0, 0.2);
                    border-radius: 12px;
                    padding: 15px;
                }

                .pain-label {
                    display: block;
                    font-size: 0.75rem;
                    color: #FF6B35;
                    font-weight: 600;
                    margin-bottom: 10px;
                    text-transform: uppercase;
                    letter-spacing: 1px;
                }

                .pain-points ul {
                    list-style: none;
                    padding: 0;
                    margin: 0;
                }

                .pain-points li {
                    font-size: 0.85rem;
                    color: rgba(255, 255, 255, 0.7);
                    padding: 5px 0;
                    display: flex;
                    align-items: center;
                    gap: 8px;
                }

                .check-icon {
                    color: #4CAF50;
                    font-weight: bold;
                }

                .not-for-section {
                    margin-top: 50px;
                    text-align: center;
                }

                .not-for-text {
                    display: inline-flex;
                    align-items: center;
                    gap: 10px;
                    background: rgba(255, 193, 7, 0.1);
                    border: 1px solid rgba(255, 193, 7, 0.3);
                    border-radius: 12px;
                    padding: 15px 25px;
                    color: rgba(255, 255, 255, 0.8);
                    font-size: 0.95rem;
                }

                .not-for-icon {
                    font-size: 1.3rem;
                }

                .not-for-text strong {
                    color: #FFC107;
                }

                .not-for-text em {
                    color: #FF6B35;
                    font-style: normal;
                    font-weight: 600;
                }

                @media (max-width: 1024px) {
                    .audience-grid {
                        grid-template-columns: repeat(2, 1fr);
                    }
                }

                @media (max-width: 576px) {
                    .target-audience-section {
                        padding: 60px 0;
                    }

                    .section-title {
                        font-size: 1.8rem;
                    }

                    .audience-grid {
                        grid-template-columns: 1fr;
                        gap: 20px;
                    }

                    .not-for-text {
                        flex-direction: column;
                        text-align: center;
                    }
                }
            `}</style>
        </section>
    )
}
