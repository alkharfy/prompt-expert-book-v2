'use client'

import { motion } from 'framer-motion'
import Link from 'next/link'
import { useParams, useRouter } from 'next/navigation'
import Navigation from '@/components/Navigation'
import Robot from '@/components/Robot'
import { section1 } from '@/data/bookData'
import { useEffect, useState } from 'react'
import { authSystem } from '@/lib/auth_system'
import { verifySession } from '@/lib/auth'
import LockedOverlay from '@/components/reading/LockedOverlay'
import ReadingPagination from '@/components/reading/ReadingPagination'
import CopyButton from '@/components/reading/CopyButton'
import BookmarkButton from '@/components/reading/BookmarkButton'
import ScrollProgress from '@/components/reading/ScrollProgress'

export default function Section1Page() {
    const params = useParams()
    const router = useRouter()
    const pageNum = parseInt(params.page as string) || 1

    const [isAuthed, setIsAuthed] = useState(false)
    const [isLockOverlayOpen, setIsLockOverlayOpen] = useState(false)
    const [isDirectAccess, setIsDirectAccess] = useState(false)

    const currentPage = section1[pageNum - 1]
    const totalPages = section1.length
    const isFirstPage = pageNum === 1
    const isLastPage = pageNum === totalPages

    // Logic for locking - only lock if not authenticated
    // Logged in users have access to all pages
    const FREE_PAGES_LIMIT = 2
    const isCurrentPageLocked = pageNum > FREE_PAGES_LIMIT && !isAuthed
    const isNextPageLocked = pageNum === FREE_PAGES_LIMIT && !isAuthed

    useEffect(() => {
        const authed = verifySession()
        setIsAuthed(authed)

        // If trying to access a locked page directly without auth
        if (pageNum > FREE_PAGES_LIMIT && !authed) {
            setIsLockOverlayOpen(true)
            setIsDirectAccess(true)
        }

        // Save progress (Section 1 starts after Intro pages which are 2)
        // Global page = 2 + pageNum
        if (authed) {
            authSystem.updateReadingProgress(2 + pageNum).catch(err => {
                console.error('Failed to save progress:', err)
            })
        }
    }, [pageNum])

    if (!currentPage) {
        if (typeof window !== 'undefined') router.push('/toc')
        return null
    }

    const handleNext = async () => {
        if (isNextPageLocked) {
            setIsLockOverlayOpen(true)
            setIsDirectAccess(false)
            return
        }

        if (!isLastPage) {
            router.push(`/read/section-1/${pageNum + 1}`)
        } else {
            // Mark Section 1 as completed (Index 1)
            if (isAuthed) {
                await authSystem.completeChapter(1)
            }
            router.push('/read/section-2/1') // Go to next chapter
        }
    }

    const handlePrev = () => {
        if (!isFirstPage) {
            router.push(`/read/section-1/${pageNum - 1}`)
        } else {
            // Navigate back to last page of Intro
            router.push('/read/intro/2')
        }
    }

    return (
        <>
            <Navigation />
            <ScrollProgress />

            {/* Locked Overlay */}
            <LockedOverlay
                isOpen={isLockOverlayOpen}
                onClose={() => setIsLockOverlayOpen(false)}
                nextPath={`/read/section-1/${isDirectAccess ? pageNum : pageNum + 1}`}
                isDirectAccess={isDirectAccess}
            />

            <main style={{ minHeight: '100vh', position: 'relative', overflow: 'hidden', paddingTop: '0' }}>
                <div className="container" style={{ paddingBottom: '40px', maxWidth: '1400px' }}>
                    {/* Reading Actions Bar */}
                    <div className="reading-actions-bar">
                        <BookmarkButton 
                            pageId={`section-1-${pageNum}`} 
                            pageTitle={`الفصل 01: ${currentPage.title}`} 
                        />
                    </div>

                    {/* Header */}
                    <motion.div
                        style={{ textAlign: 'center', marginBottom: '48px' }}
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.8 }}
                    >
                        <h1 className="chapter-title">
                            الفصل 01: {currentPage.title}
                        </h1>
                        <p style={{ fontSize: '1.15rem', color: '#b0b0b0', maxWidth: '800px', margin: '0 auto' }}>
                            {currentPage.description}
                        </p>
                    </motion.div>

                    <div className="read-layout-grid">
                        {/* Right Column Content */}
                        <motion.div
                            initial={{ opacity: 0, x: 30 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ duration: 0.8, delay: 0.2 }}
                            key={pageNum}
                            style={{
                                display: 'flex',
                                flexDirection: 'column',
                                gap: '24px',
                                filter: isCurrentPageLocked && !isAuthed ? 'blur(8px)' : 'none',
                                pointerEvents: isCurrentPageLocked && !isAuthed ? 'none' : 'auto',
                                opacity: isCurrentPageLocked && !isAuthed ? 0.3 : 1
                            }}
                        >
                            {currentPage.contentBlocks.map((block, index) => (
                                <div key={index}>
                                    {block.type === 'text' && (
                                        <div style={{
                                            padding: '16px 24px',
                                            background: 'rgba(255, 255, 255, 0.02)',
                                            borderRadius: '12px',
                                            borderRight: '4px solid #FF6B35'
                                        }}>
                                            {block.title && <h4 style={{ color: '#FF6B35', marginBottom: '8px' }}>{block.title}</h4>}
                                            <p style={{
                                                fontSize: '1.1rem',
                                                lineHeight: '1.8',
                                                color: '#d0d0d0',
                                                margin: 0,
                                                whiteSpace: 'pre-line'
                                            }}>
                                                {block.content}
                                            </p>
                                        </div>
                                    )}
                                    {block.type === 'card' && (
                                        <motion.div
                                            className="card card-glow responsive-card"
                                            style={{
                                                background: 'rgba(255, 107, 53, 0.04)',
                                                border: '1px solid rgba(255, 107, 53, 0.15)',
                                                borderRadius: '16px',
                                            }}
                                            whileHover={{ y: -5, background: 'rgba(255, 107, 53, 0.06)' }}
                                        >
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '12px' }}>
                                                <div style={{
                                                    width: '28px',
                                                    height: '28px',
                                                    borderRadius: '50%',
                                                    background: '#FF6B35',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'center',
                                                    fontSize: '0.9rem',
                                                    fontWeight: 'bold',
                                                    color: '#fff'
                                                }}>
                                                    ✦
                                                </div>
                                                <h3 style={{ fontSize: '1.3rem', margin: 0, color: '#FFB800' }}>
                                                    {block.title}
                                                </h3>
                                            </div>
                                            {block.content && (
                                                <p style={{ fontSize: '1.05rem', color: '#fff', margin: 0, lineHeight: '1.6', whiteSpace: 'pre-line', marginBottom: block.items ? '16px' : '0' }}>
                                                    {block.content}
                                                </p>
                                            )}

                                            {block.items && (
                                                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                                    {block.items.map((item, idx) => (
                                                        <details
                                                            key={idx}
                                                            style={{
                                                                background: 'rgba(255, 255, 255, 0.03)',
                                                                borderRadius: '8px',
                                                                overflow: 'hidden',
                                                                border: '1px solid rgba(255, 255, 255, 0.05)'
                                                            }}
                                                        >
                                                            <summary style={{
                                                                padding: '12px 16px',
                                                                cursor: 'pointer',
                                                                fontWeight: 'bold',
                                                                color: '#e0e0e0',
                                                                fontSize: '0.95rem',
                                                                userSelect: 'none',
                                                                outline: 'none'
                                                            }}>
                                                                {item.title}
                                                            </summary>
                                                            <div style={{
                                                                padding: '0 16px 16px 16px',
                                                                fontSize: '0.9rem',
                                                                color: '#b0b0b0',
                                                                lineHeight: '1.5'
                                                            }}>
                                                                {item.content}
                                                            </div>
                                                        </details>
                                                    ))}
                                                </div>
                                            )}
                                        </motion.div>
                                    )}
                                    {block.type === 'code' && (
                                        <div className="code-block-wrapper" style={{ marginTop: '10px' }}>
                                            {block.title && <h3 style={{ color: '#FF6B35', marginBottom: '12px', fontSize: '1.4rem' }}>{block.title}</h3>}
                                            <div className="code-block" style={{ margin: 0, padding: '24px', paddingTop: '50px', position: 'relative' }}>
                                                <CopyButton text={block.code || ''} />
                                                <pre style={{ margin: 0, whiteSpace: 'pre-wrap' }}><code style={{ color: '#FFB800' }}>{block.code}</code></pre>
                                                {block.content && (
                                                    <div style={{
                                                        marginTop: '16px',
                                                        paddingTop: '16px',
                                                        borderTop: '1px solid rgba(255,107,53,0.2)',
                                                        fontSize: '0.9rem',
                                                        color: '#888',
                                                        whiteSpace: 'pre-line'
                                                    }}>
                                                        {block.content}
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            ))}
                        </motion.div>

                        {/* Left Column Sidebar */}
                        <div className="lesson-sidebar">
                            <div style={{ position: 'relative' }}>
                                <Robot size={320} />

                                <motion.div
                                    className="floating-code-card"
                                    style={{
                                        position: 'absolute',
                                        bottom: '-20px',
                                        left: '-40px',
                                        width: '300px',
                                        background: 'rgba(10, 10, 10, 0.95)',
                                        border: '1px solid #FF6B35',
                                        borderRadius: '12px',
                                        padding: '16px',
                                        boxShadow: '0 10px 30px rgba(0,0,0,0.8), 0 0 15px rgba(255,107,53,0.2)',
                                        zIndex: 10,
                                        backdropFilter: 'blur(8px)',
                                        direction: 'ltr'
                                    }}
                                    animate={{
                                        y: [0, -12, 0],
                                        rotate: [-0.5, 0.5, -0.5]
                                    }}
                                    transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}
                                >
                                    <div style={{ display: 'flex', gap: '5px', marginBottom: '10px' }}>
                                        <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#ff5f56' }} />
                                        <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#ffbd2e' }} />
                                        <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#27c93f' }} />
                                    </div>
                                    <div style={{ fontSize: '12px', color: '#FF6B35', fontFamily: 'monospace' }}>
                                        {`{
  "section": 1,
  "status": "Learning Foundations",
  "topic": "Prompt Basics",
  "ai_mode": "Expert Tutor"
}`}
                                    </div>
                                </motion.div>
                            </div>

                        </div>
                    </div>

                    {/* Navigation Buttons & Progress Dots */}
                    <ReadingPagination
                        currentIndex={pageNum - 1}
                        total={totalPages}
                        onPrev={handlePrev}
                        onNext={handleNext}
                        isFirst={isFirstPage}
                        isLast={isLastPage}
                        isNextLocked={isNextPageLocked}
                        onLockedClick={() => {
                            setIsLockOverlayOpen(true)
                            setIsDirectAccess(false)
                        }}
                    />

                    <div style={{ textAlign: 'center', marginTop: '40px' }}>
                        <Link href="/toc" style={{ color: '#b0b0b0', textDecoration: 'none', fontSize: '0.9rem' }}>
                            العودة إلى الفهرس
                        </Link>
                    </div>
                </div>
            </main>
        </>
    )
}
