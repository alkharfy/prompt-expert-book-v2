'use client'

import Link from 'next/link'
import Robot from '@/components/Robot'
import { useState, useEffect } from 'react'
import { authSystem } from '@/lib/auth_system'
import { trackCtaClick } from '@/lib/analytics'
import { dbLogger } from '@/lib/logger'
import { getGlobalReadingUrl } from '@/config/learningCatalog'
import { MONTHLY_PRICE_EGP, hasActivePlan } from '@/lib/pricing'
import { useSubscription } from '@/context/SubscriptionContext'

export default function HeroSection() {
    const [progress, setProgress] = useState<{ currentPage: number, percentage: number } | null>(null)
    const [isLoading, setIsLoading] = useState(true)
    // A member came to study, not to be sold the course again
    const { currentPlan, expiresAt, status } = useSubscription()
    const member = hasActivePlan({ plan_id: currentPlan, expires_at: expiresAt, status })
    const continueUrl = progress ? getGlobalReadingUrl(progress.currentPage) : null

    useEffect(() => {
        async function fetchProgress() {
            try {
                const data = await authSystem.getDetailedProgress()
                if (data && (data.currentPage > 1 || (data.completedChapters && data.completedChapters.length > 0))) {
                    setProgress({ currentPage: data.currentPage, percentage: data.percentage })
                }
            } catch (err) {
                dbLogger.error('Error fetching progress:', err)
            } finally {
                setIsLoading(false)
            }
        }
        fetchProgress()
    }, [])

    return (
        <>
            <main id="main-content" className="hero-section">
                <div className="container hero-container">
                    <div className="hero-grid">
                        <div className="hero-image-container hero-fade">
                            <Robot
                                size={550}
                                variant="video"
                                videoSrc={process.env.NEXT_PUBLIC_ROBOT_VIDEO_URL || ''}
                            />
                            <div className="robot-glow-bg" />
                        </div>

                        <div className="hero-text-container hero-fade">
                            <h1 className="hero-title">
                                اتعلّم تخلّي <span className="text-gradient">الـ AI يخلّص شغلك</span> — وتعرف إمتى يغلط
                            </h1>

                            <p className="hero-description">
                                كورس تفاعلي بالمصري للمحاسب والموظف والمدرس والمسوّق وأي حد عايز يبدأ: إزاي تطلب من ChatGPT أو Gemini شغل حقيقي — شيت إكسل، تقرير، إيميل، خطة — وتراجعه قبل ما تسلّمه. من غير مصطلحات، وحتى لو أول مرة تستخدمه.
                            </p>

                            <div className="hero-benefits hero-fade">
                                <div className="hero-benefit-row"><span className="hero-benefit-check">✓</span> أول نتيجة في دقيقة: تجربة عملية في أول صفحة</div>
                                <div className="hero-benefit-row"><span className="hero-benefit-check">✓</span> تمارين على ملفات شغل مصرية، و«المستر» بيصحّحلك</div>
                                <div className="hero-benefit-row"><span className="hero-benefit-check">✓</span> التمهيد ببلاش، والاشتراك من {MONTHLY_PRICE_EGP} جنيه في الشهر</div>
                            </div>

                            <div className="hero-actions hero-fade" style={{ marginTop: '20px' }}>
                                {member ? (
                                    <Link href={continueUrl || '/toc'} className="btn btn-primary btn-pulse">
                                        <span>{continueUrl ? 'كمّل من مكانك ←' : 'ادخل الكورس ←'}</span>
                                    </Link>
                                ) : (
                                    <>
                                        <Link href="#pricing" className="btn btn-primary btn-pulse" onClick={() => trackCtaClick('اشترك الآن', 'hero_section')}>
                                            <span>شوف الباقات — من {MONTHLY_PRICE_EGP} جنيه ←</span>
                                        </Link>
                                        {continueUrl ? (
                                            <Link href={continueUrl} className="btn btn-secondary" onClick={() => trackCtaClick('كمّل من مكانك', 'hero_section_secondary')}>
                                                <span>كمّل من مكانك</span>
                                            </Link>
                                        ) : (
                                            <Link href="/read/intro/1" className="btn btn-secondary" onClick={() => trackCtaClick('جرّب التمهيد مجاناً', 'hero_section_secondary')}>
                                                <span>ابدأ مجاناً — أول تجربة في دقيقة</span>
                                            </Link>
                                        )}
                                    </>
                                )}

                                {member && continueUrl && (
                                    <Link href="/toc" className="btn btn-secondary">
                                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                            <line x1="8" y1="6" x2="21" y2="6"></line>
                                            <line x1="8" y1="12" x2="21" y2="12"></line>
                                            <line x1="8" y1="18" x2="21" y2="18"></line>
                                            <line x1="3" y1="6" x2="3.01" y2="6"></line>
                                            <line x1="3" y1="12" x2="3.01" y2="12"></line>
                                            <line x1="3" y1="18" x2="3.01" y2="18"></line>
                                        </svg>
                                        <span>الفهرس</span>
                                    </Link>
                                )}
                            </div>

                            <div className="hero-trust-row hero-fade">
                                <span><Link href="/refund-policy">🛡️ ضمان استرداد فلوسك</Link></span>
                                <span className="hero-trust-divider">|</span>
                                <span>🆓 التمهيد ببلاش ومن غير تسجيل</span>
                                <span className="hero-trust-divider">|</span>
                                <span>📱 كريدت كارد أو محفظة موبايل</span>
                            </div>
                        </div>
                    </div>
                </div>
            </main>

            {/* Sticky CTA removed — MobileStickyBuy handles mobile, FinalCTA handles desktop. */}

            <style jsx>{`
                /* SSR-safe entrance: text is in the server HTML (crawlable) and
                   visible without JS; the fade is pure CSS and respects reduced-motion. */
                .hero-fade { animation: heroFadeUp 0.7s ease-out both; }
                @keyframes heroFadeUp {
                    from { opacity: 0; transform: translateY(12px); }
                    to { opacity: 1; transform: none; }
                }
                @media (prefers-reduced-motion: reduce) {
                    .hero-fade { animation: none; }
                }
                .free-chapter-sticky {
                    position: fixed;
                    bottom: 0;
                    left: 0;
                    right: 0;
                    display: flex;
                    justify-content: center;
                    gap: 12px;
                    padding: 12px 16px;
                    background: rgba(10, 10, 10, 0.95);
                    backdrop-filter: blur(12px);
                    border-top: 1px solid rgba(255, 107, 53, 0.2);
                    z-index: 50;
                }
                .free-chapter-sticky-btn {
                    display: inline-flex;
                    align-items: center;
                    gap: 8px;
                    padding: 10px 24px;
                    background: linear-gradient(135deg, #FF6B35, #FF8C42);
                    color: #fff;
                    border-radius: 10px;
                    font-size: 15px;
                    font-weight: 700;
                    text-decoration: none;
                    transition: all 0.2s;
                    white-space: nowrap;
                }
                .free-chapter-sticky-btn:hover {
                    background: linear-gradient(135deg, #e55a2b, #FF6B35);
                    transform: translateY(-1px);
                }
                .free-badge-icon { font-size: 18px; }
                .subscribe-sticky-btn {
                    display: inline-flex;
                    align-items: center;
                    gap: 8px;
                    padding: 10px 24px;
                    background: rgba(255, 107, 53, 0.1);
                    color: #FF6B35;
                    border: 1px solid rgba(255, 107, 53, 0.3);
                    border-radius: 10px;
                    font-size: 15px;
                    font-weight: 600;
                    text-decoration: none;
                    transition: all 0.2s;
                    white-space: nowrap;
                }
                .subscribe-sticky-btn:hover {
                    background: rgba(255, 107, 53, 0.18);
                }
                .hero-stats-bar {
                    display: flex;
                    align-items: center;
                    gap: 16px;
                    flex-wrap: wrap;
                    margin-bottom: 16px;
                }
                .hero-stat {
                    color: rgba(255, 255, 255, 0.85);
                    font-size: 0.95rem;
                    font-weight: 600;
                    white-space: nowrap;
                }
                .hero-stat-divider {
                    width: 4px;
                    height: 4px;
                    border-radius: 50%;
                    background: rgba(255, 107, 53, 0.6);
                    flex-shrink: 0;
                }
                .hero-promo-badge {
                    display: inline-block;
                    background: rgba(255, 107, 53, 0.12);
                    border: 1px solid rgba(255, 107, 53, 0.4);
                    color: #FF8C42;
                    padding: 10px 22px;
                    border-radius: 12px;
                    font-size: 1rem;
                    font-weight: 700;
                    margin-bottom: 8px;
                    animation: promoPulse 2.5s ease-in-out infinite;
                }
                @keyframes promoPulse {
                    0%, 100% { box-shadow: 0 0 0 0 rgba(255, 107, 53, 0.3); }
                    50% { box-shadow: 0 0 20px 4px rgba(255, 107, 53, 0.15); }
                }
                .btn-pulse {
                    animation: btnPulse 2s ease-in-out infinite;
                }
                @keyframes btnPulse {
                    0%, 100% { box-shadow: 0 0 0 0 rgba(255, 107, 53, 0.4); }
                    50% { box-shadow: 0 0 16px 6px rgba(255, 107, 53, 0.2); }
                }
                .hero-trust-row {
                    display: flex;
                    align-items: center;
                    gap: 12px;
                    flex-wrap: wrap;
                    color: rgba(255, 255, 255, 0.45);
                    font-size: 0.82rem;
                    margin-top: 14px;
                }
                .hero-benefits {
                    display: flex;
                    flex-direction: column;
                    gap: 8px;
                    margin: 18px 0 4px;
                }
                .hero-benefit-row {
                    display: flex;
                    align-items: center;
                    gap: 10px;
                    color: rgba(255, 255, 255, 0.85);
                    font-size: 0.95rem;
                    line-height: 1.6;
                }
                .hero-benefit-check {
                    color: #22c55e;
                    font-weight: 800;
                    font-size: 1rem;
                    flex-shrink: 0;
                }
                @media (max-width: 480px) {
                    .hero-benefit-row { font-size: 0.85rem; gap: 8px; }
                }
                .hero-trust-divider {
                    color: rgba(255, 255, 255, 0.2);
                }
                @media (max-width: 900px) {
                    .hero-stats-bar { justify-content: center; }
                    .hero-trust-row { justify-content: center; }
                }
                @media (max-width: 480px) {
                    .free-chapter-sticky { gap: 8px; padding: 10px 12px; }
                    .free-chapter-sticky-btn, .subscribe-sticky-btn { padding: 10px 16px; font-size: 13px; }
                    .hero-stats-bar { gap: 10px; }
                    .hero-stat { font-size: 0.82rem; }
                }
            `}</style>
        </>
    )
}
