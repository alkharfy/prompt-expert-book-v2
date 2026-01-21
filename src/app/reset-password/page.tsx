'use client'

import { useState, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import AuthCard from '@/components/auth/AuthCard'
import AuthInput from '@/components/auth/AuthInput'
import Navigation from '@/components/Navigation'
import { authSystem } from '@/lib/auth_system'
import { supabase } from '@/lib/supabase'
import { authLogger } from '@/lib/logger'
import '@/app/auth.css'
import { useEffect } from 'react'

function ResetPasswordContent() {
    const router = useRouter()
    const searchParams = useSearchParams()
    const emailParam = searchParams.get('email') || ''

    const [newPassword, setNewPassword] = useState('')
    const [confirmPassword, setConfirmPassword] = useState('')
    const [status, setStatus] = useState<{ type: 'error' | 'success', message: string } | null>(null)
    const [isLoading, setIsLoading] = useState(false)
    const [isCheckingSession, setIsCheckingSession] = useState(true)

    useEffect(() => {
        // Check if we have a recovery session from the URL hash/query
        const checkSession = async () => {
            const { data } = await supabase.auth.getSession()
            authLogger.debug('Reset Password - checking session')

            if (!data.session) {
                // If no session but we have a hash, Supabase might still be processing it
                if (!window.location.hash && !window.location.search.includes('code=')) {
                    setStatus({
                        type: 'error',
                        message: 'رابط استعادة كلمة المرور غير صالح أو منتهي الصلاحية. يرجى طلب رابط جديد.'
                    })
                }
            }
            setIsCheckingSession(false)
        }

        checkSession()
    }, [])

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setStatus(null)

        if (!newPassword || !confirmPassword) {
            setStatus({ type: 'error', message: 'يرجى ملء جميع الحقول' })
            return
        }

        if (newPassword !== confirmPassword) {
            setStatus({ type: 'error', message: 'كلمات المرور غير متطابقة' })
            return
        }

        if (newPassword.length < 6) {
            setStatus({ type: 'error', message: 'كلمة المرور يجب أن تكون 6 أحرف على الأقل' })
            return
        }

        setIsLoading(true)
        const result = await authSystem.resetPassword(newPassword)
        setIsLoading(false)

        if (result.ok) {
            setStatus({ type: 'success', message: 'تم تغيير كلمة المرور بنجاح. يمكنك الآن تسجيل الدخول بكلمة المرور الجديدة.' })
            setTimeout(() => {
                router.push('/login')
            }, 3000)
        } else {
            setStatus({ type: 'error', message: result.error || 'حدث خطأ ما' })
        }
    }

    return (
        <main className="auth-container">
            <Navigation />

            <AuthCard
                title="تعيين كلمة المرور"
                subtitle="أدخل كلمة المرور الجديدة لحسابك"
            >
                {status && (
                    <div className={status.type === 'error' ? 'auth-global-error' : 'auth-global-success'}>
                        {status.message}
                    </div>
                )}

                <form className="auth-form" onSubmit={handleSubmit}>
                    <AuthInput
                        id="reset-password"
                        label="كلمة المرور الجديدة"
                        type="password"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        placeholder="••••••••"
                        required
                        disabled={status?.type === 'success'}
                    />

                    <AuthInput
                        id="confirm-password"
                        label="تأكيد كلمة المرور"
                        type="password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        placeholder="••••••••"
                        required
                        disabled={status?.type === 'success'}
                    />

                    <button
                        type="submit"
                        className="btn btn-primary mt-md"
                        disabled={isLoading || isCheckingSession || status?.type === 'success'}
                    >
                        {isLoading || isCheckingSession ? <div className="auth-loader"></div> : "تحديث كلمة المرور"}
                    </button>
                </form>

                <div className="auth-footer">
                    <Link href="/login">
                        تجاهل والعودة لتسجيل الدخول
                    </Link>
                </div>
            </AuthCard>
        </main>
    )
}

export default function ResetPasswordPage() {
    return (
        <Suspense fallback={<div className="auth-container"><div className="auth-loader"></div></div>}>
            <ResetPasswordContent />
        </Suspense>
    )
}
