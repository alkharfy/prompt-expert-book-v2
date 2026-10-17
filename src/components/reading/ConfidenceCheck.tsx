'use client'

import { useState } from 'react'
import { trackEvent } from '@/lib/analytics'

interface ConfidenceCheckProps {
    id: string
    title?: string
    /** The AI reply the reader judges. */
    claim: string
    /** Where the mistake is; shown after the reader picks. */
    answer: string
    formatText?: (text: string) => React.ReactNode
}

const LEVELS = [0, 25, 50, 75, 100]

export function confidenceMessage(level: number): string {
    if (level >= 75) return `كنت واثق ${level}٪… يعني كنت هتبعته. وده بالظبط اللي بيوقّع ناس كتير.`
    if (level === 50) return 'نص نص. الإحساس ده كويس، بس الشك لوحده مش كفاية: لازم تعرف الغلطة فين.'
    return 'عندك حق تشك. بس تعرف الغلطة فين بالظبط؟'
}

/** «واثق فيه بكام في المية؟»: the reader commits to a number before seeing where the planted mistake is. */
export default function ConfidenceCheck({ id, title, claim, answer, formatText = text => text }: ConfidenceCheckProps) {
    const [picked, setPicked] = useState<number | null>(null)

    const pick = (level: number) => {
        if (picked !== null) return
        setPicked(level)
        trackEvent('confidence_check', { check: id, confidence: level })
    }

    return (
        <section aria-label={title || 'واثق فيه بكام في المية؟'} style={{ margin: '24px 0', padding: '20px', borderRadius: '18px', background: 'rgba(255, 107, 53, 0.05)', border: '1px solid rgba(255, 107, 53, 0.25)' }}>
            {title && <h3 style={{ color: '#fff', fontSize: '1.15rem', lineHeight: 1.7, margin: '0 0 12px' }}>{title}</h3>}
            <blockquote style={{ margin: '0 0 16px', padding: '12px 14px', borderRadius: '12px', background: 'rgba(255,255,255,0.04)', borderInlineStart: '3px solid #FF6B35', color: '#eee', lineHeight: 1.9 }}>
                {claim}
            </blockquote>
            <p style={{ color: '#ccc', margin: '0 0 10px' }}>واثق فيه بكام في المية؟</p>
            <div role="group" aria-label="نسبة ثقتك" style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '8px' }}>
                {LEVELS.map(level => {
                    const chosen = picked === level
                    return (
                        <button
                            key={level}
                            type="button"
                            onClick={() => pick(level)}
                            disabled={picked !== null}
                            aria-pressed={chosen}
                            style={{
                                minHeight: '48px', borderRadius: '12px', font: 'inherit', fontWeight: 700,
                                cursor: picked === null ? 'pointer' : 'default',
                                color: chosen ? '#fff' : '#ddd',
                                background: chosen ? 'linear-gradient(135deg, #FF6B35, #FF8C5A)' : 'rgba(255,255,255,0.04)',
                                border: `1px solid ${chosen ? '#FF6B35' : 'rgba(255,255,255,0.12)'}`,
                                opacity: picked !== null && !chosen ? 0.5 : 1,
                            }}
                        >
                            {level}٪
                        </button>
                    )
                })}
            </div>
            {picked !== null && (
                <div aria-live="polite" style={{ marginTop: '16px' }}>
                    <p style={{ color: '#FF8C5A', fontWeight: 700, lineHeight: 1.8, margin: '0 0 10px' }}>{confidenceMessage(picked)}</p>
                    <div style={{ color: '#ddd', lineHeight: 1.9, whiteSpace: 'pre-line' }}>{formatText(answer)}</div>
                </div>
            )}
        </section>
    )
}
