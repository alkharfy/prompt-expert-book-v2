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
import { supabase } from '@/lib/supabase'
import type { Database } from '@/lib/database.types'

type Subscription = Database['public']['Tables']['subscriptions']['Row']
type Payment = Database['public']['Tables']['payments']['Row']

interface Stats {
    totalActive: number
    totalExpired: number
    totalCancelled: number
    mrr: number
    planDistribution: Record<string, number>
}

export default function BillingAdminDashboard() {
    const [stats, setStats] = useState<Stats>({
        totalActive: 0,
        totalExpired: 0,
        totalCancelled: 0,
        mrr: 0,
        planDistribution: {},
    })
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

        // جلب الاشتراكات
        const { data: subscriptions, error: subError } = await (supabase as any)
            .from('subscriptions')
            .select('status, plan_id, expires_at')

        if (subError) {
            console.error('Error fetching subscriptions:', subError)
            setLoading(false)
            return
        }

        // حساب الإحصائيات
        const now = new Date()
        const activeSubs = subscriptions.filter(
            (sub: any) => sub.status === 'active' && new Date(sub.expires_at) > now
        )
        const expiredSubs = subscriptions.filter(
            (sub: any) => sub.status === 'expired' || new Date(sub.expires_at) <= now
        )
        const cancelledSubs = subscriptions.filter((sub: any) => sub.status === 'cancelled')

        // توزيع الباقات
        const planDistribution: Record<string, number> = {}
        activeSubs.forEach((sub: any) => {
            planDistribution[sub.plan_id] = (planDistribution[sub.plan_id] || 0) + 1
        })

        // حساب MRR (Monthly Recurring Revenue)
        // MRR = (إجمالي الإيرادات السنوية / 12)
        // Estimate; authoritative prices live in the admin-managed `plans` table.
        const planPrices: Record<string, number> = {
            basic: 99,
            pro: 199,
            vip: 399,
        }
        const annualRevenue = activeSubs.reduce((sum: number, sub: any) => {
            return sum + (planPrices[sub.plan_id] || 0)
        }, 0)
        const mrr = Math.round(annualRevenue / 12)

        setStats({
            totalActive: activeSubs.length,
            totalExpired: expiredSubs.length,
            totalCancelled: cancelledSubs.length,
            mrr,
            planDistribution,
        })

        setLoading(false)
    }, [])

    const renderCharts = useCallback(() => {
        // @ts-ignore - Chart.js loaded from CDN
        if (!window.Chart) return

        // Pie Chart: توزيع الباقات
        if (pieChartRef.current) {
            const pieCtx = pieChartRef.current.getContext('2d')
            if (pieCtx) {
                // @ts-ignore
                new window.Chart(pieCtx, {
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
                })
            }
        }

        // Line Chart: نمو الاشتراكات (مثال ثابت)
        if (lineChartRef.current) {
            const lineCtx = lineChartRef.current.getContext('2d')
            if (lineCtx) {
                // @ts-ignore
                new window.Chart(lineCtx, {
                    type: 'line',
                    data: {
                        labels: ['يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو'],
                        datasets: [
                            {
                                label: 'عدد الاشتراكات',
                                data: [5, 12, 18, 25, 30, stats.totalActive],
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
                                text: 'نمو الاشتراكات (2026)',
                                color: '#e5e7eb',
                                font: { size: 16, weight: 'bold' },
                            },
                        },
                        scales: {
                            y: {
                                beginAtZero: true,
                                ticks: { color: '#9ca3af' },
                                grid: { color: '#374151' },
                            },
                            x: {
                                ticks: { color: '#9ca3af' },
                                grid: { color: '#374151' },
                            },
                        },
                    },
                })
            }
        }
    }, [stats])

    useEffect(() => {
        fetchStats()
    }, [fetchStats])

    useEffect(() => {
        if (chartLoaded && stats.totalActive > 0) {
            renderCharts()
        }
    }, [chartLoaded, stats, renderCharts])

    if (loading) {
        return <div style={{ padding: '2rem', textAlign: 'center' }}>جاري التحميل...</div>
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
                        MRR (إيرادات شهرية)
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
