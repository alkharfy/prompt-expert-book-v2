'use client'

import Link from 'next/link'
import Robot from '@/components/Robot'
import { useState, useEffect } from 'react'
import { authSystem } from '@/lib/auth_system'
import { trackCtaClick } from '@/lib/analytics'
import { dbLogger } from '@/lib/logger'

function getResumeUrl(page: number): string {
    if (page <= 6) return `/read/intro/${page}`
    if (page <= 23) return `/read/section-1/${page - 6}`
    if (page <= 41) return `/read/section-2/${page - 23}`
    if (page <= 59) return `/read/section-3/${page - 41}`
    if (page <= 77) return `/read/section-4/${page - 59}`
    if (page <= 95) return `/read/section-5/${page - 77}`
    if (page <= 115) return `/read/section-6/${page - 95}`
    if (page <= 133) return `/read/section-7/${page - 115}`
    if (page <= 149) return `/read/section-8/${page - 133}`
    if (page <= 165) return `/read/section-9/${page - 149}`
    if (page <= 182) return `/read/section-10/${page - 165}`
    return `/read/glossary/${Math.max(1, page - 182)}`
}

export default function HeroSection() {
    const [progress, setProgress] = useState<{ currentPage: number, percentage: number } | null>(null)
    const [isLoading, setIsLoading] = useState(true)

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
                                اختصر <span className="text-gradient">6 شهور تعلم AI</span> في أسبوع واحد
                            </h1>

                            <p className="hero-description">
                                دليل عملي بالعربي يعلّمك تستخدم AI صح — تكتب برومبت يفهمك من أول مرة، توفّر ساعات شغل، وتبدأ تكسب من مهارات الـ AI
                            </p>

                            <div className="hero-benefits hero-fade">
                                <div className="hero-benefit-row"><span className="hero-benefit-check">✓</span> اختصر 6 شهور تجربة وخطأ في أسبوع</div>
                                <div className="hero-benefit-row"><span className="hero-benefit-check">✓</span> 10 فصول + 48 تمرين عملي قابل للتطبيق</div>
                                <div className="hero-benefit-row"><span className="hero-benefit-check">✓</span> المقدمة + الفصل الأول كامل مجاناً — جرّب قبل ما تشتري</div>
                            </div>

                            <div className="hero-actions hero-fade" style={{ marginTop: '20px' }}>
                                {progress ? (
                                    <Link href={getResumeUrl(progress.currentPage)} className="btn btn-primary btn-pulse">
                                        <span>أكمل من حيث توقفت</span>
                                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                                            <path d="M15 18l-6-6 6-6" />
                                        </svg>
                                    </Link>
                                ) : (
                                    <>
                                        <Link href="#pricing" className="btn btn-primary btn-pulse" onClick={() => trackCtaClick('اشترك الآن', 'hero_section')}>
                                            <span>اشترك الآن — ابدأ من 99 ج.م ←</span>
                                        </Link>
                                        <Link href="/read/intro/1" className="btn btn-secondary" onClick={() => trackCtaClick('جرّب الفصل الأول مجاناً', 'hero_section_secondary')}>
                                            <span>جرّب الفصل الأول مجاناً</span>
                                        </Link>
                                    </>
                                )}

                                {progress && (
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
                                <span><Link href="/refund-policy">🛡️ ضمان استرداد 30 يوم</Link></span>
                                <span className="hero-trust-divider">|</span>
                                <span>🆓 المعاينة المجانية بدون تسجيل</span>
                                <span className="hero-trust-divider">|</span>
                                <span>📱 دفع بفودافون كاش/فوري</span>
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
