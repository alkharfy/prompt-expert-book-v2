'use client'

/**
 * Chat Analytics — إحصائيات المساعد الذكي
 *
 * إجمالي الرسائل، المستخدمين، استخدام النماذج، التقييمات، آخر 7 أيام.
 * يستخدم cookie-based admin auth (عبر /api/admin/check-access).
 *
 * @module app/billing/admin/chat/page
 */

import { useState, useEffect, useCallback } from 'react'

interface ChatAnalytics {
    totalMessages: number
    totalUsers: number
    todayMessages: number
    modelUsage: { model: string; count: number }[]
    ratings: { positive: number; negative: number }
    dailyUsage: { date: string; count: number }[]
}

export default function ChatAnalyticsPage() {
    const [analytics, setAnalytics] = useState<ChatAnalytics | null>(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState('')

    const fetchAnalytics = useCallback(async () => {
        setLoading(true)
        setError('')
        try {
            const res = await fetch('/api/chat/analytics', { credentials: 'include' })
            if (res.ok) {
                const data = await res.json()
                setAnalytics(data)
            } else {
                setError('فشل في تحميل البيانات')
            }
        } catch {
            setError('حدث خطأ في الاتصال')
        }
        setLoading(false)
    }, [])

    useEffect(() => {
        fetchAnalytics()
    }, [fetchAnalytics])

    const styles = {
        header: {
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '2rem',
        } as React.CSSProperties,
        title: {
            fontSize: '1.75rem',
            fontWeight: 700,
            color: '#e5e7eb',
            margin: 0,
        } as React.CSSProperties,
        refreshBtn: {
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            padding: '0.6rem 1.1rem',
            background: 'rgba(139, 92, 246, 0.1)',
            border: '1px solid rgba(139, 92, 246, 0.2)',
            borderRadius: '8px',
            color: '#c4b5fd',
            fontSize: '0.85rem',
            cursor: 'pointer',
            fontFamily: 'var(--font-cairo)',
            transition: 'all 0.15s',
        } as React.CSSProperties,
        statsGrid: {
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
            gap: '1rem',
            marginBottom: '2rem',
        } as React.CSSProperties,
        statCard: {
            background: 'rgba(255,255,255,0.03)',
            border: '1px solid rgba(139, 92, 246, 0.12)',
            borderRadius: '14px',
            padding: '1.25rem',
            textAlign: 'center' as const,
        } as React.CSSProperties,
        statNumber: {
            fontSize: '2rem',
            fontWeight: 700,
            color: '#8b5cf6',
            display: 'block',
        } as React.CSSProperties,
        statLabel: {
            fontSize: '0.85rem',
            color: '#6b7280',
            marginTop: '0.25rem',
        } as React.CSSProperties,
        section: {
            background: 'rgba(255,255,255,0.03)',
            border: '1px solid rgba(139, 92, 246, 0.12)',
            borderRadius: '14px',
            padding: '1.5rem',
            marginBottom: '1.5rem',
        } as React.CSSProperties,
        sectionTitle: {
            fontSize: '1.1rem',
            fontWeight: 600,
            color: '#e5e7eb',
            marginBottom: '1.25rem',
        } as React.CSSProperties,
        ratingsRow: {
            display: 'flex',
            gap: '3rem',
            alignItems: 'center',
        } as React.CSSProperties,
        ratingItem: {
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
        } as React.CSSProperties,
        barContainer: {
            height: '8px',
            background: 'rgba(255,255,255,0.05)',
            borderRadius: '4px',
            overflow: 'hidden',
        } as React.CSSProperties,
        barFill: (pct: number) => ({
            height: '100%',
            width: `${pct}%`,
            background: 'linear-gradient(135deg, #8b5cf6, #6d28d9)',
            borderRadius: '4px',
            transition: 'width 0.5s ease',
        }) as React.CSSProperties,
        dailyChart: {
            display: 'flex',
            alignItems: 'flex-end',
            gap: '0.6rem',
            height: '160px',
        } as React.CSSProperties,
        dayColumn: {
            flex: 1,
            display: 'flex',
            flexDirection: 'column' as const,
            alignItems: 'center',
            gap: '6px',
        } as React.CSSProperties,
        dayBar: (heightPercent: number) => ({
            width: '100%',
            maxWidth: '40px',
            height: `${heightPercent}%`,
            background: 'linear-gradient(180deg, #8b5cf6, #6d28d9)',
            borderRadius: '4px 4px 0 0',
            transition: 'height 0.5s ease',
        }) as React.CSSProperties,
        loading: {
            display: 'flex',
            flexDirection: 'column' as const,
            alignItems: 'center',
            justifyContent: 'center',
            padding: '5rem 0',
            gap: '1rem',
            color: '#6b7280',
        } as React.CSSProperties,
        spinner: {
            width: '36px',
            height: '36px',
            border: '3px solid rgba(139, 92, 246, 0.2)',
            borderTopColor: '#8b5cf6',
            borderRadius: '50%',
            animation: 'spin 0.8s linear infinite',
        } as React.CSSProperties,
        errorBox: {
            textAlign: 'center' as const,
            padding: '3rem 0',
            color: '#ef4444',
            fontSize: '1rem',
        } as React.CSSProperties,
    }

    if (loading) {
        return (
            <div>
                <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
                <h1 style={styles.title}>💬 إحصائيات الشات</h1>
                <div style={styles.loading}>
                    <div style={styles.spinner} />
                    <p>جاري التحميل...</p>
                </div>
            </div>
        )
    }

    if (error || !analytics) {
        return (
            <div>
                <h1 style={styles.title}>💬 إحصائيات الشات</h1>
                <div style={styles.errorBox}>
                    <p>{error || 'لا توجد بيانات'}</p>
                    <button style={styles.refreshBtn} onClick={fetchAnalytics}>🔄 إعادة المحاولة</button>
                </div>
            </div>
        )
    }

    const satisfactionRate =
        analytics.ratings.positive + analytics.ratings.negative > 0
            ? Math.round(
                  (analytics.ratings.positive / (analytics.ratings.positive + analytics.ratings.negative)) * 100
              )
            : 0

    return (
        <div>
            <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>

            <div style={styles.header}>
                <h1 style={styles.title}>💬 إحصائيات الشات</h1>
                <button style={styles.refreshBtn} onClick={fetchAnalytics}>
                    🔄 تحديث
                </button>
            </div>

            {/* Stats Cards */}
            <div style={styles.statsGrid}>
                <div style={styles.statCard}>
                    <span style={styles.statNumber}>{analytics.totalMessages}</span>
                    <span style={styles.statLabel}>إجمالي الرسائل</span>
                </div>
                <div style={styles.statCard}>
                    <span style={styles.statNumber}>{analytics.totalUsers}</span>
                    <span style={styles.statLabel}>المستخدمين</span>
                </div>
                <div style={styles.statCard}>
                    <span style={styles.statNumber}>{analytics.todayMessages}</span>
                    <span style={styles.statLabel}>رسائل اليوم</span>
                </div>
                <div style={styles.statCard}>
                    <span style={styles.statNumber}>{satisfactionRate}%</span>
                    <span style={styles.statLabel}>نسبة الرضا</span>
                </div>
            </div>

            {/* Ratings */}
            <div style={styles.section}>
                <h3 style={styles.sectionTitle}>📊 التقييمات</h3>
                <div style={styles.ratingsRow}>
                    <div style={styles.ratingItem}>
                        <span style={{ fontSize: '1.5em' }}>👍</span>
                        <span style={{ color: '#22c55e', fontSize: '1.25rem', fontWeight: 'bold' }}>
                            {analytics.ratings.positive}
                        </span>
                    </div>
                    <div style={styles.ratingItem}>
                        <span style={{ fontSize: '1.5em' }}>👎</span>
                        <span style={{ color: '#ef4444', fontSize: '1.25rem', fontWeight: 'bold' }}>
                            {analytics.ratings.negative}
                        </span>
                    </div>
                </div>
            </div>

            {/* Model Usage */}
            {analytics.modelUsage.length > 0 && (
                <div style={styles.section}>
                    <h3 style={styles.sectionTitle}>🤖 توزيع النماذج</h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                        {analytics.modelUsage.map((item) => {
                            const maxCount = analytics.modelUsage[0]?.count || 1
                            const pct = Math.round((item.count / maxCount) * 100)
                            return (
                                <div key={item.model}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                                        <span style={{ color: '#e5e7eb', fontSize: '0.85rem' }}>{item.model}</span>
                                        <span style={{ color: '#6b7280', fontSize: '0.85rem' }}>{item.count}</span>
                                    </div>
                                    <div style={styles.barContainer}>
                                        <div style={styles.barFill(pct)} />
                                    </div>
                                </div>
                            )
                        })}
                    </div>
                </div>
            )}

            {/* Daily Usage */}
            <div style={styles.section}>
                <h3 style={styles.sectionTitle}>📅 آخر 7 أيام</h3>
                <div style={styles.dailyChart}>
                    {[...analytics.dailyUsage].reverse().map((day) => {
                        const maxDaily = Math.max(...analytics.dailyUsage.map((d) => d.count), 1)
                        const heightPercent = Math.max((day.count / maxDaily) * 100, 4)
                        return (
                            <div key={day.date} style={styles.dayColumn}>
                                <span style={{ color: '#9ca3af', fontSize: '11px' }}>{day.count}</span>
                                <div style={styles.dayBar(heightPercent)} />
                                <span style={{ color: '#6b7280', fontSize: '10px', direction: 'ltr' }}>
                                    {day.date.slice(5)}
                                </span>
                            </div>
                        )
                    })}
                </div>
            </div>
        </div>
    )
}
