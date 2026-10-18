'use client'

import { useEffect, useState } from 'react'
import { trackEvent } from '@/lib/analytics'
import { loadBag, saveToBag, type BagItem } from './bag'

const box = { margin: '20px 0', padding: '18px', borderRadius: '16px', background: 'rgba(168, 85, 247, 0.06)', border: '1px solid rgba(168, 85, 247, 0.4)' } as const
const field = { width: '100%', boxSizing: 'border-box', minHeight: '120px', padding: '12px 14px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.2)', background: 'rgba(0,0,0,0.3)', color: '#fff', font: 'inherit', fontSize: '1rem', lineHeight: 1.8, resize: 'vertical' } as const
const button = { minHeight: '44px', padding: '0 16px', borderRadius: '12px', cursor: 'pointer', font: 'inherit', fontWeight: 700, color: '#fff', background: 'rgba(168, 85, 247, 0.3)', border: '1px solid rgba(168, 85, 247, 0.6)' } as const

/** Write something and keep it in «شنطتك» (a list of tasks, a tone sheet…). */
export function SaveToBagBlock({ label, intro, placeholder, sectionId, pageNumber, formatText = text => text }: {
    label: string
    intro?: string
    placeholder?: string
    sectionId: string
    pageNumber: number
    formatText?: (text: string) => React.ReactNode
}) {
    const [text, setText] = useState('')
    const [message, setMessage] = useState('')
    const save = async () => {
        if (text.trim().length < 3) return
        const result = await saveToBag({ label, text: text.trim(), sectionId, pageNumber })
        setMessage(result.message)
        trackEvent('bag_save', { label, ok: result.ok })
    }
    return (
        <section aria-label={label} style={box}>
            <p style={{ color: '#fff', fontWeight: 700, margin: '0 0 6px' }}>🎒 {label}</p>
            {intro && <p style={{ color: '#ddd', lineHeight: 1.8, margin: '0 0 10px', whiteSpace: 'pre-line' }}>{formatText(intro)}</p>}
            <textarea value={text} onChange={e => { setText(e.target.value); setMessage('') }} rows={5} dir="rtl" placeholder={placeholder || 'اكتب هنا'} aria-label={label} style={field} />
            <div style={{ margin: '10px 0 0' }}>
                <button type="button" onClick={save} disabled={text.trim().length < 3} style={{ ...button, opacity: text.trim().length < 3 ? 0.6 : 1 }}>احفظ في شنطتك</button>
                {message && <p style={{ color: '#ddd', margin: '8px 0 0' }}>{message}</p>}
            </div>
        </section>
    )
}

/** Everything this level put in «شنطتك», with a copy button each. */
export function BagList({ sectionId, title }: { sectionId: string; title?: string }) {
    const [items, setItems] = useState<BagItem[] | null | 'loading'>('loading')
    const [copied, setCopied] = useState('')
    useEffect(() => { loadBag(sectionId).then(setItems) }, [sectionId])

    const copy = async (item: BagItem) => {
        try {
            await navigator.clipboard.writeText(item.text)
            setCopied(item.id)
        } catch {
            setCopied('')
        }
    }

    return (
        <section aria-label={title || 'شنطتك'} style={box}>
            <p style={{ color: '#fff', fontWeight: 700, margin: '0 0 10px' }}>🎒 {title || 'شنطتك لحد دلوقتي'}</p>
            {items === 'loading' && <p style={{ color: '#bbb', margin: 0 }}>بيحمّل…</p>}
            {items === null && <p style={{ color: '#bbb', margin: 0 }}>سجّل دخولك عشان تشوف اللي حفظته.</p>}
            {Array.isArray(items) && items.length === 0 && <p style={{ color: '#bbb', margin: 0, lineHeight: 1.8 }}>لسه محفظتش حاجة. ارجع للدروس واضغط «🎒 احفظه في شنطتك» بعد كل طلب.</p>}
            {Array.isArray(items) && items.length > 0 && (
                <ol style={{ margin: 0, paddingInlineStart: '20px', display: 'grid', gap: '12px' }}>
                    {items.map(item => (
                        <li key={item.id} style={{ color: '#ddd', lineHeight: 1.8 }}>
                            <strong style={{ color: '#fff' }}>{item.label}</strong>
                            <div style={{ whiteSpace: 'pre-wrap', margin: '4px 0 6px', padding: '10px 12px', borderRadius: '10px', background: 'rgba(0,0,0,0.25)' }}>{item.text}</div>
                            <button type="button" onClick={() => copy(item)} style={{ ...button, minHeight: '36px', fontWeight: 400 }}>{copied === item.id ? '✅ اتنسخ' : 'انسخ'}</button>
                        </li>
                    ))}
                </ol>
            )}
        </section>
    )
}
