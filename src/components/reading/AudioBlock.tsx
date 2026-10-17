'use client'

import { useRef } from 'react'
import { trackEvent } from '@/lib/analytics'

interface AudioBlockProps {
    src: string
    title?: string
    note?: string
}

/** A listen-on-the-go summary. Plays only when the reader taps play. */
export default function AudioBlock({ src, title, note }: AudioBlockProps) {
    const started = useRef(false)
    return (
        <figure style={{ margin: '20px 0', padding: '16px', borderRadius: '16px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255, 107, 53, 0.25)' }}>
            {title && <figcaption style={{ color: '#fff', fontWeight: 700, marginBottom: '10px' }}>{title}</figcaption>}
            <audio
                src={src}
                controls
                preload="metadata"
                onPlay={() => {
                    if (started.current) return
                    started.current = true
                    trackEvent('audio_play', { audio: src })
                }}
                onEnded={() => trackEvent('audio_complete', { audio: src })}
                style={{ width: '100%' }}
            />
            {note && <p style={{ color: '#9a9a9a', fontSize: '0.85rem', margin: '8px 0 0', lineHeight: 1.7 }}>{note}</p>}
        </figure>
    )
}
