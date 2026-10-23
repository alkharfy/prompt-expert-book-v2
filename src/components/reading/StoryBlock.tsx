'use client'

import { useEffect, useState } from 'react'
import { useReducedMotion } from 'framer-motion'
import { trackEvent } from '@/lib/analytics'

type Frame = { src: string; caption: string; box?: { x: number; y: number; w: number; h: number } }

interface StoryBlockProps {
    title?: string
    note?: string
    frames: Frame[]
    formatText?: (text: string) => React.ReactNode
}

/**
 * «اتفرج عليه وهو بيعملها»: real phone screenshots the reader taps through one at a time, like a WhatsApp status.
 * Each frame has a caption under it, and `box` (percent of the image) rings the part to look at.
 */
export default function StoryBlock({ title, note, frames, formatText = text => text }: StoryBlockProps) {
    const [index, setIndex] = useState(0)
    const prefersReduced = useReducedMotion()
    const frame = frames[Math.min(index, frames.length - 1)]
    const last = index === frames.length - 1

    // Fetch the next frame early, so a tap never waits on the network.
    useEffect(() => {
        const next = frames[index + 1]
        if (next) new Image().src = next.src
    }, [index, frames])

    if (frames.length === 0) return null

    const go = (step: number) => {
        const next = Math.max(0, Math.min(frames.length - 1, index + step))
        if (next === frames.length - 1 && index !== next) trackEvent('story_complete', { title })
        setIndex(next)
    }

    return (
        <section aria-label={title || 'خطوة بخطوة'} style={{ margin: '20px auto', maxWidth: '420px', width: '100%' }}>
            {title && <h3 style={{ color: '#fff', fontSize: '1.1rem', textAlign: 'center', margin: '0 0 6px' }}>{title}</h3>}
            {note && <p style={{ color: '#999', fontSize: '0.8rem', textAlign: 'center', margin: '0 0 12px', lineHeight: 1.7 }}>{formatText(note)}</p>}

            <div style={{ display: 'flex', gap: '4px', marginBottom: '8px' }} aria-hidden="true">
                {frames.map((_, i) => (
                    <span key={i} style={{ flex: 1, height: '4px', borderRadius: '2px', background: i <= index ? '#FF6B35' : 'rgba(255,255,255,0.15)', transition: 'background 0.2s' }} />
                ))}
            </div>

            <button
                type="button"
                onClick={() => go(last ? -index : 1)}
                aria-label={last ? 'من الأول' : 'الصورة اللي بعدها'}
                style={{ position: 'relative', display: 'block', width: '100%', padding: 0, border: '1px solid rgba(255, 107, 53, 0.25)', borderRadius: '16px', overflow: 'hidden', background: '#050505', cursor: 'pointer', aspectRatio: '4 / 5' }}
            >
                {/* eslint-disable-next-line @next/next/no-img-element -- small pre-sized webp frames, swapped on tap */}
                <img src={frame.src} alt={frame.caption} loading="lazy" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
                {frame.box && (
                    <span
                        key={index}
                        aria-hidden="true"
                        className={prefersReduced ? undefined : 'story-ring'}
                        style={{
                            position: 'absolute', left: `${frame.box.x}%`, top: `${frame.box.y}%`, width: `${frame.box.w}%`, height: `${frame.box.h}%`,
                            border: '3px solid #FF6B35', borderRadius: '10px', boxShadow: '0 0 0 4000px rgba(0,0,0,0.35)', pointerEvents: 'none',
                        }}
                    />
                )}
            </button>

            <p aria-live="polite" style={{ color: '#eee', fontSize: '1rem', lineHeight: 1.8, margin: '12px 0 0', minHeight: '3.6em', textAlign: 'right' }}>
                {formatText(frame.caption)}
            </p>

            {/* Kept to the middle: the site's floating chat and back-to-top buttons sit in the bottom corners on phones. */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px', marginTop: '8px' }}>
                <button type="button" onClick={() => go(-1)} disabled={index === 0} style={{ ...navButton, opacity: index === 0 ? 0.4 : 1 }}>→ اللي قبلها</button>
                <span style={{ color: '#999', fontSize: '0.85rem' }}>{index + 1} من {frames.length}</span>
                <button type="button" onClick={() => go(last ? -index : 1)} style={{ ...navButton, borderColor: 'rgba(255, 107, 53, 0.5)', color: '#FF8C5A' }}>{last ? '↺ من الأول' : 'اللي بعدها ←'}</button>
            </div>
            <style>{`.story-ring{animation:story-ring 1.6s ease-in-out 2}@keyframes story-ring{50%{transform:scale(1.04)}}`}</style>
        </section>
    )
}

const navButton: React.CSSProperties = {
    padding: '10px 12px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.12)',
    background: 'rgba(255,255,255,0.04)', color: '#ddd', font: 'inherit', fontSize: '0.85rem', cursor: 'pointer', minHeight: '44px',
}
