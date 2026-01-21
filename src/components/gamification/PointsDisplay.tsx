'use client'

import { motion } from 'framer-motion'

interface PointsDisplayProps {
    points: number
    showAnimation?: boolean
    size?: 'small' | 'medium' | 'large'
}

export default function PointsDisplay({ 
    points, 
    showAnimation = true,
    size = 'medium' 
}: PointsDisplayProps) {
    const sizeClasses = {
        small: 'points-display-small',
        medium: 'points-display-medium',
        large: 'points-display-large'
    }

    return (
        <motion.div 
            className={`points-display ${sizeClasses[size]}`}
            initial={showAnimation ? { scale: 0.8, opacity: 0 } : false}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: 'spring', stiffness: 200 }}
        >
            <span className="points-icon">⭐</span>
            <span className="points-value">{points.toLocaleString('ar-EG')}</span>
            <span className="points-label">نقطة</span>
        </motion.div>
    )
}
