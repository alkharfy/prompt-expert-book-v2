'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import Navigation from '@/components/Navigation'
import ShareButton from '@/components/sharing/ShareButton'

interface LeaderboardUser {
    displayName: string
    total_points: number
    current_level: number
    current_streak: number
    exercises_completed: number
    badges_count: number
    rank: number
    isCurrentUser: boolean
}

type TabType = 'points' | 'streak' | 'exercises'

export default function LeaderboardPage() {
    const router = useRouter()
    const [isLoading, setIsLoading] = useState(true)
    const [leaderboard, setLeaderboard] = useState<LeaderboardUser[]>([])
    const [activeTab, setActiveTab] = useState<TabType>('points')
    const [loadError, setLoadError] = useState<string | null>(null)
    const [errorStatus, setErrorStatus] = useState<number | null>(null)
    const [retryCount, setRetryCount] = useState(0)
    const userRank = leaderboard.find(user => user.isCurrentUser) || null

    const fetchLeaderboard = useCallback(async (signal: AbortSignal) => {
        setIsLoading(true)
        setLoadError(null)
        setErrorStatus(null)
        try {
            const result = await fetch(`/api/leaderboard?tab=${activeTab}`, { signal, cache: 'no-store' })
            if (!result.ok) {
                if (!signal.aborted) {
                    setLeaderboard([])
                    setErrorStatus(result.status)
                    setLoadError(result.status === 401 ? 'يرجى تسجيل الدخول لعرض لوحة المتصدرين'
                        : result.status === 403 ? 'لوحة المتصدرين متاحة مع اشتراك نشط في Pro أو VIP'
                        : 'تعذّر تحميل لوحة المتصدرين؛ حاول لاحقًا')
                }
                return
            }
            const data = await result.json()
            if (!Array.isArray(data.entries)) throw new Error('Invalid leaderboard response')
            if (!signal.aborted) setLeaderboard(data.entries)
        } catch {
            if (!signal.aborted) {
                setLeaderboard([])
                setLoadError('تعذّر تحميل لوحة المتصدرين؛ حاول لاحقًا')
            }
        } finally {
            if (!signal.aborted) setIsLoading(false)
        }
    }, [activeTab])

    useEffect(() => {
        const controller = new AbortController()
        void fetchLeaderboard(controller.signal)
        return () => controller.abort()
    }, [fetchLeaderboard, retryCount])

    const getRankIcon = (rank: number) => {
        switch (rank) {
            case 1: return '🥇'
            case 2: return '🥈'
            case 3: return '🥉'
            default: return `#${rank}`
        }
    }

    const getRankClass = (rank: number) => {
        if (rank === 1) return 'rank-gold'
        if (rank === 2) return 'rank-silver'
        if (rank === 3) return 'rank-bronze'
        return ''
    }

    const getDisplayValue = (user: LeaderboardUser) => {
        switch (activeTab) {
            case 'points': return `${user.total_points.toLocaleString('ar-EG')} نقطة`
            case 'streak': return `${user.current_streak} يوم 🔥`
            case 'exercises': return `${user.exercises_completed} تمرين`
        }
    }

    if (isLoading) {
        return (
            <>
                <Navigation />
                <main className="leaderboard-page">
                    <div className="loading-container">
                        <div className="loading-spinner"></div>
                        <p>جاري التحميل...</p>
                    </div>
                </main>
            </>
        )
    }

    if (loadError) {
        return (
            <>
                <Navigation />
                <main className="leaderboard-page">
                    <div className="container">
                        <h1>🏆 لوحة المتصدرين</h1>
                        <div className="empty-leaderboard" role="alert">
                            <p>{loadError}</p>
                            <button className="login-btn" onClick={() => setRetryCount(value => value + 1)}>إعادة المحاولة</button>
                            {errorStatus === 401 && <button className="login-btn" onClick={() => router.push('/login')}>تسجيل الدخول</button>}
                            {errorStatus === 403 && <button className="login-btn" onClick={() => router.push('/#pricing')}>عرض الباقات</button>}
                        </div>
                    </div>
                </main>
            </>
        )
    }

    return (
        <>
            <Navigation />
            <main className="leaderboard-page">
                <div className="container">
                    {/* Header */}
                    <motion.div 
                        className="leaderboard-header"
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                    >
                        <h1>🏆 لوحة المتصدرين</h1>
                        <p>ترتيب النشاط داخل المنصة، ولا يقيس الإتقان</p>
                    </motion.div>

                    {/* Tabs */}
                    <div className="leaderboard-tabs">
                        <button 
                            className={`tab-btn ${activeTab === 'points' ? 'active' : ''}`}
                            onClick={() => setActiveTab('points')}
                        >
                            ⭐ النقاط
                        </button>
                        <button 
                            className={`tab-btn ${activeTab === 'streak' ? 'active' : ''}`}
                            onClick={() => setActiveTab('streak')}
                        >
                            🔥 التتابع
                        </button>
                        <button 
                            className={`tab-btn ${activeTab === 'exercises' ? 'active' : ''}`}
                            onClick={() => setActiveTab('exercises')}
                        >
                            ✏️ التمارين
                        </button>
                    </div>

                    {/* User's Rank Card */}
                    {userRank && (
                        <motion.div 
                            className="user-rank-card"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                        >
                            <div className="user-rank-info">
                                <span className="user-rank-position">
                                    ترتيبك: {getRankIcon(userRank.rank)}
                                </span>
                                <span className="user-rank-value">
                                    {getDisplayValue(userRank)}
                                </span>
                            </div>
                            <div className="user-rank-level">
                                مستوى النشاط {userRank.current_level}
                            </div>
                            <ShareButton
                                type="streak"
                                data={{
                                    type: 'streak',
                                    title: `الترتيب #${userRank.rank} في لوحة المتصدرين`,
                                    subtitle: getDisplayValue(userRank),
                                    icon: getRankIcon(userRank.rank),
                                    stats: [
                                        { label: 'نقطة', value: userRank.total_points },
                                        { label: 'يوم streak', value: userRank.current_streak },
                                    ],
                                }}
                                variant="icon"
                            />
                        </motion.div>
                    )}

                    {/* Top 3 Podium */}
                    {leaderboard.length >= 3 && (
                        <div className="podium">
                            {/* Second Place */}
                            <motion.div 
                                className="podium-item second"
                                initial={{ opacity: 0, y: 50 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.2 }}
                            >
                                <div className="podium-avatar">🥈</div>
                                <span className="podium-name">{leaderboard[1].displayName}</span>
                                <span className="podium-value">{getDisplayValue(leaderboard[1])}</span>
                                <div className="podium-stand">2</div>
                            </motion.div>

                            {/* First Place */}
                            <motion.div 
                                className="podium-item first"
                                initial={{ opacity: 0, y: 50 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.1 }}
                            >
                                <div className="podium-crown">👑</div>
                                <div className="podium-avatar">🥇</div>
                                <span className="podium-name">{leaderboard[0].displayName}</span>
                                <span className="podium-value">{getDisplayValue(leaderboard[0])}</span>
                                <div className="podium-stand">1</div>
                            </motion.div>

                            {/* Third Place */}
                            <motion.div 
                                className="podium-item third"
                                initial={{ opacity: 0, y: 50 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.3 }}
                            >
                                <div className="podium-avatar">🥉</div>
                                <span className="podium-name">{leaderboard[2].displayName}</span>
                                <span className="podium-value">{getDisplayValue(leaderboard[2])}</span>
                                <div className="podium-stand">3</div>
                            </motion.div>
                        </div>
                    )}

                    {/* Full Leaderboard */}
                    <div className="leaderboard-list">
                        {(leaderboard.length >= 3 ? leaderboard.slice(3) : leaderboard).map((user, index) => (
                            <motion.div
                                key={user.rank}
                                className={`leaderboard-item ${user.isCurrentUser ? 'current-user' : ''}`}
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: index * 0.03 }}
                            >
                                <span className="item-rank">{user.rank}</span>
                                <div className="item-info">
                                    <span className="item-name">{user.displayName}</span>
                                    <span className="item-level">مستوى النشاط {user.current_level}</span>
                                </div>
                                <div className="item-stats">
                                    <span className="item-value">{getDisplayValue(user)}</span>
                                    {user.badges_count > 0 && (
                                        <span className="item-badges">🏅 {user.badges_count}</span>
                                    )}
                                </div>
                            </motion.div>
                        ))}
                    </div>

                    {/* Empty State */}
                    {leaderboard.length === 0 && (
                        <div className="empty-leaderboard">
                            <span className="empty-icon">🏆</span>
                            <h3>لا يوجد متصدرين بعد</h3>
                            <p>كن أول من يتصدر القائمة!</p>
                        </div>
                    )}
                </div>
            </main>
        </>
    )
}
