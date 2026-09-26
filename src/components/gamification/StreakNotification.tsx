'use client'

import React, { useEffect, useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import ShareButton from '@/components/sharing/ShareButton'

interface StreakData {
    current_streak: number
    longest_streak: number
    is_active_today: boolean
    streak_at_risk: boolean
}

type NotificationType = 'milestone' | 'risk' | 'first_today'

interface Notification {
    id: string
    type: NotificationType
    title: string
    message: string
    icon: string
}

const STREAK_MILESTONES = [3, 7, 14, 30, 50, 100]
const MILESTONE_MESSAGES: Record<number, { title: string; icon: string }> = {
    3: { title: '🔥 بداية الاشتعال!', icon: '🔥' },
    7: { title: '🔥 أسبوع كامل!', icon: '🔥' },
    14: { title: '🔥 أسبوعان من الالتزام!', icon: '🌟' },
    30: { title: '🌟 شهر كامل! أنت أسطورة!', icon: '🏆' },
    50: { title: '💎 50 يوم! إنجاز استثنائي!', icon: '💎' },
    100: { title: '👑 100 يوم! أنت خارق!', icon: '👑' },
}

export default function StreakNotification() {
    const [notifications, setNotifications] = useState<Notification[]>([])
    const [dismissed, setDismissed] = useState<Set<string>>(new Set())

    const checkStreak = useCallback(async () => {
        try {
            // لا ترسل طلب إذا المستخدم غير مسجل دخول
            const hasUser = document.cookie.split(';').some(c => c.trim().startsWith('ebook_user_id='))
            if (!hasUser) return

            const res = await fetch('/api/streak')
            if (!res.ok) return
            const json = await res.json()
            const data = json.data as StreakData
            if (!data) return

            const newNotifications: Notification[] = []
            const sessionKey = `streak_notif_${new Date().toISOString().split('T')[0]}`
            const shown = sessionStorage.getItem(sessionKey)
            if (shown) return // Already shown notifications today

            // Check for milestone
            if (data.is_active_today && STREAK_MILESTONES.includes(data.current_streak)) {
                const milestone = MILESTONE_MESSAGES[data.current_streak]
                if (milestone) {
                    newNotifications.push({
                        id: `milestone_${data.current_streak}`,
                        type: 'milestone',
                        title: milestone.title,
                        message: `وصلت إلى ${data.current_streak} يوم متتالي! استمر في التعلم`,
                        icon: milestone.icon,
                    })
                }
            }

            // Check for first activity today
            if (data.is_active_today && data.current_streak > 1 && !STREAK_MILESTONES.includes(data.current_streak)) {
                newNotifications.push({
                    id: 'first_today',
                    type: 'first_today',
                    title: `🔥 ${data.current_streak} يوم متتالي!`,
                    message: 'أحسنت! حافظت على سلسلتك اليوم',
                    icon: '🔥',
                })
            }

            // Check for streak at risk
            if (data.streak_at_risk && data.current_streak > 0) {
                newNotifications.push({
                    id: 'risk',
                    type: 'risk',
                    title: '⚠️ سلسلتك في خطر!',
                    message: `لديك ${data.current_streak} يوم متتالي. ابدأ القراءة الآن!`,
                    icon: '⚠️',
                })
            }

            if (newNotifications.length > 0) {
                setNotifications(newNotifications)
                sessionStorage.setItem(sessionKey, 'true')
            }
        } catch {
            // Silently fail
        }
    }, [])

    useEffect(() => {
        // Slight delay to avoid blocking initial render
        const timer = setTimeout(checkStreak, 2000)
        return () => clearTimeout(timer)
    }, [checkStreak])

    const dismiss = (id: string) => {
        setDismissed(prev => new Set(prev).add(id))
    }

    const visibleNotifications = notifications.filter(n => !dismissed.has(n.id))

    // Auto-dismiss after 6 seconds
    useEffect(() => {
        if (visibleNotifications.length === 0) return
        const timer = setTimeout(() => {
            setDismissed(prev => {
                const next = new Set(prev)
                visibleNotifications.forEach(n => next.add(n.id))
                return next
            })
        }, 6000)
        return () => clearTimeout(timer)
    }, [visibleNotifications])

    return (
        <AnimatePresence>
            {visibleNotifications.map((notification, index) => (
                <motion.div
                    key={notification.id}
                    initial={{ opacity: 0, y: 50, scale: 0.9 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 50, scale: 0.9 }}
                    transition={{ delay: index * 0.2 }}
                    className="streak-notification"
                    style={{ bottom: `${100 + index * 80}px` }}
                    onClick={() => dismiss(notification.id)}
                >
                    <div className="notification-content">
                        <span className="notification-fire">{notification.icon}</span>
                        <div className="notification-text">
                            <span className="notification-title">{notification.title}</span>
                            <span className="notification-streak">{notification.message}</span>
                        </div>
                        {notification.type === 'milestone' && (
                            <div onClick={(e) => e.stopPropagation()} style={{ marginRight: '8px' }}>
                                <ShareButton
                                    type="streak"
                                    data={{
                                        type: 'streak',
                                        title: notification.title,
                                        subtitle: notification.message,
                                        icon: notification.icon,
                                    }}
                                    variant="icon"
                                />
                            </div>
                        )}
                    </div>
                </motion.div>
            ))}
        </AnimatePresence>
    )
}
