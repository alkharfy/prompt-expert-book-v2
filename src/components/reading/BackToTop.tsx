'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

export default function BackToTop() {
    const [visible, setVisible] = useState(false)

    useEffect(() => {
        const handleScroll = () => {
            setVisible(window.scrollY > 500)
        }
        window.addEventListener('scroll', handleScroll, { passive: true })
        return () => window.removeEventListener('scroll', handleScroll)
    }, [])

    const scrollToTop = () => {
        window.scrollTo({ top: 0, behavior: 'smooth' })
    }

    return (
        <AnimatePresence>
            {visible && (
                <motion.button
                    className="back-to-top-btn"
                    onClick={scrollToTop}
                    initial={{ opacity: 0, scale: 0.5 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.5 }}
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    aria-label="العودة للأعلى"
                    title="العودة للأعلى"
                >
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                        <path d="M18 15l-6-6-6 6" />
                    </svg>
                </motion.button>
            )}
        </AnimatePresence>
    )
}
