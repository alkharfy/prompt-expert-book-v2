'use client'

import { useState } from 'react'
import { trackEvent } from '@/lib/analytics'

type Question = { question: string; options: string[]; answer: number; why: string }

interface QuizBlockProps {
    id: string
    title?: string
    questions: Question[]
    /** Shown under the score when the reader finishes. */
    outro?: string
    formatText?: (text: string) => React.ReactNode
}

const LETTERS = ['أ', 'ب', 'ج', 'د']

export function scoreMessage(score: number, total: number): string {
    if (score === total) return `ممتاز! جبت ${score} من ${total}. بس في الشغل الحقيقي، الغلط مش هيبقى واضح كده.`
    if (score * 2 >= total) return `كويس! جبت ${score} من ${total}. فاضلك حاجات صغيرة بتفرق.`
    return `جبت ${score} من ${total}، وده طبيعي في الأول. دي بالظبط الحاجات اللي هتتعلمها.`
}

/** One question at a time: tap an answer, see why, then move on. Ends with the score. */
export default function QuizBlock({ id, title, questions, outro, formatText = text => text }: QuizBlockProps) {
    const [index, setIndex] = useState(0)
    const [picked, setPicked] = useState<number | null>(null)
    const [score, setScore] = useState(0)
    const [done, setDone] = useState(false)
    if (questions.length === 0) return null
    const q = questions[index]

    const pick = (option: number) => {
        if (picked !== null) return
        setPicked(option)
        if (option === q.answer) setScore(value => value + 1)
    }
    const next = () => {
        if (index + 1 < questions.length) {
            setIndex(index + 1)
            setPicked(null)
            return
        }
        setDone(true)
        trackEvent('quiz_complete', { quiz: id, score, total: questions.length })
    }
    const restart = () => { setIndex(0); setPicked(null); setScore(0); setDone(false) }

    return (
        <section aria-label={title || 'اختبر نفسك'} style={{ margin: '24px 0', padding: '20px', borderRadius: '18px', background: 'rgba(255, 107, 53, 0.05)', border: '1px solid rgba(255, 107, 53, 0.25)' }}>
            {title && <h3 style={{ color: '#fff', fontSize: '1.15rem', margin: '0 0 14px' }}>{title}</h3>}
            {done ? (
                <div aria-live="polite" style={{ textAlign: 'center' }}>
                    <p style={{ color: '#fff', fontSize: '1.1rem', fontWeight: 700, lineHeight: 1.8, margin: '0 0 10px' }}>{scoreMessage(score, questions.length)}</p>
                    {outro && <div style={{ color: '#ccc', lineHeight: 1.9, margin: '0 0 14px' }}>{formatText(outro)}</div>}
                    <button type="button" onClick={restart} style={secondaryButton}>جرّب تاني</button>
                </div>
            ) : (
                <>
                    <p style={{ color: '#999', fontSize: '0.8rem', margin: '0 0 6px' }}>سؤال {index + 1} من {questions.length}</p>
                    <p style={{ color: '#fff', fontSize: '1.05rem', fontWeight: 700, lineHeight: 1.8, margin: '0 0 14px' }}>{q.question}</p>
                    <div role="group" aria-label="الاختيارات" style={{ display: 'grid', gap: '10px' }}>
                        {q.options.map((option, i) => {
                            const isAnswer = i === q.answer
                            const show = picked !== null
                            const color = show && isAnswer ? '#22c55e' : show && i === picked ? '#ef4444' : 'rgba(255,255,255,0.12)'
                            return (
                                <button
                                    key={i}
                                    type="button"
                                    onClick={() => pick(i)}
                                    disabled={show}
                                    aria-label={`${LETTERS[i]}: ${option}${show && isAnswer ? ' (الإجابة الصح)' : ''}`}
                                    style={{
                                        display: 'flex', gap: '10px', alignItems: 'flex-start', textAlign: 'start', width: '100%', minHeight: '48px',
                                        padding: '12px 14px', borderRadius: '12px', font: 'inherit', lineHeight: 1.7, cursor: show ? 'default' : 'pointer',
                                        color: '#eee', background: show && isAnswer ? 'rgba(34,197,94,0.12)' : show && i === picked ? 'rgba(239,68,68,0.12)' : 'rgba(255,255,255,0.04)',
                                        border: `1px solid ${color}`,
                                    }}
                                >
                                    <strong style={{ color: '#FF8C5A' }}>{LETTERS[i]}</strong>
                                    <span>{option}</span>
                                    {show && isAnswer && <span aria-hidden="true" style={{ marginInlineStart: 'auto' }}>✅</span>}
                                    {show && !isAnswer && i === picked && <span aria-hidden="true" style={{ marginInlineStart: 'auto' }}>❌</span>}
                                </button>
                            )
                        })}
                    </div>
                    {picked !== null && (
                        <div aria-live="polite" style={{ marginTop: '14px' }}>
                            <p style={{ color: picked === q.answer ? '#4ade80' : '#f87171', fontWeight: 700, margin: '0 0 6px' }}>
                                {picked === q.answer ? 'صح! 👏' : `الإجابة الصح: ${LETTERS[q.answer]}`}
                            </p>
                            <p style={{ color: '#ccc', lineHeight: 1.8, margin: '0 0 12px' }}>{q.why}</p>
                            <button type="button" onClick={next} style={primaryButton}>
                                {index + 1 < questions.length ? 'السؤال الجاي ←' : 'شوف نتيجتك'}
                            </button>
                        </div>
                    )}
                </>
            )}
        </section>
    )
}

const primaryButton: React.CSSProperties = {
    padding: '12px 20px', minHeight: '48px', borderRadius: '12px', border: 'none', cursor: 'pointer',
    background: 'linear-gradient(135deg, #FF6B35, #FF8C5A)', color: '#fff', font: 'inherit', fontWeight: 700,
}
const secondaryButton: React.CSSProperties = {
    padding: '10px 18px', minHeight: '44px', borderRadius: '12px', cursor: 'pointer',
    background: 'transparent', border: '1px solid rgba(255,255,255,0.2)', color: '#ddd', font: 'inherit',
}
