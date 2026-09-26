'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { authSystem } from '@/lib/auth_system'
import Navigation from '@/components/Navigation'
import FeatureGate from '@/components/FeatureGate'
import RunningProjectHub from '@/components/tools/RunningProjectHub'

export default function RunningProjectPage() {
    const router = useRouter()
    const [isLoggedIn, setIsLoggedIn] = useState(false)
    const [isLoading, setIsLoading] = useState(true)

    useEffect(() => {
        const userId = authSystem.getCurrentUserId()
        if (!userId) {
            router.push('/login')
            return
        }
        setIsLoggedIn(true)
        setIsLoading(false)
    }, [router])

    if (isLoading) {
        return (
            <div className="loading-container">
                <div className="loading-spinner"></div>
                <p>جاري التحميل...</p>
            </div>
        )
    }

    if (!isLoggedIn) return null

    return (
        <>
            <Navigation />
            <FeatureGate feature="tools">
                <div className="running-project-page">
                    <div className="running-project-container">
                        {/* Header */}
                        <div className="running-project-header">
                            <motion.h1
                                initial={{ opacity: 0, y: -20 }}
                                animate={{ opacity: 1, y: 0 }}
                            >
                                🚀 المشروع الممتد
                            </motion.h1>
                            <motion.p
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={{ delay: 0.2 }}
                            >
                                اختر مشروعاً واقعياً وابنِه خطوة بخطوة مع كل وحدة تقرأها - من الفكرة إلى الـ AI Agent!
                            </motion.p>
                        </div>

                        {/* Main Hub */}
                        <RunningProjectHub />
                    </div>
                </div>
            </FeatureGate>
        </>
    )
}
