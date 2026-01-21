'use client'

import { useState, Suspense, useMemo } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import AuthCard from '@/components/auth/AuthCard'
import AuthInput from '@/components/auth/AuthInput'
import Navigation from '@/components/Navigation'
import { authSystem } from '@/lib/auth_system'
import { sanitizeEmail, isValidEmail, sanitizePassword } from '@/lib/sanitize'
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
    const allowedPrefixes = ['/read/', '/library/', '/toc', '/exercises', '/profile', '/achievements', '/tools', '/bookmarks', '/leaderboard']
    if (!allowedPrefixes.some(prefix => trimmed.startsWith(prefix))) {
        return '/toc'
    }
    return trimmed
}

function LoginContent() {
    const router = useRouter()
    const searchParams = useSearchParams()
    // استخدام التحقق الآمن من المسار
    const nextPath = useMemo(() => getSafeRedirectPath(searchParams.get('next')), [searchParams])

    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [error, setError] = useState('')
    const [isLoading, setIsLoading] = useState(false)

    // Custom auth system login with device fingerprinting
    const login = async (userEmail: string, pass: string) => {
        const result = await authSystem.login(userEmail, pass)
        if (result.ok) {
            return { ok: true }
        } else if (result.deviceMismatch) {
            return { ok: false, reason: 'device_mismatch' as const, error: result.error }
        } else {
            return { ok: false, reason: 'invalid' as const, error: result.error }
        }
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
            router.push(nextPath)
        } else {
            if (result.reason === 'device_mismatch') {
                setError(result.error || 'لا يمكن تسجيل الدخول من جهاز جديد. تم تحديد جهاز آخر سابقًا.')
            } else if (result.reason === 'invalid') {
                setError(result.error || 'البريد الإلكتروني أو كلمة المرور غير صحيحة')
            } else {
                setError('حدث خطأ في الاتصال، حاول مرة أخرى')
            }
        }
    }

    return (
        <main className="auth-container">
            <Navigation />

            <AuthCard
                title="تسجيل الدخول"
                subtitle="أهلاً بك مجدداً في رحلتك التعليمية"
            >
                {error && <div id="login-error" className="auth-global-error">{error}</div>}

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
                        disabled={isLoading}
                    >
                        {isLoading ? <div className="auth-loader"></div> : "دخول"}
                    </button>
                </form>

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
