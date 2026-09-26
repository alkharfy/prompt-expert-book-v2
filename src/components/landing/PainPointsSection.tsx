'use client'

import { motion } from 'framer-motion'

const painPoints = [
    {
        emoji: '😤',
        problem: 'بتكتب أمر لـ AI وبيطلعلك نتيجة محبطة',
        solution: 'إطار GOLDS يساعدك توضّح المطلوب وتحسّن إجابتك بالتجربة',
    },
    {
        emoji: '🤯',
        problem: 'ChatGPT مش بيفهمك مهما جربت',
        solution: 'هتتعلّم تحدد السياق وتراجع الإجابة وتطلب تصحيحها',
    },
    {
        emoji: '⏰',
        problem: 'مهام الدراسة والشغل بتاخد وقت طويل في التحضير',
        solution: '45 تمرين عملي تطبقهم فوراً على شغلك',
    },
    {
        emoji: '📉',
        problem: 'بتدفع فلوس على أدوات AI ومش بتستفيد منها',
        solution: 'هتستخرج أقصى قيمة من ChatGPT, Claude وغيرهم',
    },
]

export default function PainPointsSection() {
    return (
        <section className="landing-section landing-section-darker">
            <div className="landing-glow" style={{ top: '30%', right: '5%' }} />
            <div className="container">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.6 }}
                    className="section-header"
                >
                    <h2 className="section-title">هل بتواجه المشاكل دي؟</h2>
                </motion.div>

                <div className="pain-list">
                    {painPoints.map((item, index) => (
                        <motion.div
                            key={index}
                            initial={{ opacity: 0, y: 15 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ delay: index * 0.08 }}
                            className="pain-row"
                        >
                            <span className="pain-emoji">{item.emoji}</span>
                            <div className="pain-texts">
                                <span className="problem-text">{item.problem}</span>
                                <span className="arrow-icon">←</span>
                                <span className="solution-text">{item.solution}</span>
                            </div>
                        </motion.div>
                    ))}
                </div>
            </div>

            <style jsx>{`
                .container {
                    max-width: 800px;
                    margin: 0 auto;
                    padding: 0 20px;
                }

                .section-header {
                    text-align: center;
                    margin-bottom: 36px;
                }

                .section-title {
                    font-size: 2rem;
                    font-weight: 800;
                    color: white;
                    background: linear-gradient(135deg, #fff 0%, #FF6B35 100%);
                    -webkit-background-clip: text;
                    -webkit-text-fill-color: transparent;
                    background-clip: text;
                }

                .pain-list {
                    display: flex;
                    flex-direction: column;
                    gap: 14px;
                }

                .pain-row {
                    display: flex;
                    align-items: center;
                    gap: 16px;
                    padding: 18px 24px;
                    background: rgba(255, 255, 255, 0.03);
                    border: 1px solid rgba(255, 255, 255, 0.06);
                    border-radius: 14px;
                    transition: border-color 0.2s;
                }

                .pain-row:hover {
                    border-color: rgba(255, 107, 53, 0.2);
                }

                .pain-emoji {
                    font-size: 1.6rem;
                    flex-shrink: 0;
                }

                .pain-texts {
                    display: flex;
                    align-items: center;
                    gap: 10px;
                    flex-wrap: wrap;
                }

                .problem-text {
                    font-size: 1rem;
                    color: rgba(255, 255, 255, 0.85);
                    font-weight: 600;
                }

                .arrow-icon {
                    color: #FF6B35;
                    font-weight: 700;
                    flex-shrink: 0;
                }

                .solution-text {
                    font-size: 0.95rem;
                    color: #FF8C42;
                    font-weight: 500;
                }

                @media (max-width: 576px) {
                    .section-title {
                        font-size: 1.6rem;
                    }

                    .pain-row {
                        padding: 14px 16px;
                        gap: 12px;
                    }

                    .pain-texts {
                        flex-direction: column;
                        align-items: flex-start;
                        gap: 4px;
                    }

                    .arrow-icon {
                        display: none;
                    }

                    .problem-text {
                        font-size: 0.95rem;
                    }

                    .solution-text {
                        font-size: 0.85rem;
                    }
                }
            `}</style>
        </section>
    )
}
