'use client'

/**
 * Admin Subscriptions Management
 *
 * صفحة إدارة الاشتراكات — عرض، بحث، تصفية، تصدير CSV.
 *
 * Features:
 * - عرض جميع الاشتراكات في جدول
 * - تصفية حسب الحالة (active, expired, cancelled)
 * - بحث بالبريد الإلكتروني أو اسم المستخدم
 * - تصدير البيانات كـ CSV
 *
 * @module app/admin/subscriptions/page
 */

import { useEffect, useState, useCallback } from 'react'

type Subscription = {
    id: string
    user_id: string
    plan_id: string
    payment_id: string | null
    status: string
    starts_at: string
    expires_at: string
    upgraded_from: string | null
    created_at: string
    updated_at: string
    users: { email: string; full_name: string | null } | null
    payments: { amount: number; currency: string } | null
}

export default function AdminSubscriptionsPage() {
    const [subscriptions, setSubscriptions] = useState<Subscription[]>([])
    const [filteredSubs, setFilteredSubs] = useState<Subscription[]>([])
    const [loading, setLoading] = useState(true)
    const [searchQuery, setSearchQuery] = useState('')
    const [statusFilter, setStatusFilter] = useState<string>('all')

    const fetchSubscriptions = useCallback(async () => {
        setLoading(true)
        try {
            const response = await fetch('/api/admin/subscriptions')
            const data = await response.json()

            if (data.ok) {
                setSubscriptions(data.subscriptions as Subscription[])
                setFilteredSubs(data.subscriptions as Subscription[])
            } else {
                console.error('Error fetching subscriptions:', data.error)
            }
        } catch (error) {
            console.error('Error fetching subscriptions:', error)
        }
        setLoading(false)
    }, [])

    useEffect(() => {
        fetchSubscriptions()
    }, [fetchSubscriptions])

    useEffect(() => {
        // تطبيق الفلاتر
        let result = subscriptions

        // فلتر حسب الحالة
        if (statusFilter !== 'all') {
            result = result.filter((sub) => sub.status === statusFilter)
        }

        // فلتر حسب البحث
        if (searchQuery.trim()) {
            const query = searchQuery.toLowerCase()
            result = result.filter(
                (sub) =>
                    sub.users?.email.toLowerCase().includes(query) ||
                    sub.users?.full_name?.toLowerCase().includes(query)
            )
        }

        setFilteredSubs(result)
    }, [subscriptions, searchQuery, statusFilter])

    const exportToCSV = () => {
        const headers = ['البريد الإلكتروني', 'الاسم', 'الباقة', 'الحالة', 'تاريخ البداية', 'تاريخ الانتهاء', 'المبلغ']
        const rows = filteredSubs.map((sub) => [
            sub.users?.email || '',
            sub.users?.full_name || '',
            sub.plan_id,
            sub.status,
            new Date(sub.starts_at).toLocaleDateString('ar-EG'),
            new Date(sub.expires_at).toLocaleDateString('ar-EG'),
            sub.payment_id ? `${sub.payments?.amount || 0} ${sub.payments?.currency || 'EGP'}` : 'مجاني',
        ])

        const csvContent = [headers, ...rows].map((row) => row.join(',')).join('\n')
        const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' })
        const link = document.createElement('a')
        link.href = URL.createObjectURL(blob)
        link.download = `subscriptions-${new Date().toISOString().split('T')[0]}.csv`
        link.click()
    }

    const getStatusLabel = (status: string) => {
        const labels: Record<string, string> = {
            active: 'نشط',
            expired: 'منتهي',
            cancelled: 'ملغي',
            upgraded: 'تمت الترقية',
        }
        return labels[status] || status
    }

    const getStatusColor = (status: string) => {
        const colors: Record<string, string> = {
            active: '#10b981',
            expired: '#ef4444',
            cancelled: '#6b7280',
            upgraded: '#3b82f6',
        }
        return colors[status] || '#6b7280'
    }

    const getPlanLabel = (planId: string) => {
        const labels: Record<string, string> = {
            basic: 'أساسية',
            pro: 'احترافية',
            vip: 'مميزة',
        }
        return labels[planId] || planId
    }

    if (loading) {
        return <div style={{ padding: '2rem', textAlign: 'center' }}>جاري التحميل...</div>
    }

    return (
        <div>
            <div style={{ marginBottom: '2rem' }}>
                <h1 style={{ fontSize: '2rem', fontWeight: 700, marginBottom: '0.5rem' }}>
                    إدارة الاشتراكات
                </h1>
                <p style={{ color: '#9ca3af' }}>عدد الاشتراكات: {filteredSubs.length}</p>
            </div>

            {/* Filters & Search */}
            <div
                style={{
                    display: 'flex',
                    gap: '1rem',
                    marginBottom: '1.5rem',
                    flexWrap: 'wrap',
                    alignItems: 'center',
                }}
            >
                <input
                    type="text"
                    placeholder="بحث بالبريد الإلكتروني أو الاسم..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    style={{
                        flex: 1,
                        minWidth: '250px',
                        padding: '0.75rem 1rem',
                        borderRadius: '8px',
                        border: '1px solid #374151',
                        backgroundColor: '#1f2937',
                        color: '#fff',
                        fontSize: '0.95rem',
                    }}
                />

                <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    style={{
                        padding: '0.75rem 1rem',
                        borderRadius: '8px',
                        border: '1px solid #374151',
                        backgroundColor: '#1f2937',
                        color: '#fff',
                        fontSize: '0.95rem',
                    }}
                >
                    <option value="all">جميع الحالات</option>
                    <option value="active">نشط</option>
                    <option value="expired">منتهي</option>
                    <option value="cancelled">ملغي</option>
                </select>

                <button
                    onClick={exportToCSV}
                    style={{
                        padding: '0.75rem 1.5rem',
                        borderRadius: '8px',
                        backgroundColor: '#8b5cf6',
                        color: '#fff',
                        border: 'none',
                        cursor: 'pointer',
                        fontSize: '0.95rem',
                        fontWeight: 600,
                    }}
                >
                    📥 تصدير CSV
                </button>
            </div>

            {/* Table */}
            <div style={{ overflowX: 'auto' }}>
                <table
                    style={{
                        width: '100%',
                        borderCollapse: 'collapse',
                        backgroundColor: '#1f2937',
                        borderRadius: '12px',
                        overflow: 'hidden',
                    }}
                >
                    <thead>
                        <tr style={{ backgroundColor: '#111827', color: '#9ca3af' }}>
                            <th style={{ padding: '1rem', textAlign: 'right', fontWeight: 600 }}>
                                المستخدم
                            </th>
                            <th style={{ padding: '1rem', textAlign: 'center', fontWeight: 600 }}>
                                الباقة
                            </th>
                            <th style={{ padding: '1rem', textAlign: 'center', fontWeight: 600 }}>
                                الحالة
                            </th>
                            <th style={{ padding: '1rem', textAlign: 'center', fontWeight: 600 }}>
                                تاريخ البداية
                            </th>
                            <th style={{ padding: '1rem', textAlign: 'center', fontWeight: 600 }}>
                                تاريخ الانتهاء
                            </th>
                            <th style={{ padding: '1rem', textAlign: 'center', fontWeight: 600 }}>
                                المبلغ
                            </th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredSubs.map((sub, idx) => (
                            <tr
                                key={sub.id}
                                style={{
                                    borderTop: '1px solid #374151',
                                    backgroundColor: idx % 2 === 0 ? '#1f2937' : '#111827',
                                }}
                            >
                                <td style={{ padding: '1rem' }}>
                                    <div>
                                        <div style={{ fontWeight: 600 }}>
                                            {sub.users?.full_name || 'غير متوفر'}
                                        </div>
                                        <div style={{ fontSize: '0.875rem', color: '#9ca3af' }}>
                                            {sub.users?.email}
                                        </div>
                                    </div>
                                </td>
                                <td style={{ padding: '1rem', textAlign: 'center' }}>
                                    <span
                                        style={{
                                            padding: '0.25rem 0.75rem',
                                            borderRadius: '6px',
                                            backgroundColor: 'rgba(139, 92, 246, 0.2)',
                                            color: '#a78bfa',
                                            fontSize: '0.875rem',
                                            fontWeight: 600,
                                        }}
                                    >
                                        {getPlanLabel(sub.plan_id)}
                                    </span>
                                </td>
                                <td style={{ padding: '1rem', textAlign: 'center' }}>
                                    <span
                                        style={{
                                            padding: '0.25rem 0.75rem',
                                            borderRadius: '6px',
                                            backgroundColor: `${getStatusColor(sub.status)}33`,
                                            color: getStatusColor(sub.status),
                                            fontSize: '0.875rem',
                                            fontWeight: 600,
                                        }}
                                    >
                                        {getStatusLabel(sub.status)}
                                    </span>
                                </td>
                                <td
                                    style={{
                                        padding: '1rem',
                                        textAlign: 'center',
                                        fontSize: '0.875rem',
                                    }}
                                >
                                    {new Date(sub.starts_at).toLocaleDateString('ar-EG')}
                                </td>
                                <td
                                    style={{
                                        padding: '1rem',
                                        textAlign: 'center',
                                        fontSize: '0.875rem',
                                    }}
                                >
                                    {new Date(sub.expires_at).toLocaleDateString('ar-EG')}
                                </td>
                                <td
                                    style={{
                                        padding: '1rem',
                                        textAlign: 'center',
                                        fontSize: '0.875rem',
                                        fontWeight: 600,
                                    }}
                                >
                                    {sub.payment_id
                                        ? `${sub.payments?.amount || 0} ${sub.payments?.currency || 'EGP'}`
                                        : <span style={{ color: '#10b981' }}>مجاني</span>}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>

                {filteredSubs.length === 0 && (
                    <div
                        style={{
                            padding: '3rem',
                            textAlign: 'center',
                            color: '#9ca3af',
                            backgroundColor: '#1f2937',
                            borderRadius: '12px',
                        }}
                    >
                        لا توجد اشتراكات مطابقة للفلاتر المحددة
                    </div>
                )}
            </div>
        </div>
    )
}
