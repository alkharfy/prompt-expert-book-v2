'use client'

import dynamic from 'next/dynamic'

const MotionDiv = dynamic(
    () => import('framer-motion').then(mod => mod.motion.div),
    { ssr: false }
) as React.ComponentType<any>

interface CaseStudy {
    name: string;
    role: string;
    emoji: string;
    before: string;
    after: string;
    result: string;
    quote: string;
    tag: string;
}

const caseStudies: CaseStudy[] = [
    {
        name: 'أحمد',
        role: 'فريلانسر كتابة محتوى',
        emoji: '✍️',
        before: 'بيكتب بوست واحد في ساعة، ودخله 2,000 ج.م/شهر',
        after: 'بيكتب 10 بوستات في ساعة بـ AI مع خطط محتوى شهرية',
        result: 'دخله زاد 3x — بقى 6,000+ ج.م/شهر',
        quote: 'مكنتش متخيل إن prompt واحد يوفّرلي 5 ساعات شغل',
        tag: 'كتابة محتوى'
    },
    {
        name: 'سارة',
        role: 'مصممة UX',
        emoji: '🎨',
        before: 'بتاخد يومين تعمل mood board وتجمع إلهام',
        after: 'بتعمل mood board في 20 دقيقة بـ Midjourney + SSCT',
        result: 'بتاخد مشاريع أكتر عشان بتسلّم أسرع',
        quote: 'إطار SSCT خلاني أوصّف بالضبط اللي في دماغي — والنتيجة مذهلة',
        tag: 'تصميم'
    },
    {
        name: 'محمد',
        role: 'صاحب متجر أونلاين',
        emoji: '🛒',
        before: 'بيدفع 3,000 ج.م/شهر لكاتب محتوى والنتيجة مش ثابتة',
        after: 'بيكتب كل المحتوى بنفسه بـ AI — أسرع وأكثر اتساقاً',
        result: 'وفّر 36,000 ج.م/سنة وجودة المحتوى اتحسنت',
        quote: 'كنت فاكر AI صعب — الكتاب ورّاني إنه أسهل مما تتخيل',
        tag: 'تجارة إلكترونية'
    },
    {
        name: 'نورا',
        role: 'طالبة هندسة',
        emoji: '👩‍💻',
        before: 'بتقضي ساعات في حل مسائل البرمجة وفهم الأكواد',
        after: 'بتستخدم AI كمساعد تعليمي — يشرح ويراجع ويقترح',
        result: 'درجاتها اتحسنت وبقت تساعد زملاءها',
        quote: 'فصل Prompt Chaining غيّر طريقة تفكيري في حل المشكلات',
        tag: 'تعليم'
    }
]

export default function CaseStudies() {
    return (
        <section className="case-studies-section">
            <div className="container">
                <MotionDiv
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.6 }}
                >
                    <h2 className="case-studies-title">
                        <span className="case-studies-emoji">📈</span>
                        سيناريوهات واقعية — إيه اللي ممكن يتغير؟
                    </h2>
                    <p className="case-studies-disclaimer">
                        * السيناريوهات دي مبنية على استخدامات حقيقية للمهارات في الكتاب. نتائجك ممكن تختلف حسب مجهودك وسوقك.
                    </p>
                </MotionDiv>

                <div className="case-studies-grid">
                    {caseStudies.map((study, index) => (
                        <MotionDiv
                            key={study.name}
                            className="case-study-card"
                            initial={{ opacity: 0, y: 30 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.5, delay: index * 0.1 }}
                        >
                            <div className="case-study-header">
                                <span className="case-study-avatar">{study.emoji}</span>
                                <div>
                                    <h3 className="case-study-name">{study.name}</h3>
                                    <p className="case-study-role">{study.role}</p>
                                </div>
                                <span className="case-study-tag">{study.tag}</span>
                            </div>

                            <div className="case-study-comparison">
                                <div className="case-study-before">
                                    <span className="comparison-label">قبل</span>
                                    <p>{study.before}</p>
                                </div>
                                <div className="case-study-arrow">→</div>
                                <div className="case-study-after">
                                    <span className="comparison-label">بعد</span>
                                    <p>{study.after}</p>
                                </div>
                            </div>

                            <div className="case-study-result">
                                <strong>📊 النتيجة:</strong> {study.result}
                            </div>

                            <blockquote className="case-study-quote">
                                &ldquo;{study.quote}&rdquo;
                            </blockquote>
                        </MotionDiv>
                    ))}
                </div>
            </div>

            <style jsx>{`
                .case-studies-section {
                    padding: 4rem 0;
                }
                .case-studies-title {
                    text-align: center;
                    font-size: 1.8rem;
                    font-weight: 800;
                    color: var(--color-text-primary);
                    margin-bottom: 0.5rem;
                }
                .case-studies-emoji {
                    margin-left: 8px;
                }
                .case-studies-disclaimer {
                    text-align: center;
                    color: var(--color-text-muted);
                    font-size: 0.75rem;
                    margin-bottom: 2rem;
                    font-style: italic;
                }
                .case-studies-grid {
                    display: grid;
                    grid-template-columns: repeat(2, 1fr);
                    gap: 1.5rem;
                    max-width: 900px;
                    margin: 0 auto;
                }
                .case-study-card {
                    background: rgba(10, 10, 10, 0.7);
                    backdrop-filter: blur(20px);
                    border: 1px solid rgba(255, 255, 255, 0.08);
                    border-radius: 16px;
                    padding: 1.5rem;
                    transition: all 0.3s ease;
                }
                .case-study-card:hover {
                    border-color: rgba(255, 107, 53, 0.3);
                    transform: translateY(-4px);
                }
                .case-study-header {
                    display: flex;
                    align-items: center;
                    gap: 12px;
                    margin-bottom: 1rem;
                }
                .case-study-avatar {
                    font-size: 2rem;
                    flex-shrink: 0;
                }
                .case-study-name {
                    font-size: 1rem;
                    font-weight: 700;
                    color: var(--color-text-primary);
                    margin: 0;
                }
                .case-study-role {
                    font-size: 0.8rem;
                    color: var(--color-text-secondary);
                    margin: 0;
                }
                .case-study-tag {
                    margin-right: auto;
                    padding: 2px 10px;
                    background: rgba(255, 107, 53, 0.1);
                    border: 1px solid rgba(255, 107, 53, 0.2);
                    border-radius: 12px;
                    font-size: 0.7rem;
                    color: var(--color-orange-primary);
                    font-weight: 600;
                    white-space: nowrap;
                }
                .case-study-comparison {
                    display: flex;
                    align-items: stretch;
                    gap: 8px;
                    margin-bottom: 1rem;
                }
                .case-study-before, .case-study-after {
                    flex: 1;
                    padding: 0.75rem;
                    border-radius: 10px;
                    font-size: 0.8rem;
                    line-height: 1.5;
                }
                .case-study-before {
                    background: rgba(255, 77, 77, 0.05);
                    border: 1px solid rgba(255, 77, 77, 0.15);
                }
                .case-study-before p, .case-study-after p {
                    margin: 0;
                    color: var(--color-text-secondary);
                }
                .case-study-after {
                    background: rgba(39, 201, 63, 0.05);
                    border: 1px solid rgba(39, 201, 63, 0.15);
                }
                .comparison-label {
                    display: block;
                    font-size: 0.65rem;
                    font-weight: 700;
                    text-transform: uppercase;
                    margin-bottom: 4px;
                    opacity: 0.6;
                    color: var(--color-text-secondary);
                }
                .case-study-arrow {
                    display: flex;
                    align-items: center;
                    color: var(--color-orange-primary);
                    font-size: 1.2rem;
                    flex-shrink: 0;
                }
                .case-study-result {
                    font-size: 0.85rem;
                    color: #27c93f;
                    font-weight: 600;
                    margin-bottom: 0.75rem;
                    padding: 0.5rem 0.75rem;
                    background: rgba(39, 201, 63, 0.05);
                    border-radius: 8px;
                }
                .case-study-quote {
                    font-size: 0.8rem;
                    color: var(--color-text-secondary);
                    font-style: italic;
                    border-right: 3px solid var(--color-orange-primary);
                    padding-right: 12px;
                    margin: 0;
                    line-height: 1.6;
                }
                @media (max-width: 768px) {
                    .case-studies-grid {
                        grid-template-columns: 1fr;
                    }
                    .case-studies-title {
                        font-size: 1.4rem;
                    }
                }
            `}</style>
        </section>
    )
}
