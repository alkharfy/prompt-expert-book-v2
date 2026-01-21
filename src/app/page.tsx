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
    CertificatePreview
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

            <main className="hero-section">
                {/* Floating Assets */}
                <div className="floating-assets" style={{ pointerEvents: 'none', zIndex: 5 }}>
                    {/* Element 1: Magic Wand (Top Left) */}
                    <motion.div
                        className="floating-asset"
                        style={{ top: '15%', left: '10%', opacity: 0.8, scale: 1.2 }}
                        animate={{
                            y: [0, -30, 0],
                            rotate: [-5, 5, -5],
                        }}
                        transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}
                    >
                        <MagicWand />
                    </motion.div>

                    {/* New Element: Pen (Top Left Area) */}
                    <motion.div
                        className="floating-asset"
                        style={{ top: '5%', left: '25%', opacity: 0.9, scale: 1.3 }}
                        animate={{
                            y: [0, 20, 0],
                            rotate: [0, 10, 0],
                        }}
                        transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut', delay: 1 }}
                    >
                        <PenIcon />
                    </motion.div>

                    {/* Element 2: Digital Brain (Bottom Left) */}
                    <motion.div
                        className="floating-asset"
                        style={{ bottom: '20%', left: '15%', opacity: 0.8, scale: 1.2 }}
                        animate={{
                            y: [0, 25, 0],
                            scale: [1.2, 1.3, 1.2],
                        }}
                        transition={{ duration: 7, repeat: Infinity, ease: 'easeInOut' }}
                    >
                        <DigitalBrain />
                    </motion.div>

                    {/* New Element: Flowchart (Bottom Left Area) */}
                    <motion.div
                        className="floating-asset"
                        style={{ bottom: '8%', left: '5%', opacity: 0.8, scale: 1.2 }}
                        animate={{
                            x: [0, 15, 0],
                            y: [0, -15, 0],
                        }}
                        transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
                    >
                        <FlowchartIcon />
                    </motion.div>

                    {/* Element 3: Smart Bulb (Top Right) */}
                    <motion.div
                        className="floating-asset"
                        style={{ top: '20%', right: '10%', opacity: 0.8, scale: 1.2 }}
                        animate={{
                            y: [0, -40, 0],
                            rotate: [10, -10, 10],
                        }}
                        transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
                    >
                        <SmartBulb />
                    </motion.div>

                    {/* New Element: Checkmark (Top Right Area) */}
                    <motion.div
                        className="floating-asset"
                        style={{ top: '10%', right: '25%', opacity: 0.9, scale: 1.3 }}
                        animate={{
                            scale: [1.1, 1.3, 1.1],
                            opacity: [0.8, 1, 0.8],
                        }}
                        transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
                    >
                        <CheckmarkIcon />
                    </motion.div>

                    {/* Element 4: Code Brackets (Bottom Right) */}
                    <motion.div
                        className="floating-asset"
                        style={{ bottom: '15%', right: '15%', opacity: 0.8, scale: 1.2 }}
                        animate={{
                            y: [0, 35, 0],
                            rotateX: [0, 20, 0],
                        }}
                        transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut' }}
                    >
                        <CodeBrackets />
                    </motion.div>

                    {/* New Element: Database (Bottom Right Area) */}
                    <motion.div
                        className="floating-asset"
                        style={{ bottom: '5%', right: '30%', opacity: 0.8, scale: 1.2 }}
                        animate={{
                            y: [0, -25, 0],
                        }}
                        transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut', delay: 0.5 }}
                    >
                        <DatabaseIcon />
                    </motion.div>

                    {/* New Element: UI Card (Middle Right Area) */}
                    <motion.div
                        className="floating-asset"
                        style={{ top: '45%', right: '12%', opacity: 0.8, scale: 1.4 }}
                        animate={{
                            rotateY: [0, 15, 0],
                            y: [0, 30, 0],
                        }}
                        transition={{ duration: 9, repeat: Infinity, ease: 'easeInOut' }}
                    >
                        <UICardIcon />
                    </motion.div>

                    {/* New Element: Sitemap (Middle Left Area) */}
                    <motion.div
                        className="floating-asset"
                        style={{ top: '55%', left: '12%', opacity: 0.8, scale: 1.2 }}
                        animate={{
                            rotate: [-5, 5, -5],
                            scale: [1.2, 1.25, 1.2],
                        }}
                        transition={{ duration: 10, repeat: Infinity, ease: 'easeInOut' }}
                    >
                        <SitemapIcon />
                    </motion.div>

                    {/* --- MAIN IMAGE ASSETS --- */}

                    {/* 1. Flow/Process (Top Left) */}
                    <motion.div
                        className="floating-asset asset-flow"
                        style={{ top: '15%', left: '5%', width: '200px', height: '200px', zIndex: 2 }}
                        animate={{
                            y: [0, 30, 0],
                            rotate: [2, -2, 2],
                        }}
                        transition={{ duration: 9, repeat: Infinity, ease: 'easeInOut' }}
                    >
                        <Image src="/assets/flow.png" alt="Process Flow" fill style={{ objectFit: 'contain', opacity: 0.6 }} />
                    </motion.div>

                    {/* 2. Quality Badge (Top Right) */}
                    <motion.div
                        className="floating-asset asset-quality"
                        style={{ top: '18%', right: '8%', width: '160px', height: '160px', zIndex: 2 }}
                        animate={{
                            scale: [1, 1.05, 1],
                            rotate: [-5, 5, -5],
                        }}
                        transition={{ duration: 7, repeat: Infinity, ease: 'easeInOut', delay: 1 }}
                    >
                        <Image src="/assets/quality.png" alt="Quality Badge" fill style={{ objectFit: 'contain', opacity: 0.8 }} />
                    </motion.div>

                    {/* 3. Cube (Middle Left) */}
                    <motion.div
                        className="floating-asset asset-cube"
                        style={{ top: '45%', left: '4%', width: '180px', height: '180px', zIndex: 1 }}
                        animate={{
                            y: [0, 40, 0],
                            rotate: [10, -10, 10],
                        }}
                        transition={{ duration: 12, repeat: Infinity, ease: 'easeInOut' }}
                    >
                        <Image src="/assets/cube.png" alt="Glowing Cube" fill style={{ objectFit: 'contain', opacity: 0.5 }} />
                    </motion.div>

                    {/* 4. UI Card (Middle Right) */}
                    <motion.div
                        className="floating-asset asset-card"
                        style={{ top: '42%', right: '12%', width: '220px', height: '220px', zIndex: 1 }}
                        animate={{
                            y: [0, -30, 0],
                            rotateY: [0, 10, 0],
                        }}
                        transition={{ duration: 10, repeat: Infinity, ease: 'easeInOut', delay: 2 }}
                    >
                        <Image src="/assets/card.png" alt="UI Card" fill style={{ objectFit: 'contain', opacity: 0.6 }} />
                    </motion.div>

                    {/* 5. Gear (Bottom Right) */}
                    <motion.div
                        className="floating-asset asset-gear"
                        style={{ top: '70%', right: '5%', width: '200px', height: '200px', zIndex: 2 }}
                        animate={{
                            rotate: 360,
                            y: [0, -20, 0],
                        }}
                        transition={{
                            rotate: { duration: 50, repeat: Infinity, ease: 'linear' },
                            y: { duration: 6, repeat: Infinity, ease: 'easeInOut' },
                        }}
                    >
                        <Image src="/assets/gear.png" alt="Glowing Gear" fill style={{ objectFit: 'contain', opacity: 0.5 }} />
                    </motion.div>

                    {/* 6. Server (Bottom Center-Left) */}
                    <motion.div
                        className="floating-asset asset-server"
                        style={{ bottom: '8%', left: '20%', width: '240px', height: '240px', zIndex: 1 }}
                        animate={{
                            y: [0, -25, 0],
                            rotate: [-3, 3, -3],
                        }}
                        transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut', delay: 3 }}
                    >
                        <Image src="/assets/server.png" alt="Floating Server" fill style={{ objectFit: 'contain', opacity: 0.7 }} />
                    </motion.div>

                    <motion.div
                        className="code-window-card"
                        style={{ top: '28%', left: '30%', opacity: 0.6 }}
                        animate={{
                            y: [0, -25, 0],
                            rotate: [-2, 2, -2],
                        }}
                        transition={{
                            duration: 7,
                            repeat: Infinity,
                            ease: 'easeInOut',
                        }}
                    >
                        <div style={{ display: 'flex', gap: '8px', marginBottom: '12px' }}>
                            <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#ff5f56' }} />
                            <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#ffbd2e' }} />
                            <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#27c93f' }} />
                        </div>
                        <div style={{ fontSize: '10px', color: '#FF6B35', fontFamily: 'monospace', opacity: 0.8 }}>
                            {'.ui-card {'}
                            <br />
                            {'  float: true;'}
                            <br />
                            {'  style: cinematic;'}
                            <br />
                            {'}'}
                        </div>
                    </motion.div>
                </div>

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
                    background: linear-gradient(180deg, rgba(15, 15, 35, 1) 0%, rgba(10, 10, 20, 1) 100%);
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
