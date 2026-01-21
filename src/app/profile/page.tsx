'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import AuthCard from '@/components/auth/AuthCard'
import AuthInput from '@/components/auth/AuthInput'
import Navigation from '@/components/Navigation'
import { authSystem } from '@/lib/auth_system'
import '@/app/auth.css'

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

    useEffect(() => {
        const loadUserData = async () => {
            const userId = authSystem.getCurrentUserId()
            if (!userId) {
                router.push('/login?next=/profile')
                return
            }

            const user = await authSystem.getUserInfo(userId)
            if (user) {
                setFullName(user.full_name || '')
                setEmail(user.email)
            } else {
                setError('فشل في تحميل بيانات المستخدم')
            }
            setIsLoading(false)
        }

        loadUserData()
    }, [router])

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
        const result = await authSystem.updateProfile(userId, {
            fullName,
            email: email !== '' ? email : undefined,
            password: password !== '' ? password : undefined
        })
        setIsUpdating(false)

        if (result.ok) {
            setSuccess(result.message || 'تم تحديث الملف الشخصي بنجاح')
            setPassword('')
            setConfirmPassword('')
        } else {
            setError(result.error || 'فشل في تحديث الملف الشخصي')
        }
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
                {error && <div className="auth-global-error">{error}</div>}
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
            </AuthCard>
        </main>
    )
}
