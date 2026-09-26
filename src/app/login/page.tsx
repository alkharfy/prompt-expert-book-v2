'use client'

import { useState, Suspense, useMemo } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import AuthCard from '@/components/auth/AuthCard'
import AuthInput from '@/components/auth/AuthInput'
import Navigation from '@/components/Navigation'
import { sanitizeEmail, isValidEmail, sanitizePassword } from '@/lib/sanitize'
import { signInWithGoogle } from '@/lib/google_auth'
import { authSystem } from '@/lib/auth_system'
import type { DeviceDisplayInfo } from '@/lib/auth_system'
import { auth, signInWithEmailAndPassword } from '@/lib/firebase_client'
import { trackLogin } from '@/lib/analytics'
import '@/app/auth.css'

// التحقق من أن المسار آمن (داخلي فقط) لمنع Open Redirect
function getSafeRedirectPath(path: string | null): string {
    if (!path || typeof path !== 'string') return '/toc'
    const trimmed = path.trim()
    // منع Open Redirect: يجب أن يكون المسار نسبياً وليس URL خارجي
    if (!trimmed.startsWith('/') || trimmed.startsWith('//') || trimmed.includes('://')) {
        return '/toc'
    }
    // التحقق من المسارات المسموحة فقط
    const allowedPrefixes = ['/read/', '/library/', '/toc', '/exercises', '/profile', '/achievements', '/tools', '/bookmarks', '/leaderboard', '/billing/admin', '/payment', '/onboarding']
    if (!allowedPrefixes.some(prefix => trimmed.startsWith(prefix))) {
        return '/toc'
    }
    return trimmed
}

function LoginContent() {
    const searchParams = useSearchParams()
    // استخدام التحقق الآمن من المسار
    const nextPath = useMemo(() => getSafeRedirectPath(searchParams.get('next')), [searchParams])

    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [error, setError] = useState('')
    const [isLoading, setIsLoading] = useState(false)
    const [isGoogleLoading, setIsGoogleLoading] = useState(false)
    const [maxDevicesReached, setMaxDevicesReached] = useState(false)
    const [deviceList, setDeviceList] = useState<DeviceDisplayInfo[]>([])
    const [selectedDeviceId, setSelectedDeviceId] = useState('')
    const [isReplacing, setIsReplacing] = useState(false)

    // Firebase + Server API login
    const login = async (userEmail: string, pass: string) => {
        try {
            // Step 1: Authenticate with Firebase client-side
            if (!auth) {
                return { ok: false, reason: 'invalid' as const, error: 'خطأ في النظام: Firebase غير مهيأ' }
            }

            let firebaseUser
            try {
                const userCredential = await signInWithEmailAndPassword(auth, userEmail.toLowerCase(), pass)
                firebaseUser = userCredential.user
            } catch (firebaseError: any) {
                if (
                    firebaseError.code === 'auth/wrong-password' ||
                    firebaseError.code === 'auth/user-not-found' ||
                    firebaseError.code === 'auth/invalid-credential'
                ) {
                    return { ok: false, reason: 'invalid' as const, error: 'البريد الإلكتروني أو كلمة المرور غير صحيحة' }
                }
                if (firebaseError.code === 'auth/too-many-requests') {
                    return { ok: false, reason: 'invalid' as const, error: 'تم تجاوز عدد المحاولات. يرجى الانتظار قليلاً' }
                }
                return { ok: false, reason: 'invalid' as const, error: 'حدث خطأ أثناء تسجيل الدخول' }
            }

            // Step 2: Call server-side login API (creates session + sets httpOnly cookies)
            // SECURITY: Send idToken for cryptographic verification instead of just UID
            const idToken = await firebaseUser.getIdToken()
            const response = await fetch('/api/auth/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    email: userEmail.toLowerCase(),
                    firebaseUid: firebaseUser.uid,
                    idToken,
                }),
            })

            const result = await response.json()

            if (result.ok) {
                return { ok: true }
            } else {
                return { ok: false, reason: 'invalid' as const, error: result.error || 'فشل تسجيل الدخول' }
            }
        } catch (err: any) {
            return { ok: false, reason: 'invalid' as const, error: 'حدث خطأ أثناء تسجيل الدخول' }
        }
    }

    const handleReplaceDevice = async () => {
        if (!selectedDeviceId) {
            setError('اختر جهاز للاستبدال')
            return
        }

        setIsReplacing(true)
        setError('')

        try {
            const userId = authSystem.getCurrentUserId()
            if (!userId) {
                // Need to get userId - try login first to get it
                const sanitizedEmail = sanitizeEmail(email)
                const sanitizedPassword = sanitizePassword(password)

                // Use switchDevice which verifies credentials
                const result = await authSystem.switchDevice(sanitizedEmail, sanitizedPassword)
                if (result.ok) {
                    setMaxDevicesReached(false)
                    window.location.href = nextPath
                    return
                }
            }

            // Use the replaceDevice API
            const res = await fetch('/api/auth/devices/replace', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    email: sanitizeEmail(email),
                    oldDeviceId: selectedDeviceId,
                }),
            })

            const data = await res.json()
            if (data.ok) {
                setMaxDevicesReached(false)
                window.location.href = nextPath
            } else {
                setError(data.error || 'فشل في استبدال الجهاز')
            }
        } catch {
            setError('حدث خطأ أثناء استبدال الجهاز')
        }

        setIsReplacing(false)
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setError('')

        // Sanitize inputs
        const sanitizedEmail = sanitizeEmail(email)
        const sanitizedPassword = sanitizePassword(password)

        // Validation
        if (!sanitizedEmail || !sanitizedPassword) {
            setError('يرجى ملء جميع الحقول')
            return
        }
        if (!isValidEmail(sanitizedEmail)) {
            setError('بريد إلكتروني غير صالح')
            return
        }
        if (sanitizedPassword.length < 6) {
            setError('كلمة المرور يجب أن تكون 6 أحرف على الأقل')
            return
        }

        setIsLoading(true)
        const result = await login(sanitizedEmail, sanitizedPassword)
        setIsLoading(false)

        if (result.ok) {
            trackLogin('email')
            // Full page reload ensures cookies are sent with the new request
            window.location.href = nextPath
            return
        } else {
            setError(result.error || 'البريد الإلكتروني أو كلمة المرور غير صحيحة')
        }
    }

    return (
        <main className="auth-container">
            <Navigation />

            <AuthCard
                title="تسجيل الدخول"
                subtitle="أهلاً بك مجدداً في رحلتك التعليمية"
            >
                {error && <div id="login-error" className="auth-global-error" role="alert">{error}</div>}

                {/* Device Replacement UI */}
                {maxDevicesReached && (
                    <div className="device-replacement-panel">
                        <div className="device-replacement-header">
                            <span className="device-replacement-icon">⚠️</span>
                            <h3>وصلت للحد الأقصى (3 أجهزة)</h3>
                            <p>اختر جهاز تريد استبداله بهذا الجهاز:</p>
                        </div>

                        <div className="device-list">
                            {deviceList.map((device) => (
                                <label
                                    key={device.device_id}
                                    className={`device-item ${selectedDeviceId === device.device_id ? 'selected' : ''}`}
                                >
                                    <input
                                        type="radio"
                                        name="replaceDevice"
                                        value={device.device_id}
                                        checked={selectedDeviceId === device.device_id}
                                        onChange={() => setSelectedDeviceId(device.device_id)}
                                    />
                                    <span className="device-icon">
                                        {device.device_type === 'Mobile' ? '📱' : device.device_type === 'Tablet' ? '📱' : '💻'}
                                    </span>
                                    <div className="device-info">
                                        <span className="device-name">
                                            {device.device_type} — {device.browser} — {device.os}
                                        </span>
                                        <span className="device-last-used">
                                            آخر استخدام: {device.last_used ? new Date(device.last_used).toLocaleDateString('ar-EG') : 'غير معروف'}
                                        </span>
                                    </div>
                                </label>
                            ))}
                        </div>

                        <button
                            type="button"
                            className="btn btn-primary mt-md"
                            onClick={handleReplaceDevice}
                            disabled={!selectedDeviceId || isReplacing}
                            style={{ width: '100%' }}
                        >
                            {isReplacing ? <div className="auth-loader"></div> : 'استبدال والدخول'}
                        </button>

                        <button
                            type="button"
                            className="btn-back-login"
                            onClick={() => {
                                setMaxDevicesReached(false)
                                setDeviceList([])
                                setSelectedDeviceId('')
                            }}
                        >
                            ← رجوع لتسجيل الدخول
                        </button>
                    </div>
                )}

                {!maxDevicesReached && (
                    <>
                {/* Google Sign-in Button */}
                <button
                    type="button"
                    className="btn-google-auth"
                    onClick={async () => {
                        setIsGoogleLoading(true)
                        setError('')
                        try {
                            const result = await signInWithGoogle()
                            if (result.ok) {
                                trackLogin('google')
                                // Navigate BEFORE any state update to prevent re-render interference
                                const hasCompletedOnboarding = localStorage.getItem('user_learning_goal')
                                if (!hasCompletedOnboarding && result.userId) {
                                    window.location.href = `/onboarding?uid=${result.userId}`
                                } else {
                                    window.location.href = nextPath
                                }
                                return // Don't update state after redirect
                            }
                            setIsGoogleLoading(false)
                            if (result.error) {
                                setError(result.error)
                            }
                        } catch {
                            setIsGoogleLoading(false)
                            setError('حدث خطأ أثناء تسجيل الدخول بـ Google')
                        }
                    }}
                    disabled={isGoogleLoading || isLoading}
                >
                    {isGoogleLoading ? (
                        <div className="auth-loader"></div>
                    ) : (
                        <>
                            <svg width="20" height="20" viewBox="0 0 24 24">
                                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/>
                                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                            </svg>
                            <span>الدخول بحساب Google</span>
                        </>
                    )}
                </button>

                <div className="auth-divider">
                    <span>أو</span>
                </div>

                <form id="login-form" className="auth-form" onSubmit={handleSubmit}>
                    <AuthInput
                        id="login-email"
                        label="البريد الإلكتروني"
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="example@mail.com"
                        required
                    />

                    <AuthInput
                        id="login-password"
                        label="كلمة المرور"
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="••••••••"
                        required
                    />

                    <div className="auth-forgot-password">
                        <Link href="/forgot-password">هل نسيت كلمة السر؟</Link>
                    </div>

                    <button
                        id="login-submit"
                        type="submit"
                        className="btn btn-primary mt-md"
                        disabled={isLoading || isGoogleLoading}
                    >
                        {isLoading ? <div className="auth-loader"></div> : "دخول"}
                    </button>
                </form>
                    </>
                )}

                <div className="auth-footer">
                    <span>ليس لديك حساب؟ </span>
                    <Link id="register-link" href={`/register${nextPath !== '/toc' ? `?next=${nextPath}` : ''}`}>
                        إنشاء حساب جديد
                    </Link>
                </div>
            </AuthCard>
        </main>
    )
}

export default function LoginPage() {
    return (
        <Suspense fallback={<div className="auth-container"><div className="auth-loader"></div></div>}>
            <LoginContent />
        </Suspense>
    )
}
