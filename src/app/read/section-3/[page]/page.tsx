'use client'

import { motion } from 'framer-motion'
import Image from 'next/image'
import Link from 'next/link'
import { useParams, useRouter } from 'next/navigation'
import Navigation from '@/components/Navigation'
import Robot from '@/components/Robot'
import { unit3Data } from '@/data/unit3Data'
import { useEffect, useState } from 'react'
import { authSystem } from '@/lib/auth_system'
import { verifySession } from '@/lib/auth'
import LockedOverlay from '@/components/reading/LockedOverlay'
import ReadingPagination from '@/components/reading/ReadingPagination'
import CopyButton from '@/components/reading/CopyButton'
import BookmarkButton from '@/components/reading/BookmarkButton'
import ScrollProgress from '@/components/reading/ScrollProgress'
import GlossaryTerm, { GLOSSARY_PATTERNS } from '@/components/reading/GlossaryTerm'

export default function Section3Page() {
    const params = useParams()
    const router = useRouter()
    const pageNum = parseInt(params.page as string) || 1

    const [isAuthed, setIsAuthed] = useState(false)
    const [isLockOverlayOpen, setIsLockOverlayOpen] = useState(false)

    const currentPage = unit3Data[pageNum - 1]
    const totalPages = unit3Data.length
    const isFirstPage = pageNum === 1
    const isLastPage = pageNum === totalPages

    const isCurrentPageLocked = !isAuthed

    useEffect(() => {
        const authed = verifySession()
        setIsAuthed(authed)

        if (!authed) {
            setIsLockOverlayOpen(true)
        }

        // Save progress (Intro: 2 + Section 1: 11 + Section 2: 15 = 28 pages total before Section 3)
        if (authed) {
            authSystem.updateReadingProgress(28 + pageNum).catch(err => {
                console.error('Failed to save progress:', err)
            })
        }
    }, [pageNum])

    if (!currentPage) {
        if (typeof window !== 'undefined') router.push('/toc')
        return null
    }

    const handleNext = async () => {
        if (!isAuthed) {
            setIsLockOverlayOpen(true)
            return
        }
        if (!isLastPage) {
            router.push(`/read/section-3/${pageNum + 1}`)
        } else {
            // Mark Section 3 as completed (Index 3)
            if (isAuthed) {
                await authSystem.completeChapter(3)
            }
            router.push('/read/section-4/1') // Go to next chapter
        }
    }

    const handlePrev = () => {
        if (!isFirstPage) {
            router.push(`/read/section-3/${pageNum - 1}`)
        } else {
            // Navigate back to last page of Section 2 (15 pages)
            router.push('/read/section-2/15')
        }
    }

    // دالة تحويل الروابط والنصوص والمصطلحات التقنية
    const formatTextWithLinks = (text: string): (string | JSX.Element)[] => {
        if (!text) return [text];

        // قائمة الروابط المعروفة
        const linkPatterns = [
            { pattern: /chat\.openai\.com/g, url: 'https://chat.openai.com' },
            { pattern: /claude\.ai/g, url: 'https://claude.ai' },
            { pattern: /gemini\.google\.com/g, url: 'https://gemini.google.com' },
            { pattern: /openai\.com/g, url: 'https://openai.com' },
            { pattern: /anthropic\.com/g, url: 'https://anthropic.com' },
        ];

        // تقسيم النص وإضافة الروابط
        let parts: (string | JSX.Element)[] = [text];
        let keyCounter = 0;

        // معالجة كل نمط للروابط
        for (const { pattern, url } of linkPatterns) {
            const newParts: (string | JSX.Element)[] = [];
            
            for (const part of parts) {
                if (typeof part !== 'string') {
                    newParts.push(part);
                    continue;
                }

                const regex = new RegExp(pattern.source, 'g');
                let lastIndex = 0;
                let match;

                while ((match = regex.exec(part)) !== null) {
                    if (match.index > lastIndex) {
                        newParts.push(part.slice(lastIndex, match.index));
                    }
                    newParts.push(
                        <a 
                            key={`link-${keyCounter++}`}
                            href={url}
                            target="_blank"
                            rel="noopener noreferrer"
                            style={{
                                color: '#FF6B35',
                                textDecoration: 'underline',
                                fontWeight: 600,
                                cursor: 'pointer'
                            }}
                        >
                            {match[0]}
                        </a>
                    );
                    lastIndex = regex.lastIndex;
                }
                if (lastIndex < part.length) {
                    newParts.push(part.slice(lastIndex));
                } else if (lastIndex === 0) {
                    newParts.push(part);
                }
            }
            
            parts = newParts;
        }

        // معالجة المصطلحات التقنية
        for (const { termId, patterns } of GLOSSARY_PATTERNS) {
            const newParts: (string | JSX.Element)[] = [];
            
            for (const part of parts) {
                if (typeof part !== 'string') {
                    newParts.push(part);
                    continue;
                }

                const patternRegex = new RegExp(`(${patterns.join('|')})`, 'gi');
                const segments = part.split(patternRegex);
                
                for (const segment of segments) {
                    if (!segment) continue;
                    
                    const isGlossaryTerm = patterns.some(p => 
                        segment.toLowerCase() === p.toLowerCase()
                    );
                    
                    if (isGlossaryTerm) {
                        newParts.push(
                            <GlossaryTerm key={`glossary-${keyCounter++}`} termId={termId} displayText={segment} />
                        );
                    } else {
                        newParts.push(segment);
                    }
                }
            }
            
            parts = newParts;
        }

        // تنسيق أسماء الشخصيات
        const finalParts: (string | JSX.Element)[] = [];
        for (const part of parts) {
            if (typeof part !== 'string') {
                finalParts.push(part);
                continue;
            }

            const nameParts = part.split(/(سارة:|أحمد:)/g);
            for (const namePart of nameParts) {
                if (namePart === 'سارة:' || namePart === 'أحمد:') {
                    finalParts.push(
                        <span key={`name-${keyCounter++}`} style={{ color: '#FF6B35', fontWeight: 'bold' }}>
                            {namePart}
                        </span>
                    );
                } else if (namePart) {
                    finalParts.push(namePart);
                }
            }
        }

        return finalParts;
    };

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
                nextPath={`/read/section-3/${pageNum}`}
                isDirectAccess={!isAuthed}
            />

            <main style={{ minHeight: '100vh', position: 'relative', overflow: 'hidden', paddingTop: '0' }}>
                <div className="container" style={{ paddingBottom: '40px', maxWidth: '1400px' }}>
                    {/* Reading Actions Bar */}
                    <div className="reading-actions-bar">
                        <BookmarkButton 
                            pageId={`section-3-${pageNum}`} 
                            pageTitle={`الفصل 03: ${currentPage.title}`} 
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
                            الفصل 03: {currentPage.title}
                        </h1>
                        <p style={{ fontSize: '1.15rem', color: '#b0b0b0', maxWidth: '800px', margin: '0 auto' }}>
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
                            {currentPage.contentBlocks.map((block, index) => (
                                <div key={index}>
                                    {block.type === 'text' && (
                                        <div style={{
                                            padding: '20px 0',
                                            borderRight: index === 0 ? '4px solid #FF6B35' : 'none',
                                            paddingRight: index === 0 ? '20px' : '0'
                                        }}>
                                            <p style={{
                                                fontSize: '1.15rem',
                                                lineHeight: '1.7',
                                                color: index === 0 ? '#fff' : '#b0b0b0',
                                                fontWeight: index === 0 ? 600 : 400,
                                                whiteSpace: 'pre-line'
                                            }}>
                                                {formatTextWithLinks(block.content)}
                                            </p>
                                        </div>
                                    )}
                                    {block.type === 'card' && (
                                        <motion.div
                                            className="card card-glow responsive-card"
                                            style={{
                                                background: 'rgba(255, 107, 53, 0.03)',
                                                border: '1px solid rgba(255, 107, 53, 0.1)',
                                                borderRadius: '16px',
                                                position: 'relative',
                                                overflow: 'hidden'
                                            }}
                                            whileHover={{ y: -5, background: 'rgba(255, 107, 53, 0.05)' }}
                                        >
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '12px' }}>
                                                <div style={{
                                                    width: '32px',
                                                    height: '32px',
                                                    borderRadius: '50%',
                                                    background: 'linear-gradient(135deg, #FF6B35, #FF8C42)',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'center',
                                                    fontSize: '1rem',
                                                    fontWeight: '900',
                                                    color: '#fff',
                                                    flexShrink: 0
                                                }}>
                                                    {index + 1}
                                                </div>
                                                <h3 style={{ fontSize: '1.4rem', margin: 0, color: '#FF6B35' }}>
                                                    {block.title}
                                                </h3>
                                            </div>
                                            <p className="responsive-indent" style={{
                                                fontSize: '1.05rem',
                                                color: '#d0d0d0',
                                                marginBottom: block.items ? '24px' : '0',
                                                whiteSpace: 'pre-line'
                                            }}>
                                                {formatTextWithLinks(block.content)}
                                            </p>

                                            {block.items && (
                                                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '16px' }}>
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
                                            {block.title && <h3 style={{ color: '#FF6B35', marginBottom: '12px', fontSize: '1.2rem' }}>{block.title}</h3>}
                                            <div className="code-block" style={{ margin: 0, paddingTop: '50px', position: 'relative' }}>
                                                <CopyButton text={block.code || ''} />
                                                <pre><code>{block.code}</code></pre>
                                            </div>
                                            {block.content && (
                                                <p style={{ color: '#FFB800', marginTop: '10px', fontSize: '0.9rem' }}>✦ {block.content}</p>
                                            )}
                                        </div>
                                    )}
                                    {block.type === 'image' && (
                                        <motion.div
                                            initial={{ opacity: 0, scale: 0.95 }}
                                            whileInView={{ opacity: 1, scale: 1 }}
                                            viewport={{ once: true }}
                                            style={{
                                                borderRadius: '16px',
                                                overflow: 'hidden',
                                                border: '1px solid rgba(255, 107, 53, 0.2)',
                                                boxShadow: '0 10px 30px rgba(0,0,0,0.5)',
                                                margin: '10px 0'
                                            }}
                                        >
                                            <div style={{ position: 'relative', width: '100%', aspectRatio: '16/9' }}>
                                                <Image
                                                    src={block.imageUrl || ''}
                                                    alt={block.title || 'Lesson Image'}
                                                    fill
                                                    style={{ objectFit: 'cover' }}
                                                    unoptimized
                                                />
                                            </div>
                                            {block.title && (
                                                <div style={{
                                                    padding: '12px',
                                                    background: 'rgba(0,0,0,0.6)',
                                                    color: '#fff',
                                                    fontSize: '0.9rem',
                                                    textAlign: 'center',
                                                    borderTop: '1px solid rgba(255, 107, 53, 0.1)'
                                                }}>
                                                    {block.title}
                                                </div>
                                            )}
                                        </motion.div>
                                    )}
                                </div>
                            ))}
                        </motion.div>

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
  "framework": "GOLDS",
  "level": "Intermediate",
  "status": "Mastering..."
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
