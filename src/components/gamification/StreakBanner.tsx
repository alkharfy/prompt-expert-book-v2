'use client'

import React, { useEffect, useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

interface StreakData {
    current_streak: number
    longest_streak: number
    last_activity_date: string | null
    is_active_today: boolean
    streak_at_risk: boolean
    current_level: number
    total_points: number
}

interface StreakBannerProps {
    variant?: 'default' | 'small' | 'large'
    showDetails?: boolean
    className?: string
}

const STREAK_LEVELS = [
    { min: 0, label: 'مبتدئ', color: '#94a3b8' },
    { min: 3, label: 'مشتعل', color: '#f97316' },
    { min: 7, label: 'متحمس', color: '#ef4444' },
    { min: 14, label: 'ملتزم', color: '#a855f7' },
    { min: 30, label: 'أسطوري', color: '#eab308' },
    { min: 100, label: 'خارق', color: '#06b6d4' },
]

function getStreakLevel(streak: number) {
    let level = STREAK_LEVELS[0]
    for (const l of STREAK_LEVELS) {
        if (streak >= l.min) level = l
    }
    return level
}

function getFlameCount(streak: number): number {
    if (streak >= 30) return 3
    if (streak >= 7) return 2
    if (streak >= 1) return 1
    return 0
}

export default function StreakBanner({ variant = 'default', showDetails = true, className = '' }: StreakBannerProps) {
    const [streakData, setStreakData] = useState<StreakData | null>(null)
    const [loading, setLoading] = useState(true)
    const [hasRecordedActivity, setHasRecordedActivity] = useState(false)

    const fetchStreak = useCallback(async () => {
        try {
            const res = await fetch('/api/streak')
            if (!res.ok) return
            const json = await res.json()
            if (json.data) {
                setStreakData(json.data)
            }
        } catch {
            // Silently fail - streak display is non-critical
        } finally {
            setLoading(false)
        }
    }, [])

    // Record activity on mount (reading = activity)
    const recordActivity = useCallback(async () => {
        if (hasRecordedActivity) return
        try {
            const res = await fetch('/api/streak', { method: 'POST' })
            if (!res.ok) return
            const json = await res.json()
            if (json.data) {
                setStreakData(json.data)
                setHasRecordedActivity(true)
            }
        } catch {
            // Silently fail
        }
    }, [hasRecordedActivity])

    useEffect(() => {
        fetchStreak()
    }, [fetchStreak])

    // Record activity after initial fetch
    useEffect(() => {
        if (streakData && !streakData.is_active_today && !hasRecordedActivity) {
            recordActivity()
        }
    }, [streakData, hasRecordedActivity, recordActivity])

    if (loading || !streakData) return null

    const { current_streak, longest_streak, streak_at_risk, is_active_today } = streakData
    const streakLevel = getStreakLevel(current_streak)
    const flameCount = getFlameCount(current_streak)

    const sizeClass = variant === 'small' ? 'streak-counter-small' : variant === 'large' ? 'streak-counter-large' : ''

    return (
        <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className={`streak-counter ${sizeClass} ${is_active_today ? 'active-today' : ''} ${className}`}
        >
            <div className="streak-flames">
                {Array.from({ length: Math.max(flameCount, 1) }).map((_, i) => (
                    <span
                        key={i}
                        className={`streak-fire ${current_streak === 0 ? 'inactive' : ''}`}
                    >
                        🔥
                    </span>
                ))}
            </div>

            <div className="streak-info">
                <AnimatePresence mode="wait">
                    <motion.span
                        key={current_streak}
                        initial={{ scale: 0.5, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={{ scale: 0.5, opacity: 0 }}
                        className="streak-number"
                        style={{ color: streakLevel.color }}
                    >
                        {current_streak}
                    </motion.span>
                </AnimatePresence>
                <span className="streak-label">
                    {current_streak === 1 ? 'يوم متتالي' : 'أيام متتالية'}
                </span>
            </div>

            <span
                className="streak-level-badge"
                style={{ borderColor: streakLevel.color, color: streakLevel.color }}
            >
                {streakLevel.label}
            </span>

            {showDetails && variant !== 'small' && (
                <div className="streak-details">
                    <div className="streak-detail-item">
                        <span>أطول سلسلة:</span>
                        <span className="detail-value">{longest_streak} يوم</span>
                    </div>
                </div>
            )}

            {streak_at_risk && !is_active_today && (
                <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    className="streak-warning"
                >
                    ⚠️ سلسلتك في خطر! ابدأ القراءة اليوم للحفاظ عليها
                </motion.div>
            )}
        </motion.div>
    )
}
