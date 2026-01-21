'use client'

import { motion } from 'framer-motion'
import Link from 'next/link'
import { useParams, useRouter } from 'next/navigation'
import Navigation from '@/components/Navigation'
import Robot from '@/components/Robot'
import { section5 } from '@/data/bookData'
import { useEffect, useState } from 'react'
import { authSystem } from '@/lib/auth_system'
import { verifySession } from '@/lib/auth'
import LockedOverlay from '@/components/reading/LockedOverlay'
import ReadingPagination from '@/components/reading/ReadingPagination'
import CopyButton from '@/components/reading/CopyButton'
import BookmarkButton from '@/components/reading/BookmarkButton'
import ScrollProgress from '@/components/reading/ScrollProgress'

export default function Section5Page() {
    const params = useParams()
    const router = useRouter()
    const pageNum = parseInt(params.page as string) || 1

    const [isAuthed, setIsAuthed] = useState(false)
    const [isLockOverlayOpen, setIsLockOverlayOpen] = useState(false)

    const currentPage = section5[pageNum - 1]
    const totalPages = section5.length
    const isFirstPage = pageNum === 1
    const isLastPage = pageNum === totalPages

    const isCurrentPageLocked = !isAuthed

    useEffect(() => {
        const authed = verifySession()
        setIsAuthed(authed)

        if (!authed) {
            setIsLockOverlayOpen(true)
        }

        // Save progress (Intro: 2 + S1: 11 + S2: 6 + S3: 9 + S4: 11 = 39 pages total before Section 5)
        if (authed) {
            authSystem.updateReadingProgress(39 + pageNum).catch(err => {
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
            router.push(`/read/section-5/${pageNum + 1}`)
        } else {
            // Mark Section 5 as completed (Index 5)
            if (isAuthed) {
                await authSystem.completeChapter(5)
            }
            router.push('/read/section-6/1') // Go to next chapter
        }
    }

    const handlePrev = () => {
        if (!isFirstPage) {
            router.push(`/read/section-5/${pageNum - 1}`)
        } else {
            // Navigate back to last page of Section 4 (11 pages)
            router.push('/read/section-4/11')
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
                nextPath={`/read/section-5/${pageNum}`}
                isDirectAccess={!isAuthed}
            />

            <main style={{ minHeight: '100vh', position: 'relative', overflow: 'hidden', paddingTop: '0' }}>

                <div className="container" style={{ paddingBottom: '40px', maxWidth: '1400px' }}>
                    {/* Reading Actions Bar */}
                    <div className="reading-actions-bar">
                        <BookmarkButton 
                            pageId={`section-5-${pageNum}`} 
                            pageTitle={`الفصل 05: ${currentPage.title}`} 
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
                            الفصل 05: {currentPage.title}
                        </h1>
                        <p style={{ fontSize: '1.25rem', color: '#b0b0b0', maxWidth: '800px', margin: '0 auto' }}>
                            {currentPage.description}
                        </p>
                    </motion.div>

                    <div className="read-layout-grid">
                        <motion.div
                            initial={{ opacity: 0, x: 30 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ duration: 0.8, delay: 0.2 }}
                            key={pageNum}
                            style={{
                                display: 'flex',
                                flexDirection: 'column',
                                gap: '24px',
                                filter: isCurrentPageLocked ? 'blur(8px)' : 'none',
                                pointerEvents: isCurrentPageLocked ? 'none' : 'auto',
                                opacity: isCurrentPageLocked ? 0.3 : 1
                            }}
                        >
                            {currentPage.contentBlocks.map((block: any, index: number) => (
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
                                            className="card card-glow"
                                            style={{
                                                padding: '24px',
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
                                                <p style={{
                                                    fontSize: '1.05rem',
                                                    color: '#fff',
                                                    margin: 0,
                                                    lineHeight: '1.6',
                                                    whiteSpace: 'pre-line',
                                                    marginBottom: block.items ? '16px' : '0'
                                                }}>
                                                    {block.content}
                                                </p>
                                            )}

                                            {block.items && (
                                                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '12px' }}>
                                                    {block.items.map((item: any, idx: number) => (
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

                        <div style={{
                            position: 'sticky',
                            top: '120px',
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            gap: '40px'
                        }}>
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
                                        backdropFilter: 'blur(8px)'
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
  "section": 5,
  "status": "QA & Feedback",
  "theme": "Quality Assurance",
  "ai_mode": "Critic"
}`}
                                    </div>
                                </motion.div>
                            </div>

                        </div>
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
