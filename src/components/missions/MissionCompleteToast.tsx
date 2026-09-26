'use client'

import React, { useEffect } from 'react'
import { motion } from 'framer-motion'
import { useReducedMotion } from '@/hooks/useReducedMotion'

// =====================================================
// MissionCompleteToast — إشعار إكمال مهمة
// =====================================================

interface MissionCompleteToastProps {
    title: string
    points: number
    remainingCount: number
    onClose: () => void
}

export default function MissionCompleteToast({
    title,
    points,
    remainingCount,
    onClose,
}: MissionCompleteToastProps) {
    const prefersReducedMotion = useReducedMotion()

    // إخفاء تلقائي بعد 4 ثوانٍ
    useEffect(() => {
        const timer = setTimeout(onClose, 4000)
        return () => clearTimeout(timer)
    }, [onClose])

    return (
        <motion.div
            className="mission-toast"
            initial={prefersReducedMotion ? { opacity: 0 } : { opacity: 0, y: -40, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={prefersReducedMotion ? { opacity: 0 } : { opacity: 0, y: -20, scale: 0.95 }}
            transition={{ duration: 0.3, ease: 'easeOut' }}
            onClick={onClose}
        >
            <div className="mission-toast-content">
                <div className="mission-toast-icon">✅</div>
                <div className="mission-toast-text">
                    <div className="mission-toast-title">
                        مهمة مكتملة! +{points} نقطة
                    </div>
                    <div className="mission-toast-subtitle">
                        &ldquo;{title}&rdquo;
                    </div>
                </div>
            </div>
            {remainingCount > 0 && (
                <div className="mission-toast-hint">
                    🏆 أكمل كل المهام للمكافأة!
                </div>
            )}
        </motion.div>
    )
}
