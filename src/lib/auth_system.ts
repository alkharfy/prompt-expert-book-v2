// Authentication System
// Handles user registration, login, device verification, and session management

import { supabase } from './supabase'
import { deviceFingerprint, DeviceFingerprintData } from './fingerprint'
import { saveAuthCookies, getAuthCookies, clearAuthCookies } from './cookie_utils'
import { SESSION_DURATION_MS, TOTAL_BOOK_PAGES } from './config'
import { authLogger } from './logger'
import { hashPassword, verifyPassword, isBcryptHash, legacySha256Hash } from './password'
import { checkRateLimit, RATE_LIMITS } from './rate-limit'

// ============ Supabase Helper Types ============
// هذه الأنواع تساعد في تقليل استخدام `as any` وتحسين الأمان
type SupabaseTable = {
    insert: (data: Record<string, unknown>) => Promise<{ data: unknown; error: { message: string } | null }>
    upsert: (data: Record<string, unknown>, options?: { onConflict?: string }) => Promise<{ data: unknown; error: { message: string } | null }>
    update: (data: Record<string, unknown>) => { eq: (col: string, val: string) => Promise<{ error: { message: string } | null }> }
    delete: () => { eq: (col: string, val: string) => Promise<{ error: { message: string } | null }> }
    select: (cols: string) => { eq: (col: string, val: string) => { single: () => Promise<{ data: unknown; error: unknown }> } }
}

// Types for our custom tables
interface User {
    id: string
    email: string
    password_hash: string
    full_name: string | null
    phone_number: string | null
    is_phone_verified: boolean
    created_at: string
    is_active: boolean
}

interface Device {
    id: string
    user_id: string
    device_id: string
    device_fingerprint: string
    device_info: object
    registered_at: string
    last_used: string
    is_active: boolean
}

interface Session {
    id: string
    user_id: string
    device_id: string
    session_token: string
    expires_at: string
    created_at: string
}

// Result types
export interface AuthResult {
    ok: boolean
    error?: string
    message?: string
    userId?: string
    deviceMismatch?: boolean
    needsVerification?: boolean
}

export interface SessionVerifyResult {
    valid: boolean
    userId?: string
    error?: string
}

class AuthSystem {
    /**
     * Compare device fingerprints flexibly
     * Allows same device across different browsers by comparing hardware properties
     */
    private isMatchingDevice(savedDeviceInfo: any, currentFingerprint: DeviceFingerprintData): boolean {
        if (!savedDeviceInfo) {
            return false
        }

        // 1. Core properties that MUST match
        const platformMatch = savedDeviceInfo.platform === currentFingerprint.info.platform
        const timezoneMatch = savedDeviceInfo.timezone === currentFingerprint.info.timezone
        const colorDepthMatch = savedDeviceInfo.colorDepth === currentFingerprint.info.colorDepth

        // 2. Hardware properties (can be null/undefined or vary slightly between browsers)
        // We allow match if they are equal OR if one of them is missing (some browsers hide these)
        const cpuMatch = !savedDeviceInfo.cpuCores || !currentFingerprint.info.cpuCores ||
            savedDeviceInfo.cpuCores === currentFingerprint.info.cpuCores

        const memMatch = !savedDeviceInfo.memory || !currentFingerprint.info.memory ||
            savedDeviceInfo.memory === currentFingerprint.info.memory

        const isSameDevice = platformMatch && timezoneMatch && colorDepthMatch && cpuMatch && memMatch

        // Log comparison details for debugging (dev only)
        authLogger.debug('Device Match Check', { isSameDevice })

        return isSameDevice
    }

    /**
     * Hash a password using bcrypt (secure)
     * للتسجيل الجديد فقط
     */
    private async hashPasswordSecure(password: string): Promise<string> {
        return await hashPassword(password)
    }

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
     * Generate a random session token
     */
    private generateSessionToken(): string {
        return 'sess_' + crypto.randomUUID() + '_' + Date.now().toString(36)
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
     * Register a new user
     */
    async register(fullName: string, email: string, password: string, phoneNumber?: string): Promise<AuthResult> {
        try {
            // Rate limiting check
            const rateLimitResult = checkRateLimit(`register:${email.toLowerCase()}`, RATE_LIMITS.REGISTER)
            if (!rateLimitResult.allowed) {
                return { ok: false, error: `تم تجاوز عدد المحاولات. حاول مجدداً بعد ${rateLimitResult.retryAfter} ثانية` }
            }

            // 1. Hash the password securely using bcrypt
            const passwordHash = await this.hashPasswordSecure(password)

            // 2. Check if user already exists in our table
            const { data: existingUser } = await supabase
                .from('users')
                .select('id')
                .eq('email', email.toLowerCase())
                .single()

            if (existingUser) {
                return { ok: false, error: 'البريد الإلكتروني مسجل بالفعل' }
            }

            // 3. Register in Supabase Auth FIRST to get the official ID
            const { data: authData, error: sbAuthError } = await supabase.auth.signUp({
                email: email.toLowerCase(),
                password: password,
                options: {
                    data: {
                        full_name: fullName,
                    }
                }
            })

            if (sbAuthError) {
                authLogger.error('Error', sbAuthError)
                return { ok: false, error: 'فشل في إنشاء الحساب (Auth): ' + sbAuthError.message }
            }

            if (!authData.user) {
                return { ok: false, error: 'فشل في الحصول على بيانات المستخدم' }
            }

            const authUserId = authData.user.id

            // 4. Create user in our public.users table using the SAME ID
            const { data: newUser, error: userError } = await (supabase
                .from('users') as any)
                .insert({
                    id: authUserId, // Use the ID from Supabase Auth!
                    email: email.toLowerCase(),
                    password_hash: passwordHash,
                    full_name: fullName,
                    phone_number: phoneNumber || null,
                    is_phone_verified: true,
                    is_active: true,
                })
                .select()
                .single()

            if (userError || !newUser) {
                authLogger.error('Error', userError)
                // Rollback: حذف حساب Auth اليتيم
                try {
                    // نحتاج لحذف المستخدم من Supabase Auth
                    // لكن لا يمكننا ذلك من الـ client side، لذا نسجل الخطأ فقط
                    authLogger.error('Error', authUserId)
                    // TODO: إنشاء Edge Function لحذف المستخدمين اليتامى
                } catch (rollbackErr) {
                    authLogger.error('Error', rollbackErr)
                }
                return { ok: false, error: 'فشل في إكمال بيانات الحساب' }
            }

            // 5. Generate device fingerprint
            const fingerprintData = await deviceFingerprint.generate()
            const deviceId = deviceFingerprint.generateDeviceId()

            // 6. Save device
            const { error: deviceError } = await (supabase.from('devices') as any).insert({
                user_id: newUser.id,
                device_id: deviceId,
                device_fingerprint: fingerprintData.hash,
                device_info: fingerprintData.info,
                is_active: true,
            })

            if (deviceError) {
                authLogger.error('Error', deviceError)
            }

            // 7. Create session
            const session = await this.createSession(newUser.id, deviceId)
            if (!session) {
                return { ok: false, error: 'فشل في إنشاء الجلسة' }
            }

            // 8. Save to cookies
            saveAuthCookies(session.token, deviceId, newUser.id)

            // 9. Create reading progress record
            const { error: progressError } = await (supabase.from('reading_progress') as any).insert({
                user_id: newUser.id,
                current_page: 1,
                total_pages: TOTAL_BOOK_PAGES,
                bookmarks: [],
                completed_chapters: [],
                completion_percentage: 0,
            })

            if (progressError) {
                authLogger.warn('Could not create reading progress record', { message: progressError.message })
            }

            return {
                ok: true,
                userId: newUser.id,
                needsVerification: false
            }
        } catch (err) {
            authLogger.error('Error', err)
            return { ok: false, error: 'حدث خطأ غير متوقع' }
        }
    }

    /**
     * Login an existing user
     */
    async login(email: string, password: string): Promise<AuthResult> {
        try {
            // Rate limiting check
            const rateLimitResult = checkRateLimit(`login:${email.toLowerCase()}`, RATE_LIMITS.LOGIN)
            if (!rateLimitResult.allowed) {
                return { ok: false, error: `تم تجاوز عدد المحاولات. حاول مجدداً بعد ${rateLimitResult.retryAfter} ثانية` }
            }

            // 1. Find user by email first
            const { data: user, error: userError } = await supabase
                .from('users')
                .select('*')
                .eq('email', email.toLowerCase())
                .single() as { data: { id: string; password_hash: string; is_active: boolean; phone_number?: string; is_phone_verified?: boolean } | null; error: any }

            if (userError || !user) {
                return { ok: false, error: 'البريد الإلكتروني أو كلمة المرور غير صحيحة' }
            }

            // 2. Verify password (supports both bcrypt and legacy SHA-256)
            const isPasswordValid = await this.verifyUserPassword(password, user.password_hash)
            if (!isPasswordValid) {
                return { ok: false, error: 'البريد الإلكتروني أو كلمة المرور غير صحيحة' }
            }

            // 3. If using legacy hash, upgrade to bcrypt
            if (!isBcryptHash(user.password_hash)) {
                const newHash = await this.hashPasswordSecure(password)
                await (supabase.from('users') as any)
                    .update({ password_hash: newHash })
                    .eq('id', user.id)
                authLogger.debug('Password hash upgraded to bcrypt')
            }

            if (userError || !user) {
                return { ok: false, error: 'البريد الإلكتروني أو كلمة المرور غير صحيحة' }
            }

            if (!user.is_active) {
                return { ok: false, error: 'الحساب غير مفعل' }
            }

            /* Phone verification disabled
            if (user.phone_number && !user.is_phone_verified) {
                return { ok: true, userId: user.id, needsVerification: true }
            }
            */

            // 3. Generate current device fingerprint
            const currentFingerprint = await deviceFingerprint.generate()

            // 4. Get registered devices for this user
            const { data: devices, error: devicesError } = await supabase
                .from('devices')
                .select('*')
                .eq('user_id', user.id)
                .eq('is_active', true) as {
                    data: Array<{
                        id: string;
                        device_id: string;
                        device_fingerprint: string;
                        device_info: any
                    }> | null;
                    error: any
                }


            if (devicesError) {
                authLogger.error('Error', devicesError)
            }

            // 5. Compare fingerprints - flexible matching for cross-browser support
            const matchedDevice = devices?.find(d => {
                // First: try exact hash match
                if (d.device_fingerprint === currentFingerprint.hash) {
                    return true
                }
                // Second: try flexible hardware-based match (for different browsers on same device)
                return this.isMatchingDevice(d.device_info, currentFingerprint)
            })

            if (matchedDevice) {
                // Same device - allow login
                // Update last_used and fingerprint (to keep it current)
                await (supabase
                    .from('devices') as any)
                    .update({
                        last_used: new Date().toISOString(),
                        device_fingerprint: currentFingerprint.hash,
                        device_info: currentFingerprint.info
                    })
                    .eq('id', matchedDevice.id)

                // Create new session
                const session = await this.createSession(user.id, matchedDevice.device_id)
                if (!session) {
                    return { ok: false, error: 'فشل في إنشاء الجلسة' }
                }

                // Save to cookies
                saveAuthCookies(session.token, matchedDevice.device_id, user.id)

                return { ok: true, userId: user.id }
            } else {

                // If NO devices are registered at all, this might be an account created before
                // the devices table was set up correctly. Allow registering this device.
                if (!devices || devices.length === 0) {

                    const deviceId = deviceFingerprint.generateDeviceId()

                    // Save device
                    const { error: deviceError } = await (supabase.from('devices') as any).insert({
                        user_id: user.id,
                        device_id: deviceId,
                        device_fingerprint: currentFingerprint.hash,
                        device_info: currentFingerprint.info,
                        is_active: true,
                    })

                    if (deviceError) {
                        authLogger.error('Error', deviceError)
                        return { ok: false, error: 'فشل في تسجيل الجهاز' }
                    }

                    // Create new session
                    const session = await this.createSession(user.id, deviceId)
                    if (!session) {
                        return { ok: false, error: 'فشل في إنشاء الجلسة' }
                    }

                    // Save to cookies
                    saveAuthCookies(session.token, deviceId, user.id)

                    return { ok: true, userId: user.id }
                }

                // Different device - reject
                return {
                    ok: false,
                    error: 'لا يمكن تسجيل الدخول من جهاز جديد. تم تحديد جهاز آخر سابقًا.',
                    deviceMismatch: true,
                }
            }
        } catch (err) {
            authLogger.error('Error', err)
            return { ok: false, error: 'حدث خطأ غير متوقع' }
        }
    }

    /**
     * Switch device - delete old device and register new one
     */
    async switchDevice(email: string, password: string): Promise<AuthResult> {
        try {
            // 1. Verify credentials - find user first
            const { data: user, error: userError } = await supabase
                .from('users')
                .select('*')
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
     * Verify current session
     */
    async verifySession(): Promise<SessionVerifyResult & { needsVerification?: boolean }> {
        try {
            // 1. Get cookies
            const { sessionToken, deviceId, userId } = getAuthCookies()

            if (!sessionToken || !deviceId || !userId) {
                return { valid: false, error: 'لا توجد جلسة' }
            }

            // 2. Find session in database
            const { data: session } = await supabase
                .from('sessions')
                .select('*')
                .eq('session_token', sessionToken)
                .eq('user_id', userId)
                .eq('device_id', deviceId)
                .single() as { data: { id: string; expires_at: string } | null }

            if (!session) {
                clearAuthCookies()
                return { valid: false, error: 'الجلسة غير موجودة' }
            }

            // 3. Check if session expired
            if (new Date(session.expires_at) < new Date()) {
                // Delete expired session
                await (supabase.from('sessions') as any).delete().eq('id', session.id)
                clearAuthCookies()
                return { valid: false, error: 'الجلسة منتهية' }
            }

            // 4. Verify device fingerprint
            const currentFingerprint = await deviceFingerprint.generate()

            const { data: device } = await supabase
                .from('devices')
                .select('*')
                .eq('device_id', deviceId)
                .eq('user_id', userId)
                .single() as { data: { id: string; device_fingerprint: string; device_info: any } | null }

            if (!device) {
                clearAuthCookies()
                return { valid: false, error: 'الجهاز غير مسجل' }
            }

            // 5. Compare fingerprints - flexible matching for cross-browser support
            const isExactMatch = device.device_fingerprint === currentFingerprint.hash
            const isFlexibleMatch = this.isMatchingDevice(device.device_info, currentFingerprint)

            if (!isExactMatch && !isFlexibleMatch) {
                // Fingerprint changed and hardware doesn't match - invalidate session
                await (supabase.from('sessions') as any).delete().eq('id', session.id)
                clearAuthCookies()
                return { valid: false, error: 'تم الكشف عن تغيير في الجهاز' }
            }

            // Update fingerprint if it changed but device matched
            if (!isExactMatch && isFlexibleMatch) {
                await (supabase
                    .from('devices') as any)
                    .update({
                        device_fingerprint: currentFingerprint.hash,
                        device_info: currentFingerprint.info
                    })
                    .eq('id', device.id)
            }

            /* Phone verification disabled
            if (user && user.phone_number && !user.is_phone_verified) {
                return { valid: true, userId, needsVerification: true }
            }
            */

            // 6. Update last_used
            await (supabase
                .from('devices') as any)
                .update({ last_used: new Date().toISOString() })
                .eq('id', device.id)

            return { valid: true, userId }
        } catch (err) {
            authLogger.error('Error', err)
            return { valid: false, error: 'خطأ في التحقق من الجلسة' }
        }
    }

    /**
     * Send SMS Verification Code (Mock)
     */
    async sendSMSVerification(userId: string, phoneNumber: string): Promise<boolean> {
        try {
            // Generate 6-digit code
            const code = Math.floor(100000 + Math.random() * 900000).toString()

            // Store code in database (you'll need to add verification_code column)
            const { error } = await (supabase
                .from('users') as any)
                .update({ verification_code: code })
                .eq('id', userId)

            if (error) throw error

            // Mock sending SMS
            // alert(`تم إرسال رمز التحقق إلى ${phoneNumber}: ${code}`) // For demo purposes

            return true
        } catch (err) {
            authLogger.error('Error', err)
            return false
        }
    }

    /**
     * Verify Phone Code
     */
    async verifyPhoneCode(userId: string, code: string): Promise<AuthResult> {
        try {
            const { data: user, error } = await supabase
                .from('users')
                .select('verification_code')
                .eq('id', userId)
                .single() as { data: { verification_code: string | null } | null; error: any }

            if (error || !user) {
                return { ok: false, error: 'فشل في العثور على المستخدم' }
            }

            if (user.verification_code === code) {
                const { error: updateError } = await (supabase
                    .from('users') as any)
                    .update({
                        is_phone_verified: true,
                        verification_code: null
                    })
                    .eq('id', userId)

                if (updateError) {
                    return { ok: false, error: 'فشل في تحديث حالة التحقق' }
                }

                return { ok: true, message: 'تم التحقق من رقم الهاتف بنجاح' }
            } else {
                return { ok: false, error: 'رمز التحقق غير صحيح' }
            }
        } catch (err) {
            authLogger.error('Error', err)
            return { ok: false, error: 'حدث خطأ أثناء التحقق' }
        }
    }

    /**
     * Request password reset using Supabase Auth
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
                return { ok: false, error: 'البريد الإلكتروني غير مسجل' }
            }

            // 2. Call Supabase Auth to send reset email
            // This will send an email with a link to our site
            const redirectTo = `${window.location.origin}/reset-password`
            authLogger.debug('Debug', redirectTo)

            const { error } = await supabase.auth.resetPasswordForEmail(email.toLowerCase(), {
                redirectTo: redirectTo,
            })

            if (error) {
                authLogger.error('Error', error)
                return { ok: false, error: 'فشل في إرسال البريد: ' + error.message }
            }

            return { ok: true, message: 'تم إرسال رابط استعادة كلمة المرور إلى بريدك الإلكتروني. يرجى مراجعة البريد (والبريد العشوائي/Spam).' }
        } catch (err) {
            authLogger.error('Error', err)
            return { ok: false, error: 'حدث خطأ غير متوقع' }
        }
    }

    /**
     * Reset password using Supabase Auth session
     */
    async resetPassword(newPassword: string): Promise<AuthResult> {
        try {
            // 1. Update password in Supabase Auth
            const { data, error } = await supabase.auth.updateUser({
                password: newPassword
            })

            if (error) {
                return { ok: false, error: 'فشل في تحديث كلمة المرور: ' + error.message }
            }

            // 2. ALSO Update password in our public.users table (synced) with bcrypt
            if (data?.user?.email) {
                const passwordHash = await this.hashPasswordSecure(newPassword)
                const { error: updateError } = await (supabase
                    .from('users') as any)
                    .update({ password_hash: passwordHash })
                    .eq('email', data.user.email.toLowerCase())

                if (updateError) {
                    authLogger.error('Error', updateError)
                }
            }

            return { ok: true, message: 'تم تغيير كلمة المرور بنجاح' }
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
            const { sessionToken } = getAuthCookies()

            if (sessionToken) {
                // Delete session from database
                await (supabase.from('sessions') as any).delete().eq('session_token', sessionToken)
            }

            // Clear cookies
            clearAuthCookies()
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
     * Get user info by ID
     */
    async getUserInfo(userId: string): Promise<User | null> {
        try {
            const { data, error } = await supabase
                .from('users')
                .select('*')
                .eq('id', userId)
                .single()

            if (error || !data) {
                authLogger.error('Error', error)
                return null
            }

            return data as User
        } catch (err) {
            authLogger.error('Error', err)
            return null
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
                const passwordHash = await this.hashPasswordSecure(updates.password)
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
     * Also auto-calculates completed chapters based on current page
     */
    async getDetailedProgress(): Promise<{ currentPage: number, totalPages: number, percentage: number, completedChapters: number[] } | null> {
        try {
            const userId = this.getCurrentUserId()
            if (!userId) return null

            const { data, error } = await supabase
                .from('reading_progress')
                .select('current_page, total_pages, completion_percentage, completed_chapters')
                .eq('user_id', userId)
                .maybeSingle() as {
                    data: {
                        current_page?: number;
                        total_pages?: number;
                        completion_percentage?: number;
                        completed_chapters?: string[]
                    } | null;
                    error: any
                }

            if (error || !data) return null

            // Map string array to number array for chapter indices
            let completedChapters = (data.completed_chapters || []).map((id: string) => parseInt(id))

            // Auto-calculate completed chapters based on current page
            // This ensures progress is tracked even if user didn't click "Next" at end of chapter
            const currentPage = data.current_page || 1
            const calculatedChapters = this.calculateCompletedChapters(currentPage)

            // Merge: keep manually marked + add calculated ones
            const allChapters = [...completedChapters, ...calculatedChapters]
            const mergedChapters = allChapters.filter((value, index, self) => self.indexOf(value) === index)

            // If we calculated more chapters than stored, update the database
            if (mergedChapters.length > completedChapters.length) {
                completedChapters = mergedChapters
                // Update in background (don't await)
                this.syncCompletedChapters(userId, mergedChapters)
            }

            return {
                currentPage,
                totalPages: data.total_pages || TOTAL_BOOK_PAGES,
                percentage: data.completion_percentage || Math.round((currentPage / TOTAL_BOOK_PAGES) * 100),
                completedChapters
            }
        } catch (err) {
            authLogger.error('Error', err)
            return null
        }
    }

    /**
     * Calculate which chapters are completed based on current page number
     * Page ranges for each chapter (based on actual bookData counts):
     * - Intro (0): pages 1-2 (2 pages)
     * - Section 1 (1): pages 3-13 (11 pages)
     * - Section 2 (2): pages 14-19 (6 pages)
     * - Section 3 (3): pages 20-28 (9 pages)
     * - Section 4 (4): pages 29-39 (11 pages)
     * - Section 5 (5): pages 40-49 (10 pages)
     * - Section 6 (6): pages 50-58 (9 pages)
     * - Library (7): pages 59-66 (8 pages)
     * - Appendix (8): pages 67-84 (18 pages)
     * - Glossary (9): pages 85-89 (5 pages) [Optional bonus]
     * Total: 89 pages
     */
    private calculateCompletedChapters(currentPage: number): number[] {
        const completed: number[] = []

        // Chapter end pages (inclusive) - verified against bookData
        const chapterEndPages = [
            2,   // Intro ends at page 2 (2 pages)
            13,  // Section 1 ends at page 13 (11 pages)
            19,  // Section 2 ends at page 19 (6 pages)
            28,  // Section 3 ends at page 28 (9 pages)
            39,  // Section 4 ends at page 39 (11 pages)
            49,  // Section 5 ends at page 49 (10 pages)
            58,  // Section 6 ends at page 58 (9 pages)
            66,  // Library ends at page 66 (8 pages) - was incorrectly 64
            84   // Appendix ends at page 84 (18 pages) - was incorrectly 70
        ]

        for (let i = 0; i < chapterEndPages.length; i++) {
            // A chapter is completed if user has read past its last page
            if (currentPage > chapterEndPages[i]) {
                completed.push(i)
            }
        }

        return completed
    }

    /**
     * Sync completed chapters to database (background update)
     */
    private async syncCompletedChapters(userId: string, chapters: number[]): Promise<void> {
        try {
            const chaptersStr = chapters.map(c => c.toString())
            const TOTAL_CHAPTERS = 9
            const percentage = Math.min(Math.round((chapters.length / TOTAL_CHAPTERS) * 100), 100)

            await (supabase
                .from('reading_progress') as any)
                .update({
                    completed_chapters: chaptersStr,
                    completion_percentage: percentage
                })
                .eq('user_id', userId)

            authLogger.debug(`Synced completed chapters: ${chapters.length}/${9} (${percentage}%)`)
        } catch (err) {
            authLogger.error('Error syncing chapters', err)
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

            // 1. Get current completed chapters
            const { data, error: fetchError } = await supabase
                .from('reading_progress')
                .select('completed_chapters')
                .eq('user_id', userId)
                .single() as { data: { completed_chapters?: string[] } | null; error: any }

            if (fetchError) {
                authLogger.error('Error fetching chapters', { message: fetchError.message })
                return false
            }

            const current = data?.completed_chapters || []
            const indexStr = chapterIndex.toString()

            if (current.includes(indexStr)) return true // Already completed

            // 2. Update with new chapter
            const updated = [...current, indexStr]

            // 3. Calculate new percentage (9 total chapters)
            const TOTAL_CHAPTERS = 9
            const percentage = Math.min(Math.round((updated.length / TOTAL_CHAPTERS) * 100), 100)

            const { error: updateError } = await (supabase
                .from('reading_progress') as unknown as SupabaseTable)
                .update({
                    completed_chapters: updated,
                    completion_percentage: percentage
                })
                .eq('user_id', userId)

            if (updateError) {
                authLogger.error('Error completing chapter', { message: updateError.message })
                return false
            }

            authLogger.debug(`Chapter ${chapterIndex} marked as completed (${percentage}%)`)
            return true
        } catch (err) {
            authLogger.error('Error completing chapter', err)
            return false
        }
    }

    /**
     * Generate a random verification code (6 characters)
     */
    private generateVerificationCode(): string {
        const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789' // Excluded confusing chars: 0,O,1,I
        let code = ''
        for (let i = 0; i < 6; i++) {
            code += chars.charAt(Math.floor(Math.random() * chars.length))
        }
        return code
    }

    /**
     * Register a new user with verification code (requires admin approval)
     */
    async registerWithVerification(fullName: string, email: string, password: string, phoneNumber: string): Promise<AuthResult & { userId?: string }> {
        try {
            // 1. Hash the password securely using bcrypt
            const passwordHash = await this.hashPasswordSecure(password)

            // 2. Check if user already exists in our table
            const { data: existingUser } = await supabase
                .from('users')
                .select('id')
                .eq('email', email.toLowerCase())
                .single()

            if (existingUser) {
                return { ok: false, error: 'البريد الإلكتروني مسجل بالفعل' }
            }

            // 3. Register in Supabase Auth FIRST to get the official ID
            const { data: authData, error: sbAuthError } = await supabase.auth.signUp({
                email: email.toLowerCase(),
                password: password,
                options: {
                    data: {
                        full_name: fullName,
                    }
                }
            })

            if (sbAuthError) {
                authLogger.error('Error', sbAuthError)
                return { ok: false, error: 'فشل في إنشاء الحساب: ' + sbAuthError.message }
            }

            if (!authData.user) {
                return { ok: false, error: 'فشل في الحصول على بيانات المستخدم' }
            }

            const authUserId = authData.user.id

            // 4. Create user in our public.users table (NOT ACTIVE YET)
            const { data: newUser, error: userError } = await (supabase
                .from('users') as any)
                .insert({
                    id: authUserId,
                    email: email.toLowerCase(),
                    password_hash: passwordHash,
                    full_name: fullName,
                    phone_number: phoneNumber,
                    is_phone_verified: false,
                    is_verified: false,
                    is_active: false, // Not active until code verification
                })
                .select()
                .single()

            if (userError || !newUser) {
                authLogger.error('Error', userError)
                // Rollback: حذف حساب Auth اليتيم
                try {
                    authLogger.error('Error', authUserId)
                    // TODO: إنشاء Edge Function لحذف المستخدمين اليتامى
                } catch (rollbackErr) {
                    authLogger.error('Error', rollbackErr)
                }
                return { ok: false, error: 'فشل في إكمال بيانات الحساب' }
            }

            // 5. Generate verification code
            const verificationCode = this.generateVerificationCode()

            // 6. Save verification code to database
            const { error: codeError } = await (supabase.from('verification_codes') as any).insert({
                user_id: newUser.id,
                code: verificationCode,
                is_used: false,
            })

            if (codeError) {
                authLogger.error('Error', codeError)
                return { ok: false, error: 'فشل في إنشاء كود التحقق' }
            }

            // 7. Create reading progress record (for later use)
            const { error: progressError } = await (supabase.from('reading_progress') as any).insert({
                user_id: newUser.id,
                current_page: 1,
                total_pages: TOTAL_BOOK_PAGES,
                bookmarks: [],
                completed_chapters: [],
                completion_percentage: 0,
            })

            if (progressError) {
                authLogger.warn('Could not create reading progress record', { message: progressError.message })
            }


            return {
                ok: true,
                userId: newUser.id,
                needsVerification: true,
                message: 'تم إنشاء الحساب بنجاح، يرجى إدخال الكود السري'
            }
        } catch (err) {
            authLogger.error('Error', err)
            return { ok: false, error: 'حدث خطأ غير متوقع' }
        }
    }

    /**
     * Login user directly using userId (after code verification)
     */
    async loginWithUserId(userId: string): Promise<AuthResult> {
        try {
            // 1. Find user
            const { data: user, error: userError } = await supabase
                .from('users')
                .select('*')
                .eq('id', userId)
                .single() as { data: { id: string } | null; error: any }

            if (userError || !user) {
                return { ok: false, error: 'المستخدم غير موجود' }
            }

            // 2. Generate device fingerprint
            const fingerprintData = await deviceFingerprint.generate()
            const deviceId = deviceFingerprint.generateDeviceId()

            // 3. Save device
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

            // 4. Create session
            const session = await this.createSession(user.id, deviceId)
            if (!session) {
                return { ok: false, error: 'فشل في إنشاء الجلسة' }
            }

            // 5. Save to cookies
            saveAuthCookies(session.token, deviceId, user.id)

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
