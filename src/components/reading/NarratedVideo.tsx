'use client'

import { useRef } from 'react'
import { trackEvent } from '@/lib/analytics'

interface NarratedVideoProps {
    src: string
    poster?: string
    title?: string
    /** Id of the block that comes after what the video covers; the page scrolls there when it ends. */
    next?: string
    /** Replaces the default line under the video (e.g. the AI-made disclosure). */
    note?: string
}

/**
 * A talking «المستر» video: vertical, starts only when the reader taps play (so it
 * plays with sound), never loops. The same words are always written on the page.
 */
export default function NarratedVideo({ src, poster, title, next, note }: NarratedVideoProps) {
    const started = useRef(false)

    return (
        <figure style={{ margin: '16px auto', maxWidth: '340px', width: '100%' }}>
            {title && (
                <figcaption style={{ color: '#fff', fontWeight: 700, fontSize: '1rem', textAlign: 'center', marginBottom: '10px' }}>
                    {title}
                </figcaption>
            )}
            <video
                src={src}
                poster={poster}
                controls
                playsInline
                preload="metadata"
                onPlay={() => {
                    if (started.current) return
                    started.current = true
                    trackEvent('narrated_video_play', { video: src })
                }}
                onEnded={() => {
                    trackEvent('narrated_video_complete', { video: src })
                    if (next) document.getElementById(next)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
                }}
                style={{
                    width: '100%',
                    aspectRatio: '9 / 16',
                    display: 'block',
                    borderRadius: '16px',
                    border: '1px solid rgba(255, 107, 53, 0.3)',
                    background: '#050505',
                    boxShadow: '0 10px 30px rgba(0,0,0,0.5)',
                }}
            />
            <p style={{ color: '#9a9a9a', fontSize: '0.85rem', textAlign: 'center', margin: '8px 0 0' }}>
                {note && next ? (
                    <>{note} شفته؟ <a href={`#${next}`} style={{ color: '#FF6B35' }}>انزل على «يلا نجرّب» على طول 👇</a></>
                ) : note ? note : next ? (
                    <>🔊 بالصوت. شفته؟ <a href={`#${next}`} style={{ color: '#FF6B35' }}>انزل على «يلا نجرّب» على طول 👇</a></>
                ) : (
                    '🔊 بالصوت. ومش عايز تتفرج؟ نفس الكلام مكتوب تحت.'
                )}
            </p>
        </figure>
    )
}
