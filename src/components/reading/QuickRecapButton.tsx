'use client'

import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion'
import RecapCard from './RecapCard'
import type { ChapterRecap } from '@/data/recapsData'

interface QuickRecapButtonProps {
    recap: ChapterRecap
}

export default function QuickRecapButton({ recap }: QuickRecapButtonProps) {
    const [isOpen, setIsOpen] = useState(false)
    const [mounted, setMounted] = useState(false)
    const prefersReduced = useReducedMotion()
    useEffect(() => {
        // eslint-disable-next-line react-hooks/set-state-in-effect -- portal mount detection requires client-side check
        setMounted(true)
    }, [])

    return (
        <>
            <button
                className="quick-recap-btn"
                onClick={() => setIsOpen(true)}
                title={`ملخص ${recap.chapterLabel}`}
            >
                📋 ملخص {recap.chapterLabel}
            </button>

            {/* In <body>: inside the page container (its own stacking context) the floating buttons covered the modal. */}
            {mounted && createPortal(<AnimatePresence>
                {isOpen && (
                    <>
                        {/* Backdrop */}
                        <motion.div
                            className="quick-recap-backdrop"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setIsOpen(false)}
                        />

                        {/* Modal */}
                        <motion.div
                            className="quick-recap-modal"
                            initial={prefersReduced ? { opacity: 0 } : { opacity: 0, y: 50, scale: 0.95 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={prefersReduced ? { opacity: 0 } : { opacity: 0, y: 50, scale: 0.95 }}
                            transition={{ duration: 0.3 }}
                        >
                            <div className="quick-recap-header">
                                <h3>📋 {recap.chapterLabel}: {recap.chapterTitle}</h3>
                                <button
                                    className="quick-recap-close"
                                    onClick={() => setIsOpen(false)}
                                >
                                    ✕
                                </button>
                            </div>

                            <div className="quick-recap-content">
                                <h4 className="recap-section-title" style={{ marginBottom: '12px' }}>أهم النقاط:</h4>
                                {recap.keyTakeaways.map((takeaway, i) => (
                                    <RecapCard
                                        key={i}
                                        icon={takeaway.icon}
                                        title={takeaway.title}
                                        description={takeaway.description}
                                        index={i}
                                    />
                                ))}

                                {recap.proTip && (
                                    <div className="recap-pro-tip" style={{ marginTop: '16px' }}>
                                        <div className="recap-pro-tip-header">
                                            <span>{recap.proTip.icon}</span> نصيحة عملية
                                        </div>
                                        <p className="recap-pro-tip-text">{recap.proTip.text}</p>
                                    </div>
                                )}
                            </div>

                            <button
                                className="quick-recap-dismiss"
                                onClick={() => setIsOpen(false)}
                            >
                                تمام، فاكر ← كمّل
                            </button>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>, document.body)}
        </>
    )
}
