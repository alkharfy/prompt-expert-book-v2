'use client'

import React, { useEffect, useRef } from 'react'
import { motion } from 'framer-motion'
import { useReducedMotion } from '@/hooks/useReducedMotion'
import ShareButton from '@/components/sharing/ShareButton'

// =====================================================
// AllClearCelebration — احتفال إكمال كل المهام اليومية
// =====================================================

interface AllClearCelebrationProps {
    totalPoints: number
    onClose: () => void
}

// Confetti particle component
function ConfettiParticle({ index }: { index: number }) {
    const colors = ['#FF6B35', '#FFD700', '#00D4AA', '#FF4081', '#7C4DFF', '#00BCD4']
    const color = colors[index % colors.length]

    // Use deterministic values based on index to avoid calling impure functions during render
    const seed1 = ((index * 2654435761) >>> 0) / 4294967296
    const seed2 = ((index * 2246822519) >>> 0) / 4294967296
    const seed3 = ((index * 3266489917) >>> 0) / 4294967296
    const seed4 = ((index * 668265263) >>> 0) / 4294967296

    const left = seed1 * 100
    const delay = seed2 * 0.5
    const duration = 2 + seed3 * 2
    const size = 6 + seed4 * 6

    // Additional deterministic seeds for inline values
    const seed5 = ((index * 1597334677) >>> 0) / 4294967296
    const seed6 = ((index * 789456123) >>> 0) / 4294967296
    const seed7 = ((index * 456789321) >>> 0) / 4294967296

    return (
        <motion.div
            className="confetti-particle"
            style={{
                position: 'absolute',
                top: '-10px',
                left: `${left}%`,
                width: `${size}px`,
                height: `${size}px`,
                backgroundColor: color,
                borderRadius: seed5 > 0.5 ? '50%' : '2px',
            }}
            initial={{ y: 0, opacity: 1, rotate: 0 }}
            animate={{
                y: '100vh',
                opacity: [1, 1, 0],
                rotate: seed6 * 720 - 360,
                x: (seed7 - 0.5) * 200,
            }}
            transition={{
                duration: duration,
                delay: delay,
                ease: 'easeIn',
            }}
        />
    )
}

export default function AllClearCelebration({ totalPoints, onClose }: AllClearCelebrationProps) {
    const prefersReducedMotion = useReducedMotion()
    const closedRef = useRef(false)

    // إغلاق تلقائي بعد 6 ثوانٍ
    useEffect(() => {
        const timer = setTimeout(() => {
            if (!closedRef.current) {
                closedRef.current = true
                onClose()
            }
        }, 6000)
        return () => clearTimeout(timer)
    }, [onClose])

    return (
        <motion.div
            className="all-clear-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            onClick={() => {
                if (!closedRef.current) {
                    closedRef.current = true
                    onClose()
                }
            }}
        >
            {/* Confetti */}
            {!prefersReducedMotion && (
                <div className="confetti-container">
                    {Array.from({ length: 40 }).map((_, i) => (
                        <ConfettiParticle key={i} index={i} />
                    ))}
                </div>
            )}

            {/* Card */}
            <motion.div
                className="all-clear-card"
                initial={prefersReducedMotion ? { opacity: 0 } : { opacity: 0, scale: 0.7, y: 40 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.2, type: 'spring', bounce: 0.4 }}
                onClick={(e) => e.stopPropagation()}
            >
                <div className="all-clear-emojis">🎉🎊 ممتاز! 🎊🎉</div>

                <div className="all-clear-title">أكملت كل مهام اليوم!</div>

                <div className="all-clear-bonus">
                    🏆 مكافأة إضافية: +50 نقطة
                </div>

                <div className="all-clear-stats">
                    <span>⭐ مجموع نقاط اليوم: {totalPoints}</span>
                </div>

                <div style={{ display: 'flex', gap: '10px', justifyContent: 'center', flexWrap: 'wrap' }}>
                    <ShareButton
                        type="achievement"
                        data={{
                            type: 'achievement',
                            title: 'أكملت كل مهام اليوم!',
                            subtitle: `+${totalPoints} نقطة اليوم`,
                            icon: '🎯',
                        }}
                        variant="full"
                        label="شارك"
                    />
                    <motion.button
                        className="all-clear-btn"
                        whileTap={prefersReducedMotion ? {} : { scale: 0.95 }}
                        onClick={() => {
                            if (!closedRef.current) {
                                closedRef.current = true
                                onClose()
                            }
                        }}
                    >
                        رجع للقراءة
                    </motion.button>
                </div>
            </motion.div>
        </motion.div>
    )
}
