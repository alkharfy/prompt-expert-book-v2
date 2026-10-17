'use client'

import { useState } from 'react'
import { AI_TOOL_TASKS, AI_TOOLS_REVIEWED, AI_TOOLS_SHOWN, PLAN_LABEL } from '@/data/aiTools'
import { trackEvent } from '@/lib/analytics'

/** «الأفضل لكل مهمة»: one row per task, two tools each, every tool a link that opens in a new tab. */
export default function BestAiTools() {
    const [showAll, setShowAll] = useState(false)
    const rows = showAll ? AI_TOOL_TASKS : AI_TOOL_TASKS.slice(0, AI_TOOLS_SHOWN)
    const hidden = AI_TOOL_TASKS.length - AI_TOOLS_SHOWN

    return (
        <section aria-label="الأفضل لكل مهمة" style={{ margin: '8px 0', display: 'grid', gap: '10px' }}>
            {rows.map(row => (
                <div key={row.task} style={{ padding: '14px', borderRadius: '14px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)' }}>
                    <p style={{ margin: '0 0 4px', color: '#fff', fontWeight: 700, fontSize: '1.02rem' }}>
                        <span aria-hidden="true">{row.icon}</span> {row.task}
                    </p>
                    <p style={{ margin: '0 0 10px', color: '#aaa', fontSize: '0.88rem', lineHeight: 1.7 }}>{row.tip}</p>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                        {row.tools.map(tool => (
                            <a
                                key={tool.name}
                                href={tool.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                onClick={() => trackEvent('ai_tool_open', { tool: tool.name, task: row.task })}
                                style={{
                                    display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '2px',
                                    minHeight: '52px', padding: '8px', borderRadius: '12px', textDecoration: 'none',
                                    background: 'rgba(255,107,53,0.08)', border: '1px solid rgba(255,107,53,0.35)',
                                }}
                            >
                                <span dir="ltr" style={{ color: '#FF8C5A', fontWeight: 700 }}>{tool.name} ↗</span>
                                <span style={{ color: '#999', fontSize: '0.75rem' }}>{PLAN_LABEL[tool.plan]}</span>
                            </a>
                        ))}
                    </div>
                </div>
            ))}
            {!showAll && hidden > 0 && (
                <button
                    type="button"
                    onClick={() => setShowAll(true)}
                    style={{ minHeight: '48px', borderRadius: '12px', cursor: 'pointer', font: 'inherit', color: '#ddd', background: 'transparent', border: '1px dashed rgba(255,255,255,0.25)' }}
                >
                    باقي المهام ({hidden}): بحث، ومذاكرة، وصوت، وعروض، وبرمجة ▾
                </button>
            )}
            <p style={{ margin: '4px 0 0', color: '#888', fontSize: '0.8rem', textAlign: 'center' }}>
                الأفضل من وجهة نظرنا · آخر مراجعة: {AI_TOOLS_REVIEWED}. الأدوات والحدود المجانية بتتغير، وإحنا بنراجعها كل شهر.
            </p>
        </section>
    )
}
