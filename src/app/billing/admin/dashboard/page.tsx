'use client'

/**
 * Billing Admin Dashboard — Analytics & Charts
 *
 * لوحة إحصائيات الاشتراكات مع رسوم بيانية.
 *
 * Metrics:
 * - MRR (Monthly Recurring Revenue) - إجمالي الإيرادات الشهرية المتوقعة
 * - Total Active Subscriptions
 * - Plan Distribution (Pie Chart)
 * - Subscription Growth (Line Chart)
 *
 * Uses: Chart.js (CDN)
 *
 * @module app/billing/admin/dashboard/page
 */

import { useEffect, useState, useRef, useCallback } from 'react'

interface AdminSubscription {
    status: string
    plan_id: string
    payment_id: string | null
    expires_at: string
    created_at: string
    payments: { amount: number } | null
}

interface Stats {
    totalActive: number
    freeActive: number
    totalExpired: number
    totalCancelled: number
    mrr: number
    planDistribution: Record<string, number>
    growth: { label: string; count: number }[]
}

export default function BillingAdminDashboard() {
    const [stats, setStats] = useState<Stats>({
        totalActive: 0,
        freeActive: 0,
        totalExpired: 0,
        totalCancelled: 0,
        mrr: 0,
        planDistribution: {},
        growth: [],
    })
    const [loadError, setLoadError] = useState<string | null>(null)
    const chartsRef = useRef<{ destroy: () => void }[]>([])
    const [loading, setLoading] = useState(true)
    const pieChartRef = useRef<HTMLCanvasElement>(null)
    const lineChartRef = useRef<HTMLCanvasElement>(null)
    const [chartLoaded, setChartLoaded] = useState(false)

    useEffect(() => {
        // تحميل Chart.js من CDN
        const script = document.createElement('script')
        script.src = 'https://cdn.jsdelivr.net/npm/chart.js@4.4.0/dist/chart.umd.min.js'
        script.async = true
        script.onload = () => setChartLoaded(true)
        document.body.appendChild(script)

        return () => {
            if (document.body.contains(script)) {
                document.body.removeChild(script)
            }
        }
    }, [])

    const fetchStats = useCallback(async () => {
        setLoading(true)

        // جلب الاشتراكات عبر API الأدمن (service_role) — قراءة الجدول مباشرة من
        // المتصفح بمفتاح anon ممنوعة بسياسات RLS فكانت ترجع أصفاراً.
        let subscriptions: AdminSubscription[]
        try {
            const res = await fetch('/api/admin/subscriptions', { cache: 'no-store' })
            const data = await res.json()
            if (!data.ok) throw new Error(data.error || 'failed')
            subscriptions = data.subscriptions
        } catch (err) {
            console.error('Error fetching subscriptions:', err)
            setLoadError('تعذّر تحميل بيانات الاشتراكات')
            setLoading(false)
            return
        }

        // حساب الإحصائيات
        const now = new Date()
        const activeSubs = subscriptions.filter(
            (sub) => sub.status === 'active' && new Date(sub.expires_at) > now
        )
        const expiredSubs = subscriptions.filter(
            (sub) => sub.status === 'expired' || (sub.status === 'active' && new Date(sub.expires_at) <= now)
        )
        const cancelledSubs = subscriptions.filter((sub) => sub.status === 'cancelled')
        // الحسابات المجانية = اشتراك بدون دفعة (يصدرها الأدمن)
        const paidActive = activeSubs.filter((sub) => sub.payment_id)

        // توزيع الباقات
        const planDistribution: Record<string, number> = {}
        activeSubs.forEach((sub) => {
            planDistribution[sub.plan_id] = (planDistribution[sub.plan_id] || 0) + 1
        })

        // MRR = المبالغ المدفوعة فعلاً في الاشتراكات السنوية النشطة ÷ 12
        // (الحسابات المجانية لا تدخل في الإيرادات)
        const annualRevenue = paidActive.reduce((sum, sub) => sum + (Number(sub.payments?.amount) || 0), 0)
        const mrr = Math.round(annualRevenue / 12)

        // نمو الاشتراكات: عدد الاشتراكات الجديدة في آخر 6 أشهر
        const growth = Array.from({ length: 6 }, (_, i) => {
            const month = new Date(now.getFullYear(), now.getMonth() - 5 + i, 1)
            const count = subscriptions.filter((sub) => {
                const created = new Date(sub.created_at)
                return created.getFullYear() === month.getFullYear() && created.getMonth() === month.getMonth()
            }).length
            return { label: month.toLocaleDateString('ar-EG', { month: 'long' }), count }
        })

        setStats({
            totalActive: activeSubs.length,
            freeActive: activeSubs.length - paidActive.length,
            totalExpired: expiredSubs.length,
            totalCancelled: cancelledSubs.length,
            mrr,
            planDistribution,
            growth,
        })

        setLoading(false)
    }, [])

    const renderCharts = useCallback(() => {
        // @ts-ignore - Chart.js loaded from CDN
        if (!window.Chart) return

        // Chart.js refuses to reuse a canvas that still has a chart on it.
        chartsRef.current.forEach((chart) => chart.destroy())
        chartsRef.current = []

        // Pie Chart: توزيع الباقات
        if (pieChartRef.current) {
            const pieCtx = pieChartRef.current.getContext('2d')
            if (pieCtx) {
                // @ts-ignore
                chartsRef.current.push(new window.Chart(pieCtx, {
                    type: 'pie',
                    data: {
                        labels: Object.keys(stats.planDistribution).map((plan) => {
                            const labels: Record<string, string> = {
                                basic: 'أساسية',
                                pro: 'احترافية',
                                vip: 'مميزة',
                            }
                            return labels[plan] || plan
                        }),
                        datasets: [
                            {
                                data: Object.values(stats.planDistribution),
                                backgroundColor: ['#3b82f6', '#8b5cf6', '#ec4899'],
                                borderColor: '#1f2937',
                                borderWidth: 2,
                            },
                        ],
                    },
                    options: {
                        responsive: true,
                        maintainAspectRatio: true,
                        plugins: {
                            legend: {
                                position: 'bottom',
                                labels: { color: '#e5e7eb', font: { size: 14 } },
                            },
                            title: {
                                display: true,
                                text: 'توزيع الباقات',
                                color: '#e5e7eb',
                                font: { size: 16, weight: 'bold' },
                            },
                        },
                    },
                }))
            }
        }

        // Line Chart: نمو الاشتراكات (اشتراكات جديدة لكل شهر)
        if (lineChartRef.current) {
            const lineCtx = lineChartRef.current.getContext('2d')
            if (lineCtx) {
                // @ts-ignore
                chartsRef.current.push(new window.Chart(lineCtx, {
                    type: 'line',
                    data: {
                        labels: stats.growth.map((m) => m.label),
                        datasets: [
                            {
                                label: 'اشتراكات جديدة',
                                data: stats.growth.map((m) => m.count),
                                borderColor: '#8b5cf6',
                                backgroundColor: 'rgba(139, 92, 246, 0.1)',
                                tension: 0.4,
                                fill: true,
                            },
                        ],
                    },
                    options: {
                        responsive: true,
                        maintainAspectRatio: true,
                        plugins: {
                            legend: {
                                display: false,
                            },
                            title: {
                                display: true,
                                text: 'اشتراكات جديدة — آخر 6 أشهر',
                                color: '#e5e7eb',
                                font: { size: 16, weight: 'bold' },
                            },
                        },
                        scales: {
                            y: {
                                beginAtZero: true,
                                ticks: { color: '#9ca3af', precision: 0 },
                                grid: { color: '#374151' },
                            },
                            x: {
                                ticks: { color: '#9ca3af' },
                                grid: { color: '#374151' },
                            },
                        },
                    },
                }))
            }
        }
    }, [stats])

    useEffect(() => {
        fetchStats()
    }, [fetchStats])

    useEffect(() => {
        if (chartLoaded && stats.growth.length > 0) {
            renderCharts()
        }
    }, [chartLoaded, stats, renderCharts])

    useEffect(() => () => chartsRef.current.forEach((chart) => chart.destroy()), [])

    if (loading) {
        return <div style={{ padding: '2rem', textAlign: 'center' }}>جاري التحميل...</div>
    }

    if (loadError) {
        return <div role="alert" style={{ padding: '2rem', textAlign: 'center', color: '#ef4444' }}>{loadError}</div>
    }

    return (
        <div>
            <div style={{ marginBottom: '2rem' }}>
                <h1 style={{ fontSize: '2rem', fontWeight: 700, marginBottom: '0.5rem' }}>
                    لوحة التحكم
                </h1>
                <p style={{ color: '#9ca3af' }}>إحصائيات الاشتراكات والإيرادات</p>
            </div>

            {/* Stats Cards */}
            <div
                style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
                    gap: '1.5rem',
                    marginBottom: '2rem',
                }}
            >
                <div
                    style={{
                        padding: '1.5rem',
                        backgroundColor: '#1f2937',
                        borderRadius: '12px',
                        border: '1px solid #374151',
                    }}
                >
                    <div style={{ fontSize: '0.875rem', color: '#9ca3af', marginBottom: '0.5rem' }}>
                        الاشتراكات النشطة
                    </div>
                    <div style={{ fontSize: '2rem', fontWeight: 700, color: '#10b981' }}>
                        {stats.totalActive}
                    </div>
                    {stats.freeActive > 0 && (
                        <div style={{ fontSize: '0.8rem', color: '#9ca3af', marginTop: '0.25rem' }}>
                            منها {stats.freeActive} حساب مجاني
                        </div>
                    )}
                </div>

                <div
                    style={{
                        padding: '1.5rem',
                        backgroundColor: '#1f2937',
                        borderRadius: '12px',
                        border: '1px solid #374151',
                    }}
                >
                    <div style={{ fontSize: '0.875rem', color: '#9ca3af', marginBottom: '0.5rem' }}>
                        MRR (إيرادات شهرية — المدفوع فقط)
                    </div>
                    <div style={{ fontSize: '2rem', fontWeight: 700, color: '#8b5cf6' }}>
                        {stats.mrr.toLocaleString('ar-EG')} EGP
                    </div>
                </div>

                <div
                    style={{
                        padding: '1.5rem',
                        backgroundColor: '#1f2937',
                        borderRadius: '12px',
                        border: '1px solid #374151',
                    }}
                >
                    <div style={{ fontSize: '0.875rem', color: '#9ca3af', marginBottom: '0.5rem' }}>
                        الاشتراكات المنتهية
                    </div>
                    <div style={{ fontSize: '2rem', fontWeight: 700, color: '#ef4444' }}>
                        {stats.totalExpired}
                    </div>
                </div>

                <div
                    style={{
                        padding: '1.5rem',
                        backgroundColor: '#1f2937',
                        borderRadius: '12px',
                        border: '1px solid #374151',
                    }}
                >
                    <div style={{ fontSize: '0.875rem', color: '#9ca3af', marginBottom: '0.5rem' }}>
                        الاشتراكات الملغاة
                    </div>
                    <div style={{ fontSize: '2rem', fontWeight: 700, color: '#6b7280' }}>
                        {stats.totalCancelled}
                    </div>
                </div>
            </div>

            {/* Charts */}
            <div
                style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))',
                    gap: '1.5rem',
                }}
            >
                <div
                    style={{
                        padding: '1.5rem',
                        backgroundColor: '#1f2937',
                        borderRadius: '12px',
                        border: '1px solid #374151',
                    }}
                >
                    <canvas ref={pieChartRef} style={{ maxHeight: '300px' }}></canvas>
                </div>

                <div
                    style={{
                        padding: '1.5rem',
                        backgroundColor: '#1f2937',
                        borderRadius: '12px',
                        border: '1px solid #374151',
                    }}
                >
                    <canvas ref={lineChartRef} style={{ maxHeight: '300px' }}></canvas>
                </div>
            </div>
        </div>
    )
}
