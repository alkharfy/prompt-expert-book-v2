'use client'

import type { ReactNode } from 'react'

interface Props {
  label: string
  title?: string
  content: string
  items?: { title: string; content: string }[]
  formatText: (text: string) => ReactNode
}

/** Answers and worked solutions stay hidden until the reader has tried, then open on tap. */
export default function RevealCard({ label, title, content, items, formatText }: Props) {
  return (
    <details
      style={{
        border: '1px solid rgba(0, 212, 255, 0.3)',
        borderRadius: 12,
        padding: '10px 14px',
        background: 'rgba(0, 212, 255, 0.04)',
      }}
    >
      <summary style={{ cursor: 'pointer', color: '#00D4FF', fontWeight: 700, fontSize: '0.98rem', lineHeight: 1.6, minHeight: 28 }}>
        {label}
      </summary>
      <div style={{ marginTop: 10, color: '#d0d0d0', lineHeight: 1.8, whiteSpace: 'pre-line' }}>
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
