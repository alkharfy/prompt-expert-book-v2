'use client'

/**
 * Google Authentication Helper
 * يوفر وظائف تسجيل الدخول/التسجيل عبر حساب Google
 * 
 * @module lib/google_auth
 */

import { auth } from '@/lib/firebase_client'
import { GoogleAuthProvider, signInWithPopup } from 'firebase/auth'

const googleProvider = new GoogleAuthProvider()
googleProvider.setCustomParameters({
    prompt: 'select_account',
})

export interface GoogleAuthResult {
    ok: boolean
    isNewUser?: boolean
    userId?: string
    email?: string
    fullName?: string
    firebaseUid?: string
    error?: string
    needsOnboarding?: boolean
}

/**
 * تسجيل الدخول أو التسجيل عبر Google
 * يتحقق تلقائياً هل المستخدم موجود في DB أم لا
 */
export async function signInWithGoogle(): Promise<GoogleAuthResult> {
    try {
        if (!auth) {
            return { ok: false, error: 'خطأ في النظام: Firebase غير مهيأ' }
        }

        // Open Google popup
        const result = await signInWithPopup(auth, googleProvider)
        const firebaseUser = result.user

        const email = firebaseUser.email
        const fullName = firebaseUser.displayName || ''
        const firebaseUid = firebaseUser.uid

        if (!email) {
            return { ok: false, error: 'لم نتمكن من الحصول على بريدك الإلكتروني من Google' }
        }

        // SECURITY: Get idToken for server-side cryptographic verification
        const idToken = await firebaseUser.getIdToken()

        // Check if user exists in our DB via API
        // Timeout: prevent hanging if API is slow
        const controller = new AbortController()
        const timeoutId = setTimeout(() => controller.abort(), 15000) // 15s timeout

        const response = await fetch('/api/auth/google', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                email: email.toLowerCase(),
                fullName,
                firebaseUid,
                idToken,
            }),
            signal: controller.signal,
        })

        clearTimeout(timeoutId)

        const data = await response.json()

        if (data.ok) {
            return {
                ok: true,
                isNewUser: data.isNewUser,
                userId: data.userId,
                email: email.toLowerCase(),
                fullName,
                firebaseUid,
                needsOnboarding: data.isNewUser,
            }
        }

        return { ok: false, error: data.error || 'حدث خطأ أثناء المصادقة' }
    } catch (error: any) {
        // User closed popup
        if (error.code === 'auth/popup-closed-by-user') {
            return { ok: false, error: '' } // Silent — no error message
        }
        if (error.code === 'auth/cancelled-popup-request') {
            return { ok: false, error: '' }
        }
        if (error.code === 'auth/popup-blocked') {
            return { ok: false, error: 'المتصفح حظر النافذة المنبثقة. يرجى السماح بها والمحاولة مجدداً' }
        }
        // API timeout
        if (error.name === 'AbortError') {
            return { ok: false, error: 'انتهت مهلة الاتصال — يرجى المحاولة مرة أخرى' }
        }

        console.error('Google sign-in error:', error)
        return { ok: false, error: 'حدث خطأ أثناء تسجيل الدخول بـ Google' }
    }
}
