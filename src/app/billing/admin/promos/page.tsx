'use client'

/**
 * Admin Promo Codes Management Page
 * 
 * إدارة أكواد الخصم - إنشاء وتعديل وتعطيل وحذف
 */

import { useEffect, useState, useCallback } from 'react'

interface PromoCode {
    id: string
    code: string
    description: string | null
    discount_type: 'percentage' | 'fixed'
    discount_value: number
    max_uses: number | null
    current_uses: number
    min_amount: number
    max_discount: number | null
    allowed_plans: string[] | null
    starts_at: string
    expires_at: string | null
    is_active: boolean
    created_at: string
}

const emptyPromo: Omit<PromoCode, 'id' | 'current_uses' | 'created_at'> = {
    code: '',
    description: '',
    discount_type: 'percentage',
    discount_value: 10,
    max_uses: null,
    min_amount: 0,
    max_discount: null,
    allowed_plans: null,
    starts_at: new Date().toISOString().slice(0, 16),
    expires_at: null,
    is_active: true,
}

export default function AdminPromosPage() {
    const [promos, setPromos] = useState<PromoCode[]>([])
    const [loading, setLoading] = useState(true)
    const [showModal, setShowModal] = useState(false)
    const [editingPromo, setEditingPromo] = useState<any>(null)
    const [isNew, setIsNew] = useState(false)
    const [saving, setSaving] = useState(false)
    const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null)
    const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null)

    const showToast = (message: string, type: 'success' | 'error') => {
        setToast({ message, type })
    }

    const fetchPromos = useCallback(async () => {
        try {
            const response = await fetch('/api/admin/promos')
            const data = await response.json()
            if (data.ok) {
                setPromos(data.promos)
            } else {
                showToast('فشل تحميل أكواد الخصم', 'error')
            }
        } catch (error) {
            console.error('Failed to fetch promos:', error)
            showToast('حدث خطأ في تحميل البيانات', 'error')
        } finally {
            setLoading(false)
        }
    }, [])

    useEffect(() => {
        fetchPromos()
    }, [fetchPromos])

    useEffect(() => {
        if (toast) {
            const timer = setTimeout(() => setToast(null), 3000)
            return () => clearTimeout(timer)
        }
    }, [toast])

    const handleCreate = () => {
        setEditingPromo({ ...emptyPromo })
        setIsNew(true)
        setShowModal(true)
    }

    const handleEdit = (promo: PromoCode) => {
        setEditingPromo({
            ...promo,
            starts_at: promo.starts_at ? new Date(promo.starts_at).toISOString().slice(0, 16) : '',
            expires_at: promo.expires_at ? new Date(promo.expires_at).toISOString().slice(0, 16) : '',
        })
        setIsNew(false)
        setShowModal(true)
    }

    const handleSave = async () => {
        if (!editingPromo) return
        setSaving(true)

        try {
            // Strip non-updatable fields for PUT
            const { id, current_uses, created_at, updated_at, ...editableFields } = editingPromo

            const payload = {
                ...editableFields,
                starts_at: editingPromo.starts_at ? new Date(editingPromo.starts_at).toISOString() : null,
                expires_at: editingPromo.expires_at ? new Date(editingPromo.expires_at).toISOString() : null,
            }

            const url = isNew ? '/api/admin/promos' : `/api/admin/promos/${editingPromo.id}`
            const method = isNew ? 'POST' : 'PUT'

            const response = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            })

            const data = await response.json()

            if (data.ok) {
                showToast(isNew ? 'تم إنشاء كود الخصم بنجاح!' : 'تم تحديث كود الخصم بنجاح!', 'success')
                setShowModal(false)
                setEditingPromo(null)
                fetchPromos()
            } else {
                showToast(data.error || 'فشلت العملية', 'error')
            }
        } catch (error) {
            console.error('Save error:', error)
            showToast('حدث خطأ غير متوقع', 'error')
        } finally {
            setSaving(false)
        }
    }

    const handleToggleActive = async (promo: PromoCode) => {
        try {
            const response = await fetch(`/api/admin/promos/${promo.id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ is_active: !promo.is_active }),
            })

            const data = await response.json()
            if (data.ok) {
                showToast(promo.is_active ? 'تم تعطيل الكود' : 'تم تفعيل الكود', 'success')
                fetchPromos()
            }
        } catch (error) {
            showToast('فشل تغيير الحالة', 'error')
        }
    }

    const handleDelete = async (id: string) => {
        try {
            const response = await fetch(`/api/admin/promos/${id}`, { method: 'DELETE' })
            const data = await response.json()
            if (data.ok) {
                showToast('تم حذف الكود بنجاح', 'success')
                setDeleteConfirm(null)
                fetchPromos()
            } else {
                showToast('فشل حذف الكود', 'error')
            }
        } catch (error) {
            showToast('حدث خطأ في الحذف', 'error')
        }
    }

    const formatDate = (dateStr: string | null) => {
        if (!dateStr) return '—'
        return new Date(dateStr).toLocaleDateString('ar-EG', {
            year: 'numeric', month: 'short', day: 'numeric',
        })
    }

    const isExpired = (promo: PromoCode) => {
        if (!promo.expires_at) return false
        return new Date(promo.expires_at) < new Date()
    }

    const isMaxedOut = (promo: PromoCode) => {
        if (promo.max_uses === null) return false
        return promo.current_uses >= promo.max_uses
    }

    if (loading) {
        return (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '60vh' }}>
                <div style={{ textAlign: 'center' }}>
                    <div style={{
                        width: '40px', height: '40px',
                        border: '3px solid rgba(139, 92, 246, 0.2)',
                        borderTopColor: '#8b5cf6', borderRadius: '50%',
                        animation: 'spin 0.8s linear infinite',
                        margin: '0 auto 1rem',
                    }} />
                    <p style={{ color: '#9ca3af' }}>جاري تحميل أكواد الخصم...</p>
                    <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
                </div>
            </div>
        )
    }

    return (
        <div dir="rtl">
            {/* Toast */}
            {toast && (
                <div style={{
                    position: 'fixed', top: '1.5rem', left: '50%',
                    transform: 'translateX(-50%)', zIndex: 100,
                    padding: '0.85rem 1.5rem', borderRadius: '12px',
                    backgroundColor: toast.type === 'success' ? 'rgba(16, 185, 129, 0.95)' : 'rgba(239, 68, 68, 0.95)',
                    color: '#fff', fontWeight: 600, fontSize: '0.9rem',
                    boxShadow: '0 8px 32px rgba(0,0,0,0.3)',
                    display: 'flex', alignItems: 'center', gap: '0.5rem',
                    animation: 'slideDown 0.3s ease',
                }}>
                    <span>{toast.type === 'success' ? '✅' : '❌'}</span>
                    {toast.message}
                </div>
            )}
            <style>{`
                @keyframes slideDown { from { opacity: 0; transform: translateX(-50%) translateY(-20px) } to { opacity: 1; transform: translateX(-50%) translateY(0) } }
                @keyframes modalIn { from { opacity: 0; transform: scale(0.95) translateY(10px) } to { opacity: 1; transform: scale(1) translateY(0) } }
            `}</style>

            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
                <div>
                    <h1 style={{
                        fontSize: '1.75rem', fontWeight: 800, color: '#f1f5f9',
                        marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.75rem',
                    }}>
                        <span style={{
                            width: '42px', height: '42px', borderRadius: '12px',
                            background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.2rem',
                        }}>🏷️</span>
                        أكواد الخصم
                    </h1>
                    <p style={{ color: '#6b7280', fontSize: '0.9rem', marginRight: '3.5rem' }}>
                        إنشاء وإدارة أكواد الخصم الترويجية
                    </p>
                </div>
                <button
                    onClick={handleCreate}
                    style={{
                        padding: '0.75rem 1.5rem', borderRadius: '12px',
                        background: 'linear-gradient(135deg, #8b5cf6 0%, #6d28d9 100%)',
                        border: 'none', color: '#fff', fontWeight: 700, fontSize: '0.9rem',
                        cursor: 'pointer', fontFamily: 'inherit',
                        display: 'flex', alignItems: 'center', gap: '0.5rem',
                        transition: 'all 0.2s',
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-2px)'}
                    onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}
                >
                    <span style={{ fontSize: '1.1rem' }}>+</span>
                    إنشاء كود جديد
                </button>
            </div>

            {/* Stats */}
            <div style={{ display: 'flex', gap: '1rem', marginBottom: '2rem', flexWrap: 'wrap' }}>
                {[
                    { label: 'إجمالي الأكواد', value: promos.length, icon: '🏷️', color: '#6366f1' },
                    { label: 'أكواد نشطة', value: promos.filter(p => p.is_active && !isExpired(p) && !isMaxedOut(p)).length, icon: '✅', color: '#10b981' },
                    { label: 'منتهية / معطلة', value: promos.filter(p => !p.is_active || isExpired(p) || isMaxedOut(p)).length, icon: '⏸️', color: '#ef4444' },
                    { label: 'إجمالي الاستخدامات', value: promos.reduce((sum, p) => sum + p.current_uses, 0), icon: '📊', color: '#f59e0b' },
                ].map((stat, i) => (
                    <div key={i} style={{
                        flex: '1', minWidth: '150px', padding: '1rem 1.25rem',
                        borderRadius: '14px', backgroundColor: 'rgba(255,255,255,0.03)',
                        border: '1px solid rgba(255,255,255,0.06)',
                        display: 'flex', alignItems: 'center', gap: '0.85rem',
                    }}>
                        <div style={{
                            width: '40px', height: '40px', borderRadius: '10px',
                            backgroundColor: `${stat.color}18`, display: 'flex',
                            alignItems: 'center', justifyContent: 'center', fontSize: '1.1rem',
                        }}>{stat.icon}</div>
                        <div>
                            <div style={{ fontSize: '1.5rem', fontWeight: 700, color: '#f1f5f9' }}>{stat.value}</div>
                            <div style={{ fontSize: '0.75rem', color: '#6b7280' }}>{stat.label}</div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Promos List */}
            {promos.length === 0 ? (
                <div style={{
                    textAlign: 'center', padding: '4rem 2rem',
                    borderRadius: '18px', backgroundColor: 'rgba(255,255,255,0.02)',
                    border: '1px dashed rgba(255,255,255,0.1)',
                }}>
                    <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🏷️</div>
                    <p style={{ color: '#6b7280', fontSize: '1.1rem', marginBottom: '0.5rem' }}>لا توجد أكواد خصم</p>
                    <p style={{ color: '#4b5563', fontSize: '0.85rem' }}>ابدأ بإنشاء أول كود خصم</p>
                </div>
            ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                    {promos.map((promo) => {
                        const expired = isExpired(promo)
                        const maxed = isMaxedOut(promo)
                        const inactive = !promo.is_active || expired || maxed

                        return (
                            <div key={promo.id} style={{
                                borderRadius: '14px',
                                backgroundColor: inactive ? 'rgba(255,255,255,0.015)' : 'rgba(255,255,255,0.03)',
                                border: `1px solid ${inactive ? 'rgba(255,255,255,0.04)' : 'rgba(139, 92, 246, 0.15)'}`,
                                padding: '1.25rem 1.5rem',
                                opacity: inactive ? 0.6 : 1,
                                transition: 'all 0.2s',
                            }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
                                    {/* Right - Info */}
                                    <div style={{ flex: 1, minWidth: '250px' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
                                            <span style={{
                                                fontFamily: 'monospace', fontSize: '1.2rem', fontWeight: 800,
                                                color: '#f59e0b', backgroundColor: 'rgba(245, 158, 11, 0.1)',
                                                padding: '0.3rem 0.85rem', borderRadius: '8px',
                                                border: '1px solid rgba(245, 158, 11, 0.2)',
                                                letterSpacing: '0.05em',
                                            }}>{promo.code}</span>

                                            {/* Status badges */}
                                            {!promo.is_active && (
                                                <span style={{ fontSize: '0.7rem', padding: '0.2rem 0.5rem', borderRadius: '6px', backgroundColor: 'rgba(239,68,68,0.15)', color: '#f87171', border: '1px solid rgba(239,68,68,0.25)' }}>معطل</span>
                                            )}
                                            {expired && (
                                                <span style={{ fontSize: '0.7rem', padding: '0.2rem 0.5rem', borderRadius: '6px', backgroundColor: 'rgba(239,68,68,0.15)', color: '#f87171', border: '1px solid rgba(239,68,68,0.25)' }}>منتهي</span>
                                            )}
                                            {maxed && (
                                                <span style={{ fontSize: '0.7rem', padding: '0.2rem 0.5rem', borderRadius: '6px', backgroundColor: 'rgba(245,158,11,0.15)', color: '#fbbf24', border: '1px solid rgba(245,158,11,0.25)' }}>استُنفذ</span>
                                            )}
                                            {promo.is_active && !expired && !maxed && (
                                                <span style={{ fontSize: '0.7rem', padding: '0.2rem 0.5rem', borderRadius: '6px', backgroundColor: 'rgba(16,185,129,0.15)', color: '#34d399', border: '1px solid rgba(16,185,129,0.25)' }}>● نشط</span>
                                            )}
                                        </div>

                                        {promo.description && (
                                            <p style={{ color: '#9ca3af', fontSize: '0.85rem', marginBottom: '0.5rem' }}>{promo.description}</p>
                                        )}

                                        <div style={{ display: 'flex', gap: '1.5rem', flexWrap: 'wrap', fontSize: '0.8rem', color: '#6b7280' }}>
                                            <span>
                                                💰 خصم: <strong style={{ color: '#f59e0b' }}>
                                                    {promo.discount_type === 'percentage' ? `${promo.discount_value}%` : `${promo.discount_value} جنيه`}
                                                </strong>
                                            </span>
                                            <span>
                                                📊 الاستخدام: <strong style={{ color: '#d1d5db' }}>
                                                    {promo.current_uses}{promo.max_uses !== null ? ` / ${promo.max_uses}` : ' (غير محدود)'}
                                                </strong>
                                            </span>
                                            <span>📅 ينتهي: {formatDate(promo.expires_at)}</span>
                                            {promo.allowed_plans && (
                                                <span>📦 الباقات: {promo.allowed_plans.join(', ')}</span>
                                            )}
                                        </div>
                                    </div>

                                    {/* Left - Actions */}
                                    <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                                        <button
                                            onClick={() => handleEdit(promo)}
                                            title="تعديل"
                                            style={{
                                                width: '36px', height: '36px', borderRadius: '8px',
                                                backgroundColor: 'rgba(139,92,246,0.1)', border: '1px solid rgba(139,92,246,0.2)',
                                                color: '#a78bfa', cursor: 'pointer', fontSize: '0.9rem',
                                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                transition: 'all 0.2s',
                                            }}
                                            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgba(139,92,246,0.2)'}
                                            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'rgba(139,92,246,0.1)'}
                                        >✏️</button>

                                        <button
                                            onClick={() => handleToggleActive(promo)}
                                            title={promo.is_active ? 'تعطيل' : 'تفعيل'}
                                            style={{
                                                width: '36px', height: '36px', borderRadius: '8px',
                                                backgroundColor: promo.is_active ? 'rgba(245,158,11,0.1)' : 'rgba(16,185,129,0.1)',
                                                border: `1px solid ${promo.is_active ? 'rgba(245,158,11,0.2)' : 'rgba(16,185,129,0.2)'}`,
                                                color: promo.is_active ? '#fbbf24' : '#34d399',
                                                cursor: 'pointer', fontSize: '0.9rem',
                                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                transition: 'all 0.2s',
                                            }}
                                            onMouseEnter={(e) => e.currentTarget.style.opacity = '0.8'}
                                            onMouseLeave={(e) => e.currentTarget.style.opacity = '1'}
                                        >{promo.is_active ? '⏸️' : '▶️'}</button>

                                        <button
                                            onClick={() => setDeleteConfirm(promo.id)}
                                            title="حذف"
                                            style={{
                                                width: '36px', height: '36px', borderRadius: '8px',
                                                backgroundColor: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)',
                                                color: '#f87171', cursor: 'pointer', fontSize: '0.9rem',
                                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                transition: 'all 0.2s',
                                            }}
                                            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgba(239,68,68,0.2)'}
                                            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'rgba(239,68,68,0.1)'}
                                        >🗑️</button>
                                    </div>
                                </div>

                                {/* Delete confirmation */}
                                {deleteConfirm === promo.id && (
                                    <div style={{
                                        marginTop: '0.75rem', padding: '0.75rem 1rem',
                                        borderRadius: '10px', backgroundColor: 'rgba(239,68,68,0.08)',
                                        border: '1px solid rgba(239,68,68,0.2)',
                                        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                                        flexWrap: 'wrap', gap: '0.5rem',
                                    }}>
                                        <span style={{ color: '#f87171', fontSize: '0.85rem' }}>⚠️ هل أنت متأكد من حذف هذا الكود؟</span>
                                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                                            <button
                                                onClick={() => handleDelete(promo.id)}
                                                style={{
                                                    padding: '0.4rem 1rem', borderRadius: '8px',
                                                    backgroundColor: '#ef4444', border: 'none',
                                                    color: '#fff', fontWeight: 600, fontSize: '0.8rem',
                                                    cursor: 'pointer', fontFamily: 'inherit',
                                                }}
                                            >حذف</button>
                                            <button
                                                onClick={() => setDeleteConfirm(null)}
                                                style={{
                                                    padding: '0.4rem 1rem', borderRadius: '8px',
                                                    backgroundColor: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)',
                                                    color: '#9ca3af', fontWeight: 600, fontSize: '0.8rem',
                                                    cursor: 'pointer', fontFamily: 'inherit',
                                                }}
                                            >إلغاء</button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        )
                    })}
                </div>
            )}

            {/* Create/Edit Modal */}
            {showModal && editingPromo && (
                <div
                    style={{
                        position: 'fixed', inset: 0,
                        backgroundColor: 'rgba(0, 0, 0, 0.7)',
                        backdropFilter: 'blur(8px)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        padding: '1rem', zIndex: 50,
                    }}
                    onClick={(e) => { if (e.target === e.currentTarget) { setShowModal(false); setEditingPromo(null) } }}
                >
                    <div style={{
                        backgroundColor: '#131327', borderRadius: '20px',
                        border: '1px solid rgba(139, 92, 246, 0.2)',
                        maxWidth: '600px', width: '100%', maxHeight: '90vh',
                        overflowY: 'auto', padding: '2rem',
                        animation: 'modalIn 0.3s ease',
                    }}>
                        {/* Modal Header */}
                        <div style={{
                            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                            marginBottom: '1.75rem', paddingBottom: '1rem',
                            borderBottom: '1px solid rgba(255,255,255,0.06)',
                        }}>
                            <h2 style={{
                                fontSize: '1.3rem', fontWeight: 700, color: '#f1f5f9',
                                display: 'flex', alignItems: 'center', gap: '0.5rem',
                            }}>
                                <span>{isNew ? '🏷️' : '✏️'}</span>
                                {isNew ? 'إنشاء كود خصم جديد' : `تعديل: ${editingPromo.code}`}
                            </h2>
                            <button
                                onClick={() => { setShowModal(false); setEditingPromo(null) }}
                                style={{
                                    width: '32px', height: '32px', borderRadius: '8px',
                                    backgroundColor: 'rgba(255,255,255,0.06)', border: 'none',
                                    color: '#9ca3af', cursor: 'pointer', fontSize: '1.1rem',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                }}
                            >✕</button>
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                            {/* Code */}
                            <div>
                                <label style={labelStyle}>🏷️ كود الخصم</label>
                                <input
                                    type="text"
                                    value={editingPromo.code}
                                    onChange={(e) => setEditingPromo({ ...editingPromo, code: e.target.value.toUpperCase() })}
                                    placeholder="مثال: WELCOME20"
                                    style={{ ...inputStyle, fontFamily: 'monospace', letterSpacing: '0.1em', fontSize: '1.1rem' }}
                                    onFocus={(e) => e.currentTarget.style.borderColor = '#8b5cf6'}
                                    onBlur={(e) => e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)'}
                                />
                            </div>

                            {/* Description */}
                            <div>
                                <label style={labelStyle}>📝 الوصف (اختياري)</label>
                                <input
                                    type="text"
                                    value={editingPromo.description || ''}
                                    onChange={(e) => setEditingPromo({ ...editingPromo, description: e.target.value })}
                                    placeholder="مثال: خصم للطلاب الجدد"
                                    style={inputStyle}
                                    onFocus={(e) => e.currentTarget.style.borderColor = '#8b5cf6'}
                                    onBlur={(e) => e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)'}
                                />
                            </div>

                            {/* Discount Type + Value */}
                            <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                                <div style={{ flex: 1, minWidth: '150px' }}>
                                    <label style={labelStyle}>💰 نوع الخصم</label>
                                    <select
                                        value={editingPromo.discount_type}
                                        onChange={(e) => setEditingPromo({ ...editingPromo, discount_type: e.target.value })}
                                        style={inputStyle}
                                    >
                                        <option value="percentage">نسبة مئوية (%)</option>
                                        <option value="fixed">مبلغ ثابت (جنيه)</option>
                                    </select>
                                </div>
                                <div style={{ flex: 1, minWidth: '150px' }}>
                                    <label style={labelStyle}>
                                        {editingPromo.discount_type === 'percentage' ? '📊 نسبة الخصم (%)' : '💵 مبلغ الخصم (جنيه)'}
                                    </label>
                                    <input
                                        type="number"
                                        value={editingPromo.discount_value}
                                        onChange={(e) => setEditingPromo({ ...editingPromo, discount_value: parseFloat(e.target.value) || 0 })}
                                        min={1}
                                        max={editingPromo.discount_type === 'percentage' ? 100 : undefined}
                                        style={inputStyle}
                                        onFocus={(e) => e.currentTarget.style.borderColor = '#8b5cf6'}
                                        onBlur={(e) => e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)'}
                                    />
                                </div>
                            </div>

                            {/* Max Uses + Max Discount */}
                            <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                                <div style={{ flex: 1, minWidth: '150px' }}>
                                    <label style={labelStyle}>🔢 الحد الأقصى للاستخدام</label>
                                    <input
                                        type="number"
                                        value={editingPromo.max_uses ?? ''}
                                        onChange={(e) => setEditingPromo({ ...editingPromo, max_uses: e.target.value ? parseInt(e.target.value) : null })}
                                        placeholder="غير محدود"
                                        min={1}
                                        style={inputStyle}
                                        onFocus={(e) => e.currentTarget.style.borderColor = '#8b5cf6'}
                                        onBlur={(e) => e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)'}
                                    />
                                </div>
                                {editingPromo.discount_type === 'percentage' && (
                                    <div style={{ flex: 1, minWidth: '150px' }}>
                                        <label style={labelStyle}>🔝 حد أقصى للخصم (جنيه)</label>
                                        <input
                                            type="number"
                                            value={editingPromo.max_discount ?? ''}
                                            onChange={(e) => setEditingPromo({ ...editingPromo, max_discount: e.target.value ? parseFloat(e.target.value) : null })}
                                            placeholder="بدون حد"
                                            min={1}
                                            style={inputStyle}
                                            onFocus={(e) => e.currentTarget.style.borderColor = '#8b5cf6'}
                                            onBlur={(e) => e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)'}
                                        />
                                    </div>
                                )}
                            </div>

                            {/* Allowed Plans */}
                            <div>
                                <label style={labelStyle}>📦 الباقات المسموح بها (اتركها فارغة لكل الباقات)</label>
                                <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
                                    {['basic', 'pro', 'vip'].map((planId) => {
                                        const isSelected = editingPromo.allowed_plans?.includes(planId)
                                        const planNames: Record<string, string> = { basic: 'الأساسية', pro: 'المتقدمة', vip: 'VIP' }
                                        return (
                                            <label key={planId} style={{
                                                display: 'flex', alignItems: 'center', gap: '0.5rem',
                                                padding: '0.5rem 1rem', borderRadius: '10px',
                                                backgroundColor: isSelected ? 'rgba(139,92,246,0.12)' : 'rgba(255,255,255,0.03)',
                                                border: `1px solid ${isSelected ? 'rgba(139,92,246,0.3)' : 'rgba(255,255,255,0.08)'}`,
                                                cursor: 'pointer', transition: 'all 0.2s',
                                            }}>
                                                <input
                                                    type="checkbox"
                                                    checked={isSelected || false}
                                                    onChange={(e) => {
                                                        let plans = editingPromo.allowed_plans ? [...editingPromo.allowed_plans] : []
                                                        if (e.target.checked) {
                                                            plans.push(planId)
                                                        } else {
                                                            plans = plans.filter((p: string) => p !== planId)
                                                        }
                                                        setEditingPromo({ ...editingPromo, allowed_plans: plans.length > 0 ? plans : null })
                                                    }}
                                                    style={{ width: '16px', height: '16px', accentColor: '#8b5cf6' }}
                                                />
                                                <span style={{ color: '#d1d5db', fontSize: '0.85rem' }}>{planNames[planId]}</span>
                                            </label>
                                        )
                                    })}
                                </div>
                            </div>

                            {/* Dates */}
                            <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                                <div style={{ flex: 1, minWidth: '200px' }}>
                                    <label style={labelStyle}>📅 تاريخ البداية</label>
                                    <input
                                        type="datetime-local"
                                        value={editingPromo.starts_at || ''}
                                        onChange={(e) => setEditingPromo({ ...editingPromo, starts_at: e.target.value })}
                                        style={inputStyle}
                                        onFocus={(e) => e.currentTarget.style.borderColor = '#8b5cf6'}
                                        onBlur={(e) => e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)'}
                                    />
                                </div>
                                <div style={{ flex: 1, minWidth: '200px' }}>
                                    <label style={labelStyle}>📅 تاريخ الانتهاء (اختياري)</label>
                                    <input
                                        type="datetime-local"
                                        value={editingPromo.expires_at || ''}
                                        onChange={(e) => setEditingPromo({ ...editingPromo, expires_at: e.target.value || null })}
                                        style={inputStyle}
                                        onFocus={(e) => e.currentTarget.style.borderColor = '#8b5cf6'}
                                        onBlur={(e) => e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)'}
                                    />
                                </div>
                            </div>

                            {/* Active Status */}
                            <label style={{
                                display: 'flex', alignItems: 'center', gap: '0.75rem',
                                padding: '0.85rem 1rem', borderRadius: '10px',
                                backgroundColor: editingPromo.is_active ? 'rgba(16, 185, 129, 0.08)' : 'rgba(255,255,255,0.03)',
                                border: `1px solid ${editingPromo.is_active ? 'rgba(16, 185, 129, 0.2)' : 'rgba(255,255,255,0.08)'}`,
                                cursor: 'pointer',
                            }}>
                                <input
                                    type="checkbox"
                                    checked={editingPromo.is_active}
                                    onChange={(e) => setEditingPromo({ ...editingPromo, is_active: e.target.checked })}
                                    style={{ width: '18px', height: '18px', accentColor: '#8b5cf6', cursor: 'pointer' }}
                                />
                                <span style={{ color: '#d1d5db', fontSize: '0.85rem', fontWeight: 500 }}>كود نشط</span>
                            </label>
                        </div>

                        {/* Actions */}
                        <div style={{
                            display: 'flex', gap: '0.75rem', marginTop: '2rem',
                            paddingTop: '1.25rem', borderTop: '1px solid rgba(255,255,255,0.06)',
                        }}>
                            <button
                                onClick={handleSave}
                                disabled={saving}
                                style={{
                                    flex: 2, padding: '0.8rem', borderRadius: '12px',
                                    background: saving ? 'rgba(139, 92, 246, 0.3)' : 'linear-gradient(135deg, #8b5cf6 0%, #6d28d9 100%)',
                                    border: 'none', color: '#fff', fontWeight: 700, fontSize: '0.95rem',
                                    cursor: saving ? 'not-allowed' : 'pointer', fontFamily: 'inherit',
                                    opacity: saving ? 0.7 : 1, transition: 'all 0.2s',
                                }}
                            >
                                {saving ? '⏳ جاري الحفظ...' : isNew ? '🏷️ إنشاء الكود' : '💾 حفظ التغييرات'}
                            </button>
                            <button
                                onClick={() => { setShowModal(false); setEditingPromo(null) }}
                                style={{
                                    flex: 1, padding: '0.8rem', borderRadius: '12px',
                                    backgroundColor: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)',
                                    color: '#9ca3af', fontWeight: 600, fontSize: '0.9rem',
                                    cursor: 'pointer', fontFamily: 'inherit',
                                }}
                            >
                                إلغاء
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}

// Shared styles
const labelStyle: React.CSSProperties = {
    display: 'block', fontSize: '0.85rem', fontWeight: 600,
    color: '#d1d5db', marginBottom: '0.5rem',
}

const inputStyle: React.CSSProperties = {
    width: '100%', padding: '0.7rem 1rem', borderRadius: '10px',
    backgroundColor: 'rgba(255,255,255,0.04)',
    border: '1px solid rgba(255,255,255,0.1)',
    color: '#f1f5f9', fontSize: '0.95rem', fontFamily: 'inherit',
    outline: 'none', transition: 'border-color 0.2s', boxSizing: 'border-box',
}
