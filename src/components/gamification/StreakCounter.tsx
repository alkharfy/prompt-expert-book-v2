'use client'

import { motion, AnimatePresence } from 'framer-motion'

interface StreakCounterProps {
    currentStreak: number
    longestStreak: number
    lastActivityDate?: string
    showDetails?: boolean
    size?: 'small' | 'medium' | 'large'
}

export default function StreakCounter({ 
    currentStreak, 
    longestStreak,
    lastActivityDate,
    showDetails = true,
    size = 'medium'
}: StreakCounterProps) {
    const isActiveToday = lastActivityDate === new Date().toISOString().split('T')[0]
    
    // تحديد مستوى الـ streak
    const getStreakLevel = () => {
        if (currentStreak >= 100) return { flames: 5, color: '#9333ea', label: 'أسطوري!' }
        if (currentStreak >= 30) return { flames: 4, color: '#f59e0b', label: 'مذهل!' }
        if (currentStreak >= 14) return { flames: 3, color: '#ef4444', label: 'ممتاز!' }
        if (currentStreak >= 7) return { flames: 2, color: '#f97316', label: 'رائع!' }
        if (currentStreak >= 3) return { flames: 1, color: '#fb923c', label: 'جيد!' }
        return { flames: 0, color: '#9ca3af', label: '' }
    }

    const streakLevel = getStreakLevel()

    const sizeClasses = {
        small: 'streak-counter-small',
        medium: 'streak-counter-medium',
        large: 'streak-counter-large'
    }

    return (
        <motion.div 
            className={`streak-counter ${sizeClasses[size]} ${isActiveToday ? 'active-today' : ''}`}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
        >
            {/* Flame Icon */}
            <div className="streak-flames">
                {currentStreak > 0 ? (
                    <motion.span 
                        className="streak-fire"
                        animate={{ 
                            scale: [1, 1.1, 1],
                            rotate: [-2, 2, -2]
                        }}
                        transition={{ 
                            duration: 0.5, 
                            repeat: Infinity,
                            repeatType: 'reverse'
                        }}
                        style={{ color: streakLevel.color }}
                    >
                        🔥
                    </motion.span>
                ) : (
                    <span className="streak-fire inactive">🔥</span>
                )}
            </div>

            {/* Counter */}
            <div className="streak-info">
                <motion.span 
                    className="streak-number"
                    key={currentStreak}
                    initial={{ scale: 1.5, color: streakLevel.color }}
                    animate={{ scale: 1 }}
                    style={{ color: streakLevel.color }}
                >
                    {currentStreak}
                </motion.span>
                <span className="streak-label">يوم متتالي</span>
            </div>

            {/* Level Badge */}
            {streakLevel.label && (
                <motion.span 
                    className="streak-level-badge"
                    style={{ 
                        backgroundColor: `${streakLevel.color}20`,
                        color: streakLevel.color,
                        borderColor: streakLevel.color
                    }}
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 0.2 }}
                >
                    {streakLevel.label}
                </motion.span>
            )}

            {/* Details */}
            {showDetails && (
                <div className="streak-details">
                    <div className="streak-detail-item">
                        <span className="detail-icon">🏆</span>
                        <span className="detail-label">أطول سلسلة</span>
                        <span className="detail-value">{longestStreak} يوم</span>
                    </div>
                    
                    {!isActiveToday && currentStreak > 0 && (
                        <motion.div 
                            className="streak-warning"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                        >
                            ⚠️ تعلّم اليوم للحفاظ على سلسلتك!
                        </motion.div>
                    )}
                </div>
            )}
        </motion.div>
    )
}

// مكون إشعار الـ Streak
interface StreakNotificationProps {
    show: boolean
    streak: number
    isNewRecord?: boolean
    onClose: () => void
}

export function StreakNotification({ 
    show, 
    streak, 
    isNewRecord = false,
    onClose 
}: StreakNotificationProps) {
    return (
        <AnimatePresence>
            {show && (
                <motion.div
                    className="streak-notification"
                    initial={{ opacity: 0, y: 50, scale: 0.9 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -20 }}
                    onClick={onClose}
                >
                    <div className="notification-content">
                        <motion.span 
                            className="notification-fire"
                            animate={{ 
                                scale: [1, 1.2, 1],
                                rotate: [-5, 5, -5]
                            }}
                            transition={{ 
                                duration: 0.3, 
                                repeat: 3
                            }}
                        >
                            🔥
                        </motion.span>
                        <div className="notification-text">
                            <span className="notification-title">
                                {isNewRecord ? '🎉 رقم قياسي جديد!' : 'استمر!'}
                            </span>
                            <span className="notification-streak">
                                {streak} يوم متتالي
                            </span>
                        </div>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    )
}
