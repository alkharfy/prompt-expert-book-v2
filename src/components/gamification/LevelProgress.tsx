'use client'

import { motion } from 'framer-motion'

interface LevelProgressProps {
    level: number
    currentPoints: number
    pointsToNextLevel: number
    showDetails?: boolean
}

// تعريف المستويات والألقاب
const levelTitles: Record<number, { title: string; icon: string }> = {
    1: { title: 'مبتدئ', icon: '🌱' },
    2: { title: 'متعلم', icon: '📖' },
    3: { title: 'ناشط', icon: '⚡' },
    4: { title: 'متقدم', icon: '🔥' },
    5: { title: 'خبير', icon: '💪' },
    6: { title: 'محترف', icon: '🌟' },
    7: { title: 'متميز', icon: '💎' },
    8: { title: 'أسطوري', icon: '👑' },
    9: { title: 'إمبراطور', icon: '🏆' },
    10: { title: 'أسطورة', icon: '🌌' }
}

export default function LevelProgress({ 
    level, 
    currentPoints,
    pointsToNextLevel,
    showDetails = true 
}: LevelProgressProps) {
    const levelInfo = levelTitles[Math.min(level, 10)] || levelTitles[10]
    const pointsInCurrentLevel = 100 - pointsToNextLevel
    const progressPercentage = (pointsInCurrentLevel / 100) * 100

    return (
        <motion.div 
            className="level-progress-container"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
        >
            {/* Level Badge */}
            <div className="level-badge">
                <span className="level-icon">{levelInfo.icon}</span>
                <div className="level-info">
                    <span className="level-number">المستوى {level}</span>
                    <span className="level-title">{levelInfo.title}</span>
                </div>
            </div>

            {/* Progress Bar */}
            <div className="level-progress-bar">
                <motion.div 
                    className="level-progress-fill"
                    initial={{ width: 0 }}
                    animate={{ width: `${progressPercentage}%` }}
                    transition={{ duration: 1, ease: 'easeOut' }}
                />
            </div>

            {/* Details */}
            {showDetails && (
                <div className="level-details">
                    <span className="level-points-current">
                        {pointsInCurrentLevel} / 100
                    </span>
                    <span className="level-points-next">
                        {pointsToNextLevel} نقطة للمستوى التالي
                    </span>
                </div>
            )}
        </motion.div>
    )
}
