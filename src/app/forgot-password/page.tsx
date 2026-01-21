'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import AuthCard from '@/components/auth/AuthCard'
import AuthInput from '@/components/auth/AuthInput'
import Navigation from '@/components/Navigation'
import { authSystem } from '@/lib/auth_system'
import '@/app/auth.css'

export default function ForgotPasswordPage() {
    const router = useRouter()
    const [email, setEmail] = useState('')
    const [status, setStatus] = useState<{ type: 'error' | 'success', message: string } | null>(null)
    const [isLoading, setIsLoading] = useState(false)

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setStatus(null)

        if (!email) {
            setStatus({ type: 'error', message: 'يرجى إدخال البريد الإلكتروني' })
            return
        }

        if (!/\S+@\S+\.\S+/.test(email)) {
            setStatus({ type: 'error', message: 'بريد إلكتروني غير صالح' })
            return
        }

        setIsLoading(true)
        const result = await authSystem.requestPasswordReset(email)
        setIsLoading(false)

        if (result.ok) {
            setStatus({ type: 'success', message: result.message || 'تم إرسال رابط استعادة كلمة المرور لبريدك الإلكتروني، يرجى فحص البريد والضغط على الرابط الوارد فيه.' })
            // No automatic redirect, user needs to click link in email
        } else {
            setStatus({ type: 'error', message: result.error || 'حدث خطأ ما' })
        }
    }

    return (
        <main className="auth-container">
            <Navigation />

            <AuthCard
                title="استعادة كلمة المرور"
                subtitle="أدخل بريدك الإلكتروني للحصول على رمز التحقق"
            >
                {status && (
                    <div className={status.type === 'error' ? 'auth-global-error' : 'auth-global-success'}>
                        {status.message}
                    </div>
                )}

                <form className="auth-form" onSubmit={handleSubmit}>
                    <AuthInput
                        id="forgot-email"
                        label="البريد الإلكتروني"
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="example@mail.com"
                        required
                        disabled={status?.type === 'success'}
                    />

                    <button
                        type="submit"
                        className="btn btn-primary mt-md"
                        disabled={isLoading || status?.type === 'success'}
                    >
                        {isLoading ? <div className="auth-loader"></div> : "إرسال الرمز"}
                    </button>
                </form>

                <div className="auth-footer">
                    <Link href="/login">
                        تذكرت كلمة المرور؟ تسجيل الدخول
                    </Link>
                </div>
            </AuthCard>
        </main>
    )
}
