'use client'

import { motion, AnimatePresence } from 'framer-motion'
import Link from 'next/link'
import { useParams, useRouter } from 'next/navigation'
import Navigation from '@/components/Navigation'
import { libraryData } from '@/data/bookData'
import { useEffect, useState } from 'react'

import { verifySession } from '@/lib/auth'
import LockedOverlay from '@/components/reading/LockedOverlay'
import ReadingPagination from '@/components/reading/ReadingPagination'
import { authSystem } from '@/lib/auth_system'
import CopyButton from '@/components/reading/CopyButton'
import BookmarkButton from '@/components/reading/BookmarkButton'
import ScrollProgress from '@/components/reading/ScrollProgress'

export default function LibraryPage() {
    const params = useParams()
    const router = useRouter()
    const pageNum = parseInt(params.page as string) || 1

    const [isAuthed, setIsAuthed] = useState(false)
    const [isLockOverlayOpen, setIsLockOverlayOpen] = useState(false)
    const [showToast, setShowToast] = useState(false)

    const currentPage = libraryData[pageNum - 1]
    const totalPages = libraryData.length
    const isFirstPage = pageNum === 1
    const isLastPage = pageNum === totalPages

    // Library/Templates are locked content
    const isCurrentPageLocked = !isAuthed

    useEffect(() => {
        const authed = verifySession()
        setIsAuthed(authed)

        if (!authed) {
            setIsLockOverlayOpen(true)
        }

        // Save progress (Intro: 2 + S1-6: 56 = 58 pages before Library, Library has 8 pages)
        if (authed) {
            authSystem.updateReadingProgress(58 + pageNum).catch(err => {
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
            router.push(`/library/${pageNum + 1}`)
        } else {
            // Mark Library as completed (Index 7)
            if (isAuthed) {
                await authSystem.completeChapter(7)
            }
            router.push('/read/appendix/1') // Go to next chapter
        }
    }

    const handlePrev = () => {
        if (!isFirstPage) {
            router.push(`/library/${pageNum - 1}`)
        } else {
            // Navigate back to last page of Section 6 (9 pages)
            router.push('/read/section-6/9')
        }
    }

    const parseContent = (content: string) => {
        const sections: { label: string; text: string }[] = []
        const labels = ["الهدف:", "البرومبت:", "البرومبت (انسخ/الصق):", "الناتج المتوقع:", "Checklist:"]

        const matches: { label: string; index: number }[] = []
        labels.forEach(label => {
            let idx = content.indexOf(label)
            while (idx !== -1) {
                matches.push({ label, index: idx })
                idx = content.indexOf(label, idx + 1)
            }
        })

        matches.sort((a, b) => a.index - b.index)

        for (let i = 0; i < matches.length; i++) {
            const match = matches[i]
            const nextMatch = matches[i + 1]
            const textStart = match.index + match.label.length
            const textEnd = nextMatch ? nextMatch.index : content.length

            sections.push({
                label: match.label,
                text: content.substring(textStart, textEnd).trim()
            })
        }

        return sections
    }

    const copyToClipboard = async (sections: { label: string; text: string }[]) => {
        const promptSection = sections.find(s => s.label.includes("البرومبت"))
        if (promptSection) {
            try {
                await navigator.clipboard.writeText(promptSection.text)
                setShowToast(true)
                setTimeout(() => setShowToast(false), 2000)
            } catch {
                // Silent fail for clipboard
            }
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
                nextPath={`/library/${pageNum}`}
                isDirectAccess={!isAuthed}
            />

            <main style={{ minHeight: '100vh', position: 'relative', overflow: 'hidden', paddingTop: '20px' }}>

                <div className="container" style={{
                    paddingBottom: '40px',
                    filter: isCurrentPageLocked ? 'blur(8px)' : 'none',
                    pointerEvents: isCurrentPageLocked ? 'none' : 'auto',
                    opacity: isCurrentPageLocked ? 0.3 : 1
                }}>
                    {/* Reading Actions Bar */}
                    <div className="reading-actions-bar">
                        <BookmarkButton 
                            pageId={`library-${pageNum}`} 
                            pageTitle={`المكتبة: ${currentPage.title}`} 
                        />
                    </div>

                    <motion.div
                        style={{ marginBottom: '24px', textAlign: 'center' }}
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6 }}
                    >
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '16px', marginBottom: '16px' }}>
                            <span style={{ fontSize: '1.5rem', fontWeight: '900', color: '#FF6B35' }}>
                                {pageNum < 10 ? `0${pageNum}` : pageNum}
                            </span>
                            <h1 style={{ fontSize: 'clamp(2rem, 5vw, 3.5rem)', margin: 0 }}>
                                {currentPage.title}
                            </h1>
                        </div>
                        <p style={{ fontSize: '1.25rem', color: '#b0b0b0', maxWidth: '700px', margin: '0 auto' }}>
                            {currentPage.description}
                        </p>
                    </motion.div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '32px', maxWidth: '900px', margin: '0 auto' }}>
                        {currentPage.contentBlocks.map((block, index) => (
                            <motion.div
                                key={`${pageNum}-${index}`}
                                initial={{ opacity: 0, y: 30 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.6, delay: index * 0.1 }}
                            >
                                {block.type === 'text' && (
                                    <h2 style={{
                                        fontSize: '1.75rem',
                                        color: '#FF6B35',
                                        marginTop: '40px',
                                        marginBottom: '16px',
                                        borderRight: '4px solid #FF6B35',
                                        paddingRight: '16px'
                                    }}>
                                        {block.content}
                                    </h2>
                                )}
                                {block.type === 'card' && (() => {
                                    const sections = parseContent(block.content)
                                    return (
                                        <div className="card card-glow" style={{ padding: '32px', position: 'relative' }}>
                                            <h3 style={{ fontSize: '1.5rem', marginBottom: '20px', color: '#fff' }}>
                                                {block.title}
                                            </h3>

                                            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                                                {sections.map((section, i) => {
                                                    const isPrompt = section.label.includes("البرومبت")
                                                    return (
                                                        <div key={i} style={isPrompt ? {
                                                            background: 'rgba(0,0,0,0.3)',
                                                            padding: '20px',
                                                            borderRadius: '12px',
                                                            border: '1px solid rgba(255, 107, 53, 0.2)',
                                                            position: 'relative'
                                                        } : {}}>
                                                            <strong style={{
                                                                color: isPrompt ? '#FF6B35' : (section.label === "Checklist:" ? '#FFB800' : '#fff'),
                                                                display: 'block',
                                                                marginBottom: '8px'
                                                            }}>
                                                                {section.label}
                                                            </strong>
                                                            <div style={{
                                                                whiteSpace: 'pre-wrap',
                                                                color: isPrompt ? '#e0e0e0' : '#b0b0b0',
                                                                fontSize: isPrompt ? '0.95rem' : '1.05rem',
                                                                lineHeight: '1.6',
                                                                fontFamily: isPrompt ? 'Tajawal, sans-serif' : 'inherit'
                                                            }}>
                                                                {section.text}
                                                            </div>
                                                            {isPrompt && (
                                                                <button
                                                                    onClick={() => copyToClipboard(sections)}
                                                                    className="btn btn-primary"
                                                                    style={{
                                                                        marginTop: '16px',
                                                                        padding: '8px 16px',
                                                                        fontSize: '0.9rem'
                                                                    }}
                                                                >
                                                                    <span>نسخ البرومبت</span>
                                                                </button>
                                                            )}
                                                        </div>
                                                    )
                                                })}
                                            </div>
                                        </div>
                                    )
                                })()}
                            </motion.div>
                        ))}
                    </div>

                    {/* Navigation */}
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
                        <Link href="/toc" style={{ color: '#b0b0b0', textDecoration: 'none' }}>
                            العودة إلى الفهرس
                        </Link>
                    </div>
                </div>

                <AnimatePresence>
                    {showToast && (
                        <motion.div
                            initial={{ opacity: 0, y: 50 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: 50 }}
                            style={{
                                position: 'fixed',
                                bottom: '40px',
                                left: '50%',
                                transform: 'translateX(-50%)',
                                background: '#FF6B35',
                                color: '#fff',
                                padding: '12px 24px',
                                borderRadius: '30px',
                                boxShadow: '0 10px 30px rgba(255, 107, 53, 0.3)',
                                zIndex: 1000,
                                fontWeight: 'bold'
                            }}
                        >
                            تم النسخ بنجاح!
                        </motion.div>
                    )}
                </AnimatePresence>
            </main>
        </>
    )
}

