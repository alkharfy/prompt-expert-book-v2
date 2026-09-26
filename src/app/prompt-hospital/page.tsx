'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { authSystem } from '@/lib/auth_system'
import Navigation from '@/components/Navigation'
import FeatureGate from '@/components/FeatureGate'
import PromptDiagnoser from '@/components/tools/PromptDiagnoser'
import PromptChallenges from '@/components/tools/PromptChallenges'

type TabType = 'diagnose' | 'challenges'

export default function PromptHospitalPage() {
    const router = useRouter()
    const [isLoggedIn, setIsLoggedIn] = useState(false)
    const [isLoading, setIsLoading] = useState(true)
    const [activeTab, setActiveTab] = useState<TabType>('diagnose')

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
                <div className="hospital-page">
                    <div className="hospital-container">
                        {/* Header */}
                        <div className="hospital-header">
                            <motion.h1
                                initial={{ opacity: 0, y: -20 }}
                                animate={{ opacity: 1, y: 0 }}
                            >
                                🏥 مستشفى البرومبتات
                            </motion.h1>
                            <motion.p
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={{ delay: 0.2 }}
                            >
                                شخّص برومبتاتك المريضة وعالجها - أو تحدَّ نفسك بإصلاح البرومبتات المكسورة!
                            </motion.p>
                        </div>

                        {/* Tabs */}
                        <div className="hospital-tabs">
                            <button
                                className={`hospital-tab ${activeTab === 'diagnose' ? 'active' : ''}`}
                                onClick={() => setActiveTab('diagnose')}
                            >
                                🩺 العيادة الذكية
                            </button>
                            <button
                                className={`hospital-tab ${activeTab === 'challenges' ? 'active' : ''}`}
                                onClick={() => setActiveTab('challenges')}
                            >
                                🎯 تحديات العلاج
                            </button>
                        </div>

                        {/* Content */}
                        <AnimatePresence mode="wait">
                            {activeTab === 'diagnose' && (
                                <motion.div
                                    key="diagnose"
                                    initial={{ opacity: 0, x: -30 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: 30 }}
                                >
                                    <PromptDiagnoser />
                                </motion.div>
                            )}
                            {activeTab === 'challenges' && (
                                <motion.div
                                    key="challenges"
                                    initial={{ opacity: 0, x: 30 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: -30 }}
                                >
                                    <PromptChallenges />
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                </div>
            </FeatureGate>
        </>
    )
}
