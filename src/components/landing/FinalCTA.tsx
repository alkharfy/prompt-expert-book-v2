'use client'

import dynamic from 'next/dynamic'
import Link from 'next/link'
import { trackCtaClick } from '@/lib/analytics'

const MotionDiv = dynamic(
    () => import('framer-motion').then(mod => mod.motion.div),
    { ssr: false }
) as React.ComponentType<any>

export default function FinalCTA() {
    return (
        <section className="final-cta-section">
            <div className="container">
                <MotionDiv
                    initial={{ opacity: 0, y: 30 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    className="final-cta-content"
                >
                    <h2>جاهز تبدأ؟ افتح الكتاب كامل اليوم</h2>
                    <p>10 فصول + 95 قالب جاهز + 45 تمرين عملي — مع ضمان استرداد 30 يوم</p>
                    <Link href="#pricing" className="btn btn-primary btn-lg" onClick={() => trackCtaClick('اشترك الآن', 'final_cta')}>
                        اشترك الآن — شاهد الباقات والأسعار ←
                    </Link>
                    <div style={{ marginTop: '16px' }}>
                        <Link href="/read/intro/1" className="final-cta-secondary" onClick={() => trackCtaClick('جرّب مجاناً', 'final_cta_secondary')}>
                            أو جرّب المقدمة والفصل الأول مجاناً
                        </Link>
                    </div>
                    <p className="guarantee-cta">🆓 المعاينة المجانية بدون تسجيل — <Link href="/refund-policy">🛡️ ضمان استرداد 30 يوم</Link></p>
                </MotionDiv>
            </div>

            <style jsx>{`
                .final-cta-section {
                    padding: 100px 0;
                    background: transparent;
                    text-align: center;
                }
                .final-cta-content h2 {
                    font-size: 2.5rem;
                    font-weight: 800;
                    color: white;
                    margin-bottom: 15px;
                }
                .final-cta-content p {
                    font-size: 1.1rem;
                    color: rgba(255, 255, 255, 0.7);
                    margin-bottom: 30px;
                }
                .guarantee-cta {
                    font-size: 0.95rem !important;
                    color: #81C784 !important;
                    font-weight: 600;
                    margin-top: 16px;
                    margin-bottom: 0 !important;
                }
                .final-cta-secondary {
                    color: rgba(255, 255, 255, 0.55);
                    font-size: 0.95rem;
                    text-decoration: underline;
                    text-underline-offset: 3px;
                    transition: color 0.2s;
                }
                .final-cta-secondary:hover {
                    color: rgba(255, 255, 255, 0.85);
                }
            `}</style>
        </section>
    )
}
