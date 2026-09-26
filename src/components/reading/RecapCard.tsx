'use client'

import { motion, useReducedMotion } from 'framer-motion'

interface RecapCardProps {
    icon: string
    title: string
    description: string
    index: number
}

export default function RecapCard({ icon, title, description, index }: RecapCardProps) {
    const prefersReduced = useReducedMotion()

    return (
        <motion.div
            className="recap-card"
            initial={prefersReduced ? { opacity: 1 } : { opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 + index * 0.15, duration: 0.4 }}
        >
            <div className="recap-card-icon">{icon}</div>
            <div className="recap-card-content">
                <h4 className="recap-card-title">{title}</h4>
                <p className="recap-card-desc">{description}</p>
            </div>
        </motion.div>
    )
}
