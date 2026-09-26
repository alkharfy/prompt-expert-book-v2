'use client'

/**
 * Site Stats Admin — إدارة إحصائيات الصفحة الرئيسية
 *
 * التحكم في الأرقام المعروضة في قسم الإحصائيات:
 * عدد المتعلمين، التقييم، عدد الصفحات، الإنجازات
 *
 * @module app/billing/admin/site-stats/page
 */

import { useState, useEffect, useCallback } from 'react'

interface StatItem {
    id: string
    value: number
    suffix: string
    label: string
    icon: string
}

const API = '/api/admin/site-stats'

const ICONS = ['👥', '⭐', '📖', '🏆', '🎯', '📚', '🚀', '💡', '🔥', '✅', '📈', '🎓']

export default function SiteStatsAdmin() {
    const [stats, setStats] = useState<StatItem[]>([])
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)
    const [saved, setSaved] = useState(false)

    const fetchStats = useCallback(async () => {
        setLoading(true)
        try {
            const res = await fetch(API, { credentials: 'include' })
            const json = await res.json()
            setStats(json.data || [])
        } catch {
            setStats([])
        }
        setLoading(false)
    }, [])

    useEffect(() => {
        fetchStats()
    }, [fetchStats])

    const handleChange = (index: number, field: keyof StatItem, value: string | number) => {
        const updated = [...stats]
        if (field === 'value') {
            updated[index] = { ...updated[index], [field]: Number(value) }
        } else {
            updated[index] = { ...updated[index], [field]: value }
        }
        setStats(updated)
        setSaved(false)
    }

    const handleSave = async () => {
        setSaving(true)
        try {
            await fetch(API, {
                method: 'PUT',
                credentials: 'include',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ stats }),
            })
            setSaved(true)
            setTimeout(() => setSaved(false), 3000)
        } catch {
            alert('حدث خطأ أثناء الحفظ')
        }
        setSaving(false)
    }

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
        saveBtn: {
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            padding: '0.7rem 1.5rem',
            background: saved
                ? 'linear-gradient(135deg, #22c55e, #16a34a)'
                : 'linear-gradient(135deg, #8b5cf6, #6d28d9)',
            color: '#fff',
            border: 'none',
            borderRadius: '10px',
            fontSize: '0.95rem',
            fontWeight: 600,
            cursor: saving ? 'not-allowed' : 'pointer',
            opacity: saving ? 0.7 : 1,
            transition: 'all 0.3s',
            fontFamily: 'var(--font-cairo)',
        } as React.CSSProperties,
        desc: {
            color: '#9ca3af',
            fontSize: '0.95rem',
            marginBottom: '2rem',
            lineHeight: 1.6,
        } as React.CSSProperties,
        grid: {
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
            gap: '1.25rem',
        } as React.CSSProperties,
        card: {
            background: 'rgba(139, 92, 246, 0.06)',
            border: '1px solid rgba(139, 92, 246, 0.15)',
            borderRadius: '16px',
            padding: '1.5rem',
            transition: 'all 0.2s',
        } as React.CSSProperties,
        cardIcon: {
            fontSize: '2rem',
            marginBottom: '0.75rem',
        } as React.CSSProperties,
        formGroup: {
            display: 'flex',
            flexDirection: 'column' as const,
            gap: '0.35rem',
            marginBottom: '0.85rem',
        } as React.CSSProperties,
        label: {
            fontSize: '0.8rem',
            fontWeight: 600,
            color: '#9ca3af',
        } as React.CSSProperties,
        input: {
            padding: '0.55rem 0.85rem',
            background: 'rgba(255,255,255,0.04)',
            border: '1px solid rgba(139, 92, 246, 0.2)',
            borderRadius: '8px',
            color: '#e5e7eb',
            fontSize: '0.9rem',
            fontFamily: 'var(--font-cairo)',
            outline: 'none',
            transition: 'border-color 0.2s',
            width: '100%',
            boxSizing: 'border-box' as const,
        } as React.CSSProperties,
        row: {
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: '0.75rem',
        } as React.CSSProperties,
        iconSelect: {
            display: 'flex',
            flexWrap: 'wrap' as const,
            gap: '0.4rem',
        } as React.CSSProperties,
        iconBtn: (isActive: boolean) => ({
            width: '36px',
            height: '36px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '1.1rem',
            background: isActive ? 'rgba(139, 92, 246, 0.2)' : 'rgba(255,255,255,0.04)',
            border: `1px solid ${isActive ? '#8b5cf6' : 'rgba(255,255,255,0.08)'}`,
            borderRadius: '8px',
            cursor: 'pointer',
            transition: 'all 0.15s',
        }) as React.CSSProperties,
        preview: {
            marginTop: '2rem',
            padding: '2rem',
            background: 'rgba(255, 107, 53, 0.05)',
            borderRadius: '20px',
            border: '1px solid rgba(255, 107, 53, 0.15)',
        } as React.CSSProperties,
        previewTitle: {
            fontSize: '1rem',
            fontWeight: 600,
            color: '#9ca3af',
            marginBottom: '1.25rem',
            textAlign: 'center' as const,
        } as React.CSSProperties,
        previewGrid: {
            display: 'flex',
            justifyContent: 'center',
            gap: '2rem',
            flexWrap: 'wrap' as const,
        } as React.CSSProperties,
        previewItem: {
            textAlign: 'center' as const,
            padding: '1rem 1.5rem',
        } as React.CSSProperties,
        previewIcon: {
            fontSize: '1.5rem',
            marginBottom: '0.5rem',
        } as React.CSSProperties,
        previewNumber: {
            fontSize: '2.2rem',
            fontWeight: 800,
            color: '#FF6B35',
            lineHeight: 1,
        } as React.CSSProperties,
        previewLabel: {
            fontSize: '0.85rem',
            color: 'rgba(255,255,255,0.6)',
            marginTop: '0.25rem',
        } as React.CSSProperties,
        loading: {
            display: 'flex',
            flexDirection: 'column' as const,
            alignItems: 'center',
            justifyContent: 'center',
            padding: '4rem 0',
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
    }

    if (loading) {
        return (
            <div>
                <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
                <div style={styles.loading}>
                    <div style={styles.spinner} />
                    <p>جاري التحميل...</p>
                </div>
            </div>
        )
    }

    return (
        <div>
            <div style={styles.header}>
                <h1 style={styles.title}>📊 إحصائيات الصفحة الرئيسية</h1>
                <button style={styles.saveBtn} onClick={handleSave} disabled={saving}>
                    {saving ? 'جاري الحفظ...' : saved ? '✅ تم الحفظ' : '💾 حفظ التغييرات'}
                </button>
            </div>

            <p style={styles.desc}>
                تحكم في الأرقام والإحصائيات المعروضة في الصفحة الرئيسية. غيّر القيم والأيقونات والتسميات حسب الحاجة.
            </p>

            <div style={styles.grid}>
                {stats.map((stat, index) => (
                    <div key={stat.id} style={styles.card}>
                        <div style={styles.cardIcon}>{stat.icon}</div>
                        <div style={styles.row}>
                            <div style={styles.formGroup}>
                                <label style={styles.label}>القيمة</label>
                                <input
                                    type="number"
                                    value={stat.value}
                                    onChange={(e) => handleChange(index, 'value', e.target.value)}
                                    style={styles.input}
                                    step="any"
                                />
                            </div>
                            <div style={styles.formGroup}>
                                <label style={styles.label}>اللاحقة</label>
                                <input
                                    type="text"
                                    value={stat.suffix}
                                    onChange={(e) => handleChange(index, 'suffix', e.target.value)}
                                    style={styles.input}
                                    placeholder="+ أو %"
                                />
                            </div>
                        </div>
                        <div style={styles.formGroup}>
                            <label style={styles.label}>التسمية</label>
                            <input
                                type="text"
                                value={stat.label}
                                onChange={(e) => handleChange(index, 'label', e.target.value)}
                                style={styles.input}
                            />
                        </div>
                        <div style={styles.formGroup}>
                            <label style={styles.label}>الأيقونة</label>
                            <div style={styles.iconSelect}>
                                {ICONS.map((icon) => (
                                    <button
                                        key={icon}
                                        style={styles.iconBtn(stat.icon === icon)}
                                        onClick={() => handleChange(index, 'icon', icon)}
                                    >
                                        {icon}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Preview */}
            <div style={styles.preview}>
                <p style={styles.previewTitle}>👁 معاينة — هكذا ستظهر في الصفحة الرئيسية</p>
                <div style={styles.previewGrid}>
                    {stats.map((stat) => (
                        <div key={stat.id} style={styles.previewItem}>
                            <div style={styles.previewIcon}>{stat.icon}</div>
                            <div style={styles.previewNumber}>
                                {stat.value}{stat.suffix}
                            </div>
                            <div style={styles.previewLabel}>{stat.label}</div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    )
}
