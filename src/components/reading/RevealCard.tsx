'use client'

import { useState, type ReactNode } from 'react'

interface Props {
  /** The question or prompt; a line break puts each part on its own line (e.g. «🧠 فاكر؟\n<السؤال>»). */
  label: string
  title?: string
  content: string
  items?: { title: string; content: string }[]
  formatText: (text: string) => ReactNode
}

/**
 * Answers and worked solutions stay hidden until the reader has tried, then open on tap.
 * The question and the answer sit in separate boxes, and a button-like pill says plainly that it opens.
 */
export default function RevealCard({ label, title, content, items, formatText }: Props) {
  const [open, setOpen] = useState(false)

  return (
    <details
      onToggle={event => setOpen((event.currentTarget as HTMLDetailsElement).open)}
      style={{
        border: '1px solid rgba(0, 212, 255, 0.35)',
        borderRadius: 14,
        background: 'rgba(0, 212, 255, 0.05)',
        overflow: 'hidden',
      }}
    >
      <summary style={{ listStyle: 'none', cursor: 'pointer', padding: '14px 16px', display: 'grid', gap: 12 }}>
        <span style={{ color: '#e8fbff', fontWeight: 700, fontSize: '1rem', lineHeight: 1.8, whiteSpace: 'pre-line' }}>{label}</span>
        <span
          aria-hidden="true"
          style={{
            justifySelf: 'start', display: 'inline-flex', alignItems: 'center', gap: 6, minHeight: 40,
            padding: '8px 16px', borderRadius: 999, fontWeight: 700, fontSize: '0.92rem',
            color: open ? '#9be9ff' : '#06222b', background: open ? 'transparent' : '#00D4FF',
            border: '1px solid #00D4FF',
          }}
        >
          {open ? 'إخفاء الإجابة ▴' : '👆 اضغط هنا وشوف الإجابة ▾'}
        </span>
      </summary>
      <div style={{ margin: '0 12px 12px', padding: '12px 14px', borderRadius: 12, background: 'rgba(255,255,255,0.04)', color: '#d0d0d0', lineHeight: 1.8, whiteSpace: 'pre-line' }}>
        <p style={{ margin: '0 0 6px', color: '#00D4FF', fontWeight: 700, fontSize: '0.85rem' }}>الإجابة</p>
        {title && <p style={{ margin: '0 0 8px', color: '#fff', fontWeight: 700 }}>{title}</p>}
        {content && <p style={{ margin: '0 0 8px' }}>{formatText(content)}</p>}
        {items?.map(item => (
          <p key={item.title} style={{ margin: '0 0 6px' }}>
            <strong style={{ color: '#fff' }}>{item.title}:</strong> {formatText(item.content)}
          </p>
        ))}
      </div>
    </details>
  )
}
