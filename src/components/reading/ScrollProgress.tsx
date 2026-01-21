'use client'

import { useState, useEffect } from 'react'
import { motion, useScroll, useSpring } from 'framer-motion'

interface ScrollProgressProps {
    color?: string
    height?: number
}

export default function ScrollProgress({ 
    color = 'var(--color-orange-primary)', 
    height = 3 
}: ScrollProgressProps) {
    const [isVisible, setIsVisible] = useState(false)
    const { scrollYProgress } = useScroll()
    
    const scaleX = useSpring(scrollYProgress, {
        stiffness: 100,
        damping: 30,
        restDelta: 0.001
    })

    useEffect(() => {
        const handleScroll = () => {
            // Show progress bar after scrolling a bit
            setIsVisible(window.scrollY > 100)
        }

        window.addEventListener('scroll', handleScroll)
        return () => window.removeEventListener('scroll', handleScroll)
    }, [])

    return (
        <motion.div
            className="scroll-progress-container"
            initial={{ opacity: 0 }}
            animate={{ opacity: isVisible ? 1 : 0 }}
            transition={{ duration: 0.3 }}
            style={{
                position: 'fixed',
                top: 'var(--header-h, 80px)',
                left: 0,
                right: 0,
                height: `${height}px`,
                background: 'rgba(255, 107, 53, 0.1)',
                zIndex: 999,
                pointerEvents: 'none'
            }}
        >
            <motion.div
                className="scroll-progress-bar"
                style={{
                    scaleX,
                    height: '100%',
                    background: `linear-gradient(90deg, ${color}, var(--color-orange-glow))`,
                    transformOrigin: 'right',
                    boxShadow: `0 0 10px ${color}, 0 0 20px rgba(255, 107, 53, 0.3)`
                }}
            />
        </motion.div>
    )
}
