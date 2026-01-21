'use client'

import { useState, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import AuthCard from '@/components/auth/AuthCard'
import AuthInput from '@/components/auth/AuthInput'
import Navigation from '@/components/Navigation'
import { supabase } from '@/lib/supabase'
import { authSystem } from '@/lib/auth_system'
import { authLogger } from '@/lib/logger'
import { checkRateLimit, RATE_LIMITS } from '@/lib/rate-limit'
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

        // Rate limiting لمنع تخمين الكود
        const rateLimitResult = checkRateLimit(`verify-code:${userId}`, RATE_LIMITS.VERIFY_CODE)
        if (!rateLimitResult.allowed) {
            setError(`تم تجاوز عدد المحاولات. حاول مجدداً بعد ${rateLimitResult.retryAfter} ثانية`)
            return
        }

        setIsLoading(true)

        try {
            // Verify the code from database
            const { data: verificationData, error: verifyError } = await supabase
                .from('verification_codes')
                .select('*')
                .eq('user_id', userId)
                .eq('code', code)
                .eq('is_used', false)
                .single() as { data: { created_at: string; id: string } | null; error: any }

            if (verifyError || !verificationData) {
                setError('الكود غير صحيح أو منتهي الصلاحية')
                setIsLoading(false)
                return
            }

            // Check if code is expired (24 hours)
            const createdAt = new Date(verificationData.created_at)
            const now = new Date()
            const hoursDiff = (now.getTime() - createdAt.getTime()) / (1000 * 60 * 60)
            
            if (hoursDiff > 24) {
                setError('انتهت صلاحية الكود، يرجى التواصل مع الدعم')
                setIsLoading(false)
                return
            }

            // Mark code as used
            await (supabase
                .from('verification_codes') as any)
                .update({ is_used: true, used_at: new Date().toISOString() })
                .eq('id', verificationData.id)

            // Activate user account
            await (supabase
                .from('users') as any)
                .update({ is_verified: true, is_active: true })
                .eq('id', userId)

            // Login the user automatically
            const loginResult = await authSystem.loginWithUserId(userId)
            
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
                {error && <div className="auth-global-error">{error}</div>}

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
