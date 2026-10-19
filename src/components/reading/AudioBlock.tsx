'use client'

import { useRef } from 'react'
import { trackEvent } from '@/lib/analytics'

interface AudioBlockProps {
    src: string
    title?: string
    note?: string
    /** Practice voice notes: a link to save the file and send it to the learner's own AI tool. */
    download?: boolean
    formatText?: (text: string) => React.ReactNode
}

/** A listen-on-the-go summary or a practice voice note. Plays only when the reader taps play. */
export default function AudioBlock({ src, title, note, download, formatText = text => text }: AudioBlockProps) {
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
            {download && (
                <a
                    href={src}
                    download
                    onClick={() => trackEvent('audio_download', { audio: src })}
                    style={{ display: 'inline-flex', alignItems: 'center', minHeight: '44px', marginTop: '8px', padding: '0 16px', borderRadius: '12px', color: '#fff', fontWeight: 700, textDecoration: 'none', background: 'rgba(255, 107, 53, 0.18)', border: '1px solid rgba(255, 107, 53, 0.5)' }}
                >
                    ⬇️ نزّل الفويس
                </a>
            )}
            {note && <p style={{ color: download ? '#d0d0d0' : '#9a9a9a', fontSize: download ? '0.95rem' : '0.85rem', margin: '8px 0 0', lineHeight: 1.8, whiteSpace: 'pre-line' }}>{formatText(note)}</p>}
        </figure>
    )
}
