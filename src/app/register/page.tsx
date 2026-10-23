'use client'

import { useState, Suspense, useMemo } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import AuthCard from '@/components/auth/AuthCard'
import AuthInput from '@/components/auth/AuthInput'
import Navigation from '@/components/Navigation'
import { sanitizeName, sanitizeEmail, sanitizePhone, isValidEmail, sanitizePassword } from '@/lib/sanitize'
import { signInWithGoogle } from '@/lib/google_auth'
import { trackLead, trackCompleteRegistration } from '@/lib/meta-pixel'
import { trackSignUp, trackFunnelStep } from '@/lib/analytics'
import { leadEventId } from '@/lib/tracking-config'
import { getSignupRedirect } from '@/lib/signup-redirect'
import { getSafeRedirectPath } from '@/lib/safe-redirect'
import '@/app/auth.css'

// Where ?next= may send the visitor after this step (see lib/safe-redirect).
const REGISTER_REDIRECT_PREFIXES = ['/read/', '/library/', '/toc', '/exercises', '/profile', '/achievements', '/tools', '/bookmarks', '/leaderboard', '/community', '/onboarding', '/payment', '/my-plan']

function RegisterContent() {
    const searchParams = useSearchParams()
    const nextPath = useMemo(() => getSafeRedirectPath(searchParams.get('next'), REGISTER_REDIRECT_PREFIXES), [searchParams])
    // Buy-intent plan carried from a pricing/buy CTA (e.g. /register?plan=pro). Sanitized.
    const planParam = useMemo(() => (searchParams.get('plan') || '').replace(/[^a-z0-9_-]/gi, ''), [searchParams])
    const refCode = searchParams.get('ref') || ''

    const [form, setForm] = useState({
        fullName: '',
        email: '',
        phoneNumber: '',
        password: '',
        referralCode: refCode,
    })
    const [referralValid, setReferralValid] = useState<string | null>(refCode ? null : null)
    const [referralChecking, setReferralChecking] = useState(false)
    const [error, setError] = useState('')
    const [isLoading, setIsLoading] = useState(false)
    const [isGoogleLoading, setIsGoogleLoading] = useState(false)

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setForm({ ...form, [e.target.name]: e.target.value })
    }

    // Firebase + API registration with verification code
    const register = async (name: string, email: string, pass: string, phone: string) => {
        try {
            // Step 1: Create user in Firebase Auth
            const { auth, createUserWithEmailAndPassword } = await import('@/lib/firebase_client')

            if (!auth) {
                return { ok: false, error: 'خطأ في النظام: Firebase غير مهيأ' }
            }

            const userCredential = await createUserWithEmailAndPassword(
                auth,
                email.toLowerCase(),
                pass
            )
            const firebaseUser = userCredential.user

            // Step 2: Create user in database via API route
            // SECURITY: Send idToken for cryptographic verification
            const idToken = await firebaseUser.getIdToken()
            const response = await fetch('/api/auth/register', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    fullName: name,
                    email: email.toLowerCase(),
                    password: pass,
                    phoneNumber: phone,
                    firebaseUid: firebaseUser.uid,
                    idToken,
                    referralCode: form.referralCode?.trim() || undefined,
                }),
            })

            const result = await response.json()

            if (!result.ok) {
                // Rollback: Delete Firebase user if database creation failed
                try {
                    await firebaseUser.delete()
                } catch (deleteErr) {
                    console.error('Failed to delete Firebase user during rollback', deleteErr)
                }
            }

            return result
        } catch (firebaseError: any) {
            if (firebaseError.code === 'auth/email-already-in-use') {
                return { ok: false, error: 'الإيميل ده عليه حساب قبل كده. سجّل دخول بيه' }
            }
            if (firebaseError.code === 'auth/weak-password') {
                return { ok: false, error: 'الباسورد ضعيف: خليه 6 حروف أو أكتر' }
            }
            if (firebaseError.code === 'auth/invalid-email') {
                return { ok: false, error: 'الإيميل ده مش مكتوب صح' }
            }
            if (firebaseError.code === 'auth/too-many-requests') {
                return { ok: false, error: 'محاولات كتير. استنى شوية وجرّب تاني' }
            }
            return { ok: false, error: 'حصلت مشكلة وإحنا بنعمل الحساب. جرّب تاني' }
        }
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setError('')

        // Sanitize inputs
        const sanitizedName = sanitizeName(form.fullName)
        const sanitizedEmail = sanitizeEmail(form.email)
        const sanitizedPhone = sanitizePhone(form.phoneNumber)
        const sanitizedPassword = sanitizePassword(form.password)

        // Validation
        if (!sanitizedName || !sanitizedEmail || !sanitizedPassword) {
            setError('اكتب اسمك والإيميل والباسورد')
            return
        }
        if (!isValidEmail(sanitizedEmail)) {
            setError('الإيميل ده مش مكتوب صح')
            return
        }
        if (sanitizedPassword.length < 6) {
            setError('الباسورد لازم يبقى 6 حروف أو أكتر')
            return
        }

        setIsLoading(true)
        const result = await register(sanitizedName, sanitizedEmail, sanitizedPassword, sanitizedPhone)
        setIsLoading(false)

        if (result.ok && result.userId) {
            // Track signup in Meta Pixel + GA4 — shared event_id so the server
            // CAPI Lead (register/route) deduplicates against this browser Lead.
            trackLead(leadEventId(result.userId))
            trackCompleteRegistration()
            trackSignUp('email')
            trackFunnelStep('registration', 4)
            // Buy-intent flow: if they arrived from a pricing/buy CTA, send them
            // straight to checkout; otherwise onboarding, which then returns them
            // to the page that brought them here (`next`), not page 1.
            // SECURITY: Don't pass userId in URL — cookie is already set
            const redirect = getSignupRedirect({ method: 'email', planParam, nextPath })
            if (redirect.paymentIntent) trackFunnelStep('payment_intent', 5)
            window.location.href = redirect.href
            return
        } else {
            setError(result.error || 'حصلت مشكلة. جرّب تاني')
        }
    }

    return (
        <main className="auth-container">
            <Navigation />

            <AuthCard
                title="اعمل حساب ببلاش"
                subtitle={nextPath.startsWith('/payment')
                    ? 'خطوة واحدة قبل الدفع: اعمل حسابك عشان الاشتراك يتسجّل باسمك، وبعدها هنوديك لصفحة الدفع على طول.'
                    : 'عشان نحفظ مكانك في الكورس، وتقدر تشترك وقت ما تحب'}
            >
                {error && <div id="register-error" className="auth-global-error" role="alert">{error}</div>}

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
                                // Only count a NEW user as a registration/Lead — a returning
                                // user clicking "Google" here is just logging in.
                                if (result.isNewUser && result.userId) {
                                    trackLead(leadEventId(result.userId))
                                    trackCompleteRegistration()
                                    trackSignUp('google')
                                }
                                trackFunnelStep('registration', 4)
                                // Navigate BEFORE any state update to prevent re-render interference.
                                // Buy-intent wins; otherwise new users → onboarding, returning → nextPath.
                                // Decision uses the SERVER's isNewUser signal, not a stale localStorage flag.
                                const redirect = getSignupRedirect({ method: 'google', planParam, nextPath, isNewUser: result.isNewUser })
                                if (redirect.paymentIntent) trackFunnelStep('payment_intent', 5)
                                window.location.href = redirect.href
                                return // Don't update state after redirect
                            }
                            setIsGoogleLoading(false)
                            if (result.error) {
                                setError(result.error)
                            }
                        } catch {
                            setIsGoogleLoading(false)
                            setError('حصلت مشكلة في الدخول بـ Google. جرّب تاني')
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
                            <span>كمّل بحساب Google (أسرع)</span>
                        </>
                    )}
                </button>

                <div className="auth-divider">
                    <span>أو</span>
                </div>

                <form id="register-form" className="auth-form" onSubmit={handleSubmit}>
                    <AuthInput
                        id="register-name"
                        label="اسمك"
                        name="fullName"
                        value={form.fullName}
                        onChange={handleChange}
                        placeholder="اكتب اسمك هنا"
                        required
                    />

                    <AuthInput
                        id="register-email"
                        label="الإيميل"
                        name="email"
                        type="email"
                        value={form.email}
                        onChange={handleChange}
                        placeholder="example@mail.com"
                        required
                    />

                    <AuthInput
                        id="register-phone"
                        label="رقم الموبايل (مش لازم)"
                        name="phoneNumber"
                        type="tel"
                        value={form.phoneNumber}
                        onChange={handleChange}
                        placeholder="01xxxxxxxxx"
                    />

                    <AuthInput
                        id="register-password"
                        label="الباسورد (6 حروف أو أكتر)"
                        name="password"
                        type="password"
                        value={form.password}
                        onChange={handleChange}
                        placeholder="••••••••"
                        required
                    />

                    <div style={{ position: 'relative' }}>
                        <AuthInput
                            id="register-referral"
                            label="كود صاحبك (لو معاك)"
                            name="referralCode"
                            value={form.referralCode}
                            onChange={(e) => {
                                handleChange(e)
                                setReferralValid(null)
                            }}
                            placeholder="مثال: AHMED-X7K2"
                        />
                        {form.referralCode && (
                            <button
                                type="button"
                                className="referral-check-btn"
                                onClick={async () => {
                                    if (!form.referralCode.trim()) return
                                    setReferralChecking(true)
                                    try {
                                        const res = await fetch('/api/referral', {
                                            method: 'POST',
                                            headers: { 'Content-Type': 'application/json' },
                                            body: JSON.stringify({ referralCode: form.referralCode.trim() }),
                                        })
                                        const data = await res.json()
                                        setReferralValid(data.ok ? `✅ كود صالح — خصم ${data.discount} ج.م من ${data.referrerName}` : `❌ ${data.error}`)
                                    } catch {
                                        setReferralValid('❌ مقدرناش نتأكد من الكود')
                                    }
                                    setReferralChecking(false)
                                }}
                                disabled={referralChecking}
                            >
                                {referralChecking ? '...' : 'اتأكد'}
                            </button>
                        )}
                        {referralValid && (
                            <p style={{
                                fontSize: '12px',
                                marginTop: '4px',
                                color: referralValid.startsWith('✅') ? '#4CAF50' : '#ff4444',
                            }}>
                                {referralValid}
                            </p>
                        )}
                    </div>

                    <button
                        id="register-submit"
                        type="submit"
                        className="btn btn-primary mt-md"
                        disabled={isLoading || isGoogleLoading}
                    >
                        {isLoading ? <div className="auth-loader"></div> : "اعمل الحساب"}
                    </button>
                </form>

                <div className="auth-footer">
                    <span>عندك حساب؟ </span>
                    <Link id="login-link" href={`/login${nextPath !== '/toc' ? `?next=${encodeURIComponent(nextPath)}` : ''}`}>
                        سجّل دخول
                    </Link>
                </div>
            </AuthCard>
        </main>
    )
}

export default function RegisterPage() {
    return (
        <Suspense fallback={<div className="auth-container"><div className="auth-loader"></div></div>}>
            <RegisterContent />
        </Suspense>
    )
}
