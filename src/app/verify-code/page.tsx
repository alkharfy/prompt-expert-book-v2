'use client'

import { useState, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import AuthCard from '@/components/auth/AuthCard'
import AuthInput from '@/components/auth/AuthInput'
import Navigation from '@/components/Navigation'
import { authSystem } from '@/lib/auth_system'
import { authLogger } from '@/lib/logger'
import '@/app/auth.css'

function VerifyCodeContent() {
    const router = useRouter()
    const searchParams = useSearchParams()
    const userId = searchParams.get('uid')

    const [code, setCode] = useState('')
    const [error, setError] = useState('')
    const [isLoading, setIsLoading] = useState(false)

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setError('')

        if (!code || code.length < 6) {
            setError('يرجى إدخال الكود الصحيح')
            return
        }

        if (!userId) {
            setError('رابط غير صالح، يرجى التسجيل مرة أخرى')
            return
        }

        setIsLoading(true)

        try {
            // Verify code via server-side API route (uses service_role, bypasses RLS)
            const response = await fetch('/api/auth/verify-code', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId, code }),
            })

            const result = await response.json()

            if (!result.ok) {
                setError(result.error || 'حدث خطأ غير متوقع')
                setIsLoading(false)
                return
            }

            // Login the user automatically (callerVerified=true because code was verified server-side above)
            const loginResult = await authSystem.loginWithUserId(userId, true)

            if (loginResult.ok) {
                router.push('/toc')
            } else {
                // If auto-login fails, redirect to login page
                router.push('/login?verified=true')
            }
        } catch (err) {
            authLogger.error('Verification error:', err)
            setError('حدث خطأ غير متوقع')
        }

        setIsLoading(false)
    }

    return (
        <main className="auth-container">
            <Navigation />

            <AuthCard
                title="تفعيل الحساب"
                subtitle="أدخل الكود السري للمتابعة"
            >
                {error && <div className="auth-global-error" role="alert">{error}</div>}

                <form className="auth-form" onSubmit={handleSubmit}>
                    <div className="verify-code-info">
                        <p className="verify-code-text">
                            تم إنشاء حسابك بنجاح. يرجى إدخال الكود السري لتفعيل حسابك والوصول إلى المحتوى.
                        </p>
                    </div>

                    <AuthInput
                        id="verify-code"
                        label="الكود السري"
                        name="code"
                        type="text"
                        value={code}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => setCode(e.target.value.toUpperCase())}
                        placeholder="أدخل الكود هنا"
                        required
                        maxLength={8}
                        style={{ textAlign: 'center', letterSpacing: '0.3em', fontSize: '1.5rem' }}
                    />

                    <button
                        type="submit"
                        className="btn btn-primary mt-md"
                        disabled={isLoading}
                    >
                        {isLoading ? <div className="auth-loader"></div> : "تفعيل الحساب"}
                    </button>
                </form>

                <div className="auth-footer">
                    <p className="verify-footer-note">
                        لم تحصل على الكود؟ يرجى التواصل مع الدعم الفني
                    </p>
                </div>
            </AuthCard>
        </main>
    )
}

export default function VerifyCodePage() {
    return (
        <Suspense fallback={<div className="auth-container"><div className="auth-loader"></div></div>}>
            <VerifyCodeContent />
        </Suspense>
    )
}
