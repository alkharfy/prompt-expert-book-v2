'use client'

import { useState } from 'react'
import Link from 'next/link'
import { trackEvent } from '@/lib/analytics'
import { GRADE_RUBRICS } from '@/data/gradeRubrics'
import type { CriterionResult } from '@/lib/grader'
import { saveToBag } from './bag'
import { markGradePassed } from './gradePass'

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
    /** The rest of the lesson waits behind this exercise (SectionPage hides it until onPass). */
    gated?: boolean
    onPass?: () => void
    /** A step of a guided project: after 3 misses, send the learner back to this lesson; the self-check comes later. */
    stuckLesson?: { label: string; href: string }
    placeholder?: string
}

/**
 * Graded tries with a ❌ before the self-check list shows up anyway: the grader can be wrong, nobody stays stuck.
 * Owner 2026-10-22: 3 came too soon (a learner ticked it instead of trying again); 5 still spares 10 wrong tries.
 */
const MISSES_BEFORE_SELF_CHECK = 5
/** In a guided project the lesson link comes first, before the self-check. */
const MISSES_BEFORE_SEND_BACK = 3

const MARK: Record<CriterionResult['verdict'], string> = { pass: '✅', fail: '❌', unsure: '🤔' }

type State =
    | { kind: 'idle' }
    | { kind: 'loading' }
    | { kind: 'error'; message: string; code?: string }
    | { kind: 'done'; criteria: CriterionResult[]; fix: string; remaining?: number }

/** «المستر بيصحّح»: the learner pastes their prompt or reply and gets feedback per criterion. */
export default function GradeCheck({ rubricId, title, intro, bagLabel, sectionId, pageNumber, formatText = text => text, gated = false, onPass, stuckLesson, placeholder }: GradeCheckProps) {
    const rubric = GRADE_RUBRICS[rubricId]
    const [text, setText] = useState('')
    const [state, setState] = useState<State>({ kind: 'idle' })
    const [saved, setSaved] = useState('')
    const [ticked, setTicked] = useState<Record<string, boolean>>({})
    const [misses, setMisses] = useState(0)
    const [opened, setOpened] = useState(false)
    if (!rubric) return null
    const ready = text.trim().length >= 15
    // When the grader can't answer (down, busy, out of today's gradings, offline), the learner checks the same list by hand.
    const graderDown = state.kind === 'error' && !['login', 'subscription', 'sensitive', 'copied', 'too_short', 'too_long', 'bad_request'].includes(state.code || '')
    const stuck = state.kind === 'done' && (!!stuckLesson || gated) && misses >= MISSES_BEFORE_SELF_CHECK
    const sendBack = !!stuckLesson && misses >= MISSES_BEFORE_SEND_BACK && state.kind === 'done' && state.criteria.some(c => c.verdict === 'fail')
    const selfCheck = graderDown || stuck
    const checks = [...(rubric.placeholders ? [{ id: 'placeholders', label: 'فيه فراغات [  ] بدل البيانات' }] : []), ...rubric.criteria]
    const allTicked = checks.every(c => ticked[c.id])

    const pass = (via: 'grader' | 'self') => {
        markGradePassed(rubricId)
        if (gated) {
            setOpened(true)
            trackEvent('grade_gate_open', { rubric: rubricId, via })
        }
        onPass?.()
    }
    const tick = (id: string, on: boolean) => {
        const next = { ...ticked, [id]: on }
        setTicked(next)
        if (checks.every(c => next[c.id])) pass('self')
    }

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
            if ((json.criteria as CriterionResult[]).some(c => c.verdict === 'fail')) setMisses(m => m + 1)
            else pass('grader')
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
                onChange={e => { setText(e.target.value); setSaved(''); if (state.kind === 'error' && !selfCheck) setState({ kind: 'idle' }) }}
                rows={6}
                dir="rtl"
                placeholder={placeholder || 'الزق هنا اللي كتبته'}
                aria-label="اللي كتبته"
                style={{ width: '100%', boxSizing: 'border-box', minHeight: '140px', padding: '12px 14px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.2)', background: 'rgba(0,0,0,0.3)', color: '#fff', font: 'inherit', fontSize: '1rem', lineHeight: 1.8, resize: 'vertical' }}
            />
            <p style={{ color: '#fbbf24', margin: '6px 0 10px', fontSize: '0.88rem', lineHeight: 1.7 }}>⚠️ متلزقش بيانات حقيقية: أسامي، أو أرقام موبايل، أو أرقام قومية. ولو لقينا حاجة زي كده، هنوقف ومش هنبعتها.</p>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
                <button
                    type="button"
                    onClick={send}
                    disabled={state.kind === 'loading' || !ready}
                    style={{ minHeight: '48px', padding: '0 20px', borderRadius: '12px', border: 'none', cursor: 'pointer', font: 'inherit', fontWeight: 700, color: '#052e16', background: '#4ade80', opacity: ready ? 1 : 0.6 }}
                >
                    {state.kind === 'loading' ? 'المستر بيقرا…' : state.kind === 'done' || selfCheck ? 'عدّلت؟ صحّحلي تاني' : 'صحّحلي'}
                </button>
                {bagLabel && ready && (
                    <button type="button" onClick={save} style={{ minHeight: '48px', padding: '0 16px', borderRadius: '12px', cursor: 'pointer', font: 'inherit', fontWeight: 700, color: '#fff', background: 'rgba(168, 85, 247, 0.25)', border: '1px solid rgba(168, 85, 247, 0.6)' }}>
                        🎒 احفظه في شنطتك
                    </button>
                )}
            </div>
            {saved && <p style={{ color: '#ddd', margin: '8px 0 0' }}>{saved}</p>}

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
                    </div>
                )}
                {sendBack && stuckLesson && (
                    <div style={{ margin: '12px 0 0', padding: '12px 14px', borderRadius: '12px', background: 'rgba(0, 212, 255, 0.07)', border: '1px solid rgba(0, 212, 255, 0.4)', lineHeight: 1.8 }}>
                        <strong style={{ color: '#e8fbff' }}>🔁 النقطة دي محتاجة مراجعة.</strong>
                        <div style={{ color: '#ddd' }}>ارجع لدرس <Link href={stuckLesson.href} style={{ color: '#00D4FF', fontWeight: 700 }}>«{stuckLesson.label}»</Link>، وتعالى كمّل من هنا. مكانك محفوظ.</div>
                    </div>
                )}
                {selfCheck && (
                    <div style={{ margin: '12px 0 0', padding: '12px 14px', borderRadius: '12px', background: 'rgba(0,0,0,0.25)' }}>
                        <p style={{ color: '#fff', fontWeight: 700, margin: '0 0 8px', lineHeight: 1.8 }}>
                            {graderDown ? '✍️ لحد ما المستر يرجع، صحّح نفسك: علّم على اللي موجود في طلبك فعلاً.' : '✍️ المستر ممكن يغلط. لو متأكد إن طلبك فيه كل ده، علّم عليه بنفسك وكمّل.'}
                        </p>
                        <ul style={{ listStyle: 'none', margin: 0, padding: 0, display: 'grid', gap: '6px' }}>
                            {checks.map(c => (
                                <li key={c.id}>
                                    <label style={{ display: 'flex', gap: '10px', alignItems: 'flex-start', minHeight: '44px', color: '#ddd', lineHeight: 1.8, cursor: 'pointer' }}>
                                        <input type="checkbox" checked={!!ticked[c.id]} onChange={e => tick(c.id, e.target.checked)} style={{ width: '20px', height: '20px', marginTop: '5px', flexShrink: 0 }} />
                                        {c.label}
                                    </label>
                                </li>
                            ))}
                        </ul>
                        <p style={{ color: allTicked ? '#4ade80' : '#bbb', margin: '8px 0 0', lineHeight: 1.8 }}>
                            {allTicked ? '✅ طلبك فيه كل حاجة. احفظه في شنطتك وكمّل.' : 'اللي مش متعلّم عليه، زوّده في طلبك وجرّبه تاني في أداتك.'}
                        </p>
                    </div>
                )}
                {gated && !opened && (
                    <p style={{ color: '#fbbf24', margin: '12px 0 0', lineHeight: 1.8 }}>🔒 باقي الدرس هيفتح أول ما طلبك ياخد ✅ من المستر. ولو المستر مش متاح، هتصحّح نفسك بقايمة وتكمّل.</p>
                )}
                {opened && <p style={{ color: '#4ade80', fontWeight: 700, margin: '12px 0 0', lineHeight: 1.8 }}>✅ اتفتح باقي الدرس. كمّل تحت 👇</p>}
            </div>
        </section>
    )
}
