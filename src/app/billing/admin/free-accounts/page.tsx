'use client'

/**
 * Admin Free Accounts Page
 *
 * إصدار حسابات مجانية (مثلاً لموظفي العملاء): الأدمن يختار الباقة والمدة،
 * والنظام يولّد كلمة مرور تظهر مرة واحدة فقط لتسليمها للموظف.
 * القائمة تعرض كل الاشتراكات المجانية مع تمديد/إلغاء.
 *
 * @module app/billing/admin/free-accounts/page
 */

import { useEffect, useState, useCallback } from 'react'

type PlanId = 'basic' | 'pro' | 'vip'

interface FreeAccount {
    id: string
    plan_id: PlanId
    status: string
    starts_at: string
    expires_at: string
    created_at: string
    users: { email: string; full_name: string | null } | null
}

interface CreatedAccount {
    fullName: string
    email: string
    planId: PlanId
    expiresAt: string
    password: string | null
    existingAccount: boolean
}

const PLAN_LABELS: Record<PlanId, string> = { basic: 'أساسية', pro: 'احترافية', vip: 'مميزة (VIP)' }
const DURATIONS = [
    { days: 30, label: '30 يوم' },
    { days: 90, label: '3 شهور' },
    { days: 180, label: '6 شهور' },
    { days: 365, label: 'سنة' },
]
const EXTEND_DAYS = [30, 90, 180, 365]

const inputStyle: React.CSSProperties = {
    width: '100%',
    padding: '0.75rem 1rem',
    borderRadius: '8px',
    border: '1px solid #374151',
    backgroundColor: '#111827',
    color: '#fff',
    fontSize: '0.95rem',
}
const labelStyle: React.CSSProperties = { display: 'block', fontSize: '0.85rem', color: '#9ca3af', marginBottom: '0.4rem' }
const cardStyle: React.CSSProperties = { padding: '1.5rem', backgroundColor: '#1f2937', borderRadius: '12px', border: '1px solid #374151' }

function isLive(acc: FreeAccount) {
    return acc.status === 'active' && new Date(acc.expires_at) > new Date()
}

export default function AdminFreeAccountsPage() {
    const [accounts, setAccounts] = useState<FreeAccount[]>([])
    const [loading, setLoading] = useState(true)
    const [form, setForm] = useState({ fullName: '', email: '', planId: 'vip' as PlanId, durationDays: 365 })
    const [creating, setCreating] = useState(false)
    const [created, setCreated] = useState<CreatedAccount | null>(null)
    const [copied, setCopied] = useState(false)
    const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null)
    const [extendDays, setExtendDays] = useState<Record<string, number>>({})
    const [busyId, setBusyId] = useState<string | null>(null)
    const [confirmCancelId, setConfirmCancelId] = useState<string | null>(null)

    const fetchAccounts = useCallback(async () => {
        try {
            const res = await fetch('/api/admin/accounts', { cache: 'no-store' })
            const data = await res.json()
            if (data.ok) setAccounts(data.accounts)
            else setToast({ message: 'فشل تحميل الحسابات المجانية', type: 'error' })
        } catch {
            setToast({ message: 'حدث خطأ في تحميل البيانات', type: 'error' })
        } finally {
            setLoading(false)
        }
    }, [])

    useEffect(() => {
        fetchAccounts()
    }, [fetchAccounts])

    useEffect(() => {
        if (!toast) return
        const timer = setTimeout(() => setToast(null), 4000)
        return () => clearTimeout(timer)
    }, [toast])

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault()
        setCreating(true)
        setCreated(null)
        setCopied(false)
        try {
            const res = await fetch('/api/admin/accounts', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(form),
            })
            const data = await res.json()
            if (data.ok) {
                setCreated({ ...data.account, existingAccount: data.existingAccount })
                setForm(f => ({ ...f, fullName: '', email: '' }))
                fetchAccounts()
            } else {
                setToast({ message: data.error || 'فشل إنشاء الحساب', type: 'error' })
            }
        } catch {
            setToast({ message: 'حدث خطأ غير متوقع', type: 'error' })
        } finally {
            setCreating(false)
        }
    }

    const credentialsText = (acc: CreatedAccount) => [
        `رابط الدخول: ${window.location.origin}/login`,
        `الإيميل: ${acc.email}`,
        ...(acc.password ? [`كلمة المرور: ${acc.password}`] : []),
        `الباقة: ${PLAN_LABELS[acc.planId]} — صالحة حتى ${new Date(acc.expiresAt).toLocaleDateString('ar-EG')}`,
    ].join('\n')

    const handleCopy = async () => {
        if (!created) return
        try {
            await navigator.clipboard.writeText(credentialsText(created))
            setCopied(true)
        } catch {
            setToast({ message: 'تعذّر النسخ — انسخ البيانات يدوياً', type: 'error' })
        }
    }

    const handleExtend = async (acc: FreeAccount) => {
        const days = extendDays[acc.id] || 30
        setBusyId(acc.id)
        try {
            const res = await fetch('/api/admin/subscriptions/extend', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ subscriptionId: acc.id, days }),
            })
            const data = await res.json()
            if (data.success) {
                setToast({ message: `تم التمديد ${days} يوم`, type: 'success' })
                fetchAccounts()
            } else {
                setToast({ message: data.error || 'فشل التمديد', type: 'error' })
            }
        } catch {
            setToast({ message: 'حدث خطأ غير متوقع', type: 'error' })
        } finally {
            setBusyId(null)
        }
    }

    const handleCancel = async (acc: FreeAccount) => {
        setBusyId(acc.id)
        setConfirmCancelId(null)
        try {
            const res = await fetch('/api/admin/subscriptions/cancel', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ subscriptionId: acc.id, reason: 'free account revoked by admin' }),
            })
            const data = await res.json()
            if (data.success) {
                setToast({ message: 'تم إلغاء الحساب المجاني', type: 'success' })
                fetchAccounts()
            } else {
                setToast({ message: data.error || 'فشل الإلغاء', type: 'error' })
            }
        } catch {
            setToast({ message: 'حدث خطأ غير متوقع', type: 'error' })
        } finally {
            setBusyId(null)
        }
    }

    const liveCount = accounts.filter(isLive).length

    return (
        <div>
            <div style={{ marginBottom: '2rem' }}>
                <h1 style={{ fontSize: '2rem', fontWeight: 700, marginBottom: '0.5rem' }}>الحسابات المجانية</h1>
                <p style={{ color: '#9ca3af' }}>
                    أنشئ حساباً مجانياً بالكامل (مثلاً لموظفي عميل) بالباقة والمدة التي تختارها — بدون أي دفع.
                </p>
            </div>

            {/* Create form */}
            <form onSubmit={handleCreate} style={{ ...cardStyle, marginBottom: '1.5rem' }}>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem', marginBottom: '1.25rem' }}>
                    <div>
                        <label htmlFor="fa-name" style={labelStyle}>الاسم الكامل</label>
                        <input id="fa-name" required minLength={2} maxLength={100} value={form.fullName}
                            onChange={e => setForm({ ...form, fullName: e.target.value })} style={inputStyle} />
                    </div>
                    <div>
                        <label htmlFor="fa-email" style={labelStyle}>البريد الإلكتروني</label>
                        <input id="fa-email" type="email" required dir="ltr" value={form.email}
                            onChange={e => setForm({ ...form, email: e.target.value })} style={inputStyle} />
                    </div>
                    <div>
                        <label htmlFor="fa-plan" style={labelStyle}>الباقة</label>
                        <select id="fa-plan" value={form.planId}
                            onChange={e => setForm({ ...form, planId: e.target.value as PlanId })} style={inputStyle}>
                            {(Object.keys(PLAN_LABELS) as PlanId[]).map(p => <option key={p} value={p}>{PLAN_LABELS[p]}</option>)}
                        </select>
                    </div>
                    <div>
                        <label htmlFor="fa-duration" style={labelStyle}>المدة</label>
                        <select id="fa-duration" value={form.durationDays}
                            onChange={e => setForm({ ...form, durationDays: Number(e.target.value) })} style={inputStyle}>
                            {DURATIONS.map(d => <option key={d.days} value={d.days}>{d.label}</option>)}
                        </select>
                    </div>
                </div>
                <button type="submit" disabled={creating} style={{
                    padding: '0.75rem 1.75rem', borderRadius: '8px', border: 'none', fontWeight: 600, fontSize: '0.95rem',
                    backgroundColor: creating ? '#4b5563' : '#8b5cf6', color: '#fff', cursor: creating ? 'wait' : 'pointer',
                }}>
                    {creating ? 'جاري الإنشاء...' : '🎁 إنشاء الحساب المجاني'}
                </button>
                <p style={{ color: '#6b7280', fontSize: '0.8rem', marginTop: '0.75rem', marginBottom: 0 }}>
                    لو الإيميل مسجّل بالفعل، يتم تفعيل الباقة المجانية على نفس الحساب ويدخل صاحبه بكلمة مروره الحالية.
                </p>
            </form>

            {/* One-time credentials */}
            {created && (
                <div role="status" style={{ ...cardStyle, borderColor: '#10b981', marginBottom: '2rem' }}>
                    <h2 style={{ fontSize: '1.15rem', fontWeight: 700, color: '#10b981', marginTop: 0 }}>
                        {created.existingAccount ? '✅ تم تفعيل الباقة المجانية على الحساب الموجود' : '✅ تم إنشاء الحساب'}
                    </h2>
                    <pre dir="rtl" style={{
                        whiteSpace: 'pre-wrap', backgroundColor: '#111827', padding: '1rem', borderRadius: '8px',
                        fontFamily: 'inherit', fontSize: '0.95rem', lineHeight: 1.8, margin: '0 0 1rem',
                    }}>{credentialsText(created)}</pre>
                    {created.password ? (
                        <p style={{ color: '#fbbf24', fontSize: '0.85rem', margin: '0 0 1rem' }}>
                            ⚠️ كلمة المرور تظهر هنا مرة واحدة فقط ولا تُحفظ — انسخها الآن وسلّمها للموظف.
                        </p>
                    ) : (
                        <p style={{ color: '#9ca3af', fontSize: '0.85rem', margin: '0 0 1rem' }}>
                            صاحب الحساب يدخل بكلمة مروره الحالية (أو «نسيت كلمة المرور»).
                        </p>
                    )}
                    <button type="button" onClick={handleCopy} style={{
                        padding: '0.6rem 1.25rem', borderRadius: '8px', border: 'none', fontWeight: 600,
                        backgroundColor: copied ? '#059669' : '#10b981', color: '#fff', cursor: 'pointer',
                    }}>
                        {copied ? '✓ تم النسخ' : '📋 نسخ بيانات الدخول'}
                    </button>
                </div>
            )}

            {/* List */}
            <h2 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '0.75rem' }}>
                الحسابات المجانية ({liveCount} نشط من {accounts.length})
            </h2>
            {loading ? (
                <div style={{ padding: '2rem', textAlign: 'center' }}>جاري التحميل...</div>
            ) : accounts.length === 0 ? (
                <div style={{ ...cardStyle, textAlign: 'center', color: '#9ca3af' }}>لا توجد حسابات مجانية بعد</div>
            ) : (
                <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', backgroundColor: '#1f2937', borderRadius: '12px', overflow: 'hidden' }}>
                        <thead>
                            <tr style={{ backgroundColor: '#111827', color: '#9ca3af' }}>
                                <th style={{ padding: '1rem', textAlign: 'right', fontWeight: 600 }}>المستخدم</th>
                                <th style={{ padding: '1rem', textAlign: 'center', fontWeight: 600 }}>الباقة</th>
                                <th style={{ padding: '1rem', textAlign: 'center', fontWeight: 600 }}>الحالة</th>
                                <th style={{ padding: '1rem', textAlign: 'center', fontWeight: 600 }}>ينتهي في</th>
                                <th style={{ padding: '1rem', textAlign: 'center', fontWeight: 600 }}>إجراءات</th>
                            </tr>
                        </thead>
                        <tbody>
                            {accounts.map((acc, idx) => {
                                const live = isLive(acc)
                                const busy = busyId === acc.id
                                return (
                                    <tr key={acc.id} style={{ borderTop: '1px solid #374151', backgroundColor: idx % 2 === 0 ? '#1f2937' : '#111827' }}>
                                        <td style={{ padding: '1rem' }}>
                                            <div style={{ fontWeight: 600 }}>{acc.users?.full_name || 'غير متوفر'}</div>
                                            <div dir="ltr" style={{ fontSize: '0.85rem', color: '#9ca3af', textAlign: 'right' }}>{acc.users?.email}</div>
                                        </td>
                                        <td style={{ padding: '1rem', textAlign: 'center' }}>{PLAN_LABELS[acc.plan_id] || acc.plan_id}</td>
                                        <td style={{ padding: '1rem', textAlign: 'center', color: live ? '#10b981' : acc.status === 'cancelled' ? '#6b7280' : '#ef4444', fontWeight: 600 }}>
                                            {live ? 'نشط' : acc.status === 'cancelled' ? 'ملغي' : 'منتهي'}
                                        </td>
                                        <td style={{ padding: '1rem', textAlign: 'center', fontSize: '0.875rem' }}>
                                            {new Date(acc.expires_at).toLocaleDateString('ar-EG')}
                                        </td>
                                        <td style={{ padding: '1rem', textAlign: 'center', whiteSpace: 'nowrap' }}>
                                            <select aria-label="مدة التمديد" value={extendDays[acc.id] || 30} disabled={busy}
                                                onChange={e => setExtendDays({ ...extendDays, [acc.id]: Number(e.target.value) })}
                                                style={{ ...inputStyle, width: 'auto', padding: '0.4rem 0.5rem', marginInlineEnd: '0.4rem' }}>
                                                {EXTEND_DAYS.map(d => <option key={d} value={d}>{d} يوم</option>)}
                                            </select>
                                            <button type="button" disabled={busy} onClick={() => handleExtend(acc)} style={{
                                                padding: '0.4rem 0.9rem', borderRadius: '6px', border: 'none', backgroundColor: '#3b82f6',
                                                color: '#fff', cursor: 'pointer', fontWeight: 600, marginInlineEnd: '0.4rem',
                                            }}>تمديد</button>
                                            {live && (confirmCancelId === acc.id ? (
                                                <>
                                                    <button type="button" disabled={busy} onClick={() => handleCancel(acc)} style={{
                                                        padding: '0.4rem 0.9rem', borderRadius: '6px', border: 'none', backgroundColor: '#ef4444',
                                                        color: '#fff', cursor: 'pointer', fontWeight: 600, marginInlineEnd: '0.4rem',
                                                    }}>تأكيد الإلغاء</button>
                                                    <button type="button" onClick={() => setConfirmCancelId(null)} style={{
                                                        padding: '0.4rem 0.9rem', borderRadius: '6px', border: '1px solid #4b5563',
                                                        backgroundColor: 'transparent', color: '#d1d5db', cursor: 'pointer',
                                                    }}>تراجع</button>
                                                </>
                                            ) : (
                                                <button type="button" disabled={busy} onClick={() => setConfirmCancelId(acc.id)} style={{
                                                    padding: '0.4rem 0.9rem', borderRadius: '6px', border: '1px solid #ef4444',
                                                    backgroundColor: 'transparent', color: '#ef4444', cursor: 'pointer', fontWeight: 600,
                                                }}>إلغاء</button>
                                            ))}
                                        </td>
                                    </tr>
                                )
                            })}
                        </tbody>
                    </table>
                </div>
            )}

            {toast && (
                <div role="alert" style={{
                    position: 'fixed', bottom: '1.5rem', left: '1.5rem', padding: '0.85rem 1.25rem', borderRadius: '10px',
                    backgroundColor: toast.type === 'success' ? '#065f46' : '#7f1d1d', color: '#fff', fontWeight: 600,
                    boxShadow: '0 10px 30px rgba(0,0,0,0.4)', zIndex: 50,
                }}>
                    {toast.message}
                </div>
            )}
        </div>
    )
}
