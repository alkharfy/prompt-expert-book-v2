'use client'

import { motion } from 'framer-motion'
import Link from 'next/link'

const features = [
    { label: 'عربي 100% بأسلوب مصري', us: true, udemy: 'بعضها', learnprompting: false },
    { label: 'تمارين تفاعلية (45+)', us: true, udemy: false, learnprompting: false },
    { label: 'تتبع تقدم + Streaks', us: true, udemy: false, learnprompting: false },
    { label: '5 ج.م (عرض محدود)', us: true, udemy: false, learnprompting: 'مجاني' },
    { label: 'شهادة قابلة للمشاركة', us: true, udemy: true, learnprompting: false },
    { label: 'مجتمع + Leaderboard', us: true, udemy: false, learnprompting: false },
    { label: 'أسلوب قصصي ممتع', us: true, udemy: false, learnprompting: false },
    { label: 'Gamification كاملة', us: true, udemy: false, learnprompting: false },
]

function renderCell(value: boolean | string) {
    if (value === true) return <span className="check">✓</span>
    if (value === false) return <span className="cross">✕</span>
    return <span className="partial">{value}</span>
}

export default function CompetitorComparison() {
    return (
        <section className="landing-section landing-section-dark">
            <div className="landing-glow" style={{ bottom: '20%', left: '10%' }} />
            <div className="container">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.6 }}
                    className="section-header"
                >
                    <span className="section-badge">⚡ ليه إحنا مختلفين؟</span>
                    <h2 className="section-title">قارن بنفسك</h2>
                    <p className="section-subtitle">
                        شوف الفرق بين PromptMaster والبدائل الثانية
                    </p>
                </motion.div>

                <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: 0.2 }}
                    className="table-wrapper glass-card"
                >
                    <div className="comparison-table-scroll">
                        <table className="comparison-table">
                            <thead>
                                <tr>
                                    <th className="feature-header">الميزة</th>
                                    <th className="our-header">
                                        <span className="our-badge">PromptMaster</span>
                                    </th>
                                    <th>Udemy</th>
                                    <th>LearnPrompting</th>
                                </tr>
                            </thead>
                            <tbody>
                                {features.map((row, index) => (
                                    <motion.tr
                                        key={index}
                                        initial={{ opacity: 0, x: -10 }}
                                        whileInView={{ opacity: 1, x: 0 }}
                                        viewport={{ once: true }}
                                        transition={{ delay: index * 0.06 }}
                                    >
                                        <td className="feature-name">{row.label}</td>
                                        <td className="our-cell">{renderCell(row.us)}</td>
                                        <td>{renderCell(row.udemy)}</td>
                                        <td>{renderCell(row.learnprompting)}</td>
                                    </motion.tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </motion.div>

                {/* Price comparison callout */}
                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    whileInView={{ opacity: 1, scale: 1 }}
                    viewport={{ once: true }}
                    transition={{ delay: 0.3 }}
                    className="price-callout glass-card"
                >
                    <div className="callout-content">
                        <span className="callout-emoji">💡</span>
                        <div>
                            <p className="callout-title">
                                كورس AI واحد على Udemy = 349-2,199 ج.م (فيديو فقط)
                            </p>
                            <p className="callout-subtitle">
                                PromptMaster = <strong>5 ج.م فقط (بكود AI56)</strong> مع تمارين + gamification + شهادة + مجتمع — بدل كورس Udemy بـ 349-2,199 ج.م
                            </p>
                        </div>
                    </div>
                    <Link href="#pricing" className="callout-cta">
                        شوف الخطط والأسعار ←
                    </Link>
                </motion.div>
            </div>

            <style jsx>{`
                .container {
                    max-width: 1200px;
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
                    background: linear-gradient(135deg, #fff 0%, #FF6B35 100%);
                    -webkit-background-clip: text;
                    -webkit-text-fill-color: transparent;
                    background-clip: text;
                }

                .section-subtitle {
                    font-size: 1.1rem;
                    color: rgba(255, 255, 255, 0.7);
                }

                .table-wrapper {
                    padding: 30px;
                    margin-bottom: 40px;
                    overflow: hidden;
                }

                .comparison-table-scroll {
                    overflow-x: auto;
                    -webkit-overflow-scrolling: touch;
                }

                .comparison-table {
                    width: 100%;
                    border-collapse: separate;
                    border-spacing: 0;
                    min-width: 550px;
                }

                .comparison-table th,
                .comparison-table td {
                    padding: 16px 20px;
                    text-align: center;
                    border-bottom: 1px solid rgba(255, 255, 255, 0.06);
                    font-size: 0.95rem;
                }

                .comparison-table thead th {
                    color: rgba(255, 255, 255, 0.5);
                    font-weight: 600;
                    font-size: 0.85rem;
                    padding-bottom: 20px;
                }

                .feature-header {
                    text-align: right !important;
                }

                .feature-name {
                    text-align: right !important;
                    color: rgba(255, 255, 255, 0.8);
                    font-weight: 500;
                }

                .our-header {
                    min-width: 140px;
                }

                .our-badge {
                    display: inline-block;
                    background: linear-gradient(135deg, #FF6B35, #FF8C42);
                    color: white;
                    padding: 6px 16px;
                    border-radius: 20px;
                    font-weight: 700;
                    font-size: 0.85rem;
                }

                .our-cell {
                    background: rgba(255, 107, 53, 0.04);
                }

                .comparison-table :global(.check) {
                    color: #4CAF50;
                    font-weight: 700;
                    font-size: 1.2rem;
                }

                .comparison-table :global(.cross) {
                    color: rgba(255, 255, 255, 0.25);
                    font-size: 1.1rem;
                }

                .comparison-table :global(.partial) {
                    color: rgba(255, 255, 255, 0.45);
                    font-size: 0.85rem;
                }

                .comparison-table tbody tr:last-child td {
                    border-bottom: none;
                }

                .price-callout {
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                    gap: 25px;
                    padding: 30px 35px;
                    background: rgba(255, 107, 53, 0.04);
                    border-color: rgba(255, 107, 53, 0.15);
                }

                .callout-content {
                    display: flex;
                    align-items: center;
                    gap: 18px;
                }

                .callout-emoji {
                    font-size: 2rem;
                    flex-shrink: 0;
                }

                .callout-title {
                    color: rgba(255, 255, 255, 0.7);
                    font-size: 0.95rem;
                    margin-bottom: 4px;
                }

                .callout-subtitle {
                    color: rgba(255, 255, 255, 0.85);
                    font-size: 1rem;
                }

                .callout-subtitle strong {
                    color: #FF6B35;
                    font-weight: 700;
                }

                .callout-cta {
                    flex-shrink: 0;
                    color: #FF6B35;
                    font-weight: 700;
                    text-decoration: none;
                    font-size: 0.95rem;
                    padding: 10px 20px;
                    border: 1px solid rgba(255, 107, 53, 0.3);
                    border-radius: 12px;
                    transition: all 0.3s ease;
                    min-height: 44px;
                    display: flex;
                    align-items: center;
                }

                .callout-cta:hover {
                    background: rgba(255, 107, 53, 0.1);
                    border-color: rgba(255, 107, 53, 0.5);
                }

                @media (max-width: 992px) {
                    .price-callout {
                        flex-direction: column;
                        text-align: center;
                    }

                    .callout-content {
                        flex-direction: column;
                    }
                }

                @media (max-width: 576px) {
                    .section-title {
                        font-size: 1.8rem;
                    }

                    .table-wrapper {
                        padding: 15px;
                    }

                    .comparison-table th,
                    .comparison-table td {
                        padding: 12px 10px;
                        font-size: 0.85rem;
                    }

                    .price-callout {
                        padding: 22px 18px;
                    }

                    .callout-cta {
                        width: 100%;
                        justify-content: center;
                    }
                }
            `}</style>
        </section>
    )
}
