'use client'

import { motion } from 'framer-motion'
import Image from 'next/image'
import Link from 'next/link'
import { useParams, useRouter } from 'next/navigation'
import Navigation from '@/components/Navigation'
import Robot from '@/components/Robot'
import { unit1Data } from '@/data/unit1Data'
import { useEffect, useState } from 'react'
import { authSystem } from '@/lib/auth_system'
import { verifySession } from '@/lib/auth'
import LockedOverlay from '@/components/reading/LockedOverlay'
import ReadingPagination from '@/components/reading/ReadingPagination'
import CopyButton from '@/components/reading/CopyButton'
import BookmarkButton from '@/components/reading/BookmarkButton'
import ScrollProgress from '@/components/reading/ScrollProgress'
import { updateGamification } from '@/lib/gamification'

export default function Section1Page() {
    const params = useParams()
    const router = useRouter()
    const pageNum = parseInt(params.page as string) || 1

    const [isAuthed, setIsAuthed] = useState(false)
    const [isLockOverlayOpen, setIsLockOverlayOpen] = useState(false)
    const [isDirectAccess, setIsDirectAccess] = useState(false)
    const [claimedRewards, setClaimedRewards] = useState<string[]>([])
    const [showRewardCelebration, setShowRewardCelebration] = useState<string | null>(null)

    const currentPage = unit1Data[pageNum - 1]
    const totalPages = unit1Data.length
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

            // Load claimed rewards
            const savedRewards = localStorage.getItem('claimed_rewards')
            if (savedRewards) {
                setClaimedRewards(JSON.parse(savedRewards))
            }
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

    const handleClaimReward = async (rewardId: string, points: number) => {
        if (!isAuthed) {
            setIsLockOverlayOpen(true)
            return
        }

        if (claimedRewards.includes(rewardId)) return

        try {
            const userId = authSystem.getCurrentUserId()
            if (userId) {
                await updateGamification(userId, points, 'mission_complete')
                const newClaimed = [...claimedRewards, rewardId]
                setClaimedRewards(newClaimed)
                localStorage.setItem('claimed_rewards', JSON.stringify(newClaimed))

                // Show celebration
                setShowRewardCelebration(rewardId)
                setTimeout(() => setShowRewardCelebration(null), 3000)
            }
        } catch (err) {
            console.error('Failed to claim reward:', err)
        }
    }

    const formatEnhancedText = (text: string) => {
        if (!text) return text;

        // Remove markdown bold first to avoid double styling
        let processedText = text.replace(/\*\*/g, '');

        // Match numbers, "قول", and "الفرق"
        const parts = processedText.split(/(\d+|قول|الفرق)/g);

        return parts.map((part, i) => {
            if (/^\d+$/.test(part) || part === 'قول' || part === 'الفرق') {
                return (
                    <span key={i} style={{ color: '#FF6B35', fontWeight: 'bold' }}>
                        {part}
                    </span>
                );
            }
            return part;
        });
    };

    // دالة تحويل الروابط
    const formatLinks = (text: string): (string | JSX.Element)[] => {
        if (!text) return [text];

        const linkPatterns = [
            { pattern: /chat\.openai\.com/g, url: 'https://chat.openai.com' },
            { pattern: /claude\.ai/g, url: 'https://claude.ai' },
            { pattern: /gemini\.google\.com/g, url: 'https://gemini.google.com' },
            { pattern: /openai\.com/g, url: 'https://openai.com' },
            { pattern: /anthropic\.com/g, url: 'https://anthropic.com' },
        ];

        let parts: (string | JSX.Element)[] = [text];
        let keyCounter = 0;

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
                                fontWeight: 600
                            }}
                        >
                            {match[0]}
                        </a>
                    );
                    lastIndex = regex.lastIndex;
                }
                if (lastIndex < part.length) {
                    newParts.push(part.slice(lastIndex));
                }
            }
            
            parts = newParts.length > 0 ? newParts : parts;
        }

        return parts;
    };

    const formatDialogue = (text: string) => {
        if (!text) return text;
        
        // أولاً تحويل الروابط
        const linkedParts = formatLinks(text);
        
        // ثم تنسيق أسماء الشخصيات
        const finalParts: (string | JSX.Element)[] = [];
        let keyCounter = 100;
        
        for (const part of linkedParts) {
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
                } else {
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
                    {(() => {
                        const hasPageImage = currentPage.contentBlocks.some(b => b.type === 'image');
                        return (
                            <motion.div
                                style={{ textAlign: 'center', marginBottom: '48px' }}
                                initial={{ opacity: 0, y: -20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.8 }}
                            >
                                <div style={{ marginBottom: '8px' }}>
                                    <span style={{
                                        color: '#FF6B35',
                                        fontWeight: 'bold',
                                        fontSize: '1.1rem',
                                        opacity: 0.9,
                                        display: 'block',
                                        marginBottom: '4px'
                                    }}>
                                        الفصل 01
                                    </span>
                                </div>
                                <div style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    gap: '24px',
                                    marginBottom: '16px',
                                    flexWrap: 'wrap'
                                }}>
                                    <h1 className="chapter-title" style={{ fontSize: '3.5rem', margin: 0, fontWeight: '800', lineHeight: 1.2 }}>
                                        {currentPage.title}
                                    </h1>

                                    {/* Robot Mascot - Placed next to title (Left in RTL) - Only if NO image */}
                                    {!hasPageImage && <Robot size={100} />}
                                </div>

                                <p style={{ fontSize: '1.4rem', color: '#b0b0b0', maxWidth: '800px', margin: '0 auto', fontWeight: '500' }}>
                                    {currentPage.description}
                                </p>
                            </motion.div>
                        );
                    })()}

                    {/* Main Illustration - Placed after title and before text */}
                    {currentPage.contentBlocks.find(b => b.type === 'image') && (
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.8, delay: 0.2 }}
                            style={{
                                maxWidth: '850px',
                                margin: '0 auto 48px auto',
                                width: '100%',
                                textAlign: 'center'
                            }}
                        >
                            <div style={{
                                borderRadius: '24px',
                                overflow: 'hidden',
                                border: '1px solid rgba(255, 107, 53, 0.25)',
                                boxShadow: '0 25px 60px rgba(0,0,0,0.7)',
                                aspectRatio: '16/9',
                                position: 'relative',
                                background: 'rgba(0,0,0,0.3)'
                            }}>
                                <Image
                                    src={currentPage.contentBlocks.find(b => b.type === 'image')?.imageUrl || ''}
                                    alt="Main Illustration"
                                    fill
                                    style={{ objectFit: 'cover' }}
                                    unoptimized
                                />
                            </div>
                        </motion.div>
                    )}

                    <div style={{ maxWidth: '900px', margin: '0 auto' }}>
                        {/* Content Column */}
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.8, delay: 0.4 }}
                            key={pageNum}
                            style={{
                                display: 'flex',
                                flexDirection: 'column',
                                gap: '32px',
                                filter: isCurrentPageLocked && !isAuthed ? 'blur(8px)' : 'none',
                                pointerEvents: isCurrentPageLocked && !isAuthed ? 'none' : 'auto',
                                opacity: isCurrentPageLocked && !isAuthed ? 0.3 : 1
                            }}
                        >
                            {currentPage.contentBlocks
                                .filter((block, idx) => !(block.type === 'image' && idx === currentPage.contentBlocks.findIndex(b => b.type === 'image')))
                                .map((block, index) => (
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
                                                    {formatDialogue(block.content)}
                                                </p>
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
                                                        {formatEnhancedText(block.title)}
                                                    </div>
                                                )}
                                            </motion.div>
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
                                                    <div style={{
                                                        fontSize: '1.1rem',
                                                        color: '#fff',
                                                        margin: 0,
                                                        lineHeight: '1.8',
                                                        textAlign: block.isReward ? 'center' : 'right',
                                                        marginBottom: (block.items || block.isReward) ? '24px' : '0'
                                                    }}>
                                                        {block.isReward ? (
                                                            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', alignItems: 'center' }}>
                                                                {block.content.split('\n\n').map((paragraph, pIdx) => (
                                                                    <div key={pIdx} style={{
                                                                        background: pIdx === 0 ? 'rgba(255, 255, 255, 0.03)' : 'transparent',
                                                                        padding: pIdx === 0 ? '12px 20px' : '0',
                                                                        borderRadius: '12px',
                                                                        width: '100%'
                                                                    }}>
                                                                        {paragraph.split('\n').map((line, lIdx) => {
                                                                            // Detect points or badges to add icons
                                                                            const isPoints = line.includes('نقاط') || line.includes('نقطة');
                                                                            const isBadge = line.includes('شارة');

                                                                            return (
                                                                                <div key={lIdx} style={{
                                                                                    display: 'flex',
                                                                                    alignItems: 'center',
                                                                                    justifyContent: 'center',
                                                                                    gap: '8px',
                                                                                    marginBottom: '4px',
                                                                                    color: isPoints ? '#FFB800' : (isBadge ? '#4CAF50' : '#fff'),
                                                                                    fontWeight: (isPoints || isBadge) ? 'bold' : 'normal'
                                                                                }}>
                                                                                    {isPoints && <span>⭐</span>}
                                                                                    {isBadge && <span>🏅</span>}
                                                                                    <span dangerouslySetInnerHTML={{
                                                                                        __html: line.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
                                                                                    }} />
                                                                                </div>
                                                                            );
                                                                        })}
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        ) : (
                                                            <p style={{ whiteSpace: 'pre-line', margin: 0 }}>
                                                                {formatEnhancedText(block.content)}
                                                            </p>
                                                        )}
                                                    </div>
                                                )}

                                                {block.isReward && block.rewardId && (
                                                    <div style={{ marginTop: '16px', display: 'flex', justifyContent: 'center' }}>
                                                        {claimedRewards.includes(block.rewardId) ? (
                                                            <div style={{
                                                                display: 'flex',
                                                                alignItems: 'center',
                                                                gap: '8px',
                                                                color: '#4CAF50',
                                                                fontWeight: 'bold',
                                                                padding: '10px 20px',
                                                                background: 'rgba(76, 175, 80, 0.1)',
                                                                borderRadius: '12px'
                                                            }}>
                                                                <span style={{ fontSize: '1.2rem' }}>✓</span>
                                                                تم الحصول على النقاط
                                                            </div>
                                                        ) : (
                                                            <motion.button
                                                                whileHover={{ scale: 1.05 }}
                                                                whileTap={{ scale: 0.95 }}
                                                                onClick={() => handleClaimReward(block.rewardId!, block.points || 0)}
                                                                style={{
                                                                    background: '#FF6B35',
                                                                    color: '#fff',
                                                                    border: 'none',
                                                                    padding: '12px 24px',
                                                                    borderRadius: '12px',
                                                                    fontWeight: 'bold',
                                                                    cursor: 'pointer',
                                                                    fontSize: '1rem',
                                                                    boxShadow: '0 4px 15px rgba(255, 107, 53, 0.3)'
                                                                }}
                                                            >
                                                                هل أكملت المهمة؟ احصل على {block.points} نقاط
                                                            </motion.button>
                                                        )}

                                                        {showRewardCelebration === block.rewardId && (
                                                            <div style={{
                                                                position: 'absolute',
                                                                top: '0',
                                                                left: '0',
                                                                width: '100%',
                                                                height: '100%',
                                                                pointerEvents: 'none',
                                                                zIndex: 999, // Ensure it's above everything
                                                                display: 'flex',
                                                                alignItems: 'center',
                                                                justifyContent: 'center'
                                                            }}>
                                                                <div style={{ position: 'relative', width: '1px', height: '1px' }}>
                                                                    {[...Array(16)].map((_, i) => {
                                                                        const angle = (i / 16) * Math.PI * 2;
                                                                        const distance = 120 + Math.random() * 180;
                                                                        const icons = ['🎉', '✨', '⭐', '💎', '🔥', '💎', '✨', '🎊'];
                                                                        const icon = icons[i % icons.length];

                                                                        return (
                                                                            <motion.div
                                                                                key={i}
                                                                                initial={{ x: 0, y: 0, opacity: 1, scale: 0 }}
                                                                                animate={{
                                                                                    x: Math.cos(angle) * distance,
                                                                                    y: Math.sin(angle) * distance,
                                                                                    opacity: 0,
                                                                                    scale: 1.2,
                                                                                    rotate: 720
                                                                                }}
                                                                                transition={{
                                                                                    duration: 2,
                                                                                    ease: "easeOut",
                                                                                    delay: (i % 4) * 0.05
                                                                                }}
                                                                                style={{
                                                                                    position: 'absolute',
                                                                                    fontSize: '1.8rem',
                                                                                    filter: 'drop-shadow(0 0 10px rgba(255,255,255,0.4))'
                                                                                }}
                                                                            >
                                                                                {icon}
                                                                            </motion.div>
                                                                        );
                                                                    })}
                                                                    <motion.div
                                                                        initial={{ opacity: 0, y: 20, scale: 0.5 }}
                                                                        animate={{ opacity: 1, y: -80, scale: 1 }}
                                                                        exit={{ opacity: 0 }}
                                                                        transition={{
                                                                            type: "spring",
                                                                            stiffness: 200,
                                                                            damping: 15
                                                                        }}
                                                                        style={{
                                                                            position: 'absolute',
                                                                            left: '50%',
                                                                            transform: 'translateX(-50%)',
                                                                            whiteSpace: 'nowrap',
                                                                            color: '#FFB800',
                                                                            fontWeight: 'bold',
                                                                            fontSize: '1.8rem',
                                                                            textShadow: '0 0 20px rgba(0,0,0,0.8), 0 0 10px rgba(255,184,0,0.5)',
                                                                            zIndex: 1000,
                                                                            background: 'rgba(0,0,0,0.4)',
                                                                            padding: '8px 24px',
                                                                            borderRadius: '20px',
                                                                            backdropFilter: 'blur(4px)',
                                                                            border: '1px solid rgba(255,184,0,0.3)'
                                                                        }}
                                                                    >
                                                                        جاهز للتحدي التالي!
                                                                    </motion.div>
                                                                </div>
                                                            </div>
                                                        )}
                                                    </div>
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
