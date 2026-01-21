'use client'

import { useState, useEffect, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import { getAllTestimonials, createTestimonial, updateTestimonial, deleteTestimonial, toggleTestimonialVisibility, Testimonial } from '@/lib/testimonials'
import { getPromoSettings, updatePromoSettings, togglePromoActive, PromoSettings } from '@/lib/promo'
import { dbLogger } from '@/lib/logger'
import '@/app/auth.css'
import './dashboard.css'

interface VerificationRecord {
    id: string
    user_id: string
    code: string
    created_at: string
    is_used: boolean
    used_at: string | null
    user?: {
        full_name: string
        email: string
        phone_number: string
    }
}

type TabType = 'codes' | 'testimonials' | 'settings'

export default function AdminDashboard() {
    const [activeTab, setActiveTab] = useState<TabType>('codes')

    // Verification Codes State
    const [records, setRecords] = useState<VerificationRecord[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [adminPassword, setAdminPassword] = useState('')
    const [isAuthenticated, setIsAuthenticated] = useState(false)
    const [error, setError] = useState('')
    const [filter, setFilter] = useState<'all' | 'pending' | 'used'>('pending')
    const [copiedId, setCopiedId] = useState<string | null>(null)
    const [deletingId, setDeletingId] = useState<string | null>(null)

    // Testimonials State
    const [testimonials, setTestimonials] = useState<Testimonial[]>([])
    const [testimonialsLoading, setTestimonialsLoading] = useState(false)
    const [showTestimonialForm, setShowTestimonialForm] = useState(false)
    const [editingTestimonial, setEditingTestimonial] = useState<Testimonial | null>(null)
    const [testimonialForm, setTestimonialForm] = useState({
        name: '',
        title: '',
        content: '',
        rating: 5,
        photo_url: ''
    })

    // Promo Settings State
    const [promo, setPromo] = useState<PromoSettings | null>(null)
    const [promoLoading, setPromoLoading] = useState(false)
    const [promoForm, setPromoForm] = useState({
        is_active: false,
        discount_percentage: 40,
        end_date: ''
    })
    const [sessionToken, setSessionToken] = useState<string | null>(null)

    // التحقق من Admin باستخدام Supabase
    const handleAdminLogin = async (e: React.FormEvent) => {
        e.preventDefault()
        setError('')

        try {
            // التحقق من كلمة المرور عبر API Route
            const response = await fetch('/api/admin/verify', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ password: adminPassword })
            })

            const data = await response.json()

            if (data.success && data.token) {
                setIsAuthenticated(true)
                setSessionToken(data.token)
                // تخزين التوكن بشكل آمن
                sessionStorage.setItem('admin_session', data.token)
            } else {
                setError('كلمة المرور غير صحيحة')
            }
        } catch {
            setError('حدث خطأ في الاتصال')
        }
    }

    useEffect(() => {
        // التحقق من الجلسة عند التحميل
        const checkSession = async () => {
            const token = sessionStorage.getItem('admin_session')
            if (token) {
                // التحقق من صلاحية التوكن
                try {
                    const response = await fetch('/api/admin/verify-session', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ token })
                    })
                    const data = await response.json()
                    if (data.valid) {
                        setIsAuthenticated(true)
                        setSessionToken(token)
                    } else {
                        sessionStorage.removeItem('admin_session')
                    }
                } catch {
                    sessionStorage.removeItem('admin_session')
                }
            }
        }
        checkSession()
    }, [])

    const fetchRecords = useCallback(async () => {
        setIsLoading(true)
        try {
            let query = supabase
                .from('verification_codes')
                .select(`
                    *,
                    user:users(full_name, email, phone_number)
                `)
                .order('created_at', { ascending: false })

            if (filter === 'pending') {
                query = query.eq('is_used', false)
            } else if (filter === 'used') {
                query = query.eq('is_used', true)
            }

            const { data, error } = await query

            if (error) {
                dbLogger.error('Error fetching records:', error)
                return
            }

            setRecords(data || [])
        } catch (err) {
            dbLogger.error('Fetch error:', err)
        }
        setIsLoading(false)
    }, [filter])

    useEffect(() => {
        if (isAuthenticated && activeTab === 'codes') {
            fetchRecords()
            // Auto-refresh every 10 seconds
            const interval = setInterval(fetchRecords, 10000)
            return () => clearInterval(interval)
        }
    }, [isAuthenticated, filter, activeTab, fetchRecords])

    // Fetch Testimonials
    const fetchTestimonials = useCallback(async () => {
        setTestimonialsLoading(true)
        const data = await getAllTestimonials()
        setTestimonials(data)
        setTestimonialsLoading(false)
    }, [])

    useEffect(() => {
        if (isAuthenticated && activeTab === 'testimonials') {
            fetchTestimonials()
        }
    }, [isAuthenticated, activeTab, fetchTestimonials])

    // Fetch Promo Settings
    const fetchPromoSettings = useCallback(async () => {
        setPromoLoading(true)
        const data = await getPromoSettings()
        setPromo(data)
        setPromoForm({
            is_active: data.is_active,
            discount_percentage: data.discount_percentage,
            end_date: data.end_date.split('T')[0]
        })
        setPromoLoading(false)
    }, [])

    useEffect(() => {
        if (isAuthenticated && activeTab === 'settings') {
            fetchPromoSettings()
        }
    }, [isAuthenticated, activeTab, fetchPromoSettings])

    const copyCode = (code: string, id: string) => {
        navigator.clipboard.writeText(code)
        setCopiedId(id)
        setTimeout(() => setCopiedId(null), 2000)
    }

    const handleDeleteRecord = async (userId: string, verificationCodeId: string) => {
        if (!confirm('هل أنت متأكد من حذف هذا الكود؟ سيتم حذف بيانات المستخدم والسماح له بالتسجيل مرة أخرى بنفس البريد.')) {
            return
        }

        setDeletingId(verificationCodeId)
        try {
            const response = await fetch('/api/admin/delete-pending-user', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    token: sessionToken,
                    userId,
                    verificationCodeId
                })
            })

            const data = await response.json()

            if (data.success) {
                // Refresh records
                fetchRecords()
            } else {
                alert('فشل الحذف: ' + data.error)
            }
        } catch (err) {
            alert('حدث خطأ في الاتصال بالسيرفر')
        } finally {
            setDeletingId(null)
        }
    }

    const formatDate = (dateStr: string) => {
        const date = new Date(dateStr)
        return date.toLocaleString('ar-EG', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        })
    }

    const handleLogout = () => {
        try {
            sessionStorage.removeItem('admin_session')
        } catch {
            // Ignore storage errors
        }
        setSessionToken('')
        setIsAuthenticated(false)
        setAdminPassword('')
    }

    // Testimonial handlers
    const handleTestimonialSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (editingTestimonial) {
            await updateTestimonial(editingTestimonial.id, testimonialForm)
        } else {
            await createTestimonial(testimonialForm)
        }
        setShowTestimonialForm(false)
        setEditingTestimonial(null)
        setTestimonialForm({ name: '', title: '', content: '', rating: 5, photo_url: '' })
        fetchTestimonials()
    }

    const handleEditTestimonial = (testimonial: Testimonial) => {
        setEditingTestimonial(testimonial)
        setTestimonialForm({
            name: testimonial.name,
            title: testimonial.title || '',
            content: testimonial.content,
            rating: testimonial.rating,
            photo_url: testimonial.photo_url || ''
        })
        setShowTestimonialForm(true)
    }

    const handleDeleteTestimonial = async (id: string) => {
        if (confirm('هل أنت متأكد من حذف هذا التقييم؟')) {
            await deleteTestimonial(id)
            fetchTestimonials()
        }
    }

    const handleToggleVisibility = async (id: string, isVisible: boolean) => {
        await toggleTestimonialVisibility(id, !isVisible)
        fetchTestimonials()
    }

    // Promo handlers
    const handlePromoSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        const result = await updatePromoSettings({
            discount_percentage: promoForm.discount_percentage,
            end_date: promoForm.end_date
        })
        if (!result.success && result.error) {
            setError(result.error)
        } else {
            setError('')
        }
        fetchPromoSettings()
    }

    const handlePromoToggle = async () => {
        const result = await togglePromoActive(!promoForm.is_active)
        if (!result.success && result.error) {
            setError(result.error)
        } else {
            setError('')
            setPromoForm(prev => ({ ...prev, is_active: !prev.is_active }))
        }
        fetchPromoSettings()
    }

    if (!isAuthenticated) {
        return (
            <main className="admin-login-container">
                <div className="admin-login-card">
                    <h1 className="admin-title">🔐 لوحة الإدارة</h1>
                    <p className="admin-subtitle">أدخل كلمة المرور للوصول</p>

                    {error && <div className="auth-global-error">{error}</div>}

                    <form onSubmit={handleAdminLogin} className="admin-login-form">
                        <input
                            type="password"
                            value={adminPassword}
                            onChange={(e) => setAdminPassword(e.target.value)}
                            placeholder="كلمة المرور"
                            className="auth-input"
                        />
                        <button type="submit" className="btn btn-primary">
                            دخول
                        </button>
                    </form>
                </div>
            </main>
        )
    }

    return (
        <main className="admin-container">
            <header className="admin-header">
                <div className="admin-header-content">
                    <h1>🔐 لوحة الإدارة</h1>
                    <button onClick={handleLogout} className="btn btn-secondary btn-sm">
                        تسجيل الخروج
                    </button>
                </div>

                <div className="admin-tabs">
                    <button
                        className={`tab-btn ${activeTab === 'codes' ? 'active' : ''}`}
                        onClick={() => setActiveTab('codes')}
                    >
                        🔢 أكواد التحقق
                    </button>
                    <button
                        className={`tab-btn ${activeTab === 'testimonials' ? 'active' : ''}`}
                        onClick={() => setActiveTab('testimonials')}
                    >
                        ⭐ شهادات العملاء
                    </button>
                    <button
                        className={`tab-btn ${activeTab === 'settings' ? 'active' : ''}`}
                        onClick={() => setActiveTab('settings')}
                    >
                        ⚙️ الإعدادات
                    </button>
                </div>
            </header>

            {activeTab === 'codes' && (
                <>
                    <div className="admin-controls">
                        <div className="filter-buttons">
                            <button
                                className={`filter-btn ${filter === 'pending' ? 'active' : ''}`}
                                onClick={() => setFilter('pending')}
                            >
                                ⏳ في الانتظار
                            </button>
                            <button
                                className={`filter-btn ${filter === 'used' ? 'active' : ''}`}
                                onClick={() => setFilter('used')}
                            >
                                ✅ تم الاستخدام
                            </button>
                            <button
                                className={`filter-btn ${filter === 'all' ? 'active' : ''}`}
                                onClick={() => setFilter('all')}
                            >
                                📋 الكل
                            </button>
                        </div>
                        <button onClick={fetchRecords} className="btn btn-secondary btn-sm refresh-btn">
                            🔄 تحديث
                        </button>
                    </div>

                    {isLoading ? (
                        <div className="admin-loading">
                            <div className="auth-loader"></div>
                            <p>جاري التحميل...</p>
                        </div>
                    ) : records.length === 0 ? (
                        <div className="admin-empty">
                            <p>📭 لا توجد سجلات</p>
                        </div>
                    ) : (
                        <div className="admin-table-container">
                            <table className="admin-table">
                                <thead>
                                    <tr>
                                        <th>الاسم</th>
                                        <th>البريد</th>
                                        <th>الهاتف</th>
                                        <th>الكود</th>
                                        <th>تاريخ الإنشاء</th>
                                        <th>الحالة</th>
                                        <th>إجراءات</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {records.map((record) => (
                                        <tr key={record.id} className={record.is_used ? 'used-row' : 'pending-row'}>
                                            <td>{record.user?.full_name || 'غير معروف'}</td>
                                            <td>{record.user?.email || 'غير معروف'}</td>
                                            <td className="phone-cell">{record.user?.phone_number || 'غير متوفر'}</td>
                                            <td className="code-cell">
                                                <span className="verification-code">{record.code}</span>
                                            </td>
                                            <td>{formatDate(record.created_at)}</td>
                                            <td>
                                                {record.is_used ? (
                                                    <span className="status-badge used">✅ مُستخدم</span>
                                                ) : (
                                                    <span className="status-badge pending">⏳ في الانتظار</span>
                                                )}
                                            </td>
                                            <td>
                                                <div className="admin-actions-flex">
                                                    <button
                                                        onClick={() => copyCode(record.code, record.id)}
                                                        className="btn btn-copy"
                                                        disabled={record.is_used}
                                                    >
                                                        {copiedId === record.id ? '✓ تم النسخ' : '📋 نسخ'}
                                                    </button>
                                                    {!record.is_used && (
                                                        <button
                                                            onClick={() => handleDeleteRecord(record.user_id, record.id)}
                                                            className="btn btn-delete-small"
                                                            disabled={deletingId === record.id}
                                                            title="حذف هذا الحساب والسماح له بالتسجيل مرة أخرى"
                                                        >
                                                            {deletingId === record.id ? '...' : '🗑 حذف'}
                                                        </button>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}

                    <div className="admin-stats">
                        <div className="stat-card">
                            <span className="stat-number">{records.filter(r => !r.is_used).length}</span>
                            <span className="stat-label">في الانتظار</span>
                        </div>
                        <div className="stat-card">
                            <span className="stat-number">{records.filter(r => r.is_used).length}</span>
                            <span className="stat-label">تم التفعيل</span>
                        </div>
                        <div className="stat-card">
                            <span className="stat-number">{records.length}</span>
                            <span className="stat-label">الإجمالي</span>
                        </div>
                    </div>
                </>
            )}

            {activeTab === 'testimonials' && (
                <div className="testimonials-tab">
                    <div className="tab-header">
                        <h2>⭐ إدارة شهادات العملاء</h2>
                        <button
                            onClick={() => {
                                setShowTestimonialForm(true)
                                setEditingTestimonial(null)
                                setTestimonialForm({ name: '', title: '', content: '', rating: 5, photo_url: '' })
                            }}
                            className="btn btn-primary"
                        >
                            ➕ إضافة شهادة
                        </button>
                    </div>

                    {showTestimonialForm && (
                        <div className="form-card">
                            <h3>{editingTestimonial ? 'تعديل شهادة' : 'إضافة شهادة جديدة'}</h3>
                            <form onSubmit={handleTestimonialSubmit} className="testimonial-form">
                                <div className="form-row">
                                    <div className="form-group">
                                        <label>الاسم</label>
                                        <input
                                            type="text"
                                            value={testimonialForm.name}
                                            onChange={(e) => setTestimonialForm({ ...testimonialForm, name: e.target.value })}
                                            required
                                            className="auth-input"
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label>الوظيفة</label>
                                        <input
                                            type="text"
                                            value={testimonialForm.title}
                                            onChange={(e) => setTestimonialForm({ ...testimonialForm, title: e.target.value })}
                                            required
                                            className="auth-input"
                                        />
                                    </div>
                                </div>
                                <div className="form-group">
                                    <label>المحتوى</label>
                                    <textarea
                                        value={testimonialForm.content}
                                        onChange={(e) => setTestimonialForm({ ...testimonialForm, content: e.target.value })}
                                        required
                                        rows={3}
                                        className="auth-input"
                                    />
                                </div>
                                <div className="form-row">
                                    <div className="form-group">
                                        <label>التقييم (1-5)</label>
                                        <input
                                            type="number"
                                            min={1}
                                            max={5}
                                            value={testimonialForm.rating}
                                            onChange={(e) => setTestimonialForm({ ...testimonialForm, rating: parseInt(e.target.value) })}
                                            className="auth-input"
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label>رابط الصورة (اختياري)</label>
                                        <input
                                            type="url"
                                            value={testimonialForm.photo_url}
                                            onChange={(e) => setTestimonialForm({ ...testimonialForm, photo_url: e.target.value })}
                                            className="auth-input"
                                        />
                                    </div>
                                </div>
                                <div className="form-actions">
                                    <button type="submit" className="btn btn-primary">
                                        {editingTestimonial ? 'حفظ التعديلات' : 'إضافة'}
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setShowTestimonialForm(false)}
                                        className="btn btn-secondary"
                                    >
                                        إلغاء
                                    </button>
                                </div>
                            </form>
                        </div>
                    )}

                    {testimonialsLoading ? (
                        <div className="admin-loading">
                            <div className="auth-loader"></div>
                            <p>جاري التحميل...</p>
                        </div>
                    ) : (
                        <div className="testimonials-grid">
                            {testimonials.map((t) => (
                                <div key={t.id} className={`testimonial-card-admin ${!t.is_visible ? 'hidden-card' : ''}`}>
                                    <div className="testimonial-header">
                                        <div className="testimonial-avatar">
                                            {t.photo_url ? (
                                                // eslint-disable-next-line @next/next/no-img-element
                                                <img src={t.photo_url} alt={t.name} />
                                            ) : (
                                                <span>{t.name.charAt(0)}</span>
                                            )}
                                        </div>
                                        <div className="testimonial-info">
                                            <h4>{t.name}</h4>
                                            <p>{t.title || ''}</p>
                                        </div>
                                        <div className="testimonial-rating">
                                            {Array(t.rating).fill('⭐').join('')}
                                        </div>
                                    </div>
                                    <p className="testimonial-content">{t.content}</p>
                                    <div className="testimonial-actions">
                                        <button
                                            onClick={() => handleToggleVisibility(t.id, t.is_visible)}
                                            className={`btn btn-sm ${t.is_visible ? 'btn-warning' : 'btn-success'}`}
                                        >
                                            {t.is_visible ? '👁 إخفاء' : '👁 إظهار'}
                                        </button>
                                        <button
                                            onClick={() => handleEditTestimonial(t)}
                                            className="btn btn-sm btn-secondary"
                                        >
                                            ✏️ تعديل
                                        </button>
                                        <button
                                            onClick={() => handleDeleteTestimonial(t.id)}
                                            className="btn btn-sm btn-danger"
                                        >
                                            🗑 حذف
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}

            {activeTab === 'settings' && (
                <div className="settings-tab">
                    <h2>⚙️ إعدادات العروض</h2>

                    {promoLoading ? (
                        <div className="admin-loading">
                            <div className="auth-loader"></div>
                            <p>جاري التحميل...</p>
                        </div>
                    ) : (
                        <div className="settings-card">
                            <div className="promo-toggle">
                                <span>حالة العرض الترويجي</span>
                                <button
                                    onClick={handlePromoToggle}
                                    className={`toggle-btn ${promoForm.is_active ? 'active' : ''}`}
                                >
                                    {promoForm.is_active ? '✅ مفعّل' : '❌ معطّل'}
                                </button>
                            </div>

                            <form onSubmit={handlePromoSubmit} className="promo-form">
                                <div className="form-row">
                                    <div className="form-group">
                                        <label>نسبة الخصم (%)</label>
                                        <input
                                            type="number"
                                            min={1}
                                            max={90}
                                            value={promoForm.discount_percentage}
                                            onChange={(e) => setPromoForm({ ...promoForm, discount_percentage: parseInt(e.target.value) })}
                                            className="auth-input"
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label>تاريخ انتهاء العرض</label>
                                        <input
                                            type="date"
                                            value={promoForm.end_date}
                                            onChange={(e) => setPromoForm({ ...promoForm, end_date: e.target.value })}
                                            className="auth-input"
                                        />
                                    </div>
                                </div>
                                <button type="submit" className="btn btn-primary">
                                    💾 حفظ التغييرات
                                </button>
                            </form>

                            {promo && (
                                <div className="promo-preview">
                                    <h4>معاينة العرض</h4>
                                    <div className="preview-card">
                                        <p><strong>الخصم:</strong> {promo.discount_percentage}%</p>
                                        <p><strong>ينتهي في:</strong> {new Date(promo.end_date).toLocaleDateString('ar-EG')}</p>
                                        <p><strong>الحالة:</strong> {promo.is_active ? '🟢 مفعّل' : '🔴 معطّل'}</p>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            )}
        </main>
    )
}
