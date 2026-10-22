'use client'

import { useEffect, useState } from 'react'
import { trackEvent } from '@/lib/analytics'
import GradeCheck from './GradeCheck'
import { markGradePassed } from './gradePass'

type Step = NonNullable<import('@/types/book').PageContent['contentBlocks'][number]['steps']>[number]

interface GuidedStepsProps {
    /** The gate's key (the block's `rubric`): marked passed once every step has. */
    id: string
    title?: string
    intro?: string
    steps: Step[]
    sectionId: string
    pageNumber: number
    formatText?: (text: string) => React.ReactNode
    gated?: boolean
    onPass?: () => void
}

/** Where the learner stopped, per browser: they may leave for a lesson and come back (owner 2026-10-22). */
const key = (id: string) => `grade-steps:${id}`

function readStep(id: string, count: number): number {
    try {
        const saved = Number(localStorage.getItem(key(id)))
        return Number.isInteger(saved) && saved >= 0 && saved <= count ? saved : 0
    } catch {
        return 0
    }
}

function saveStep(id: string, step: number) {
    try {
        localStorage.setItem(key(id), String(step))
    } catch {
        // Private mode: the step is kept for this visit only.
    }
}

/**
 * A project done one question at a time, like the notes template at the end of Level 1: the learner answers a step,
 * «المستر» grades it, and the next step opens once it passes. Stuck on a step? GradeCheck points back to its lesson.
 */
export default function GuidedSteps({ id, title, intro, steps, sectionId, pageNumber, formatText = text => text, gated = false, onPass }: GuidedStepsProps) {
    const [current, setCurrent] = useState(0)
    const [passed, setPassed] = useState(false)
    useEffect(() => setCurrent(readStep(id, steps.length)), [id, steps.length])
    const done = current >= steps.length
    const step = steps[Math.min(current, steps.length - 1)]

    const goTo = (next: number) => {
        setCurrent(next)
        setPassed(false)
        saveStep(id, next)
        if (next >= steps.length) {
            markGradePassed(id)
            trackEvent('grade_steps_done', { steps: id })
            onPass?.()
        }
    }

    return (
        <section aria-label={title || 'المشروع خطوة بخطوة'} style={{ margin: '20px 0', padding: '18px', borderRadius: '16px', background: 'rgba(74, 222, 128, 0.04)', border: '1px solid rgba(74, 222, 128, 0.35)' }}>
            {title && <p style={{ color: '#fff', fontWeight: 700, fontSize: '1.1rem', lineHeight: 1.8, margin: '0 0 6px' }}>🧑‍🏫 {title}</p>}
            {intro && <p style={{ color: '#ddd', lineHeight: 1.8, margin: '0 0 12px', whiteSpace: 'pre-line' }}>{formatText(intro)}</p>}

            <ol aria-label="الخطوات" style={{ listStyle: 'none', display: 'flex', flexWrap: 'wrap', gap: '6px', margin: '0 0 14px', padding: 0 }}>
                {steps.map((s, i) => (
                    <li key={s.rubric + i} aria-current={i === current ? 'step' : undefined} style={{
                        padding: '4px 12px', borderRadius: '999px', fontSize: '0.85rem', fontWeight: 700,
                        color: i < current ? '#052e16' : i === current ? '#fff' : '#999',
                        background: i < current ? '#4ade80' : i === current ? 'rgba(74, 222, 128, 0.2)' : 'rgba(255,255,255,0.05)',
                        border: `1px solid ${i <= current ? '#4ade80' : 'rgba(255,255,255,0.12)'}`,
                    }}>
                        {i < current ? '✓' : i + 1}. {s.title}
                    </li>
                ))}
            </ol>

            {done ? (
                <div aria-live="polite" style={{ lineHeight: 1.8 }}>
                    <p style={{ color: '#4ade80', fontWeight: 700, margin: '0 0 8px' }}>✅ خلّصت الخطوات كلها، والطلب ده بقى جاهز في شنطتك.{gated ? ' واتفتح باقي الدرس تحت 👇' : ''}</p>
                    <button type="button" onClick={() => goTo(0)} style={secondary}>اعمل طلب تاني بنفس الخطوات</button>
                </div>
            ) : (
                <>
                    <p style={{ color: '#bbb', fontSize: '0.85rem', margin: '0 0 4px' }}>سؤال {current + 1} من {steps.length}</p>
                    <GradeCheck
                        key={step.rubric + current}
                        rubricId={step.rubric}
                        title={step.title}
                        intro={step.ask}
                        bagLabel={step.bag}
                        sectionId={sectionId}
                        pageNumber={pageNumber}
                        formatText={formatText}
                        stuckLesson={step.lesson}
                        placeholder={step.placeholder || 'اكتب إجابتك هنا'}
                        onPass={() => setPassed(true)}
                    />
                    {passed && (
                        <button type="button" onClick={() => goTo(current + 1)} style={primary}>
                            {current + 1 < steps.length ? `السؤال اللي بعده ←` : 'خلّصت ✓'}
                        </button>
                    )}
                    {gated && !passed && (
                        <p style={{ color: '#fbbf24', margin: '10px 0 0', lineHeight: 1.8 }}>🔒 باقي الدرس والمستوى الجاي هيفتحوا لما تخلّص الأسئلة كلها.</p>
                    )}
                </>
            )}
        </section>
    )
}

const primary: React.CSSProperties = { minHeight: '48px', padding: '0 22px', borderRadius: '12px', border: 'none', cursor: 'pointer', font: 'inherit', fontWeight: 700, color: '#052e16', background: '#4ade80' }
const secondary: React.CSSProperties = { minHeight: '44px', padding: '0 18px', borderRadius: '12px', cursor: 'pointer', font: 'inherit', fontWeight: 700, color: '#fff', background: 'transparent', border: '1px solid rgba(255,255,255,0.3)' }
