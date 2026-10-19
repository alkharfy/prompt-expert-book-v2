'use client'

import { useState } from 'react'
import { trackEvent } from '@/lib/analytics'

interface AnswerCheckProps {
    id: string
    /** The question the reader answers by typing. */
    question: string
    /** Accepted answers; compared after normalising digits, commas, spaces and ٪. */
    accept: string[]
    /** Shown after a right answer, or when the reader gives up. */
    explanation?: string
    /** Shown after the first wrong try. */
    hint?: string
    formatText?: (text: string) => React.ReactNode
}

const ARABIC_DIGITS = '٠١٢٣٤٥٦٧٨٩'

/** «١٠» = «10» = « 10 » = «10٪»: what a reader types on an Arabic phone keyboard still matches. */
export function normalizeAnswer(value: string): string {
    return value
        .trim()
        .replace(/[٠-٩]/g, d => String(ARABIC_DIGITS.indexOf(d)))
        // A list of numbers typed as «1 و 3 و 4» reads the same as «1، 3، 4».
        .replace(/(\d)\s*و\s*(?=\d)/g, '$1')
        .replace(/٫/g, '.')
        .replace(/[,،٬\s%٪]/g, '')
        .replace(/[أإآ]/g, 'ا')
        .replace(/ة/g, 'ه')
        .replace(/ى/g, 'ي')
        .toLowerCase()
}

export function isAcceptedAnswer(value: string, accept: string[]): boolean {
    const given = normalizeAnswer(value)
    return given !== '' && accept.some(answer => normalizeAnswer(answer) === given)
}

/** Type-your-answer check: the site tells the reader right away, with a hint after a miss. */
export default function AnswerCheck({ id, question, accept, explanation, hint, formatText = text => text }: AnswerCheckProps) {
    const [value, setValue] = useState('')
    const [state, setState] = useState<'idle' | 'right' | 'wrong' | 'shown'>('idle')
    const [tries, setTries] = useState(0)
    const numeric = accept.every(answer => /^[\d٠-٩.,٬٪%\s]+$/.test(answer))

    const check = () => {
        if (!value.trim() || state === 'right') return
        const right = isAcceptedAnswer(value, accept)
        setTries(t => t + 1)
        setState(right ? 'right' : 'wrong')
        trackEvent('answer_check', { check: id, right, tries: tries + 1 })
    }

    return (
        <section aria-label={question} style={{ margin: '20px 0', padding: '18px', borderRadius: '16px', background: 'rgba(255, 184, 0, 0.05)', border: '1px solid rgba(255, 184, 0, 0.35)' }}>
            <p style={{ color: '#fff', fontWeight: 700, lineHeight: 1.8, margin: '0 0 12px', whiteSpace: 'pre-line' }}>✍️ {question}</p>
            <div style={{ display: 'flex', gap: '8px' }}>
                <input
                    value={value}
                    onChange={e => { setValue(e.target.value); if (state === 'wrong') setState('idle') }}
                    onKeyDown={e => { if (e.key === 'Enter') check() }}
                    inputMode={numeric ? 'numeric' : 'text'}
                    disabled={state === 'right' || state === 'shown'}
                    placeholder="اكتب إجابتك هنا"
                    aria-label="إجابتك"
                    style={{ flex: 1, minWidth: 0, minHeight: '48px', padding: '10px 14px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.2)', background: 'rgba(0,0,0,0.3)', color: '#fff', font: 'inherit', fontSize: '1rem' }}
                />
                <button
                    type="button"
                    onClick={check}
                    disabled={state === 'right' || state === 'shown'}
                    style={{ minHeight: '48px', padding: '0 18px', borderRadius: '12px', border: 'none', cursor: 'pointer', font: 'inherit', fontWeight: 700, color: '#1a1300', background: '#FFB800' }}
                >
                    اتأكد
                </button>
            </div>
            <div aria-live="polite">
                {state === 'right' && <p style={{ color: '#4ade80', fontWeight: 700, margin: '12px 0 0' }}>✅ صح!</p>}
                {state === 'wrong' && (
                    <div style={{ margin: '12px 0 0' }}>
                        <p style={{ color: '#f87171', fontWeight: 700, margin: '0 0 6px' }}>❌ مش دي. جرّب تاني.</p>
                        {hint && <p style={{ color: '#ddd', margin: '0 0 8px', lineHeight: 1.8 }}>💡 {formatText(hint)}</p>}
                        {tries >= 2 && (
                            <button type="button" onClick={() => setState('shown')} style={{ minHeight: '40px', padding: '0 14px', borderRadius: '10px', cursor: 'pointer', font: 'inherit', color: '#ddd', background: 'transparent', border: '1px solid rgba(255,255,255,0.25)' }}>
                                وريني الإجابة
                            </button>
                        )}
                    </div>
                )}
                {(state === 'right' || state === 'shown') && (
                    <div style={{ margin: '10px 0 0', color: '#ddd', lineHeight: 1.9, whiteSpace: 'pre-line' }}>
                        {state === 'shown' && <p style={{ margin: '0 0 6px', fontWeight: 700, color: '#FFB800' }}>الإجابة: {accept[0]}</p>}
                        {explanation && formatText(explanation)}
                    </div>
                )}
            </div>
        </section>
    )
}
