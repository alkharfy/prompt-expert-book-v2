'use client'

/**
 * Testimonials Admin — إدارة شهادات العملاء
 *
 * إضافة / تعديل / حذف / إظهار/إخفاء شهادات العملاء
 * المعروضة في الصفحة الرئيسية.
 *
 * @module app/billing/admin/testimonials/page
 */

import { useState, useEffect, useCallback } from 'react'
import { Testimonial } from '@/lib/testimonials'

const API = '/api/admin/testimonials'

export default function TestimonialsAdmin() {
    const [testimonials, setTestimonials] = useState<Testimonial[]>([])
    const [loading, setLoading] = useState(true)
    const [showForm, setShowForm] = useState(false)
    const [editing, setEditing] = useState<Testimonial | null>(null)
    const [form, setForm] = useState({ name: '', title: '', content: '', rating: 5, photo_url: '' })
    const [saving, setSaving] = useState(false)

    const fetchTestimonials = useCallback(async () => {
        setLoading(true)
        try {
            const res = await fetch(API, { credentials: 'include' })
            const json = await res.json()
            setTestimonials(json.data || [])
        } catch {
            setTestimonials([])
        }
        setLoading(false)
    }, [])

    useEffect(() => {
        fetchTestimonials()
    }, [fetchTestimonials])

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setSaving(true)
        if (editing) {
            await fetch(API, {
                method: 'PUT',
                credentials: 'include',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id: editing.id, ...form }),
            })
        } else {
            await fetch(API, {
                method: 'POST',
                credentials: 'include',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(form),
            })
        }
        setShowForm(false)
        setEditing(null)
        setForm({ name: '', title: '', content: '', rating: 5, photo_url: '' })
        setSaving(false)
        fetchTestimonials()
    }

    const handleEdit = (t: Testimonial) => {
        setEditing(t)
        setForm({
            name: t.name,
            title: t.title || '',
            content: t.content,
            rating: t.rating,
            photo_url: t.photo_url || '',
        })
        setShowForm(true)
    }

    const handleDelete = async (id: string) => {
        if (confirm('هل أنت متأكد من حذف هذا التقييم؟')) {
            await fetch(`${API}?id=${id}`, { method: 'DELETE', credentials: 'include' })
            fetchTestimonials()
        }
    }

    const handleToggle = async (id: string, isVisible: boolean) => {
        await fetch(API, {
            method: 'PUT',
            credentials: 'include',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id, is_visible: !isVisible }),
        })
        fetchTestimonials()
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
        addBtn: {
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            padding: '0.7rem 1.25rem',
            background: 'linear-gradient(135deg, #8b5cf6, #6d28d9)',
            color: '#fff',
            border: 'none',
            borderRadius: '10px',
            fontSize: '0.9rem',
            fontWeight: 600,
            cursor: 'pointer',
            transition: 'all 0.2s',
            fontFamily: 'var(--font-cairo)',
        } as React.CSSProperties,
        formCard: {
            background: 'rgba(139, 92, 246, 0.06)',
            border: '1px solid rgba(139, 92, 246, 0.15)',
            borderRadius: '14px',
            padding: '1.5rem',
            marginBottom: '2rem',
        } as React.CSSProperties,
        formTitle: {
            fontSize: '1.1rem',
            fontWeight: 600,
            color: '#c4b5fd',
            marginBottom: '1rem',
        } as React.CSSProperties,
        formRow: {
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: '1rem',
            marginBottom: '1rem',
        } as React.CSSProperties,
        formGroup: {
            display: 'flex',
            flexDirection: 'column' as const,
            gap: '0.4rem',
        } as React.CSSProperties,
        label: {
            fontSize: '0.8rem',
            fontWeight: 600,
            color: '#9ca3af',
        } as React.CSSProperties,
        input: {
            padding: '0.6rem 0.85rem',
            background: 'rgba(255,255,255,0.04)',
            border: '1px solid rgba(139, 92, 246, 0.2)',
            borderRadius: '8px',
            color: '#e5e7eb',
            fontSize: '0.9rem',
            fontFamily: 'var(--font-cairo)',
            outline: 'none',
            transition: 'border-color 0.2s',
        } as React.CSSProperties,
        textarea: {
            padding: '0.6rem 0.85rem',
            background: 'rgba(255,255,255,0.04)',
            border: '1px solid rgba(139, 92, 246, 0.2)',
            borderRadius: '8px',
            color: '#e5e7eb',
            fontSize: '0.9rem',
            fontFamily: 'var(--font-cairo)',
            outline: 'none',
            resize: 'vertical' as const,
            minHeight: '80px',
        } as React.CSSProperties,
        formActions: {
            display: 'flex',
            gap: '0.75rem',
            marginTop: '1rem',
        } as React.CSSProperties,
        submitBtn: {
            padding: '0.6rem 1.5rem',
            background: 'linear-gradient(135deg, #8b5cf6, #6d28d9)',
            color: '#fff',
            border: 'none',
            borderRadius: '8px',
            fontSize: '0.9rem',
            fontWeight: 600,
            cursor: 'pointer',
            fontFamily: 'var(--font-cairo)',
        } as React.CSSProperties,
        cancelBtn: {
            padding: '0.6rem 1.5rem',
            background: 'rgba(255,255,255,0.06)',
            color: '#9ca3af',
            border: '1px solid rgba(255,255,255,0.1)',
            borderRadius: '8px',
            fontSize: '0.9rem',
            cursor: 'pointer',
            fontFamily: 'var(--font-cairo)',
        } as React.CSSProperties,
        grid: {
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))',
            gap: '1.25rem',
        } as React.CSSProperties,
        card: (isVisible: boolean) => ({
            background: 'rgba(255,255,255,0.03)',
            border: `1px solid ${isVisible ? 'rgba(139, 92, 246, 0.12)' : 'rgba(239, 68, 68, 0.2)'}`,
            borderRadius: '14px',
            padding: '1.25rem',
            opacity: isVisible ? 1 : 0.6,
            transition: 'all 0.2s',
        }) as React.CSSProperties,
        cardHeader: {
            display: 'flex',
            alignItems: 'center',
            gap: '0.75rem',
            marginBottom: '0.75rem',
        } as React.CSSProperties,
        avatar: {
            width: '44px',
            height: '44px',
            borderRadius: '50%',
            background: 'linear-gradient(135deg, #8b5cf6, #6d28d9)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#fff',
            fontSize: '1.1rem',
            fontWeight: 700,
            overflow: 'hidden',
        } as React.CSSProperties,
        avatarImg: {
            width: '100%',
            height: '100%',
            objectFit: 'cover' as const,
        } as React.CSSProperties,
        cardName: {
            fontSize: '1rem',
            fontWeight: 600,
            color: '#e5e7eb',
            margin: 0,
        } as React.CSSProperties,
        cardTitle: {
            fontSize: '0.8rem',
            color: '#6b7280',
            margin: 0,
        } as React.CSSProperties,
        cardRating: {
            marginRight: 'auto',
            fontSize: '0.85rem',
        } as React.CSSProperties,
        cardContent: {
            fontSize: '0.9rem',
            color: '#9ca3af',
            lineHeight: 1.6,
            marginBottom: '1rem',
        } as React.CSSProperties,
        cardActions: {
            display: 'flex',
            gap: '0.5rem',
            flexWrap: 'wrap' as const,
        } as React.CSSProperties,
        actionBtn: (color: string) => ({
            padding: '0.4rem 0.85rem',
            background: `${color}15`,
            border: `1px solid ${color}30`,
            borderRadius: '8px',
            color,
            fontSize: '0.8rem',
            cursor: 'pointer',
            fontFamily: 'var(--font-cairo)',
            transition: 'all 0.15s',
        }) as React.CSSProperties,
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
        empty: {
            textAlign: 'center' as const,
            padding: '4rem 0',
            color: '#6b7280',
            fontSize: '1rem',
        } as React.CSSProperties,
        hiddenBadge: {
            fontSize: '0.7rem',
            padding: '2px 8px',
            background: 'rgba(239, 68, 68, 0.15)',
            color: '#ef4444',
            borderRadius: '6px',
            fontWeight: 600,
        } as React.CSSProperties,
    }

    return (
        <div>
            <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>

            <div style={styles.header}>
                <h1 style={styles.title}>⭐ شهادات العملاء</h1>
                <button
                    style={styles.addBtn}
                    onClick={() => {
                        setShowForm(true)
                        setEditing(null)
                        setForm({ name: '', title: '', content: '', rating: 5, photo_url: '' })
                    }}
                >
                    ➕ إضافة شهادة
                </button>
            </div>

            {showForm && (
                <div style={styles.formCard}>
                    <h3 style={styles.formTitle}>
                        {editing ? '✏️ تعديل شهادة' : '➕ إضافة شهادة جديدة'}
                    </h3>
                    <form onSubmit={handleSubmit}>
                        <div style={styles.formRow}>
                            <div style={styles.formGroup}>
                                <label style={styles.label}>الاسم</label>
                                <input
                                    type="text"
                                    value={form.name}
                                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                                    required
                                    style={styles.input}
                                />
                            </div>
                            <div style={styles.formGroup}>
                                <label style={styles.label}>الوظيفة</label>
                                <input
                                    type="text"
                                    value={form.title}
                                    onChange={(e) => setForm({ ...form, title: e.target.value })}
                                    required
                                    style={styles.input}
                                />
                            </div>
                        </div>
                        <div style={{ ...styles.formGroup, marginBottom: '1rem' }}>
                            <label style={styles.label}>المحتوى</label>
                            <textarea
                                value={form.content}
                                onChange={(e) => setForm({ ...form, content: e.target.value })}
                                required
                                style={styles.textarea}
                            />
                        </div>
                        <div style={styles.formRow}>
                            <div style={styles.formGroup}>
                                <label style={styles.label}>التقييم (1-5)</label>
                                <input
                                    type="number"
                                    min={1}
                                    max={5}
                                    value={form.rating}
                                    onChange={(e) => setForm({ ...form, rating: parseInt(e.target.value) })}
                                    style={styles.input}
                                />
                            </div>
                            <div style={styles.formGroup}>
                                <label style={styles.label}>رابط الصورة (اختياري)</label>
                                <input
                                    type="url"
                                    value={form.photo_url}
                                    onChange={(e) => setForm({ ...form, photo_url: e.target.value })}
                                    style={styles.input}
                                />
                            </div>
                        </div>
                        <div style={styles.formActions}>
                            <button type="submit" style={styles.submitBtn} disabled={saving}>
                                {saving ? 'جاري الحفظ...' : editing ? '💾 حفظ التعديلات' : '➕ إضافة'}
                            </button>
                            <button type="button" style={styles.cancelBtn} onClick={() => setShowForm(false)}>
                                إلغاء
                            </button>
                        </div>
                    </form>
                </div>
            )}

            {loading ? (
                <div style={styles.loading}>
                    <div style={styles.spinner} />
                    <p>جاري التحميل...</p>
                </div>
            ) : testimonials.length === 0 ? (
                <div style={styles.empty}>📭 لا توجد شهادات بعد</div>
            ) : (
                <div style={styles.grid}>
                    {testimonials.map((t) => (
                        <div key={t.id} style={styles.card(t.is_visible)}>
                            <div style={styles.cardHeader}>
                                <div style={styles.avatar}>
                                    {t.photo_url ? (
                                        // eslint-disable-next-line @next/next/no-img-element
                                        <img src={t.photo_url} alt={t.name} style={styles.avatarImg} />
                                    ) : (
                                        <span>{t.name.charAt(0)}</span>
                                    )}
                                </div>
                                <div>
                                    <h4 style={styles.cardName}>{t.name}</h4>
                                    <p style={styles.cardTitle}>{t.title || ''}</p>
                                </div>
                                <div style={styles.cardRating}>
                                    {Array(t.rating).fill('⭐').join('')}
                                </div>
                            </div>
                            {!t.is_visible && <span style={styles.hiddenBadge}>مخفية</span>}
                            <p style={styles.cardContent}>{t.content}</p>
                            <div style={styles.cardActions}>
                                <button
                                    style={styles.actionBtn(t.is_visible ? '#f59e0b' : '#22c55e')}
                                    onClick={() => handleToggle(t.id, t.is_visible)}
                                >
                                    {t.is_visible ? '👁 إخفاء' : '👁 إظهار'}
                                </button>
                                <button style={styles.actionBtn('#8b5cf6')} onClick={() => handleEdit(t)}>
                                    ✏️ تعديل
                                </button>
                                <button style={styles.actionBtn('#ef4444')} onClick={() => handleDelete(t.id)}>
                                    🗑 حذف
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    )
}
