'use client'

import { useState, Suspense, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import AuthCard from '@/components/auth/AuthCard'
import AuthInput from '@/components/auth/AuthInput'
import Navigation from '@/components/Navigation'
import { confirmPasswordReset } from 'firebase/auth'
import { auth } from '@/lib/firebase_client'
import { authLogger } from '@/lib/logger'
import '@/app/auth.css'

function ResetPasswordContent() {
    const router = useRouter()
    const searchParams = useSearchParams()

    const [newPassword, setNewPassword] = useState('')
    const [confirmPassword, setConfirmPassword] = useState('')
    const [status, setStatus] = useState<{ type: 'error' | 'success', message: string } | null>(null)
    const [isLoading, setIsLoading] = useState(false)
    const [oobCode, setOobCode] = useState<string | null>(null)

    useEffect(() => {
        // Get oobCode from URL (Firebase password reset token)
        const code = searchParams.get('oobCode')
        if (!code) {
            setStatus({
                type: 'error',
                message: 'رابط غير صالح أو منتهي الصلاحية. يرجى طلب رابط جديد من صفحة "نسيت كلمة المرور".'
            })
        } else {
            setOobCode(code)
        }
    }, [searchParams])

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

        if (!oobCode) {
            setStatus({ type: 'error', message: 'رابط غير صالح' })
            return
        }

        setIsLoading(true)

        try {
            // Reset password in Firebase
            if (!auth) {
                setStatus({ type: 'error', message: 'خطأ في إعداد المصادقة' })
                return
            }
            await confirmPasswordReset(auth, oobCode, newPassword)

            // Sync password hash to database via secure server-side API
            try {
                const firebaseUser = auth.currentUser
                if (firebaseUser) {
                    const idToken = await firebaseUser.getIdToken()
                    await fetch('/api/auth/sync-password', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ idToken, newPassword }),
                    })
                }
                // If user is not logged in, hash will be synced on next login
            } catch {
                // Non-critical — password was already reset in Firebase
            }

            setStatus({ type: 'success', message: 'تم تغيير كلمة المرور بنجاح! يمكنك الآن تسجيل الدخول.' })
            setTimeout(() => {
                router.push('/login')
            }, 2000)
        } catch (err: any) {
            authLogger.error('Firebase password reset error', err)
            if (err.code === 'auth/invalid-action-code') {
                setStatus({ type: 'error', message: 'الرابط غير صالح أو منتهي الصلاحية. يرجى طلب رابط جديد.' })
            } else if (err.code === 'auth/weak-password') {
                setStatus({ type: 'error', message: 'كلمة المرور ضعيفة جداً' })
            } else if (err.code === 'auth/expired-action-code') {
                setStatus({ type: 'error', message: 'الرابط منتهي الصلاحية. يرجى طلب رابط جديد.' })
            } else {
                setStatus({ type: 'error', message: 'حدث خطأ غير متوقع' })
            }
        } finally {
            setIsLoading(false)
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
                    <div className={status.type === 'error' ? 'auth-global-error' : 'auth-global-success'} role="alert">
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
                        disabled={status?.type === 'success' || !oobCode}
                    />

                    <AuthInput
                        id="confirm-password"
                        label="تأكيد كلمة المرور"
                        type="password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        placeholder="••••••••"
                        required
                        disabled={status?.type === 'success' || !oobCode}
                    />

                    <button
                        type="submit"
                        className="btn btn-primary mt-md"
                        disabled={isLoading || !oobCode || status?.type === 'success'}
                    >
                        {isLoading ? <div className="auth-loader"></div> : "تحديث كلمة المرور"}
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
