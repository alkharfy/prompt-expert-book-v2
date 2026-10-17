'use client'

import { useState } from 'react'
import { trackEvent } from '@/lib/analytics'

interface ChecklistBlockProps {
    id: string
    title?: string
    /** Each item is one criterion: title = the check, content = what "done" looks like. */
    items: { title: string; content: string }[]
    /** Shown once every box is ticked. */
    outro?: string
    formatText?: (text: string) => React.ReactNode
}

export function checklistMessage(done: number, total: number): string {
    if (total === 0) return ''
    if (done === total) return `✅ ${total} من ${total}.`
    return `${done} من ${total}. فاضل ${total - done}: ارجع للي ماعلّمتش عليه.`
}

/** «جدول المعايير»: the learner ticks each criterion their own work meets; the score shows as they go. */
export default function ChecklistBlock({ id, title, items, outro, formatText = text => text }: ChecklistBlockProps) {
    const [checked, setChecked] = useState<boolean[]>(() => items.map(() => false))
    const done = checked.filter(Boolean).length

    const toggle = (index: number) => {
        const next = checked.map((value, i) => (i === index ? !value : value))
        setChecked(next)
        if (next.every(Boolean)) trackEvent('checklist_complete', { checklist: id, total: items.length })
    }

    return (
        <section aria-label={title || 'جدول المعايير'} style={{ margin: '24px 0', padding: '20px', borderRadius: '18px', background: 'rgba(34, 197, 94, 0.05)', border: '1px solid rgba(34, 197, 94, 0.3)' }}>
            {title && <h3 style={{ color: '#fff', fontSize: '1.15rem', lineHeight: 1.7, margin: '0 0 14px' }}>{title}</h3>}
            <div style={{ display: 'grid', gap: '10px' }}>
                {items.map((item, index) => (
                    <label
                        key={item.title}
                        style={{
                            display: 'flex', gap: '12px', alignItems: 'flex-start', cursor: 'pointer', minHeight: '48px',
                            padding: '12px 14px', borderRadius: '12px', lineHeight: 1.7,
                            background: checked[index] ? 'rgba(34,197,94,0.1)' : 'rgba(255,255,255,0.03)',
                            border: `1px solid ${checked[index] ? 'rgba(34,197,94,0.5)' : 'rgba(255,255,255,0.1)'}`,
                        }}
                    >
                        <input type="checkbox" checked={checked[index]} onChange={() => toggle(index)} style={{ width: '22px', height: '22px', marginTop: '3px', accentColor: '#22c55e', flexShrink: 0 }} />
                        <span>
                            <strong style={{ color: '#fff' }}>{item.title}</strong>
                            {item.content && <span style={{ display: 'block', color: '#bbb', fontSize: '0.92rem' }}>{formatText(item.content)}</span>}
                        </span>
                    </label>
                ))}
            </div>
            <p aria-live="polite" style={{ color: done === items.length ? '#4ade80' : '#ddd', fontWeight: 700, margin: '14px 0 0', lineHeight: 1.8 }}>
                {checklistMessage(done, items.length)}
            </p>
            {done === items.length && outro && <div style={{ color: '#ccc', lineHeight: 1.9, marginTop: '8px', whiteSpace: 'pre-line' }}>{formatText(outro)}</div>}
        </section>
    )
}
