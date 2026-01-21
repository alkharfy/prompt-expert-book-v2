'use client'

import { motion } from 'framer-motion'

interface ProgressCircleProps {
    percentage: number
    size?: number
    strokeWidth?: number
}

export default function ProgressCircle({
    percentage,
    size = 32,
    strokeWidth = 3
}: ProgressCircleProps) {
    const radius = (size - strokeWidth) / 2
    const circumference = radius * 2 * Math.PI
    const offset = circumference - (percentage / 100) * circumference

    return (
        <div
            className="progress-circle-container"
            style={{ width: size, height: size }}
            title={`${Math.round(percentage)}% مكتمل`}
        >
            <svg width={size} height={size}>
                {/* Background circle */}
                <circle
                    cx={size / 2}
                    cy={size / 2}
                    r={radius}
                    fill="none"
                    stroke="rgba(255, 255, 255, 0.2)"
                    strokeWidth={strokeWidth}
                />
                {/* Progress circle */}
                <motion.circle
                    cx={size / 2}
                    cy={size / 2}
                    r={radius}
                    fill="none"
                    stroke="url(#progressGradient)"
                    strokeWidth={strokeWidth}
                    strokeLinecap="round"
                    strokeDasharray={circumference}
                    strokeDashoffset={offset}
                    initial={{ strokeDashoffset: circumference }}
                    animate={{ strokeDashoffset: offset }}
                    transition={{ duration: 1, ease: "easeOut" }}
                    style={{
                        transform: 'rotate(-90deg)',
                        transformOrigin: 'center'
                    }}
                />
                <defs>
                    <linearGradient id="progressGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                        <stop offset="0%" stopColor="#FF6B35" />
                        <stop offset="100%" stopColor="#FFB800" />
                    </linearGradient>
                </defs>
            </svg>
            <span className="progress-circle-text">
                {Math.round(percentage)}%
            </span>
        </div>
    )
}
