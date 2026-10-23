// Authentication System
// Handles user registration, login, device verification, and session management

import { supabaseProxy as supabase } from './supabase_proxy'
import { deviceFingerprint } from './fingerprint'
import { saveAuthCookies, getAuthCookies, clearAuthCookies } from './cookie_utils'
import { SESSION_DURATION_MS, TOTAL_BOOK_PAGES } from './config'
import { getMainChapterCompletion, normalizeCompletedChapters, parseChapterId } from './reading-completion'
import { authLogger } from './logger'
import { hashPassword, verifyPassword, isBcryptHash, legacySha256Hash } from './password'
import { LIVE_PLAN_ID } from './live'
import {
  auth,
  sendPasswordResetEmail,
  signOut,
} from './firebase_client'

// Constants
const MAX_DEVICES = 3

// Device info for UI display
interface DeviceDisplayInfo {
    id: string
    device_id: string
    device_type: string // Desktop / Mobile / Tablet
    browser: string
    os: string
    last_used: string
    is_current: boolean
}

// Result types
interface AuthResult {
    ok: boolean
    error?: string
    message?: string
    userId?: string
    deviceMismatch?: boolean
    maxDevicesReached?: boolean
    registeredDevices?: DeviceDisplayInfo[]
    needsVerification?: boolean
}

interface SessionVerifyResult {
    valid: boolean
    userId?: string
    error?: string
}

class AuthSystem {
    // Debounce cache: skip redundant verifySession calls within 30 seconds
    private _lastVerifyResult: (SessionVerifyResult & { needsVerification?: boolean; hasPaid?: boolean }) | null = null
    private _lastVerifyTime = 0
    private static readonly VERIFY_CACHE_MS = 30_000 // 30 seconds

    /**
     * التحقق من كلمة المرور مع دعم الهاشات القديمة
     * يدعم كلاً من bcrypt (الجديد) و SHA-256 (القديم)
     */
    private async verifyUserPassword(password: string, storedHash: string): Promise<boolean> {
        // إذا كان الهاش bcrypt
        if (isBcryptHash(storedHash)) {
            return await verifyPassword(password, storedHash)
        }

        // للتوافق: فحص SHA-256 القديم
        const sha256Hash = await legacySha256Hash(password)
        return sha256Hash === storedHash
    }

    /**
     * Generate a random session token using CSPRNG
     */
    private generateSessionToken(): string {
        let uuid: string
        if (typeof crypto !== 'undefined' && crypto.randomUUID) {
            uuid = crypto.randomUUID()
        } else if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
            const bytes = new Uint8Array(16)
            crypto.getRandomValues(bytes)
            uuid = Array.from(bytes, b => b.toString(16).padStart(2, '0')).join('')
        } else {
            throw new Error('No secure random generator available')
        }
        return 'sess_' + uuid + '_' + Date.now().toString(36)
    }

    /**
     * Create a new session in the database
     */
    private async createSession(userId: string, deviceId: string): Promise<{ token: string; expiresAt: Date } | null> {
        const token = this.generateSessionToken()
        const expiresAt = new Date(Date.now() + SESSION_DURATION_MS)

        const { error } = await (supabase.from('sessions') as any).insert({
            user_id: userId,
            device_id: deviceId,
            session_token: token,
            expires_at: expiresAt.toISOString(),
        })

        if (error) {
            authLogger.error('Error creating session', error)
            return null
        }

        return { token, expiresAt }
    }

    /**
     * Switch device - delete old device and register new one
     */
    async switchDevice(email: string, password: string): Promise<AuthResult> {
        try {
            // 1. Verify credentials - find user first
            const { data: user, error: userError } = await supabase
                .from('users')
                .select('id, password_hash')
                .eq('email', email.toLowerCase())
                .single() as { data: { id: string; password_hash: string } | null; error: any }

            if (userError || !user) {
                return { ok: false, error: 'فشل في التحقق من البيانات' }
            }

            // 2. Verify password
            const isPasswordValid = await this.verifyUserPassword(password, user.password_hash)
            if (!isPasswordValid) {
                return { ok: false, error: 'فشل في التحقق من البيانات' }
            }

            // 3. Delete all old devices for this user
            await (supabase.from('devices') as any).delete().eq('user_id', user.id)

            // 3. Delete all old sessions for this user
            await (supabase.from('sessions') as any).delete().eq('user_id', user.id)

            // 4. Generate new device fingerprint
            const newFingerprint = await deviceFingerprint.generate()
            const newDeviceId = deviceFingerprint.generateDeviceId()

            // 5. Save new device
            await (supabase.from('devices') as any).insert({
                user_id: user.id,
                device_id: newDeviceId,
                device_fingerprint: newFingerprint.hash,
                device_info: newFingerprint.info,
                is_active: true,
            })

            // 6. Create new session
            const session = await this.createSession(user.id, newDeviceId)
            if (!session) {
                return { ok: false, error: 'فشل في إنشاء الجلسة' }
            }

            // 7. Save to cookies
            saveAuthCookies(session.token, newDeviceId, user.id)
            authLogger.debug('Debug', { deviceId: newDeviceId, userId: user.id })

            return { ok: true, userId: user.id, message: 'تم تغيير الجهاز بنجاح' }
        } catch (err) {
            authLogger.error('Error', err)
            return { ok: false, error: 'حدث خطأ غير متوقع' }
        }
    }

    /**
     * Verify current session via server-side API (bypasses RLS)
     * Falls back to updating device fingerprint client-side after verification
     */
    async verifySession(): Promise<SessionVerifyResult & { needsVerification?: boolean; hasPaid?: boolean }> {
        try {
            // Debounce: return cached result if verified recently (within 30s)
            const now = Date.now()
            if (this._lastVerifyResult?.valid && (now - this._lastVerifyTime) < AuthSystem.VERIFY_CACHE_MS) {
                return this._lastVerifyResult
            }

            // 1. Check for userId cookie (non-httpOnly, readable from JS)
            // Note: sessionToken is httpOnly (set by server), so we can't read it from JS
            // The server-side verify-session endpoint reads it from the HTTP request cookies
            const { userId } = getAuthCookies()

            if (!userId) {
                return { valid: false, error: 'لا توجد جلسة' }
            }

            // 2. Verify session via server-side API (uses service_role, bypasses RLS)
            const response = await fetch('/api/auth/verify-session', {
                method: 'GET',
                credentials: 'include',
            })

            if (!response.ok) {
                // DON'T clear cookies on server errors — could be transient (500, 502, timeout)
                return { valid: false, error: 'فشل التحقق من الجلسة' }
            }

            const result = await response.json()

            if (!result.valid) {
                // Only clear cookies for definitive session invalidation
                if (result.error === 'session_expired' || result.error === 'session_not_found') {
                    clearAuthCookies()
                }
                // Don't clear for 'no_session', 'server_error', or unknown errors
                return { valid: false, error: result.error || 'الجلسة غير صالحة' }
            }

            // The browser used to rewrite the device fingerprint here on every check, but
            // /api/auth/db-operation refuses device updates (403 on every page), so it never saved.
            const successResult = { valid: true as const, userId, hasPaid: result.hasPaid ?? false }
            // Cache the successful result for debouncing
            this._lastVerifyResult = successResult
            this._lastVerifyTime = Date.now()
            return successResult
        } catch (err) {
            authLogger.error('Error', err)
            return { valid: false, error: 'خطأ في التحقق من الجلسة' }
        }
    }

    /**
     * Request password reset using Firebase Auth
     */
    async requestPasswordReset(email: string): Promise<AuthResult> {
        try {
            // 1. Check if user exists in our public.users first
            const { data: user, error: publicError } = await supabase
                .from('users')
                .select('id')
                .eq('email', email.toLowerCase())
                .single()

            if (publicError || !user) {
                // Don't reveal if email exists (security best practice)
                return { ok: true, message: 'إذا كان البريد الإلكتروني مسجلاً، ستصلك رسالة استعادة كلمة المرور' }
            }

            // 2. Call Firebase Auth to send reset email
            const redirectTo = `${window.location.origin}/reset-password`
            authLogger.debug('Password reset redirect URL', redirectTo)

            try {
                if (!auth) {
                    return { ok: false, error: 'خطأ في إعداد المصادقة' }
                }
                await sendPasswordResetEmail(auth, email.toLowerCase(), {
                    url: redirectTo,
                    handleCodeInApp: true,
                })
            } catch (firebaseError: any) {
                authLogger.error('Firebase password reset error', firebaseError)
                if (firebaseError.code === 'auth/user-not-found') {
                    // Don't reveal if email exists
                    return { ok: true, message: 'إذا كان البريد الإلكتروني مسجلاً، ستصلك رسالة استعادة كلمة المرور' }
                }
                return { ok: false, error: 'فشل في إرسال البريد' }
            }

            return { ok: true, message: 'تم إرسال رابط استعادة كلمة المرور إلى بريدك الإلكتروني. يرجى مراجعة البريد (والبريد العشوائي/Spam).' }
        } catch (err) {
            authLogger.error('Error', err)
            return { ok: false, error: 'حدث خطأ غير متوقع' }
        }
    }

    /**
     * Logout - clear session and cookies
     */
    async logout(): Promise<void> {
        try {
            // Call server-side logout to delete session from DB and clear httpOnly cookies
            try {
                await fetch('/api/auth/logout', { method: 'POST', credentials: 'include' })
            } catch {
                // Continue even if server call fails — still clear client-side state
            }

            // Sign out from Firebase Auth
            try {
                if (auth) {
                    await signOut(auth)
                }
            } catch (firebaseErr) {
                authLogger.error('Firebase sign out error', firebaseErr)
            }

            // Clear client-accessible cookies (userId, deviceId)
            clearAuthCookies()

            // Invalidate verify cache
            this._lastVerifyResult = null
            this._lastVerifyTime = 0
        } catch (err) {
            authLogger.error('Error', err)
            // Clear cookies anyway
            clearAuthCookies()
        }
    }

    /**
     * Get current user ID from cookies
     */
    getCurrentUserId(): string | null {
        const { userId } = getAuthCookies()
        return userId
    }

    /**
     * Check if user has a successful payment
     */
    async checkPaymentStatus(userId?: string): Promise<boolean> {
        try {
            const targetUserId = userId || this.getCurrentUserId()
            if (!targetUserId) return false

            const { data, error } = await supabase
                .from('payments')
                .select('status')
                .eq('user_id', targetUserId)
                .eq('status', 'success')
                // A live-challenge seat is not course access.
                .neq('plan_id', LIVE_PLAN_ID)
                .limit(1)
                .maybeSingle()

            if (error) {
                authLogger.error('Error checking payment status', error)
                return false
            }

            return !!data
        } catch (err) {
            authLogger.error('Error checking payment status', err)
            return false
        }
    }

    /**
     * Update user profile
     */
    async updateProfile(userId: string, updates: { fullName?: string, email?: string, password?: string }): Promise<AuthResult> {
        try {
            const updatePayload: any = {}

            if (updates.fullName) {
                updatePayload.full_name = updates.fullName
            }

            if (updates.email) {
                // Check if email is already taken by another user
                const { data: existingUser } = await supabase
                    .from('users')
                    .select('id')
                    .eq('email', updates.email.toLowerCase())
                    .neq('id', userId)
                    .single()

                if (existingUser) {
                    return { ok: false, error: 'البريد الإلكتروني مستخدم بالفعل من قبل حساب آخر' }
                }
                updatePayload.email = updates.email.toLowerCase()
            }

            if (updates.password) {
                const passwordHash = await hashPassword(updates.password)
                updatePayload.password_hash = passwordHash
            }

            if (Object.keys(updatePayload).length === 0) {
                return { ok: true, message: 'لا يوجد تغييرات لتحديثها' }
            }

            const { error } = await (supabase
                .from('users') as any)
                .update(updatePayload)
                .eq('id', userId)

            if (error) {
                authLogger.error('Error', error)
                return { ok: false, error: 'فشل في تحديث بيانات الملف الشخصي' }
            }

            // SECURITY: If password was changed, invalidate all OTHER sessions
            if (updates.password) {
                const { sessionToken } = getAuthCookies()
                if (sessionToken) {
                    await (supabase.from('sessions') as any)
                        .delete()
                        .eq('user_id', userId)
                        .neq('session_token', sessionToken)
                    authLogger.info('Invalidated other sessions after profile password change')
                }
            }

            return { ok: true, message: 'تم تحديث الملف الشخصي بنجاح' }
        } catch (err) {
            authLogger.error('Error', err)
            return { ok: false, error: 'حدث خطأ غير متوقع أثناء التحديث' }
        }
    }

    /**
 * Update reading progress for the current user
 * @returns true if successful, false if failed
 */
    async updateReadingProgress(pageNumber: number): Promise<boolean> {
        try {
            const userId = this.getCurrentUserId()
            if (!userId) {
                authLogger.debug('No user ID for progress update')
                return false
            }

            authLogger.debug(`Updating progress for user to page ${pageNumber}`)

            // Use API route to bypass RLS
            const response = await fetch('/api/reading-progress', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ current_page: pageNumber })
            })

            if (!response.ok) {
                const errorData = await response.json()
                authLogger.error('Error updating progress', { message: errorData.error })
                return false
            }

            authLogger.debug(`Progress advanced: Page ${pageNumber}`)
            return true
        } catch (err) {
            authLogger.error('Error in updateReadingProgress', err)
            return false
        }
    }
    /**
     * Get reading progress for the current user
     */
    /**
     * Get detailed reading progress including completed chapters
     * Reads explicit, validated chapter markers. Jumping to a later page does
     * not mark the earlier chapters complete.
     */
    async getDetailedProgress(): Promise<{ currentPage: number, totalPages: number, percentage: number, completedChapters: number[], completedLessons?: string[] } | null> {
        try {
            const userId = this.getCurrentUserId()
            if (!userId) return null

            const response = await fetch('/api/reading-progress', { cache: 'no-store' })
            if (!response.ok) return null
            const { data } = await response.json()
            if (!data) return null
            const completedChapters = normalizeCompletedChapters(data.completed_chapters).map(Number)
            const currentPage = data.current_page || 1

            return {
                currentPage,
                totalPages: TOTAL_BOOK_PAGES,
                percentage: getMainChapterCompletion(completedChapters).percentage,
                completedChapters,
                // Missing until supabase/migrations/20261019_completed_lessons.sql runs.
                completedLessons: Array.isArray(data.completed_lessons)
                    ? data.completed_lessons.filter((lesson: unknown): lesson is string => typeof lesson === 'string')
                    : undefined,
            }
        } catch (err) {
            authLogger.error('Error', err)
            return null
        }
    }

    /**
     * Mark a specific chapter as completed
     * @returns true if successful, false if failed
     */
    async completeChapter(chapterIndex: number): Promise<boolean> {
        try {
            const userId = this.getCurrentUserId()
            if (!userId) return false

            if (parseChapterId(chapterIndex) === null) return false
            const response = await fetch('/api/reading-progress', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ completed_chapter: chapterIndex }),
            })
            if (!response.ok) return false

            authLogger.debug(`Chapter ${chapterIndex} marked as completed`)
            return true
        } catch (err) {
            authLogger.error('Error completing chapter', err)
            return false
        }
    }

    /**
     * Login user directly using userId (after code verification)
     * SECURITY: This is only safe when called immediately after successful
     * server-side verification (phone/email). Do NOT expose as a public API.
     * The callerVerified flag must be explicitly set to true.
     */
    async loginWithUserId(userId: string, callerVerified: boolean = false): Promise<AuthResult> {
        try {
            // SECURITY: Ensure this is only called from verified contexts
            if (!callerVerified) {
                authLogger.error('Error', 'loginWithUserId called without callerVerified flag')
                return { ok: false, error: 'غير مصرح بهذا الإجراء' }
            }

            // 1. Find user
            const { data: user, error: userError } = await supabase
                .from('users')
                .select('id')
                .eq('id', userId)
                .single() as { data: { id: string } | null; error: any }

            if (userError || !user) {
                return { ok: false, error: 'المستخدم غير موجود' }
            }

            // 2. Generate device fingerprint
            const fingerprintData = await deviceFingerprint.generate()
            const deviceId = deviceFingerprint.generateDeviceId()

            // 3. Check if device already exists for this user
            const { data: existingDevice } = await supabase
                .from('devices')
                .select('id, device_id')
                .eq('user_id', user.id)
                .eq('device_fingerprint', fingerprintData.hash)
                .single() as { data: { id: string; device_id: string } | null }

            let finalDeviceId = deviceId

            if (existingDevice) {
                // Device already exists, use its device_id
                finalDeviceId = existingDevice.device_id
                await (supabase.from('devices') as any)
                    .update({ last_used: new Date().toISOString(), device_info: fingerprintData.info })
                    .eq('id', existingDevice.id)
            } else {
                // Save new device
                const { error: deviceError } = await (supabase.from('devices') as any).insert({
                    user_id: user.id,
                    device_id: deviceId,
                    device_fingerprint: fingerprintData.hash,
                    device_info: fingerprintData.info,
                    is_active: true,
                })

                if (deviceError) {
                    authLogger.error('Error', deviceError)
                }
            }

            // 4. Create session
            const session = await this.createSession(user.id, finalDeviceId)
            if (!session) {
                return { ok: false, error: 'فشل في إنشاء الجلسة' }
            }

            // 5. Save to cookies
            saveAuthCookies(session.token, finalDeviceId, user.id)

            return {
                ok: true,
                userId: user.id
            }
        } catch (err) {
            authLogger.error('Error', err)
            return { ok: false, error: 'حدث خطأ غير متوقع' }
        }
    }
}

// Export singleton instance
export const authSystem = new AuthSystem()
export { MAX_DEVICES }
export type { DeviceDisplayInfo }
