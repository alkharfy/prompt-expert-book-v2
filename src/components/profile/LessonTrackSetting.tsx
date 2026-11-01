'use client'

import { useState } from 'react'
import { useLearning } from '@/context/LearningContext'
import { readerTrack } from '@/lib/personalizeBlocks'
import { TRACK_PROFESSIONS, TRACK_PROFESSION_LABELS } from '@/lib/onboarding'
import type { ProfessionId } from '@/types/learning'

/**
 * The one place to change whose examples the lessons follow (owner 2026-11-01: the lessons show the track
 * picked at sign-up, with no switch on every page).
 */
export default function LessonTrackSetting() {
    const { preferences, refreshPreferences } = useLearning()
    const profession = preferences?.profession ?? null
    const currentTrack = profession ? readerTrack(profession) : null
    const [saving, setSaving] = useState<ProfessionId | null>(null)
    const [message, setMessage] = useState('')

    const choose = async (id: ProfessionId) => {
        if (saving || (currentTrack && readerTrack(id) === currentTrack)) return
        setSaving(id)
        setMessage('')
        try {
            const res = await fetch('/api/onboarding', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ profession: id }),
            })
            const data = await res.json().catch(() => ({}))
            if (!res.ok || !data.ok) throw new Error()
            await refreshPreferences()
            setMessage(`✅ الدروس هتمشي مع ${TRACK_PROFESSION_LABELS[id].person} من دلوقتي.`)
        } catch {
            setMessage('⚠️ مقدرناش نحفظ الاختيار. جرّب تاني.')
        }
        setSaving(null)
    }

    return (
        <div style={{ marginTop: '16px' }}>
            <h3 style={{ color: '#FF6B35', fontSize: '18px', marginBottom: '4px' }}>🧭 أمثلة الدروس على مين؟</h3>
            <p style={{ color: '#888', fontSize: '13px', marginBottom: '14px' }}>
                الدروس ماشية مع اتنين من الشغل. اختار الأقرب لشغلك، والدروس والتمارين هتتغيّر على طول.
            </p>
            <div role="radiogroup" aria-label="أمثلة الدروس على مين" style={{ display: 'grid', gap: '10px' }}>
                {TRACK_PROFESSIONS.map(id => {
                    const option = TRACK_PROFESSION_LABELS[id]
                    const on = currentTrack !== null && readerTrack(id) === currentTrack
                    return (
                        <button
                            key={id}
                            type="button"
                            role="radio"
                            aria-checked={on}
                            disabled={!!saving}
                            onClick={() => choose(id)}
                            style={{
                                display: 'flex', alignItems: 'center', gap: '12px', textAlign: 'right', width: '100%',
                                minHeight: '56px', padding: '10px 14px', borderRadius: '12px', cursor: 'pointer', font: 'inherit',
                                color: on ? '#fff' : '#ccc',
                                background: on ? 'rgba(255,107,53,0.15)' : 'transparent',
                                border: `1px solid ${on ? '#FF6B35' : 'rgba(255,255,255,0.15)'}`,
                            }}
                        >
                            <span aria-hidden="true" style={{ fontSize: '1.4rem' }}>{option.icon}</span>
                            <span style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                                <b style={{ fontSize: '0.95rem' }}>{option.label}</b>
                                <span style={{ fontSize: '0.8rem', color: '#999' }}>{saving === id ? 'بنحفظ...' : option.hint}</span>
                            </span>
                            {on && <span style={{ marginInlineStart: 'auto', color: '#FF6B35', fontSize: '0.85rem', fontWeight: 700 }}>✓ اختيارك</span>}
                        </button>
                    )
                })}
            </div>
            {message && <p role="status" style={{ color: '#bbb', fontSize: '13px', marginTop: '10px' }}>{message}</p>}
        </div>
    )
}
