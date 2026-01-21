'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import Navigation from '@/components/Navigation'
import { supabase } from '@/lib/supabase'
import { authSystem } from '@/lib/auth_system'
import { dbLogger } from '@/lib/logger'

interface LeaderboardUser {
    user_id: string
    full_name: string
    total_points: number
    current_level: number
    current_streak: number
    chapters_completed: number
    exercises_completed: number
    badges_count: number
    rank: number
}

type TabType = 'points' | 'streak' | 'exercises'

export default function LeaderboardPage() {
    const router = useRouter()
    const [isLoading, setIsLoading] = useState(true)
    const [isLoggedIn, setIsLoggedIn] = useState(false)
    const [currentUserId, setCurrentUserId] = useState<string | null>(null)
    const [leaderboard, setLeaderboard] = useState<LeaderboardUser[]>([])
    const [activeTab, setActiveTab] = useState<TabType>('points')
    const [userRank, setUserRank] = useState<LeaderboardUser | null>(null)

    const fetchLeaderboard = useCallback(async () => {
        try {
            // ترتيب حسب التبويب النشط
            let orderBy = 'total_points'
            if (activeTab === 'streak') orderBy = 'current_streak'
            if (activeTab === 'exercises') orderBy = 'exercises_completed'

            const { data, error } = await supabase
                .from('user_gamification')
                .select(`
                    user_id,
                    total_points,
                    current_level,
                    current_streak,
                    chapters_completed,
                    exercises_completed
                `)
                .order(orderBy, { ascending: false })
                .limit(50) as { 
                    data: Array<{
                        user_id: string;
                        total_points: number;
                        current_level: number;
                        current_streak: number;
                        chapters_completed: number;
                        exercises_completed: number;
                    }> | null; 
                    error: any 
                }

            if (error) throw error

            // جلب أسماء المستخدمين
            if (data && data.length > 0) {
                const userIds = data.map(d => d.user_id)
                const { data: users } = await supabase
                    .from('users')
                    .select('id, full_name')
                    .in('id', userIds) as { data: Array<{ id: string; full_name: string }> | null }

                const usersMap = new Map(users?.map(u => [u.id, u.full_name]) || [])

                // جلب عدد الشارات لكل مستخدم
                const { data: badgeCounts } = await supabase
                    .from('user_badges')
                    .select('user_id')
                    .in('user_id', userIds) as { data: Array<{ user_id: string }> | null }

                const badgeCountMap = new Map<string, number>()
                badgeCounts?.forEach(b => {
                    badgeCountMap.set(b.user_id, (badgeCountMap.get(b.user_id) || 0) + 1)
                })

                const leaderboardData: LeaderboardUser[] = data.map((item, index) => ({
                    user_id: item.user_id,
                    full_name: usersMap.get(item.user_id) || 'مستخدم',
                    total_points: item.total_points || 0,
                    current_level: item.current_level || 1,
                    current_streak: item.current_streak || 0,
                    chapters_completed: item.chapters_completed || 0,
                    exercises_completed: item.exercises_completed || 0,
                    badges_count: badgeCountMap.get(item.user_id) || 0,
                    rank: index + 1
                }))

                setLeaderboard(leaderboardData)

                // إيجاد ترتيب المستخدم الحالي - استخدام userId مباشرة بدلاً من state
                const userId = authSystem.getCurrentUserId()
                if (userId) {
                    const userEntry = leaderboardData.find(u => u.user_id === userId)
                    setUserRank(userEntry || null)
                }
            }
        } catch (error) {
            dbLogger.error('Error fetching leaderboard:', error)
        }
    }, [activeTab])

    useEffect(() => {
        const checkAuthAndLoadData = async () => {
            try {
                const userId = authSystem.getCurrentUserId()
                setCurrentUserId(userId)
                setIsLoggedIn(!!userId)

                // جلب بيانات المتصدرين
                await fetchLeaderboard()
            } catch (error) {
                dbLogger.error('Error loading leaderboard:', error)
            } finally {
                setIsLoading(false)
            }
        }

        checkAuthAndLoadData()
    }, [activeTab, fetchLeaderboard])

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
                        <p>تنافس مع المتعلمين الآخرين</p>
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
                    {isLoggedIn && userRank && (
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
                                المستوى {userRank.current_level}
                            </div>
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
                                <span className="podium-name">{leaderboard[1].full_name}</span>
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
                                <span className="podium-name">{leaderboard[0].full_name}</span>
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
                                <span className="podium-name">{leaderboard[2].full_name}</span>
                                <span className="podium-value">{getDisplayValue(leaderboard[2])}</span>
                                <div className="podium-stand">3</div>
                            </motion.div>
                        </div>
                    )}

                    {/* Full Leaderboard */}
                    <div className="leaderboard-list">
                        {leaderboard.slice(3).map((user, index) => (
                            <motion.div
                                key={user.user_id}
                                className={`leaderboard-item ${user.user_id === currentUserId ? 'current-user' : ''}`}
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: index * 0.03 }}
                            >
                                <span className="item-rank">{user.rank}</span>
                                <div className="item-info">
                                    <span className="item-name">{user.full_name}</span>
                                    <span className="item-level">المستوى {user.current_level}</span>
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
                            {!isLoggedIn && (
                                <button 
                                    className="login-btn"
                                    onClick={() => router.push('/login')}
                                >
                                    سجّل الدخول للمشاركة
                                </button>
                            )}
                        </div>
                    )}
                </div>
            </main>
        </>
    )
}
