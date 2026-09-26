'use client'

import { motion } from 'framer-motion'
import Link from 'next/link'
import { useParams, useRouter } from 'next/navigation'
import Navigation from '@/components/Navigation'
import Robot from '@/components/Robot'
import { useEffect, useState } from 'react'
import type { PageContent } from '@/data/bookData'
import { authSystem } from '@/lib/auth_system'
import { verifySession } from '@/lib/auth'
import LockedOverlay from '@/components/reading/LockedOverlay'
import ReadingPagination from '@/components/reading/ReadingPagination'
import CopyButton from '@/components/reading/CopyButton'
import BookmarkButton from '@/components/reading/BookmarkButton'
import ScrollProgress from '@/components/reading/ScrollProgress'

interface AppendixReaderProps {
    /** Entitlement-gated pages: locked pages arrive with empty contentBlocks. */
    data: PageContent[]
    initialHasAccess?: boolean
    initialAuthed?: boolean
}

export default function AppendixReader({ data, initialHasAccess = false, initialAuthed = false }: AppendixReaderProps) {
    const params = useParams()
    const router = useRouter()
    const pageNum = parseInt(params.page as string) || 1

    const [isAuthed, setIsAuthed] = useState(initialAuthed)
    const [isLockOverlayOpen, setIsLockOverlayOpen] = useState(!initialHasAccess)

    const currentPage = data[pageNum - 1]
    const totalPages = data.length
    const isFirstPage = pageNum === 1
    const isLastPage = pageNum === totalPages

    // Appendix is part of the paid book — gated on payment, not just login.
    const isCurrentPageLocked = !initialHasAccess

    useEffect(() => {
        const authed = verifySession()
        // eslint-disable-next-line react-hooks/set-state-in-effect -- verifySession reads document.cookie (unavailable during SSR)
        setIsAuthed(authed)

        if (!initialHasAccess) {
            setIsLockOverlayOpen(true)
        } else {
            // Save progress (Intro:6 + S1:17 + S2-7:18×6 + S8:16 + S9:16 + S10:12 + Library:12 = 187 pages before Appendix)
            authSystem.updateReadingProgress(187 + pageNum).catch(err => {
                console.error('Failed to save progress:', err)
            })
        }
    }, [pageNum, initialHasAccess])

    if (!currentPage) {
        if (typeof window !== 'undefined' && params.page) router.push('/toc')
        return null
    }

    const handleNext = async () => {
        if (!initialHasAccess) {
            setIsLockOverlayOpen(true)
            return
        }
        if (!isLastPage) {
            router.push(`/read/appendix/${pageNum + 1}`)
        } else {
            // Mark Appendix as completed (Index 12)
            await authSystem.completeChapter(12)
            router.push('/read/glossary/1') // Go to glossary
        }
    }

    const handlePrev = () => {
        if (!isFirstPage) {
            router.push(`/read/appendix/${pageNum - 1}`)
        } else {
            // Navigate back to last page of Library (12 pages)
            router.push('/library/12')
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
                    if (!initialHasAccess) router.push(isAuthed ? '/payment?plan=pro' : '/read/section-1/17')
                    else setIsLockOverlayOpen(false)
                }}
                nextPath={`/read/appendix/${pageNum}`}
                isDirectAccess={!initialHasAccess}
            />

            <main style={{ minHeight: '100vh', position: 'relative', overflow: 'hidden', paddingTop: '0' }}>

                <div className="container" style={{ paddingBottom: '40px', maxWidth: '1400px' }}>
                    {/* Reading Actions Bar */}
                    <div className="reading-actions-bar">
                        <BookmarkButton
                            pageId={`appendix-${pageNum}`}
                            pageTitle={`الملحق: ${currentPage.title}`}
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
                            الملحق الإضافي (08): {currentPage.title}
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
                                            <p style={{ fontSize: '1.05rem', color: '#fff', margin: 0, lineHeight: '1.6', whiteSpace: 'pre-line' }}>
                                                {block.content}
                                            </p>
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
  "section": "Appendix",
  "status": "Extra Exercises",
  "mode": "Learn by Example"
}`}
                                    </div>
                                </motion.div>
                            </div>

                            <div style={{
                                width: '100%',
                                background: 'linear-gradient(135deg, rgba(255,107,53,0.08), transparent)',
                                padding: '24px',
                                borderRadius: '20px',
                                border: '1px solid rgba(255,107,53,0.1)'
                            }}>
                                <h4 style={{ color: '#FFB800', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                                    <span>💡</span> نصيحة الملحق
                                </h4>
                                <p style={{ color: '#b0b0b0', fontSize: '0.95rem', lineHeight: '1.6', margin: 0 }}>
                                    هذه التمارين مصممة لصقل مهاراتك. لا تستعجل الحل، قارن وتحليل لماذا تعمل الإجابة النموذجية بشكل أفضل. التكرار هو سر الإتقان.
                                </p>
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
                        isNextLocked={!initialHasAccess}
                        onLockedClick={() => setIsLockOverlayOpen(true)}
                        isBookEnd={isLastPage}
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
