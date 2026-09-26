'use client'

import React, { useState, useEffect, useCallback, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useReducedMotion } from '@/hooks/useReducedMotion'
import MissionCompleteToast from './MissionCompleteToast'
import AllClearCelebration from './AllClearCelebration'
import '@/styles/missions.css'

// =====================================================
// DailyMissionsWidget — ويدجت المهام اليومية العائم
// =====================================================

interface MissionData {
    id: string
    title: string
    description: string
    icon: string
    category: string
    target_value: number
    current_value: number
    status: string
    points_earned: number
    base_points: number
    bonus_multiplier: number
    slot_number: number
    completed_at: string | null
}

interface MissionsResponse {
    data: MissionData[]
    stats: {
        total: number
        completed: number
        total_points: number
        all_clear: boolean
    }
}

interface DailyMissionsWidgetProps {
    className?: string
}

export default function DailyMissionsWidget({ className = '' }: DailyMissionsWidgetProps) {
    const [missions, setMissions] = useState<MissionData[]>([])
    const [stats, setStats] = useState({ total: 0, completed: 0, total_points: 0, all_clear: false })
    const [isMinimized, setIsMinimized] = useState(true)
    const [isLoading, setIsLoading] = useState(true)
    const [completedToast, setCompletedToast] = useState<{ title: string; points: number } | null>(null)
    const [showAllClear, setShowAllClear] = useState(false)
    const [countdown, setCountdown] = useState('')
    const prevMissionsRef = useRef<MissionData[]>([])
    const allClearShownRef = useRef(false)
    const prefersReducedMotion = useReducedMotion()

    // جلب المهام
    const fetchMissions = useCallback(async () => {
        try {
            // لا ترسل طلب إذا المستخدم غير مسجل دخول
            const hasUser = document.cookie.split(';').some(c => c.trim().startsWith('ebook_user_id='))
            if (!hasUser) {
                setIsLoading(false)
                return
            }

            const res = await fetch('/api/missions')
            if (!res.ok) return

            const json: MissionsResponse = await res.json()
            const newMissions = json.data || []

            // كشف المهام المكتملة حديثاً (للإشعار)
            if (prevMissionsRef.current.length > 0) {
                for (const newM of newMissions) {
                    const oldM = prevMissionsRef.current.find(m => m.id === newM.id)
                    if (oldM && oldM.status === 'active' && newM.status === 'completed') {
                        setCompletedToast({ title: newM.title, points: newM.points_earned })
                        break
                    }
                }
            }

            prevMissionsRef.current = newMissions
            setMissions(newMissions)
            setStats(json.stats || { total: 0, completed: 0, total_points: 0, all_clear: false })

            // عرض احتفال All Clear
            if (json.stats?.all_clear && !allClearShownRef.current) {
                allClearShownRef.current = true
                // تأخير قليل لعرض toast أولاً
                setTimeout(() => setShowAllClear(true), 1500)
            }
        } catch {
            // Silent
        } finally {
            setIsLoading(false)
        }
    }, [])

    // جلب المهام عند التحميل
    useEffect(() => {
        fetchMissions()
    }, [fetchMissions])

    // Polling كل 15 ثانية
    useEffect(() => {
        const interval = setInterval(fetchMissions, 15000)
        return () => clearInterval(interval)
    }, [fetchMissions])

    // Countdown timer
    useEffect(() => {
        const updateCountdown = () => {
            const now = new Date()
            const endOfDay = new Date(now)
            endOfDay.setHours(23, 59, 59, 999)
            const diff = endOfDay.getTime() - now.getTime()

            const hours = Math.floor(diff / (1000 * 60 * 60))
            const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))
            setCountdown(`${hours}س ${minutes}د`)
        }

        updateCountdown()
        const interval = setInterval(updateCountdown, 60000)
        return () => clearInterval(interval)
    }, [])

    // الاستماع لأحداث تقدم المهام من باقي المكونات
    useEffect(() => {
        const handler = () => {
            // إعادة جلب المهام بعد تأخير قصير
            setTimeout(fetchMissions, 500)
        }

        window.addEventListener('mission-progress-updated', handler)
        return () => window.removeEventListener('mission-progress-updated', handler)
    }, [fetchMissions])

    if (isLoading || missions.length === 0) return null

    const completedCount = stats.completed
    const totalCount = stats.total || 3

    return (
        <>
            {/* Toast إكمال مهمة */}
            <AnimatePresence>
                {completedToast && (
                    <MissionCompleteToast
                        title={completedToast.title}
                        points={completedToast.points}
                        remainingCount={totalCount - completedCount}
                        onClose={() => setCompletedToast(null)}
                    />
                )}
            </AnimatePresence>

            {/* احتفال All Clear */}
            <AnimatePresence>
                {showAllClear && (
                    <AllClearCelebration
                        totalPoints={stats.total_points + 50}
                        onClose={() => setShowAllClear(false)}
                    />
                )}
            </AnimatePresence>

            {/* الويدجت */}
            <div className={`missions-widget ${isMinimized ? 'missions-widget-minimized' : ''} ${className}`}>
                {isMinimized ? (
                    /* الأيقونة المصغرة */
                    <motion.button
                        className="missions-widget-fab"
                        onClick={() => setIsMinimized(false)}
                        whileTap={prefersReducedMotion ? {} : { scale: 0.9 }}
                        title="مهام اليوم"
                    >
                        <span className="missions-fab-icon">🎯</span>
                        {completedCount < totalCount && (
                            <span className="missions-fab-badge">{completedCount}/{totalCount}</span>
                        )}
                        {completedCount === totalCount && (
                            <span className="missions-fab-badge missions-fab-badge-done">✅</span>
                        )}
                    </motion.button>
                ) : (
                    /* الويدجت الكامل */
                    <motion.div
                        className="missions-widget-card"
                        initial={prefersReducedMotion ? {} : { opacity: 0, y: 20, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        transition={{ duration: 0.3 }}
                    >
                        {/* Header */}
                        <div className="missions-widget-header">
                            <div className="missions-header-title">
                                <span>🎯</span>
                                <span>مهام اليوم</span>
                                <span className="missions-count-badge">
                                    {completedCount}/{totalCount} ✅
                                </span>
                            </div>
                            <button
                                className="missions-minimize-btn"
                                onClick={() => setIsMinimized(true)}
                                title="إخفاء"
                            >
                                إخفاء
                            </button>
                        </div>

                        {/* Mission List */}
                        <div className="missions-widget-list">
                            {missions.map((mission) => {
                                const progress = mission.target_value > 0
                                    ? Math.min((mission.current_value / mission.target_value) * 100, 100)
                                    : 0
                                const isCompleted = mission.status === 'completed'

                                return (
                                    <div
                                        key={mission.id}
                                        className={`mission-item ${isCompleted ? 'mission-item-completed' : ''}`}
                                    >
                                        <div className="mission-item-top">
                                            <span className="mission-icon">{mission.icon}</span>
                                            <span className="mission-title">{mission.title}</span>
                                            {isCompleted ? (
                                                <span className="mission-status-done">✅</span>
                                            ) : (
                                                <span className="mission-progress-text">
                                                    {mission.current_value}/{mission.target_value}
                                                </span>
                                            )}
                                        </div>
                                        <div className="mission-progress-bar-container">
                                            <motion.div
                                                className={`mission-progress-bar ${isCompleted ? 'mission-progress-bar-done' : ''}`}
                                                initial={{ width: 0 }}
                                                animate={{ width: `${progress}%` }}
                                                transition={{ duration: prefersReducedMotion ? 0 : 0.5, ease: 'easeOut' }}
                                            />
                                        </div>
                                    </div>
                                )
                            })}
                        </div>

                        {/* Footer */}
                        <div className="missions-widget-footer">
                            <span className="missions-countdown">⏰ باقي {countdown}</span>
                            {stats.total_points > 0 && (
                                <span className="missions-points">+{stats.total_points} نقطة</span>
                            )}
                        </div>
                    </motion.div>
                )}
            </div>
        </>
    )
}
