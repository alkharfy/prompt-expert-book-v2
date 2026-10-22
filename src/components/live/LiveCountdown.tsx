'use client'

import { useEffect, useState } from 'react'
import { arabicDigits } from '@/lib/live'

const UNITS = [
    { label: 'يوم', ms: 86400000 },
    { label: 'ساعة', ms: 3600000 },
    { label: 'دقيقة', ms: 60000 },
    { label: 'ثانية', ms: 1000 },
]

/** Counts down to a real instant (day 1 of the cohort). Renders nothing until mounted to avoid a hydration mismatch. */
export default function LiveCountdown({ target, compact = false }: { target: string; compact?: boolean }) {
    const [now, setNow] = useState<number | null>(null)

    useEffect(() => {
        setNow(Date.now())
        const id = setInterval(() => setNow(Date.now()), 1000)
        return () => clearInterval(id)
    }, [])

    let left = Math.max(0, new Date(target).getTime() - (now ?? 0))
    const values = UNITS.map(u => {
        const v = Math.floor(left / u.ms)
        left -= v * u.ms
        return v
    })

    return (
        <div className={`live-count${compact ? ' compact' : ''}`} role="timer" aria-label="الوقت الباقي على بداية التحدّي">
            {UNITS.map((u, i) => (
                <span key={u.label} className="live-count-cell">
                    <b>{now === null ? '–' : arabicDigits(String(values[i]).padStart(2, '0'))}</b>
                    <small>{u.label}</small>
                </span>
            ))}
        </div>
    )
}
