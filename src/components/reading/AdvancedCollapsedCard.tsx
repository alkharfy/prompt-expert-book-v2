'use client'

import type { ReactNode } from 'react'

interface Props {
  title?: string
  content: string
  items?: { title: string; content: string }[]
  formatText: (text: string) => ReactNode
}

/** A '⚡ للمتمرسين' card shown to first-time AI users as one optional, tappable line. */
export default function AdvancedCollapsedCard({ title, content, items, formatText }: Props) {
  const topic = (title || '').replace(/^⚡\s*(للمتمرسين:\s*)?/, '').trim()
  return (
    <details
      style={{
        border: '1px dashed rgba(255, 184, 0, 0.35)',
        borderRadius: 12,
        padding: '10px 14px',
        background: 'rgba(255, 184, 0, 0.04)',
      }}
    >
      <summary style={{ cursor: 'pointer', color: '#FFB800', fontWeight: 700, fontSize: '0.98rem', lineHeight: 1.6, minHeight: 28 }}>
        ⚡ للمتمرسين — اختياري{topic ? `: ${topic}` : ''}
      </summary>
      <div style={{ marginTop: 10, color: '#d0d0d0', lineHeight: 1.8, whiteSpace: 'pre-line' }}>
        {content && <p style={{ margin: '0 0 8px' }}>{formatText(content)}</p>}
        {items?.map(item => (
          <p key={item.title} style={{ margin: '0 0 6px' }}>
            <strong style={{ color: '#fff' }}>{item.title}:</strong> {item.content}
          </p>
        ))}
      </div>
    </details>
  )
}
