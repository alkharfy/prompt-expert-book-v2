'use client'

import { motion } from 'framer-motion'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import Navigation from '@/components/Navigation'
import { glossaryData } from '@/data/bookData'
import { useEffect, useState } from 'react'
import { authSystem } from '@/lib/auth_system'
import { verifySession } from '@/lib/auth'
import LockedOverlay from '@/components/reading/LockedOverlay'
import ReadingPagination from '@/components/reading/ReadingPagination'
import BookmarkButton from '@/components/reading/BookmarkButton'
import ScrollProgress from '@/components/reading/ScrollProgress'

export default function GlossaryPage() {
    const params = useParams()
    const router = useRouter()
    const pageNum = parseInt(params.page as string) || 1

    const [isAuthed, setIsAuthed] = useState(false)
    const [isLockOverlayOpen, setIsLockOverlayOpen] = useState(false)

    const currentPage = glossaryData[pageNum - 1]
    const totalPages = glossaryData.length
    const isFirstPage = pageNum === 1
    const isLastPage = pageNum === totalPages

    const isCurrentPageLocked = !isAuthed

    useEffect(() => {
        const authed = verifySession()
        setIsAuthed(authed)

        if (!authed) {
            setIsLockOverlayOpen(true)
        }

        // Save progress (Intro: 2 + S1-6: 56 + Lib: 8 + App: 18 = 84 pages total before Glossary)
        if (authed) {
            authSystem.updateReadingProgress(84 + pageNum).catch(err => {
                console.error('Failed to save progress:', err)
            })
        }
    }, [pageNum])

    if (!currentPage) {
        if (typeof window !== 'undefined' && params.page) router.push('/toc')
        return null
    }

    const handleNext = async () => {
        if (!isAuthed) {
            setIsLockOverlayOpen(true)
            return
        }
        if (!isLastPage) {
            router.push(`/read/glossary/${pageNum + 1}`)
        } else {
            // Explicitly mark Glossary as completed (Page 89 = last page)
            if (isAuthed) {
                await authSystem.updateReadingProgress(89)
            }
            router.push('/toc')
        }
    }

    const handlePrev = () => {
        if (!isFirstPage) {
            router.push(`/read/glossary/${pageNum - 1}`)
        } else {
            // Navigate back to last page of Appendix (18 pages)
            router.push('/read/appendix/18')
        }
    }

    return (
        <>
            <Navigation />
            <ScrollProgress />

            {/* Locked Overlay */}
            <LockedOverlay
                isOpen={isLockOverlayOpen}
                onClose={() => {
                    if (!isAuthed) router.push('/read/section-1/2')
                    else setIsLockOverlayOpen(false)
                }}
                nextPath={`/read/glossary/${pageNum}`}
                isDirectAccess={!isAuthed}
            />

            <main style={{ minHeight: '100vh', position: 'relative', overflow: 'hidden', paddingTop: '0' }}>

                <div className="container" style={{ paddingBottom: '40px', maxWidth: '1000px' }}>
                    {/* Reading Actions Bar */}
                    <div className="reading-actions-bar">
                        <BookmarkButton 
                            pageId={`glossary-${pageNum}`} 
                            pageTitle={`المعجم: ${currentPage.title}`} 
                        />
                    </div>

                    <motion.div
                        style={{ textAlign: 'center', marginBottom: '48px' }}
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.8 }}
                    >
                        <h1 style={{
                            fontSize: 'clamp(2rem, 4vw, 3.5rem)',
                            margin: '0 0 16px 0',
                            background: 'linear-gradient(to bottom, #fff 40%, #FF6B35)',
                            WebkitBackgroundClip: 'text',
                            WebkitTextFillColor: 'transparent',
                            fontWeight: 900
                        }}>
                            07: {currentPage.title}
                        </h1>
                        <p style={{ fontSize: '1.25rem', color: '#b0b0b0', maxWidth: '800px', margin: '0 auto' }}>
                            {currentPage.description}
                        </p>
                    </motion.div>

                    <div style={{
                        display: 'grid',
                        gridTemplateColumns: '1fr',
                        gap: '24px',
                        filter: isCurrentPageLocked ? 'blur(8px)' : 'none',
                        pointerEvents: isCurrentPageLocked ? 'none' : 'auto',
                        opacity: isCurrentPageLocked ? 0.3 : 1
                    }}>
                        {currentPage.contentBlocks.map((block, index) => {
                            if (block.type !== 'card') return null;

                            // Split title into Arabic and English
                            const titleParts = block.title?.split(' — ') || [];
                            const arabicName = titleParts[0];
                            const englishName = titleParts[1];

                            return (
                                <motion.div
                                    key={index}
                                    className="card card-glow"
                                    style={{
                                        padding: '28px',
                                        background: 'rgba(255, 107, 53, 0.04)',
                                        border: '1px solid rgba(255, 107, 53, 0.15)',
                                        borderRadius: '20px',
                                        position: 'relative',
                                        overflow: 'hidden'
                                    }}
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ duration: 0.5, delay: index * 0.05 }}
                                    whileHover={{ y: -5, background: 'rgba(255, 107, 53, 0.08)' }}
                                >
                                    <div style={{
                                        position: 'absolute',
                                        top: '0',
                                        right: '0',
                                        width: '100px',
                                        height: '100px',
                                        background: 'radial-gradient(circle at top right, rgba(255, 107, 53, 0.1), transparent 70%)',
                                        pointerEvents: 'none'
                                    }} />

                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '12px', marginBottom: '16px' }}>
                                        <h3 style={{ fontSize: '1.6rem', margin: 0, color: '#FF6B35', fontWeight: '800' }}>
                                            {arabicName}
                                        </h3>
                                        {englishName && (
                                            <span style={{
                                                fontSize: '1.1rem',
                                                color: '#888',
                                                fontWeight: '500',
                                                fontFamily: 'Outfit, sans-serif',
                                                background: 'rgba(255,255,255,0.05)',
                                                padding: '4px 12px',
                                                borderRadius: '20px'
                                            }}>
                                                {englishName}
                                            </span>
                                        )}
                                    </div>
                                    <p style={{
                                        fontSize: '1.1rem',
                                        color: '#d0d0d0',
                                        lineHeight: '1.7',
                                        margin: 0,
                                        maxWidth: '100%'
                                    }}>
                                        {block.content}
                                    </p>
                                </motion.div>
                            )
                        })}
                    </div>

                    <ReadingPagination
                        currentIndex={pageNum - 1}
                        total={totalPages}
                        onPrev={handlePrev}
                        onNext={handleNext}
                        isFirst={isFirstPage}
                        isLast={isLastPage}
                        isNextLocked={!isAuthed}
                        onLockedClick={() => setIsLockOverlayOpen(true)}
                    />

                    <div style={{ textAlign: 'center', marginTop: '40px' }}>
                        <Link href="/toc" style={{ color: '#666', textDecoration: 'none', fontSize: '0.9rem' }}>
                            العودة إلى الفهرس
                        </Link>
                    </div>
                </div>
            </main>
        </>
    )
}
