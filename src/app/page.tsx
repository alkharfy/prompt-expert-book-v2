'use client'

import { motion } from 'framer-motion'
import Link from 'next/link'
import Image from 'next/image'
import Navigation from '@/components/Navigation'
import Robot from '@/components/Robot'
import { useState, useEffect } from 'react'
import { authSystem } from '@/lib/auth_system'
import { dbLogger } from '@/lib/logger'
import {
    PromoBanner,
    WhatYouLearn,
    TargetAudience,
    Testimonials,
    PricingSection,
    FAQSection,
    CertificatePreview,
    UnifiedBackground
} from '@/components/landing'
import {
    MagicWand,
    DigitalBrain,
    CodeBrackets,
    SmartBulb,
    PenIcon,
    UICardIcon,
    FlowchartIcon,
    SitemapIcon,
    CheckmarkIcon,
    DatabaseIcon
} from '@/components/FloatingAssets'

export default function Home() {
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

    const getResumeUrl = (page: number) => {
        if (page <= 2) return `/read/intro/${page}`
        if (page <= 13) return `/read/section-1/${page - 2}`
        if (page <= 19) return `/read/section-2/${page - 13}`
        if (page <= 28) return `/read/section-3/${page - 19}`
        if (page <= 39) return `/read/section-4/${page - 28}`
        if (page <= 49) return `/read/section-5/${page - 39}`
        if (page <= 58) return `/read/section-6/${page - 49}`
        if (page <= 64) return `/library/${page - 58}`
        if (page <= 70) return `/read/appendix/${page - 64}`
        return `/read/glossary/${Math.max(1, page - 70)}`
    }

    return (
        <>
            <Navigation />
            <UnifiedBackground />

            <main className="hero-section">
                {/* Hero Content */}
                <div className="container hero-container">
                    <div className="hero-grid">
                        {/* Right Content - Robot (Order swapped for RTL/LTR flow and better mobile stack) */}
                        <motion.div
                            className="hero-image-container"
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ duration: 1 }}
                        >
                            <Robot
                                size={550}
                                variant="video"
                                videoSrc="https://uusefrutihcozxrtdrat.supabase.co/storage/v1/object/sign/robot%20vedio%202/AZtlkAe6oTEHBCJ7-vdsnw-AZtlkAe7xnD8T7hZ_ktz0A.mp4?token=eyJraWQiOiJzdG9yYWdlLXVybC1zaWduaW5nLWtleV9jZTBiZmNhNC04MWNhLTQ5Y2ItOTBkYy00MzliZTQ5NDA1ZjUiLCJhbGciOiJIUzI1NiJ9.eyJ1cmwiOiJyb2JvdCB2ZWRpbyAyL0FadGxrQWU2b1RFSEJDSjctdmRzbnctQVp0bGtBZTd4bkQ4VDdoWl9rdHowQS5tcDQiLCJpYXQiOjE3NjcwMjU3MjgsImV4cCI6MjYzMTAyNTcyOH0.-YfDTaSvVIExsYZWgVYIQDh4xooWvYyTX0oEukVB9uU"
                            />
                            <div className="robot-glow-bg" />
                        </motion.div>

                        {/* Left Content */}
                        <motion.div
                            className="hero-text-container"
                            initial={{ opacity: 0, x: 50 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ duration: 1, ease: "easeOut" }}
                        >
                            <motion.h1 className="hero-title">
                                بناء موقع أو تطبيق
                                <br />
                                <span className="text-gradient">عن طريق التوجيهات الذكية للذكاء الاصطناعي</span>
                            </motion.h1>

                            <motion.p className="hero-description">
                                حوّل أفكارك إلى واقع ملموس واحترافي من خلال إتقان فن صياغة الأوامر الذكية.
                            </motion.p>

                            <motion.div className="hero-actions">
                                {progress ? (
                                    <Link href={getResumeUrl(progress.currentPage)} className="btn btn-primary">
                                        <span>أكمل من حيث توقفت</span>
                                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                                            <path d="M15 18l-6-6 6-6" />
                                        </svg>
                                    </Link>
                                ) : (
                                    <Link href="/toc" className="btn btn-primary">
                                        <span>ابدأ القراءة الآن</span>
                                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                                            <path d="M15 18l-6-6 6-6" />
                                        </svg>
                                    </Link>
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
                            </motion.div>
                        </motion.div>
                    </div>
                </div>
            </main>

            {/* Landing Page Sections */}
            <WhatYouLearn />
            <TargetAudience />
            <Testimonials />
            <CertificatePreview />
            <PricingSection />
            <FAQSection />

            {/* Final CTA Section */}
            <section className="final-cta-section">
                <div className="container">
                    <motion.div
                        initial={{ opacity: 0, y: 30 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        className="final-cta-content"
                    >
                        <h2>جاهز تبدأ رحلتك؟</h2>
                        <p>انضم لأكثر من 500 متعلم بدأوا يبنون مواقعهم بالذكاء الاصطناعي</p>
                        <Link href="/register" className="btn btn-primary btn-lg">
                            ابدأ رحلتي الآن ←
                        </Link>
                    </motion.div>
                </div>
            </section>

            {/* Promo Banner */}
            <PromoBanner />

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
                
                .btn-lg {
                    padding: 18px 40px !important;
                    font-size: 1.2rem !important;
                }
                
                @media (max-width: 576px) {
                    .final-cta-section {
                        padding: 60px 0;
                    }
                    
                    .final-cta-content h2 {
                        font-size: 1.8rem;
                    }
                }
            `}</style>
        </>
    )
}
