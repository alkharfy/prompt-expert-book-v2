'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import Link from 'next/link'

interface Chapter {
    num: number
    title: string
    description: string
    pages: number
    icon: string
    free?: boolean
    freePages?: number
}

const chapters: Chapter[] = [
    {
        num: 1,
        title: 'كيف يفكر الذكاء الاصطناعي فعلاً (GPT-5, Claude, Gemini)',
        description: 'فهم كيف يعمل الذكاء الاصطناعي التوليدي وأنواعه',
        pages: 17,
        icon: '🧠',
        free: true,
    },
    {
        num: 2,
        title: 'من برومبت عشوائي إلى برومبت منظم (أول تجربة احترافية)',
        description: 'خطواتك الأولى في استخدام أدوات AI العملية',
        pages: 18,
        icon: '🚀',
        freePages: 4,
    },
    {
        num: 3,
        title: 'إطار GOLDS — نظام ثابت لأي برومبت',
        description: 'إطار عمل مُثبت لكتابة أوامر AI فعالة',
        pages: 18,
        icon: '🎯',
    },
    {
        num: 4,
        title: 'برومبتات متسلسلة لبناء مشروع كامل (Prompt Chaining)',
        description: 'ربط الأوامر معاً لإنجاز مهام معقدة',
        pages: 18,
        icon: '🔗',
    },
    {
        num: 5,
        title: 'جودة المخرجات وتصحيح البرومبت (Debug & Refinement)',
        description: 'تقنيات تحسين النتائج وتصحيح الأخطاء',
        pages: 18,
        icon: '✅',
    },
    {
        num: 6,
        title: 'التعامل مع الصور والصوت والفيديو (Multimodal AI)',
        description: 'التعامل مع الصور والفيديو والصوت',
        pages: 20,
        icon: '🎨',
    },
    {
        num: 7,
        title: 'بناء وكلاء AI يعملون نيابةً عنك (AI Agents)',
        description: 'بناء وكلاء ذكية تعمل بشكل مستقل',
        pages: 18,
        icon: '🤖',
    },
    {
        num: 8,
        title: 'اربط AI ببياناتك الخاصة بثقة (RAG)',
        description: 'ربط AI ببياناتك ومصادرك الخاصة',
        pages: 16,
        icon: '📊',
    },
    {
        num: 9,
        title: 'مشاريع كاملة من الفكرة إلى الإطلاق',
        description: 'مشاريع حقيقية من البداية للنهاية',
        pages: 16,
        icon: '💼',
    },
    {
        num: 10,
        title: 'استعد لموجة AI القادمة (اتجاهات 2026+)',
        description: 'اتجاهات المستقبل وكيف تستعد لها',
        pages: 17,
        icon: '🔮',
    },
]

const totalPages = chapters.reduce((sum, ch) => sum + ch.pages, 0)

export default function BookContentsSection() {
    const [expandedChapter, setExpandedChapter] = useState<number | null>(null)

    return (
        <section className="landing-section book-contents-section">
            <div className="container">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.6 }}
                    className="section-header"
                >
                    <span className="section-badge">📚 محتوى الكتاب</span>
                    <h2 className="section-title">ماذا بداخل الكتاب؟</h2>
                    <p className="section-subtitle">
                        10 فصول — {totalPages}+ صفحة — 48 تمرين تفاعلي
                    </p>
                </motion.div>

                <div className="chapters-grid">
                    {chapters.map((chapter, index) => (
                        <motion.div
                            key={chapter.num}
                            initial={{ opacity: 0, y: 30 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ delay: index * 0.08 }}
                            className={`chapter-card glass-card ${chapter.free ? 'chapter-free' : ''} ${expandedChapter === chapter.num ? 'chapter-expanded' : ''}`}
                            onClick={() => setExpandedChapter(expandedChapter === chapter.num ? null : chapter.num)}
                        >
                            <div className="chapter-header">
                                <span className="chapter-icon">{chapter.icon}</span>
                                <div className="chapter-info">
                                    <span className="chapter-number">الفصل {chapter.num}</span>
                                    <h3 className="chapter-title">{chapter.title}</h3>
                                </div>
                                {chapter.free && (
                                    <span className="free-badge">🆓 مجاني</span>
                                )}
                                {chapter.freePages && (
                                    <span className="free-badge partial-free">{chapter.freePages} صفحات مجانية</span>
                                )}
                            </div>

                            <AnimatePresence>
                                {expandedChapter === chapter.num && (
                                    <motion.div
                                        className="chapter-details"
                                        initial={{ height: 0, opacity: 0 }}
                                        animate={{ height: 'auto', opacity: 1 }}
                                        exit={{ height: 0, opacity: 0 }}
                                        transition={{ duration: 0.3 }}
                                    >
                                        <p className="chapter-description">{chapter.description}</p>
                                        <span className="chapter-pages">{chapter.pages} صفحة</span>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </motion.div>
                    ))}
                </div>

                {/* أزرار CTA */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: 0.4 }}
                    className="contents-cta"
                >
                    <Link href="#pricing" className="btn-contents-primary">
                        💳 اشترك الآن — من 99 ج.م
                    </Link>
                    <Link href="/read/intro/1" className="btn-contents-secondary">
                        🆓 جرّب الفصل المجاني
                    </Link>
                </motion.div>
            </div>

            <style jsx>{`
                .book-contents-section {
                    padding: 100px 0;
                    background: transparent;
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
                }

                .chapters-grid {
                    display: grid;
                    grid-template-columns: repeat(2, 1fr);
                    gap: 16px;
                    max-width: 900px;
                    margin: 0 auto;
                }

                .chapter-card {
                    padding: 20px 24px;
                    cursor: pointer;
                    transition: all 0.3s ease;
                    border-radius: 16px;
                    background: linear-gradient(145deg, rgba(255, 255, 255, 0.06) 0%, rgba(255, 255, 255, 0.02) 100%);
                    border: 1px solid rgba(255, 255, 255, 0.08);
                }

                .chapter-card:hover {
                    transform: translateY(-2px);
                    border-color: rgba(255, 107, 53, 0.25);
                    box-shadow: 0 8px 25px rgba(0, 0, 0, 0.2);
                }

                .chapter-free {
                    border-color: rgba(34, 197, 94, 0.2);
                    background: linear-gradient(145deg, rgba(34, 197, 94, 0.06) 0%, rgba(34, 197, 94, 0.02) 100%);
                }

                .chapter-free:hover {
                    border-color: rgba(34, 197, 94, 0.4);
                }

                .chapter-header {
                    display: flex;
                    align-items: center;
                    gap: 14px;
                }

                .chapter-icon {
                    font-size: 1.8rem;
                    flex-shrink: 0;
                }

                .chapter-info {
                    flex: 1;
                    min-width: 0;
                }

                .chapter-number {
                    font-size: 0.75rem;
                    color: rgba(255, 255, 255, 0.4);
                    font-weight: 600;
                    text-transform: uppercase;
                    letter-spacing: 0.5px;
                }

                .chapter-title {
                    font-size: 1rem;
                    font-weight: 700;
                    color: white;
                    margin: 2px 0 0;
                    line-height: 1.4;
                }

                .free-badge {
                    background: rgba(34, 197, 94, 0.15);
                    color: #4ade80;
                    padding: 4px 10px;
                    border-radius: 8px;
                    font-size: 0.72rem;
                    font-weight: 700;
                    flex-shrink: 0;
                    white-space: nowrap;
                }

                .partial-free {
                    background: rgba(59, 130, 246, 0.15);
                    color: #60a5fa;
                }

                .chapter-details {
                    overflow: hidden;
                    margin-top: 12px;
                    padding-top: 12px;
                    border-top: 1px solid rgba(255, 255, 255, 0.06);
                }

                .chapter-description {
                    font-size: 0.9rem;
                    color: rgba(255, 255, 255, 0.6);
                    line-height: 1.6;
                    margin: 0 0 8px;
                }

                .chapter-pages {
                    font-size: 0.8rem;
                    color: var(--color-orange-primary);
                    font-weight: 600;
                }

                .contents-cta {
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    gap: 16px;
                    margin-top: 50px;
                }

                .btn-contents-primary {
                    display: inline-flex;
                    align-items: center;
                    gap: 8px;
                    padding: 14px 32px;
                    background: linear-gradient(135deg, #22c55e, #16a34a);
                    color: white;
                    border-radius: 14px;
                    font-weight: 700;
                    font-size: 1rem;
                    text-decoration: none;
                    transition: all 0.3s;
                    box-shadow: 0 8px 20px rgba(34, 197, 94, 0.2);
                }

                .btn-contents-primary:hover {
                    transform: translateY(-2px);
                    box-shadow: 0 12px 28px rgba(34, 197, 94, 0.3);
                }

                .btn-contents-secondary {
                    display: inline-flex;
                    align-items: center;
                    gap: 8px;
                    padding: 14px 32px;
                    background: linear-gradient(135deg, var(--color-orange-primary), var(--color-orange-glow));
                    color: white;
                    border-radius: 14px;
                    font-weight: 700;
                    font-size: 1rem;
                    text-decoration: none;
                    transition: all 0.3s;
                    box-shadow: 0 8px 20px rgba(255, 107, 53, 0.2);
                }

                .btn-contents-secondary:hover {
                    transform: translateY(-2px);
                    box-shadow: 0 12px 28px rgba(255, 107, 53, 0.3);
                }

                @media (max-width: 768px) {
                    .chapters-grid {
                        grid-template-columns: 1fr;
                    }

                    .section-title {
                        font-size: 1.8rem;
                    }

                    .contents-cta {
                        flex-direction: column;
                    }

                    .btn-contents-primary,
                    .btn-contents-secondary {
                        width: 100%;
                        justify-content: center;
                        max-width: 320px;
                    }
                }

                @media (max-width: 480px) {
                    .chapter-card {
                        padding: 16px 18px;
                    }

                    .chapter-icon {
                        font-size: 1.5rem;
                    }

                    .chapter-title {
                        font-size: 0.92rem;
                    }

                    .free-badge {
                        font-size: 0.65rem;
                        padding: 3px 8px;
                    }
                }
            `}</style>
        </section>
    )
}
