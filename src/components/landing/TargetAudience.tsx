'use client'

import { motion } from 'framer-motion'

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

const audiences = [
    {
        icon: <BusinessIcon />,
        title: 'صاحب مشروع',
        description: 'تريد تحويل فكرتك إلى منتج رقمي حقيقي بدون الحاجة لفريق تقني كامل',
        painPoints: ['لا وقت لتعلم البرمجة', 'ميزانية محدودة', 'تحتاج نتائج سريعة']
    },
    {
        icon: <CreatorIcon />,
        title: 'صانع محتوى',
        description: 'تبحث عن نظام عمل منظم لإنتاج محتوى احترافي بسرعة وكفاءة',
        painPoints: ['ضغط المواعيد', 'جودة غير متسقة', 'إرهاق إبداعي']
    },
    {
        icon: <DesignerIcon />,
        title: 'مصمم UX/UI',
        description: 'تريد التفكير والتخطيط كمحترف قبل الانتقال للتصميم',
        painPoints: ['متطلبات غير واضحة', 'تغييرات مستمرة', 'توثيق ضعيف']
    },
    {
        icon: <StartupIcon />,
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
        <section className="landing-section landing-section-darker">
            <div className="landing-glow" style={{ bottom: '10%', left: '5%' }} />
            <div className="container">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.6 }}
                    className="section-header"
                >
                    <span className="section-badge">🎯 لمن هذا الكتاب؟</span>
                    <h2 className="section-title">هل أنت الشخص المستهدف؟</h2>
                    <p className="section-subtitle">
                        صُمم هذا الكتاب خصيصاً ليساعدك على اختصار سنوات من التعلم
                    </p>
                </motion.div>

                <div className="audience-grid">
                    {audiences.map((audience, index) => (
                        <motion.div
                            key={index}
                            initial={{ opacity: 0, y: 30 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ delay: index * 0.1 }}
                            className="audience-card glass-card"
                        >
                            <div className="audience-icon-wrapper">
                                {audience.icon}
                            </div>
                            <h3 className="audience-title">{audience.title}</h3>
                            <p className="audience-description">{audience.description}</p>

                            <div className="pain-points">
                                {audience.painPoints.map((point, pIndex) => (
                                    <div key={pIndex} className="pain-point">
                                        <span className="pain-dot"></span>
                                        <span>{point}</span>
                                    </div>
                                ))}
                            </div>
                        </motion.div>
                    ))}
                </div>

                {/* Not For Section */}
                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    whileInView={{ opacity: 1, scale: 1 }}
                    viewport={{ once: true }}
                    className="not-for-box glass-card"
                >
                    <div className="not-for-header">
                        <span className="not-icon">🛑</span>
                        <h3>هذا الكتاب ليس لك إذا:</h3>
                    </div>
                    <ul className="not-for-list">
                        <li>تبحث عن "زر سحري" للثراء السريع دون جهد.</li>
                        <li>لا تريد تطبيق ما تتعلمه بشكل عملي.</li>
                        <li>تعتقد أن الذكاء الاصطناعي مجرد "لعبة" للتسلية فقط.</li>
                    </ul>
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
                    background: linear-gradient(135deg, #fff 0%, #FF6B35 100%);
                    -webkit-background-clip: text;
                    -webkit-text-fill-color: transparent;
                    background-clip: text;
                }

                .section-subtitle {
                    font-size: 1.1rem;
                    color: rgba(255, 255, 255, 0.7);
                }

                .audience-grid {
                    display: grid;
                    grid-template-columns: repeat(3, 1fr);
                    gap: 40px;
                    margin-bottom: 60px;
                }

                .audience-card {
                    padding: 50px 40px;
                    text-align: center;
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                }

                .audience-icon-wrapper {
                    width: 70px;
                    height: 70px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    background: rgba(255, 107, 53, 0.1);
                    border-radius: 20px;
                    margin-bottom: 25px;
                    color: #FF6B35;
                    padding: 18px;
                    border: 1px solid rgba(255, 107, 53, 0.2);
                    filter: drop-shadow(0 0 15px rgba(255, 107, 53, 0.2));
                }

                .audience-card:hover .audience-icon-wrapper {
                    background: rgba(255, 107, 53, 0.2);
                    transform: scale(1.05);
                    border-color: rgba(255, 107, 53, 0.4);
                }

                .audience-title {
                    font-size: 1.5rem;
                    font-weight: 800;
                    color: white;
                    margin-bottom: 15px;
                }

                .audience-description {
                    font-size: 1.05rem;
                    color: rgba(255, 255, 255, 0.65);
                    line-height: 1.7;
                    margin-bottom: 30px;
                }

                .pain-points {
                    margin-top: auto;
                    width: 100%;
                    text-align: right;
                    background: rgba(0, 0, 0, 0.2);
                    padding: 25px;
                    border-radius: 18px;
                    border: 1px solid rgba(255, 255, 255, 0.03);
                }

                .pain-point {
                    display: flex;
                    align-items: center;
                    gap: 12px;
                    font-size: 0.95rem;
                    color: rgba(255, 255, 255, 0.6);
                    margin-bottom: 12px;
                }

                .pain-dot {
                    width: 6px;
                    height: 6px;
                    background: #FF6B35;
                    border-radius: 50%;
                    box-shadow: 0 0 8px #FF6B35;
                }

                .pain-point:last-child {
                    margin-bottom: 0;
                }

                .not-for-box {
                    max-width: 800px;
                    margin: 0 auto;
                    padding: 40px;
                    background: rgba(220, 38, 38, 0.03);
                    border-color: rgba(220, 38, 38, 0.1);
                }
                
                .not-for-box:hover {
                    border-color: rgba(220, 38, 38, 0.3);
                    background: rgba(220, 38, 38, 0.05);
                }

                .not-for-box::after {
                    background: linear-gradient(90deg, #dc2626, #ef4444);
                }

                .not-for-header {
                    display: flex;
                    align-items: center;
                    gap: 15px;
                    margin-bottom: 20px;
                    justify-content: center;
                }

                .not-icon {
                    font-size: 1.5rem;
                }

                .not-for-header h3 {
                    font-size: 1.5rem;
                    font-weight: 700;
                    color: #ef4444;
                }

                .not-for-list {
                    list-style: none;
                    padding: 0;
                    display: flex;
                    flex-direction: column;
                    gap: 12px;
                }

                .not-for-list li {
                    color: rgba(255, 255, 255, 0.6);
                    font-size: 1rem;
                    display: flex;
                    align-items: center;
                    gap: 10px;
                    justify-content: center;
                }

                .not-for-list li::before {
                    content: '✕';
                    color: #ef4444;
                    font-weight: bold;
                }

                @media (max-width: 992px) {
                    .audience-grid {
                        grid-template-columns: 1fr;
                        max-width: 500px;
                        margin-left: auto;
                        margin-right: auto;
                    }
                }

                @media (max-width: 576px) {
                    .section-title {
                        font-size: 1.8rem;
                    }

                    .not-for-box {
                        padding: 25px 20px;
                    }
                }
            `}</style>
        </section>
    )
}
