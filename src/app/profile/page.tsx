'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import AuthCard from '@/components/auth/AuthCard'
import AuthInput from '@/components/auth/AuthInput'
import Navigation from '@/components/Navigation'
import { authSystem } from '@/lib/auth_system'
import ShareButton from '@/components/sharing/ShareButton'
import { trackWhatsAppClick, trackReferralShared } from '@/lib/analytics'
import '@/app/auth.css'

interface EmailPrefs {
    reminders_enabled: boolean
    reminder_frequency: string
    preferred_time: string
    streak_reminders: boolean
    mission_reminders: boolean
    milestone_notifications: boolean
    weekly_recap: boolean
}

interface DeviceInfo {
    id: string
    device_id: string
    device_type: string
    browser: string
    os: string
    last_used: string
    is_current: boolean
}

export default function ProfilePage() {
    const router = useRouter()

    const [fullName, setFullName] = useState('')
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [confirmPassword, setConfirmPassword] = useState('')

    const [isLoading, setIsLoading] = useState(true)
    const [isUpdating, setIsUpdating] = useState(false)
    const [error, setError] = useState('')
    const [success, setSuccess] = useState('')

    // Email preferences state
    const [emailPrefs, setEmailPrefs] = useState<EmailPrefs>({
        reminders_enabled: true,
        reminder_frequency: 'smart',
        preferred_time: '18:00',
        streak_reminders: true,
        mission_reminders: true,
        milestone_notifications: true,
        weekly_recap: true,
    })
    const [emailPrefsLoading, setEmailPrefsLoading] = useState(false)
    const [emailPrefsSuccess, setEmailPrefsSuccess] = useState('')

    // Device management state
    const [devices, setDevices] = useState<DeviceInfo[]>([])
    const [maxDevices, setMaxDevices] = useState(3)
    const [devicesLoading, setDevicesLoading] = useState(true)
    const [deviceRemoving, setDeviceRemoving] = useState<string | null>(null)

    // Referral state
    const [referralCode, setReferralCode] = useState('')
    const [referralLink, setReferralLink] = useState('')
    const [referralStats, setReferralStats] = useState({ total: 0, registered: 0, paid: 0, totalEarnings: 0 })
    const [referrals, setReferrals] = useState<Array<{ email: string; status: string; reward: number; date: string }>>([])
    const [referralLoading, setReferralLoading] = useState(true)
    const [codeCopied, setCopied] = useState(false)

    useEffect(() => {
        const loadUserData = async () => {
            const userId = authSystem.getCurrentUserId()
            if (!userId) {
                router.push('/login?next=/profile')
                return
            }

            try {
                const res = await fetch('/api/user/profile')
                const data = await res.json()
                if (data.ok && data.user) {
                    setFullName(data.user.full_name || '')
                    setEmail(data.user.email)
                } else {
                    setError('فشل في تحميل بيانات المستخدم')
                }
            } catch {
                setError('فشل في تحميل بيانات المستخدم')
            }
            setIsLoading(false)
        }

        const loadEmailPrefs = async () => {
            try {
                const res = await fetch('/api/email/preferences')
                const data = await res.json()
                if (data.ok && data.preferences) {
                    setEmailPrefs({
                        reminders_enabled: data.preferences.reminders_enabled ?? true,
                        reminder_frequency: data.preferences.reminder_frequency || 'smart',
                        preferred_time: data.preferences.preferred_time || '18:00',
                        streak_reminders: data.preferences.streak_reminders ?? true,
                        mission_reminders: data.preferences.mission_reminders ?? true,
                        milestone_notifications: data.preferences.milestone_notifications ?? true,
                        weekly_recap: data.preferences.weekly_recap ?? true,
                    })
                }
            } catch {
                // Silent fail for email preferences
            }
        }

        const initLoadDevices = async () => {
            setDevicesLoading(true)
            try {
                const res = await fetch('/api/auth/devices')
                const data = await res.json()
                if (data.ok) {
                    setDevices(data.devices || [])
                    setMaxDevices(data.maxDevices || 3)
                }
            } catch {
                // Silent fail
            }
            setDevicesLoading(false)
        }

        const initLoadReferral = async () => {
            setReferralLoading(true)
            try {
                const res = await fetch('/api/referral')
                const data = await res.json()
                if (data.ok) {
                    setReferralCode(data.referralCode || '')
                    setReferralLink(data.referralLink || '')
                    setReferralStats(data.stats || { total: 0, registered: 0, paid: 0, totalEarnings: 0 })
                    setReferrals(data.referrals || [])
                }
            } catch {
                // Silent fail
            }
            setReferralLoading(false)
        }

        loadUserData()
        loadEmailPrefs()
        initLoadDevices()
        initLoadReferral()
    }, [router])

    const copyToClipboard = async (text: string) => {
        try {
            await navigator.clipboard.writeText(text)
            setCopied(true)
            setTimeout(() => setCopied(false), 2000)
        } catch {
            // Fallback
            const input = document.createElement('input')
            input.value = text
            document.body.appendChild(input)
            input.select()
            document.execCommand('copy')
            document.body.removeChild(input)
            setCopied(true)
            setTimeout(() => setCopied(false), 2000)
        }
    }

    const shareWhatsApp = () => {
        const message = `🎁 جرب كتاب PromptMaster — أحسن كتاب عربي لتعلم الـ AI Prompts!\n\nاستخدم كودي وخذ خصم 50 جنيه: ${referralCode}\n\nسجّل من هنا: ${referralLink}`
        window.open(`https://wa.me/?text=${encodeURIComponent(message)}`, '_blank')
        trackWhatsAppClick('profile_referral')
        trackReferralShared('whatsapp')
    }

    const shareX = () => {
        const message = `🎁 جرب كتاب PromptMaster — أحسن كتاب عربي لتعلم الـ AI Prompts!\n\nسجّل من هنا واحصل على خصم 50 ج.م: ${referralLink}`
        window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(message)}`, '_blank')
    }

    const loadDevices = async () => {
        setDevicesLoading(true)
        try {
            const res = await fetch('/api/auth/devices')
            const data = await res.json()
            if (data.ok) {
                setDevices(data.devices || [])
                setMaxDevices(data.maxDevices || 3)
            }
        } catch {
            // Silent fail
        }
        setDevicesLoading(false)
    }

    const removeDevice = async (deviceId: string) => {
        setDeviceRemoving(deviceId)
        try {
            const res = await fetch('/api/auth/devices', {
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ deviceId }),
            })
            const data = await res.json()
            if (data.ok) {
                setDevices(prev => prev.filter(d => d.device_id !== deviceId))
            } else {
                setError(data.error || 'فشل في إزالة الجهاز')
            }
        } catch {
            setError('فشل في إزالة الجهاز')
        }
        setDeviceRemoving(null)
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setError('')
        setSuccess('')

        const userId = authSystem.getCurrentUserId()
        if (!userId) return

        // Validation
        if (!fullName || !email) {
            setError('الاسم والبريد الإلكتروني مطلوبان')
            return
        }

        if (password && password.length < 6) {
            setError('كلمة المرور الجديدة يجب أن تكون 6 أحرف على الأقل')
            return
        }

        if (password !== confirmPassword) {
            setError('كلمات المرور غير متطابقة')
            return
        }

        setIsUpdating(true)
        try {
            const res = await fetch('/api/user/profile', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ full_name: fullName, email })
            })
            const data = await res.json()
            if (data.ok) {
                setSuccess(data.message || 'تم تحديث الملف الشخصي بنجاح')
                setPassword('')
                setConfirmPassword('')
            } else {
                setError(data.error || 'فشل في تحديث الملف الشخصي')
            }
        } catch {
            setError('فشل في تحديث الملف الشخصي')
        }

        // Handle password change via Firebase if needed
        if (password) {
            const result = await authSystem.updateProfile(userId, {
                password
            })
            if (!result.ok) {
                setError(result.error || 'فشل في تحديث كلمة المرور')
            }
        }
        setIsUpdating(false)
    }

    if (isLoading) {
        return (
            <main className="auth-container">
                <Navigation />
                <div className="auth-loader"></div>
            </main>
        )
    }

    return (
        <main className="auth-container">
            <Navigation />

            <AuthCard
                title="الملف الشخصي"
                subtitle="قم بتحديث بيانات حسابك"
            >
                {error && <div className="auth-global-error" role="alert">{error}</div>}
                {success && <div className="auth-global-success">{success}</div>}

                <form className="auth-form" onSubmit={handleSubmit}>
                    <AuthInput
                        id="profile-fullname"
                        label="الاسم الكامل"
                        type="text"
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        placeholder="أدخل اسمك الكامل"
                        required
                    />

                    <AuthInput
                        id="profile-email"
                        label="البريد الإلكتروني"
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="example@mail.com"
                        required
                    />

                    <hr style={{ border: 'none', borderTop: '1px solid rgba(255,255,255,0.1)', margin: 'var(--spacing-md) 0' }} />
                    <p style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-text-secondary)', marginBottom: 'var(--spacing-xs)' }}>
                        تغيير كلمة المرور (اتركها فارغة إذا لم تكن تريد التغيير)
                    </p>

                    <AuthInput
                        id="profile-password"
                        label="كلمة المرور الجديدة"
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="••••••••"
                    />

                    <AuthInput
                        id="profile-confirm-password"
                        label="تأكيد كلمة المرور"
                        type="password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        placeholder="••••••••"
                    />

                    <button
                        type="submit"
                        className="btn btn-primary mt-md"
                        disabled={isUpdating}
                    >
                        {isUpdating ? <div className="auth-loader"></div> : "حفظ التغييرات"}
                    </button>
                </form>

                {/* Share Progress Section */}
                <hr style={{ border: 'none', borderTop: '1px solid rgba(255,255,255,0.1)', margin: '24px 0' }} />
                
                <div className="share-progress-section">
                    <h3 className="share-progress-title">
                        📤 شارك تقدمك
                    </h3>
                    <p className="share-progress-desc">
                        شارك رحلتك مع أصحابك على السوشيال ميديا
                    </p>
                    <div className="share-progress-actions">
                        <ShareButton
                            type="weekly"
                            data={{
                                type: 'weekly',
                                title: `تقدمي في PromptMaster`,
                                subtitle: fullName || 'متعلم',
                                icon: '📊',
                            }}
                            label="شارك تقدمك"
                        />
                    </div>
                </div>

                {/* Device Management Section */}
                <hr style={{ border: 'none', borderTop: '1px solid rgba(255,255,255,0.1)', margin: '24px 0' }} />
                
                <div style={{ marginTop: '16px' }}>
                    <h3 style={{ color: '#FF6B35', fontSize: '18px', marginBottom: '4px' }}>
                        📱 الأجهزة المسجلة ({devices.length}/{maxDevices})
                    </h3>
                    <p style={{ color: '#888', fontSize: '13px', marginBottom: '16px' }}>
                        يمكنك تسجيل الدخول من {maxDevices} أجهزة كحد أقصى
                    </p>

                    {devicesLoading ? (
                        <div style={{ textAlign: 'center', padding: '20px' }}>
                            <div className="auth-loader"></div>
                        </div>
                    ) : devices.length === 0 ? (
                        <p style={{ color: '#888', fontSize: '14px', textAlign: 'center', padding: '16px' }}>
                            لا توجد أجهزة مسجلة
                        </p>
                    ) : (
                        <div className="devices-list-profile">
                            {devices.map((device) => (
                                <div
                                    key={device.device_id}
                                    className={`device-card ${device.is_current ? 'current' : ''}`}
                                >
                                    <div className="device-card-icon">
                                        {device.device_type === 'Mobile' ? '📱' : device.device_type === 'Tablet' ? '📱' : '💻'}
                                    </div>
                                    <div className="device-card-info">
                                        <span className="device-card-name">
                                            {device.device_type} — {device.browser} — {device.os}
                                        </span>
                                        <span className="device-card-meta">
                                            آخر استخدام: {device.last_used ? new Date(device.last_used).toLocaleDateString('ar-EG', {
                                                year: 'numeric',
                                                month: 'short',
                                                day: 'numeric',
                                            }) : 'غير معروف'}
                                        </span>
                                    </div>
                                    <div className="device-card-action">
                                        {device.is_current ? (
                                            <span className="device-current-badge">هذا الجهاز</span>
                                        ) : (
                                            <button
                                                className="device-remove-btn"
                                                onClick={() => removeDevice(device.device_id)}
                                                disabled={deviceRemoving === device.device_id}
                                            >
                                                {deviceRemoving === device.device_id ? '...' : 'إزالة'}
                                            </button>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Referral Section */}
                <hr style={{ border: 'none', borderTop: '1px solid rgba(255,255,255,0.1)', margin: '24px 0' }} />
                
                <div style={{ marginTop: '16px' }}>
                    <h3 style={{ color: '#FF6B35', fontSize: '18px', marginBottom: '4px' }}>
                        🎁 ادعو صديقك واكسبوا معاً!
                    </h3>
                    <p style={{ color: '#888', fontSize: '13px', marginBottom: '16px' }}>
                        شارك الكود ده مع أصحابك — كل واحد يسجل ويدفع، كلكم تاخدوا 50 ج.م
                    </p>

                    {referralLoading ? (
                        <div style={{ textAlign: 'center', padding: '20px' }}>
                            <div className="auth-loader"></div>
                        </div>
                    ) : !referralCode ? (
                        <div style={{
                            textAlign: 'center',
                            padding: '20px',
                            background: 'rgba(255,107,53,0.06)',
                            border: '1px solid rgba(255,107,53,0.15)',
                            borderRadius: '12px',
                            color: '#aaa',
                            fontSize: '14px',
                        }}>
                            <p style={{ margin: '0 0 12px' }}>⚠️ لم نتمكن من تحميل كود الإحالة</p>
                            <button
                                className="referral-copy-btn"
                                onClick={async () => {
                                    setReferralLoading(true)
                                    try {
                                        const res = await fetch('/api/referral')
                                        const data = await res.json()
                                        if (data.ok) {
                                            setReferralCode(data.referralCode || '')
                                            setReferralLink(data.referralLink || '')
                                            setReferralStats(data.stats || { total: 0, registered: 0, paid: 0, totalEarnings: 0 })
                                            setReferrals(data.referrals || [])
                                        } else {
                                            setError(data.error || 'فشل في تحميل كود الإحالة')
                                        }
                                    } catch {
                                        setError('فشل في الاتصال بالخادم')
                                    } finally {
                                        setReferralLoading(false)
                                    }
                                }}
                            >
                                🔄 إعادة المحاولة
                            </button>
                        </div>
                    ) : (
                        <>
                            {/* Referral Code Box */}
                            <div className="referral-code-box">
                                <span className="referral-code-text">{referralCode}</span>
                                <button
                                    className="referral-copy-btn"
                                    onClick={() => copyToClipboard(referralCode)}
                                >
                                    {codeCopied ? '✅ تم النسخ' : '📋 نسخ'}
                                </button>
                            </div>

                            {/* Share Buttons */}
                            <div className="referral-share-row">
                                <button
                                    className="referral-share-btn link"
                                    onClick={() => copyToClipboard(referralLink)}
                                >
                                    📋 نسخ الرابط
                                </button>
                                <button
                                    className="referral-share-btn whatsapp"
                                    onClick={shareWhatsApp}
                                >
                                    💬 WhatsApp
                                </button>
                                <button
                                    className="referral-share-btn x"
                                    onClick={shareX}
                                >
                                    🐦 X
                                </button>
                            </div>

                            {/* How it works */}
                            <div className="referral-how-it-works">
                                <p style={{ color: '#aaa', fontSize: '13px', fontWeight: 600, marginBottom: '8px' }}>
                                    كيف يعمل؟
                                </p>
                                <div className="referral-steps">
                                    <div className="referral-step">
                                        <span className="step-num">1</span>
                                        <span>شارك كودك مع صديقك</span>
                                    </div>
                                    <div className="referral-step">
                                        <span className="step-num">2</span>
                                        <span>صديقك يسجل ويحصل على خصم 50 ج.م</span>
                                    </div>
                                    <div className="referral-step">
                                        <span className="step-num">3</span>
                                        <span>أنت كمان تحصل على 50 ج.م رصيد</span>
                                    </div>
                                </div>
                            </div>

                            {/* Referral Stats */}
                            {referralStats.total > 0 && (
                                <div className="referral-stats-section">
                                    <p style={{ color: '#aaa', fontSize: '13px', fontWeight: 600, marginBottom: '10px' }}>
                                        إحالاتك
                                    </p>
                                    {referrals.map((ref, i) => (
                                        <div key={i} className="referral-item">
                                            <span className="referral-item-icon">
                                                {ref.status === 'rewarded' || ref.status === 'paid' ? '✅' : '⏳'}
                                            </span>
                                            <span className="referral-item-email">{ref.email}</span>
                                            <span className="referral-item-status">
                                                {ref.status === 'rewarded' ? `كسبت ${ref.reward} ج.م` : 
                                                 ref.status === 'paid' ? 'دفع' :
                                                 ref.status === 'registered' ? 'سجّل' : 'مستنية'}
                                            </span>
                                        </div>
                                    ))}
                                    <div className="referral-total">
                                        📊 إجمالي المكسب: {referralStats.totalEarnings} ج.م
                                    </div>
                                </div>
                            )}
                        </>
                    )}
                </div>

                {/* Subscription Management Link */}
                <hr style={{ border: 'none', borderTop: '1px solid rgba(255,255,255,0.1)', margin: '24px 0' }} />
                
                <div style={{ marginTop: '16px', marginBottom: '8px' }}>
                    <h3 style={{ color: '#FF6B35', fontSize: '18px', marginBottom: '12px' }}>
                        💳 الاشتراك والدفع
                    </h3>
                    <a
                        href="/profile/subscription"
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            padding: '14px 18px',
                            background: 'rgba(255,107,53,0.05)',
                            border: '1px solid rgba(255,107,53,0.15)',
                            borderRadius: '12px',
                            color: 'rgba(255,255,255,0.8)',
                            textDecoration: 'none',
                            fontSize: '0.95rem',
                            fontWeight: 600,
                            transition: 'all 0.2s',
                            minHeight: '44px',
                        }}
                    >
                        <span>إدارة الاشتراك وسجل المدفوعات</span>
                        <span style={{ color: '#FF6B35' }}>←</span>
                    </a>
                </div>

                {/* Email Preferences Section */}
                <hr style={{ border: 'none', borderTop: '1px solid rgba(255,255,255,0.1)', margin: '24px 0' }} />
                
                <div style={{ marginTop: '16px' }}>
                    <h3 style={{ color: '#FF6B35', fontSize: '18px', marginBottom: '16px' }}>
                        📧 تفضيلات الإيميل
                    </h3>

                    {emailPrefsSuccess && (
                        <div className="auth-global-success" style={{ marginBottom: '12px' }}>{emailPrefsSuccess}</div>
                    )}

                    {/* Master toggle */}
                    <label style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px', cursor: 'pointer' }}>
                        <input
                            type="checkbox"
                            checked={emailPrefs.reminders_enabled}
                            onChange={(e) => setEmailPrefs(prev => ({ ...prev, reminders_enabled: e.target.checked }))}
                            style={{ width: '18px', height: '18px', accentColor: '#FF6B35' }}
                        />
                        <span style={{ color: '#e0e0e0', fontSize: '15px' }}>تفعيل التذكيرات بالإيميل</span>
                    </label>

                    {emailPrefs.reminders_enabled && (
                        <>
                            {/* Individual toggles */}
                            {[
                                { key: 'streak_reminders' as const, label: '🔥 تذكيرات الـ Streak' },
                                { key: 'mission_reminders' as const, label: '🎯 تذكيرات المهام اليومية' },
                                { key: 'milestone_notifications' as const, label: '🏆 تهنئة بالإنجازات' },
                                { key: 'weekly_recap' as const, label: '📊 الملخص الأسبوعي' },
                            ].map(item => (
                                <label key={item.key} style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px', cursor: 'pointer', paddingRight: '8px' }}>
                                    <input
                                        type="checkbox"
                                        checked={emailPrefs[item.key]}
                                        onChange={(e) => setEmailPrefs(prev => ({ ...prev, [item.key]: e.target.checked }))}
                                        style={{ width: '16px', height: '16px', accentColor: '#FF6B35' }}
                                    />
                                    <span style={{ color: '#bbb', fontSize: '14px' }}>{item.label}</span>
                                </label>
                            ))}

                            {/* Frequency select */}
                            <div style={{ marginTop: '16px', marginBottom: '12px' }}>
                                <label style={{ color: '#aaa', fontSize: '13px', display: 'block', marginBottom: '6px' }}>
                                    التكرار:
                                </label>
                                <select
                                    value={emailPrefs.reminder_frequency}
                                    onChange={(e) => setEmailPrefs(prev => ({ ...prev, reminder_frequency: e.target.value }))}
                                    style={{
                                        background: '#1a1a1a',
                                        color: '#e0e0e0',
                                        border: '1px solid rgba(255,255,255,0.15)',
                                        borderRadius: '8px',
                                        padding: '8px 12px',
                                        fontSize: '14px',
                                        width: '100%',
                                    }}
                                >
                                    <option value="smart">🧠 ذكي (يقرر تلقائياً)</option>
                                    <option value="daily">يومياً</option>
                                    <option value="every_3_days">كل 3 أيام</option>
                                    <option value="weekly">أسبوعياً</option>
                                </select>
                            </div>

                            {/* Preferred time */}
                            <div style={{ marginBottom: '16px' }}>
                                <label style={{ color: '#aaa', fontSize: '13px', display: 'block', marginBottom: '6px' }}>
                                    الوقت المفضل:
                                </label>
                                <select
                                    value={emailPrefs.preferred_time}
                                    onChange={(e) => setEmailPrefs(prev => ({ ...prev, preferred_time: e.target.value }))}
                                    style={{
                                        background: '#1a1a1a',
                                        color: '#e0e0e0',
                                        border: '1px solid rgba(255,255,255,0.15)',
                                        borderRadius: '8px',
                                        padding: '8px 12px',
                                        fontSize: '14px',
                                        width: '100%',
                                    }}
                                >
                                    {['08:00', '10:00', '12:00', '14:00', '16:00', '18:00', '20:00', '22:00'].map(t => (
                                        <option key={t} value={t}>{t}</option>
                                    ))}
                                </select>
                            </div>
                        </>
                    )}

                    <button
                        type="button"
                        onClick={async () => {
                            setEmailPrefsLoading(true)
                            setEmailPrefsSuccess('')
                            try {
                                const res = await fetch('/api/email/preferences', {
                                    method: 'PUT',
                                    headers: { 'Content-Type': 'application/json' },
                                    body: JSON.stringify(emailPrefs),
                                })
                                const data = await res.json()
                                if (data.ok) {
                                    setEmailPrefsSuccess('تم حفظ تفضيلات الإيميل ✅')
                                    setTimeout(() => setEmailPrefsSuccess(''), 3000)
                                }
                            } catch {
                                // Silent fail
                            }
                            setEmailPrefsLoading(false)
                        }}
                        disabled={emailPrefsLoading}
                        className="btn btn-primary"
                        style={{ width: '100%', marginTop: '4px' }}
                    >
                        {emailPrefsLoading ? 'جاري الحفظ...' : 'حفظ تفضيلات الإيميل'}
                    </button>
                </div>
            </AuthCard>
        </main>
    )
}
