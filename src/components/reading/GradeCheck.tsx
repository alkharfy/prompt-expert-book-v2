'use client'

import { useState } from 'react'
import Link from 'next/link'
import { trackEvent } from '@/lib/analytics'
import { GRADE_RUBRICS } from '@/data/gradeRubrics'
import type { CriterionResult } from '@/lib/grader'
import { saveToBag } from './bag'

interface GradeCheckProps {
    rubricId: string
    title?: string
    /** One line above the box: what to paste here. */
    intro?: string
    /** When set, a good result can be saved to «شنطتك» under this label. */
    bagLabel?: string
    sectionId: string
    pageNumber: number
    formatText?: (text: string) => React.ReactNode
}

const MARK: Record<CriterionResult['verdict'], string> = { pass: '✅', fail: '❌', unsure: '🤔' }

type State =
    | { kind: 'idle' }
    | { kind: 'loading' }
    | { kind: 'error'; message: string; code?: string }
    | { kind: 'done'; criteria: CriterionResult[]; fix: string; remaining?: number }

/** «المستر بيصحّح»: the learner pastes their prompt or reply and gets feedback per criterion. */
export default function GradeCheck({ rubricId, title, intro, bagLabel, sectionId, pageNumber, formatText = text => text }: GradeCheckProps) {
    const rubric = GRADE_RUBRICS[rubricId]
    const [text, setText] = useState('')
    const [state, setState] = useState<State>({ kind: 'idle' })
    const [saved, setSaved] = useState('')
    if (!rubric) return null

    const send = async () => {
        if (state.kind === 'loading' || text.trim().length < 15) return
        setState({ kind: 'loading' })
        setSaved('')
        try {
            const res = await fetch('/api/grade', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({ rubric: rubricId, text }),
            })
            const json = await res.json().catch(() => ({}))
            if (!res.ok) {
                setState({ kind: 'error', message: json.message || 'حصلت مشكلة. جرّب تاني.', code: json.error })
                trackEvent('grade_check', { rubric: rubricId, outcome: json.error || 'error' })
                return
            }
            setState({ kind: 'done', criteria: json.criteria, fix: json.fix, remaining: json.remaining })
            const counts = (json.criteria as CriterionResult[]).reduce((t, c) => ({ ...t, [c.verdict]: (t[c.verdict] || 0) + 1 }), {} as Record<string, number>)
            trackEvent('grade_check', { rubric: rubricId, outcome: 'graded', pass: counts.pass || 0, fail: counts.fail || 0, unsure: counts.unsure || 0 })
        } catch {
            setState({ kind: 'error', message: 'النت فصل؟ جرّب تاني.' })
        }
    }

    const save = async () => {
        if (!bagLabel) return
        const result = await saveToBag({ label: bagLabel, text, sectionId, pageNumber })
        setSaved(result.message)
        trackEvent('bag_save', { rubric: rubricId, ok: result.ok })
    }

    const here = typeof window !== 'undefined' ? window.location.pathname : `/read/${sectionId}/${pageNumber}`

    return (
        <section aria-label={title || 'المستر بيصحّح'} style={{ margin: '20px 0', padding: '18px', borderRadius: '16px', background: 'rgba(74, 222, 128, 0.05)', border: '1px solid rgba(74, 222, 128, 0.35)' }}>
            <p style={{ color: '#fff', fontWeight: 700, lineHeight: 1.8, margin: '0 0 6px' }}>🧑‍🏫 {title || 'المستر بيصحّح'}</p>
            {intro && <p style={{ color: '#ddd', lineHeight: 1.8, margin: '0 0 10px', whiteSpace: 'pre-line' }}>{formatText(intro)}</p>}
            <p style={{ color: '#bbb', margin: '0 0 6px', fontSize: '0.92rem' }}>المستر هيبص على:</p>
            <ul style={{ margin: '0 0 12px', paddingInlineStart: '20px', color: '#ddd', lineHeight: 1.8 }}>
                {rubric.placeholders && <li>فيه فراغات [  ] بدل البيانات</li>}
                {rubric.criteria.map(c => <li key={c.id}>{c.label}</li>)}
            </ul>
            <textarea
                value={text}
                onChange={e => { setText(e.target.value); if (state.kind === 'error') setState({ kind: 'idle' }) }}
                rows={6}
                dir="rtl"
                placeholder="الزق هنا اللي كتبته"
                aria-label="اللي كتبته"
                style={{ width: '100%', boxSizing: 'border-box', minHeight: '140px', padding: '12px 14px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.2)', background: 'rgba(0,0,0,0.3)', color: '#fff', font: 'inherit', fontSize: '1rem', lineHeight: 1.8, resize: 'vertical' }}
            />
            <p style={{ color: '#fbbf24', margin: '6px 0 10px', fontSize: '0.88rem', lineHeight: 1.7 }}>⚠️ متلزقش بيانات حقيقية: أسامي، أو أرقام موبايل، أو أرقام قومية. ولو لقينا حاجة زي كده، هنوقف ومش هنبعتها.</p>
            <button
                type="button"
                onClick={send}
                disabled={state.kind === 'loading' || text.trim().length < 15}
                style={{ minHeight: '48px', padding: '0 20px', borderRadius: '12px', border: 'none', cursor: 'pointer', font: 'inherit', fontWeight: 700, color: '#052e16', background: '#4ade80', opacity: text.trim().length < 15 ? 0.6 : 1 }}
            >
                {state.kind === 'loading' ? 'المستر بيقرا…' : state.kind === 'done' ? 'عدّلت؟ صحّحلي تاني' : 'صحّحلي'}
            </button>

            <div aria-live="polite">
                {state.kind === 'error' && (
                    <p role="alert" style={{ color: '#fca5a5', margin: '12px 0 0', lineHeight: 1.8 }}>
                        {state.message}{' '}
                        {state.code === 'login' && (
                            <>
                                <Link href={`/register?next=${encodeURIComponent(here)}`} style={{ color: '#FFB800' }}>اعمل حساب ببلاش</Link>
                                {' · '}
                                <Link href={`/login?next=${encodeURIComponent(here)}`} style={{ color: '#FFB800' }}>سجّل دخول</Link>
                            </>
                        )}
                        {state.code === 'subscription' && <Link href="/#pricing" style={{ color: '#FFB800' }}>شوف الباقات</Link>}
                    </p>
                )}
                {state.kind === 'done' && (
                    <div style={{ margin: '14px 0 0' }}>
                        <ul style={{ listStyle: 'none', margin: 0, padding: 0, display: 'grid', gap: '10px' }}>
                            {state.criteria.map(c => (
                                <li key={c.id} style={{ padding: '10px 12px', borderRadius: '12px', background: 'rgba(0,0,0,0.25)', lineHeight: 1.8 }}>
                                    <strong style={{ color: '#fff' }}>{MARK[c.verdict]} {c.label}</strong>
                                    {c.note && <div style={{ color: '#ddd' }}>{c.note}</div>}
                                    {c.evidence && <div style={{ color: '#a3a3a3', fontSize: '0.9rem' }}>من كلامك: «{c.evidence}»</div>}
                                </li>
                            ))}
                        </ul>
                        {state.fix && (
                            <div style={{ margin: '12px 0 0', padding: '12px 14px', borderRadius: '12px', background: 'rgba(255, 184, 0, 0.08)', border: '1px solid rgba(255, 184, 0, 0.35)', lineHeight: 1.8 }}>
                                <strong style={{ color: '#FFB800' }}>{state.criteria.every(c => c.verdict === 'pass') ? '💡 لو عايز تحسّنه أكتر:' : '🔧 أهم حاجة تصلّحها:'}</strong>
                                <div style={{ color: '#eee' }}>{state.fix}</div>
                            </div>
                        )}
                        <p style={{ color: '#999', fontSize: '0.85rem', margin: '10px 0 0' }}>ملاحظات المستر، وممكن يغلط. إنت اللي بتقرر في الآخر.{typeof state.remaining === 'number' ? ` · فاضلك النهارده ${state.remaining}` : ''}</p>
                        {bagLabel && (
                            <div style={{ margin: '12px 0 0' }}>
                                <button type="button" onClick={save} style={{ minHeight: '44px', padding: '0 16px', borderRadius: '12px', cursor: 'pointer', font: 'inherit', fontWeight: 700, color: '#fff', background: 'rgba(168, 85, 247, 0.25)', border: '1px solid rgba(168, 85, 247, 0.6)' }}>
                                    🎒 احفظه في شنطتك
                                </button>
                                {saved && <p style={{ color: '#ddd', margin: '8px 0 0' }}>{saved}</p>}
                            </div>
                        )}
                    </div>
                )}
            </div>
        </section>
    )
}
