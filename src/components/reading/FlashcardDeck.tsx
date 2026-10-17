'use client'

import { useState } from 'react'
import { trackEvent } from '@/lib/analytics'

interface FlashcardDeckProps {
    title?: string
    cards: { title: string; content: string }[]
}

/** Tap a card to flip it: the question on the front, the answer on the back. */
export default function FlashcardDeck({ title, cards }: FlashcardDeckProps) {
    const [index, setIndex] = useState(0)
    const [flipped, setFlipped] = useState(false)
    const [seen, setSeen] = useState<Set<number>>(() => new Set())
    if (cards.length === 0) return null
    const card = cards[index]

    const flip = () => {
        setFlipped(value => !value)
        if (!seen.has(index)) {
            const next = new Set(seen).add(index)
            setSeen(next)
            if (next.size === cards.length) trackEvent('flashcards_complete', { title })
        }
    }
    const go = (step: number) => {
        setIndex(value => (value + step + cards.length) % cards.length)
        setFlipped(false)
    }

    return (
        <section aria-label={title || 'بطاقات'} style={{ margin: '20px auto', maxWidth: '460px', width: '100%' }}>
            {title && <h3 style={{ color: '#fff', fontSize: '1.1rem', textAlign: 'center', margin: '0 0 12px' }}>{title}</h3>}
            <button
                type="button"
                onClick={flip}
                aria-pressed={flipped}
                aria-label={flipped ? `الإجابة: ${card.content}. اضغط عشان ترجع للسؤال` : `${card.title}. اضغط عشان تشوف الإجابة`}
                style={{
                    width: '100%', minHeight: '180px', padding: '24px 20px', borderRadius: '18px', cursor: 'pointer',
                    display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '12px',
                    textAlign: 'center', font: 'inherit', lineHeight: 1.8,
                    color: flipped ? '#111' : '#fff',
                    background: flipped ? 'linear-gradient(135deg, #FFB347, #FF6B35)' : 'linear-gradient(135deg, #1d1d1d, #262626)',
                    border: `1px solid ${flipped ? '#FF6B35' : 'rgba(255, 107, 53, 0.35)'}`,
                    boxShadow: '0 10px 30px rgba(0,0,0,0.4)',
                    transition: 'background 0.25s, color 0.25s',
                }}
            >
                <span style={{ fontSize: '0.75rem', opacity: 0.75 }}>{flipped ? 'الإجابة' : 'السؤال'}</span>
                <span style={{ fontSize: flipped ? '1.05rem' : '1.2rem', fontWeight: 700 }}>{flipped ? card.content : card.title}</span>
                {!flipped && <span style={{ fontSize: '0.8rem', color: '#FF8C5A' }}>👆 اضغط عشان تقلبها</span>}
            </button>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '12px' }}>
                <button type="button" onClick={() => go(-1)} style={navButton}>→ اللي قبلها</button>
                <span style={{ color: '#999', fontSize: '0.85rem' }}>{index + 1} من {cards.length}</span>
                <button type="button" onClick={() => go(1)} style={navButton}>اللي بعدها ←</button>
            </div>
        </section>
    )
}

const navButton: React.CSSProperties = {
    padding: '10px 14px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.12)',
    background: 'rgba(255,255,255,0.04)', color: '#ddd', font: 'inherit', fontSize: '0.85rem', cursor: 'pointer', minHeight: '44px',
}
