'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { useState } from 'react'

interface PointsAnimationProps {
    points: number
    show: boolean
    onComplete?: () => void
}

export function PointsAnimation({ points, show, onComplete }: PointsAnimationProps) {
    return (
        <AnimatePresence>
            {show && (
                <motion.div
                    className="points-animation"
                    initial={{ opacity: 0, y: 20, scale: 0.5 }}
                    animate={{ 
                        opacity: [0, 1, 1, 0],
                        y: [20, 0, -20, -40],
                        scale: [0.5, 1.2, 1, 0.8]
                    }}
                    transition={{ duration: 1.5, ease: 'easeOut' }}
                    onAnimationComplete={onComplete}
                >
                    <span className="points-plus">+{points}</span>
                    <span className="points-star">⭐</span>
                </motion.div>
            )}
        </AnimatePresence>
    )
}

// مكون إشعار الشارة الجديدة
interface BadgeUnlockProps {
    show: boolean
    badge: {
        icon: string
        name: string
        rarity: string
    } | null
    onClose: () => void
}

export function BadgeUnlockNotification({ show, badge, onClose }: BadgeUnlockProps) {
    if (!badge) return null

    const rarityColors: Record<string, string> = {
        common: '#9ca3af',
        uncommon: '#22c55e',
        rare: '#3b82f6',
        epic: '#a855f7',
        legendary: '#ffb800'
    }

    return (
        <AnimatePresence>
            {show && (
                <motion.div
                    className="badge-unlock-overlay"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    onClick={onClose}
                >
                    <motion.div
                        className="badge-unlock-modal"
                        initial={{ scale: 0, rotate: -180 }}
                        animate={{ scale: 1, rotate: 0 }}
                        exit={{ scale: 0, rotate: 180 }}
                        transition={{ type: 'spring', stiffness: 200, damping: 15 }}
                        onClick={e => e.stopPropagation()}
                    >
                        {/* Confetti Effect */}
                        <div className="confetti-container">
                            {[...Array(20)].map((_, i) => (
                                <motion.div
                                    key={i}
                                    className="confetti"
                                    initial={{ 
                                        x: 0, 
                                        y: 0, 
                                        rotate: 0,
                                        opacity: 1 
                                    }}
                                    animate={{ 
                                        x: (Math.random() - 0.5) * 300,
                                        y: Math.random() * 200 + 100,
                                        rotate: Math.random() * 720,
                                        opacity: 0
                                    }}
                                    transition={{ 
                                        duration: 1.5,
                                        delay: i * 0.05
                                    }}
                                    style={{
                                        backgroundColor: ['#ff6b35', '#ffb800', '#22c55e', '#3b82f6', '#a855f7'][i % 5]
                                    }}
                                />
                            ))}
                        </div>

                        <span className="unlock-label">🎉 شارة جديدة!</span>
                        
                        <motion.div 
                            className="unlock-badge-icon"
                            animate={{ 
                                scale: [1, 1.2, 1],
                                rotate: [0, 10, -10, 0]
                            }}
                            transition={{ 
                                duration: 0.5,
                                repeat: 2
                            }}
                            style={{
                                boxShadow: `0 0 30px ${rarityColors[badge.rarity]}`,
                                borderColor: rarityColors[badge.rarity]
                            }}
                        >
                            <span>{badge.icon}</span>
                        </motion.div>

                        <h3 className="unlock-badge-name">{badge.name}</h3>
                        
                        <button className="unlock-close-btn" onClick={onClose}>
                            رائع! 🎊
                        </button>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    )
}

// مكون Level Up
interface LevelUpProps {
    show: boolean
    newLevel: number
    levelTitle: string
    onClose: () => void
}

export function LevelUpNotification({ show, newLevel, levelTitle, onClose }: LevelUpProps) {
    return (
        <AnimatePresence>
            {show && (
                <motion.div
                    className="level-up-overlay"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    onClick={onClose}
                >
                    <motion.div
                        className="level-up-modal"
                        initial={{ scale: 0, y: 100 }}
                        animate={{ scale: 1, y: 0 }}
                        exit={{ scale: 0, y: -100 }}
                        transition={{ type: 'spring', stiffness: 200 }}
                    >
                        <motion.div 
                            className="level-up-glow"
                            animate={{ 
                                scale: [1, 1.5, 1],
                                opacity: [0.5, 1, 0.5]
                            }}
                            transition={{ 
                                duration: 1,
                                repeat: Infinity
                            }}
                        />

                        <span className="level-up-label">⬆️ مستوى جديد!</span>
                        
                        <motion.span 
                            className="level-up-number"
                            animate={{ 
                                scale: [1, 1.3, 1],
                                textShadow: [
                                    '0 0 20px #ff6b35',
                                    '0 0 40px #ffb800',
                                    '0 0 20px #ff6b35'
                                ]
                            }}
                            transition={{ duration: 1, repeat: 2 }}
                        >
                            {newLevel}
                        </motion.span>

                        <h3 className="level-up-title">{levelTitle}</h3>
                        
                        <button className="level-up-close-btn" onClick={onClose}>
                            استمر! 🚀
                        </button>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    )
}
