'use client'

import { motion } from 'framer-motion'
import { ReactNode } from 'react'

interface AuthCardProps {
    children: ReactNode
    title: string
    subtitle?: string
}

export default function AuthCard({ children, title, subtitle }: AuthCardProps) {
    return (
        <motion.div
            className="auth-card"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: 'easeOut' }}
        >
            <div className="auth-header">
                <h1 className="auth-title">{title}</h1>
                {subtitle && <p className="auth-subtitle">{subtitle}</p>}
            </div>
            {children}
        </motion.div>
    )
}
