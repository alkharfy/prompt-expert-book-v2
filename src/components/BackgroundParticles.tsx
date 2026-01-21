'use client'

import { motion, useReducedMotion } from 'framer-motion'
import { useEffect, useState } from 'react'
import { usePathname } from 'next/navigation'

export default function BackgroundParticles() {
    const shouldReduceMotion = useReducedMotion()
    const pathname = usePathname()
    const [particleCount, setParticleCount] = useState(0)

    const isHome = pathname === '/'

    useEffect(() => {
        // High density for internal pages (180), subtle for home (60)
        const density = isHome ? (window.innerWidth < 768 ? 25 : 60) : (window.innerWidth < 768 ? 70 : 180)
        setParticleCount(density)
    }, [isHome, pathname])

    if (particleCount === 0) return null

    return (
        <div className="particles" style={{ zIndex: -3 }}>
            {[...Array(particleCount)].map((_, i) => {
                const size = 2 + Math.random() * 3 // Original size: 2px to 5px
                const opacity = 0.3 + Math.random() * 0.4 // Original visibility

                return (
                    <motion.div
                        key={i}
                        className="particle"
                        style={{
                            left: `${Math.random() * 100}%`,
                            top: `${Math.random() * 100}%`,
                            width: `${size}px`,
                            height: `${size}px`,
                            opacity: opacity,
                            boxShadow: `0 0 ${size * 4}px rgba(255, 107, 53, 0.6)`, // Original rich glow
                            background: 'var(--color-orange-primary)',
                        }}
                        animate={shouldReduceMotion ? {} : {
                            y: [0, -120 - (Math.random() * 80), 0],
                            x: [0, (Math.random() - 0.5) * 60, 0],
                            opacity: [opacity, opacity * 1.6, opacity],
                        }}
                        transition={shouldReduceMotion ? {} : {
                            duration: 12 + Math.random() * 18, // Original animation speed
                            repeat: Infinity,
                            delay: Math.random() * 12,
                            ease: "easeInOut"
                        }}
                    />
                )
            })}
        </div>
    )
}
