'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import Image from 'next/image'
import CopyButton from '@/components/reading/CopyButton'
import { InteractiveWidget } from '@/components/reading/widgets'

interface ContentBlock {
    type: 'text' | 'code' | 'card' | 'image' | 'video' | 'interactive'
    title?: string
    content: string
    code?: string
    imageUrl?: string
    items?: { title: string; content: string; icon?: string }[]
    isReward?: boolean
    points?: number
    rewardId?: string
    videoUrl?: string
    poster?: string
    loop?: boolean
    autoplay?: boolean
    widget?: string
}

interface KnowledgeCardViewProps {
    blocks: ContentBlock[]
    formatText: (text: string) => React.ReactNode
    onExit: () => void
}

/** Group content blocks into cards (~2-3 blocks per card) */
function groupIntoCards(blocks: ContentBlock[]): ContentBlock[][] {
    const cards: ContentBlock[][] = []
    let current: ContentBlock[] = []

    for (const block of blocks) {
        current.push(block)
        // Start a new card after 2-3 blocks, or after a card/code block
        if (
            current.length >= 3 ||
            (current.length >= 2 && (block.type === 'card' || block.type === 'code'))
        ) {
            cards.push(current)
            current = []
        }
    }
    if (current.length > 0) cards.push(current)
    return cards
}

export default function KnowledgeCardView({
    blocks,
    formatText,
    onExit,
}: KnowledgeCardViewProps) {
    const [activeCard, setActiveCard] = useState(0)
    const touchStartX = useRef(0)
    const touchDelta = useRef(0)
    const containerRef = useRef<HTMLDivElement>(null)

    const cards = groupIntoCards(blocks)
    const totalCards = cards.length

    const goNext = useCallback(() => {
        setActiveCard((prev) => Math.min(prev + 1, totalCards - 1))
    }, [totalCards])

    const goPrev = useCallback(() => {
        setActiveCard((prev) => Math.max(prev - 1, 0))
    }, [])

    // Scroll to top on card change
    useEffect(() => {
        containerRef.current?.scrollTo({ top: 0, behavior: 'smooth' })
    }, [activeCard])

    const handleTouchStart = (e: React.TouchEvent) => {
        touchStartX.current = e.touches[0].clientX
        touchDelta.current = 0
    }

    const handleTouchMove = (e: React.TouchEvent) => {
        touchDelta.current = e.touches[0].clientX - touchStartX.current
    }

    const handleTouchEnd = () => {
        if (touchDelta.current > 60) goPrev()      // swipe right → prev (RTL)
        else if (touchDelta.current < -60) goNext() // swipe left → next (RTL)
        touchDelta.current = 0
    }

    if (totalCards === 0) return null

    const currentBlocks = cards[activeCard]

    return (
        <div className="kc-wrapper">
            {/* Header */}
            <div className="kc-header">
                <div className="kc-dots">
                    {cards.map((_, i) => (
                        <button
                            key={i}
                            className={`kc-dot ${i === activeCard ? 'active' : ''} ${i < activeCard ? 'done' : ''}`}
                            onClick={() => setActiveCard(i)}
                            aria-label={`بطاقة ${i + 1}`}
                        />
                    ))}
                </div>
                <button className="kc-exit" onClick={onExit}>
                    عرض عادي
                </button>
            </div>

            {/* Card Content */}
            <div
                className="kc-card"
                ref={containerRef}
                onTouchStart={handleTouchStart}
                onTouchMove={handleTouchMove}
                onTouchEnd={handleTouchEnd}
            >
                <div className="kc-card-counter">
                    بطاقة {activeCard + 1} من {totalCards}
                </div>

                {currentBlocks.map((block, idx) => (
                    <div key={idx} className="kc-block">
                        {block.type === 'text' && (
                            <div className="kc-text-block">
                                {block.title && (
                                    <h4 className="kc-block-title">{block.title}</h4>
                                )}
                                <p className="kc-block-content">
                                    {formatText(block.content)}
                                </p>
                            </div>
                        )}

                        {block.type === 'image' && block.imageUrl && (
                            <div className="kc-image-block">
                                <Image
                                    src={block.imageUrl}
                                    alt={block.title || 'صورة'}
                                    width={600}
                                    height={400}
                                    style={{
                                        width: '100%',
                                        height: 'auto',
                                        borderRadius: '12px',
                                    }}
                                />
                                {block.title && (
                                    <span className="kc-image-caption">{block.title}</span>
                                )}
                            </div>
                        )}

                        {block.type === 'video' && block.videoUrl && (
                            <div className="kc-image-block">
                                <video
                                    src={block.videoUrl}
                                    poster={block.poster}
                                    autoPlay={block.autoplay !== false}
                                    loop={block.loop !== false}
                                    muted
                                    playsInline
                                    preload="metadata"
                                    style={{ width: '100%', height: 'auto', borderRadius: '12px' }}
                                />
                                {block.title && (
                                    <span className="kc-image-caption">{block.title}</span>
                                )}
                            </div>
                        )}

                        {block.type === 'interactive' && (
                            <InteractiveWidget widget={block.widget} />
                        )}

                        {block.type === 'card' && (
                            <div className="kc-card-block">
                                {block.title && (
                                    <h3 className="kc-card-block-title">
                                        {block.isReward ? '🏆' : '✦'} {block.title}
                                    </h3>
                                )}
                                {block.content && (
                                    <p className="kc-block-content">
                                        {formatText(block.content)}
                                    </p>
                                )}
                                {block.items?.map((item, iIdx) => (
                                    <details key={iIdx} className="kc-accordion">
                                        <summary>{item.title}</summary>
                                        <div className="kc-accordion-content">
                                            {item.content}
                                        </div>
                                    </details>
                                ))}
                            </div>
                        )}

                        {block.type === 'code' && (
                            <div className="kc-code-block">
                                {block.title && (
                                    <h4 className="kc-block-title">{block.title}</h4>
                                )}
                                <div className="kc-code-container">
                                    <CopyButton text={block.code || ''} />
                                    <pre>
                                        <code>{block.code}</code>
                                    </pre>
                                </div>
                            </div>
                        )}
                    </div>
                ))}

                {/* Takeaway on last block of card */}
                {activeCard < totalCards - 1 && (
                    <div className="kc-takeaway">
                        💡 اسحب لليسار للبطاقة التالية
                    </div>
                )}
                {activeCard === totalCards - 1 && (
                    <div className="kc-takeaway kc-takeaway-done">
                        ✅ أكملت كل البطاقات في هذه الصفحة!
                    </div>
                )}
            </div>

            {/* Navigation Arrows */}
            <div className="kc-nav">
                <button
                    className="kc-nav-btn"
                    onClick={goPrev}
                    disabled={activeCard === 0}
                >
                    →
                </button>
                <button
                    className="kc-nav-btn"
                    onClick={goNext}
                    disabled={activeCard === totalCards - 1}
                >
                    ←
                </button>
            </div>

            <style jsx>{`
                .kc-wrapper {
                    display: flex;
                    flex-direction: column;
                    gap: 12px;
                }
                .kc-header {
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                    padding: 0 4px;
                }
                .kc-dots {
                    display: flex;
                    gap: 6px;
                    flex-wrap: wrap;
                }
                .kc-dot {
                    width: 10px;
                    height: 10px;
                    border-radius: 50%;
                    border: 2px solid rgba(255, 107, 53, 0.4);
                    background: transparent;
                    padding: 0;
                    cursor: pointer;
                    transition: all 0.2s;
                }
                .kc-dot.active {
                    background: #FF6B35;
                    border-color: #FF6B35;
                    transform: scale(1.2);
                }
                .kc-dot.done {
                    background: rgba(255, 107, 53, 0.5);
                    border-color: rgba(255, 107, 53, 0.5);
                }
                .kc-exit {
                    background: rgba(255, 255, 255, 0.06);
                    border: 1px solid rgba(255, 255, 255, 0.12);
                    color: #b0b0b0;
                    padding: 6px 14px;
                    border-radius: 8px;
                    font-size: 0.75rem;
                    cursor: pointer;
                    font-family: inherit;
                }
                .kc-card {
                    background: rgba(255, 255, 255, 0.02);
                    border: 1px solid rgba(255, 107, 53, 0.15);
                    border-radius: 16px;
                    padding: 20px 16px;
                    min-height: 300px;
                    overflow-y: auto;
                    max-height: 65vh;
                    display: flex;
                    flex-direction: column;
                    gap: 20px;
                }
                .kc-card-counter {
                    text-align: center;
                    font-size: 0.72rem;
                    color: rgba(255, 255, 255, 0.35);
                }
                .kc-block {
                    animation: kcFadeIn 0.3s ease;
                }
                @keyframes kcFadeIn {
                    from { opacity: 0; transform: translateY(10px); }
                    to { opacity: 1; transform: translateY(0); }
                }
                .kc-text-block {
                    padding: 12px 16px;
                    background: rgba(255, 255, 255, 0.02);
                    border-radius: 12px;
                    border-right: 3px solid #FF6B35;
                }
                .kc-block-title {
                    color: #FF6B35;
                    margin: 0 0 8px 0;
                    font-size: 1rem;
                }
                .kc-block-content {
                    font-size: 1rem;
                    line-height: 1.8;
                    color: #d0d0d0;
                    margin: 0;
                    white-space: pre-line;
                }
                .kc-image-block {
                    border-radius: 12px;
                    overflow: hidden;
                    border: 1px solid rgba(255, 107, 53, 0.15);
                }
                .kc-image-caption {
                    display: block;
                    padding: 8px 12px;
                    font-size: 0.8rem;
                    color: #999;
                    text-align: center;
                    background: rgba(0, 0, 0, 0.4);
                }
                .kc-card-block {
                    background: rgba(255, 107, 53, 0.04);
                    border: 1px solid rgba(255, 107, 53, 0.12);
                    border-radius: 12px;
                    padding: 16px;
                }
                .kc-card-block-title {
                    color: #FFB800;
                    font-size: 1.1rem;
                    margin: 0 0 10px 0;
                }
                .kc-accordion {
                    background: rgba(255, 255, 255, 0.03);
                    border-radius: 8px;
                    overflow: hidden;
                    border: 1px solid rgba(255, 255, 255, 0.05);
                    margin-top: 6px;
                }
                .kc-accordion summary {
                    padding: 10px 14px;
                    cursor: pointer;
                    font-weight: bold;
                    color: #e0e0e0;
                    font-size: 0.9rem;
                }
                .kc-accordion-content {
                    padding: 0 14px 14px;
                    font-size: 0.85rem;
                    color: #b0b0b0;
                    line-height: 1.5;
                }
                .kc-code-block {
                    margin-top: 4px;
                }
                .kc-code-container {
                    background: #1a1a2e;
                    border-radius: 10px;
                    padding: 16px;
                    padding-top: 44px;
                    position: relative;
                    overflow-x: auto;
                }
                .kc-code-container pre {
                    margin: 0;
                    white-space: pre-wrap;
                }
                .kc-code-container code {
                    color: #FFB800;
                    font-size: 0.85rem;
                }
                .kc-takeaway {
                    text-align: center;
                    font-size: 0.82rem;
                    color: rgba(255, 107, 53, 0.6);
                    padding: 8px;
                    border-top: 1px solid rgba(255, 255, 255, 0.05);
                    margin-top: auto;
                }
                .kc-takeaway-done {
                    color: #4CAF50;
                }
                .kc-nav {
                    display: flex;
                    justify-content: center;
                    gap: 40px;
                }
                .kc-nav-btn {
                    width: 44px;
                    height: 44px;
                    border-radius: 50%;
                    background: rgba(255, 107, 53, 0.12);
                    border: 1px solid rgba(255, 107, 53, 0.3);
                    color: #FF6B35;
                    font-size: 1.2rem;
                    cursor: pointer;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    transition: all 0.2s;
                    font-family: inherit;
                }
                .kc-nav-btn:hover:not(:disabled) {
                    background: rgba(255, 107, 53, 0.25);
                }
                .kc-nav-btn:disabled {
                    opacity: 0.3;
                    cursor: not-allowed;
                }
            `}</style>
        </div>
    )
}
