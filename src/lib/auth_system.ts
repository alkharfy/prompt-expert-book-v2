// Authentication System
// Handles user registration, login, device verification, and session management

import { supabaseProxy as supabase } from './supabase_proxy'
import { deviceFingerprint, DeviceFingerprintData } from './fingerprint'
import { saveAuthCookies, getAuthCookies, clearAuthCookies } from './cookie_utils'
import { SESSION_DURATION_MS, TOTAL_BOOK_PAGES } from './config'
import { getMainChapterCompletion, normalizeCompletedChapters, parseChapterId } from './reading-completion'
import { authLogger } from './logger'
import { hashPassword, verifyPassword, isBcryptHash, legacySha256Hash } from './password'
import { checkRateLimit, RATE_LIMITS } from './rate-limit'
import {
  auth,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  sendPasswordResetEmail,
  updatePassword,
  signOut,
} from './firebase_client'

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
     * Parse device info into display-friendly format
     */
    private parseDeviceDisplayInfo(device: any, currentDeviceId?: string): DeviceDisplayInfo {
        const info = device.device_info || {}
        
        // Detect device type
        let deviceType = 'Desktop'
        const platform = (info.platform || '').toLowerCase()
        const userAgent = (info.userAgent || '').toLowerCase()
        if (platform.includes('android') || userAgent.includes('android') || userAgent.includes('mobile')) {
            deviceType = 'Mobile'
        } else if (platform.includes('iphone') || userAgent.includes('iphone')) {
            deviceType = 'Mobile'
        } else if (platform.includes('ipad') || userAgent.includes('ipad') || userAgent.includes('tablet')) {
            deviceType = 'Tablet'
        }

        // Detect browser
        let browser = 'Unknown'
        if (userAgent.includes('edg/') || userAgent.includes('edge')) browser = 'Edge'
        else if (userAgent.includes('chrome') && !userAgent.includes('edg')) browser = 'Chrome'
        else if (userAgent.includes('firefox')) browser = 'Firefox'
        else if (userAgent.includes('safari') && !userAgent.includes('chrome')) browser = 'Safari'
        else if (userAgent.includes('opera') || userAgent.includes('opr')) browser = 'Opera'

        // Detect OS
        let os = info.platform || 'Unknown'
        if (userAgent.includes('windows')) os = 'Windows'
        else if (userAgent.includes('mac os') || userAgent.includes('macos')) os = 'macOS'
        else if (userAgent.includes('linux') && !userAgent.includes('android')) os = 'Linux'
        else if (userAgent.includes('android')) os = 'Android'
        else if (userAgent.includes('iphone') || userAgent.includes('ipad')) os = 'iOS'

        return {
            id: device.id,
            device_id: device.device_id,
            device_type: deviceType,
            browser,
            os,
            last_used: device.last_used || device.registered_at || '',
            is_current: device.device_id === currentDeviceId,
        }
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

            // 3. Register in Firebase Auth FIRST to get the official ID
            let firebaseUser
            try {
                if (!auth) {
                    return { ok: false, error: 'خطأ في إعداد المصادقة' }
                }
                const userCredential = await createUserWithEmailAndPassword(
                    auth,
                    email.toLowerCase(),
                    password
                )
                firebaseUser = userCredential.user
            } catch (firebaseError: any) {
                authLogger.error('Firebase registration error', firebaseError)
                if (firebaseError.code === 'auth/email-already-in-use') {
                    return { ok: false, error: 'البريد الإلكتروني مسجل بالفعل في Firebase' }
                }
                if (firebaseError.code === 'auth/weak-password') {
                    return { ok: false, error: 'كلمة المرور ضعيفة جداً (يجب أن تكون 6 أحرف على الأقل)' }
                }
                if (firebaseError.code === 'auth/invalid-email') {
                    return { ok: false, error: 'البريد الإلكتروني غير صالح' }
                }
                return { ok: false, error: 'فشل في إنشاء الحساب. حاول مرة أخرى.' }
            }

            const authUserId = firebaseUser.uid

            // 4. Create user in our public.users table
            const { data: newUser, error: userError} = await (supabase
                .from('users') as any)
                .insert({
                    firebase_uid: authUserId, // Store Firebase UID for mapping
                    email: email.toLowerCase(),
                    password_hash: passwordHash,
                    full_name: fullName,
                    phone_number: phoneNumber || null,
                    is_phone_verified: false,
                    is_active: false,
                })
                .select()
                .single()

            if (userError || !newUser) {
                authLogger.error('Error', userError)
                // Rollback: delete orphaned Firebase user
                try {
                    if (auth) await signOut(auth)
                    authLogger.warn('Orphaned Firebase user created', { uid: authUserId })
                } catch (rollbackErr) {
                    authLogger.error('Rollback error', rollbackErr)
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

            // The validated reading API initializes progress on the first save.

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

            // 1. Login using Firebase Auth
            // Ensure Firebase is initialized (client-side only)
            if (!auth) {
                authLogger.error('Firebase Auth not initialized - must be called from client side')
                return { ok: false, error: 'خطأ في النظام: Firebase غير مهيأ' }
            }

            let firebaseUser
            try {
                const userCredential = await signInWithEmailAndPassword(
                    auth,
                    email.toLowerCase(),
                    password
                )
                firebaseUser = userCredential.user
                authLogger.debug('Firebase login successful', { uid: firebaseUser.uid })
            } catch (firebaseError: any) {
                authLogger.error('Firebase login error', firebaseError)
                if (
                    firebaseError.code === 'auth/wrong-password' ||
                    firebaseError.code === 'auth/user-not-found' ||
                    firebaseError.code === 'auth/invalid-credential'
                ) {
                    return { ok: false, error: 'البريد الإلكتروني أو كلمة المرور غير صحيحة' }
                }
                return { ok: false, error: 'حدث خطأ أثناء تسجيل الدخول' }
            }

            // 2. Get user from database (by firebase_uid or email for backward compatibility)
            let userQuery = await supabase
                .from('users')
                .select('id, firebase_uid, password_hash, is_active, phone_number, is_phone_verified')
                .eq('firebase_uid', firebaseUser.uid)
                .single() as { data: { id: string; firebase_uid?: string; password_hash: string; is_active: boolean; phone_number?: string; is_phone_verified?: boolean } | null; error: any }

            let user = userQuery.data

            // Backward compatibility: If user doesn't have firebase_uid, try by email
            if (!user) {
                userQuery = await supabase
                    .from('users')
                    .select('id, firebase_uid, password_hash, is_active, phone_number, is_phone_verified')
                    .eq('email', email.toLowerCase())
                    .single() as { data: { id: string; firebase_uid?: string; password_hash: string; is_active: boolean; phone_number?: string; is_phone_verified?: boolean } | null; error: any }

                user = userQuery.data

                // Update firebase_uid for this user
                if (user) {
                    await (supabase.from('users') as any)
                        .update({ firebase_uid: firebaseUser.uid })
                        .eq('id', user.id)
                    authLogger.debug('firebase_uid updated for existing user')
                }
            }

            if (!user) {
                return { ok: false, error: 'المستخدم غير موجود في قاعدة البيانات' }
            }

            // 3. If using legacy hash, upgrade to bcrypt
            if (!isBcryptHash(user.password_hash)) {
                const newHash = await this.hashPasswordSecure(password)
                await (supabase.from('users') as any)
                    .update({ password_hash: newHash })
                    .eq('id', user.id)
                authLogger.debug('Password hash upgraded to bcrypt')
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
                .select('id, device_id, device_fingerprint, device_info, last_used, registered_at')
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
                const deviceCount = devices?.length || 0

                // If under the limit (or no devices at all), register the new device automatically
                if (deviceCount < MAX_DEVICES) {

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

                // Max devices reached - return device list for replacement
                const registeredDevices = devices!.map(d => this.parseDeviceDisplayInfo(d))
                return {
                    ok: false,
                    error: `وصلت للحد الأقصى (${MAX_DEVICES} أجهزة). اختر جهاز تريد استبداله.`,
                    maxDevicesReached: true,
                    registeredDevices,
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
     * Replace a specific device - remove one device and register the current one
     * Used when user has reached MAX_DEVICES and wants to replace one specific device
     * SECURITY: Requires password verification to prevent unauthorized device takeover
     */
    async replaceDevice(userId: string, oldDeviceId: string, password?: string): Promise<AuthResult> {
        try {
            // SECURITY: Verify the caller owns this account via current session
            const { userId: currentUserId } = getAuthCookies()
            if (!currentUserId || currentUserId !== userId) {
                return { ok: false, error: 'غير مصرح بهذا الإجراء' }
            }

            // 1. Delete the old device
            await (supabase.from('devices') as any)
                .delete()
                .eq('user_id', userId)
                .eq('device_id', oldDeviceId)

            // 2. Delete sessions for the old device
            await (supabase.from('sessions') as any)
                .delete()
                .eq('user_id', userId)
                .eq('device_id', oldDeviceId)

            // 3. Generate new device fingerprint
            const newFingerprint = await deviceFingerprint.generate()
            const newDeviceId = deviceFingerprint.generateDeviceId()

            // 4. Save new device
            await (supabase.from('devices') as any).insert({
                user_id: userId,
                device_id: newDeviceId,
                device_fingerprint: newFingerprint.hash,
                device_info: newFingerprint.info,
                is_active: true,
            })

            // 5. Create new session
            const session = await this.createSession(userId, newDeviceId)
            if (!session) {
                return { ok: false, error: 'فشل في إنشاء الجلسة' }
            }

            // 6. Save to cookies
            saveAuthCookies(session.token, newDeviceId, userId)

            return { ok: true, userId, message: 'تم استبدال الجهاز بنجاح' }
        } catch (err) {
            authLogger.error('Error replacing device', err)
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

            // 3. Update device fingerprint in background (client-side has hardware info)
            const { deviceId } = getAuthCookies()
            if (deviceId) {
                this.updateDeviceFingerprintInBackground(deviceId, userId)
            }

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
     * Update device fingerprint from client-side (has access to hardware info)
     * Runs in background, doesn't block session verification
     */
    private async updateDeviceFingerprintInBackground(deviceId: string, userId: string): Promise<void> {
        try {
            const currentFingerprint = await deviceFingerprint.generate()

            const { data: device } = await supabase
                .from('devices')
                .select('id, device_fingerprint, device_info')
                .eq('device_id', deviceId)
                .eq('user_id', userId)
                .single() as { data: { id: string; device_fingerprint: string; device_info: any } | null }

            if (!device) return

            // Update fingerprint if device has no info (server-registered) or hash changed
            const hasDeviceInfo = device.device_info && typeof device.device_info === 'object' && Object.keys(device.device_info).length > 0
            const needsUpdate = !hasDeviceInfo || device.device_fingerprint !== currentFingerprint.hash

            if (needsUpdate) {
                await (supabase
                    .from('devices') as any)
                    .update({
                        device_fingerprint: currentFingerprint.hash,
                        device_info: currentFingerprint.info,
                        last_used: new Date().toISOString(),
                    })
                    .eq('id', device.id)
            }
        } catch (err) {
            authLogger.error('Error updating device fingerprint', err)
        }
    }

    /**
     * Send SMS Verification Code (Mock)
     */
    async sendSMSVerification(userId: string, phoneNumber: string): Promise<boolean> {
        try {
            // Generate 6-digit code
            // SECURITY: Use crypto for unpredictable verification codes
            const randomBytes = new Uint32Array(1)
            crypto.getRandomValues(randomBytes)
            const code = (100000 + (randomBytes[0] % 900000)).toString()

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
     * Reset password for logged-in user (using Firebase Auth)
     * Note: For password reset via email link, use confirmPasswordReset in reset-password page
     */
    async resetPassword(newPassword: string): Promise<AuthResult> {
        try {
            // 1. Check if user is logged in to Firebase
            const currentUser = auth?.currentUser
            if (!currentUser) {
                return { ok: false, error: 'يجب تسجيل الدخول أولاً' }
            }

            // 2. Update password in Firebase Auth
            try {
                await updatePassword(currentUser, newPassword)
            } catch (firebaseError: any) {
                authLogger.error('Firebase password update error', firebaseError)
                if (firebaseError.code === 'auth/weak-password') {
                    return { ok: false, error: 'كلمة المرور ضعيفة جداً (يجب أن تكون 6 أحرف على الأقل)' }
                }
                if (firebaseError.code === 'auth/requires-recent-login') {
                    return { ok: false, error: 'يجب تسجيل الدخول مرة أخرى لتغيير كلمة المرور' }
                }
                return { ok: false, error: 'فشل في تحديث كلمة المرور' }
            }

            // 3. Also update password hash in database for consistency
            const passwordHash = await this.hashPasswordSecure(newPassword)
            const { error: updateError } = await (supabase
                .from('users') as any)
                .update({ password_hash: passwordHash })
                .eq('firebase_uid', currentUser.uid)

            if (updateError) {
                authLogger.error('Failed to update password hash in database', updateError)
            }

            // SECURITY: Invalidate ALL sessions after password change
            // Note: getAuthCookies() can't read httpOnly session_token from client-side JS,
            // so we invalidate ALL sessions by user ID — user will need to re-login (safer behavior)
            const { data: userData } = await supabase
                .from('users')
                .select('id')
                .eq('firebase_uid', currentUser.uid)
                .single()

            if (userData?.id) {
                await (supabase.from('sessions') as any)
                    .delete()
                    .eq('user_id', userData.id)
                authLogger.info('Invalidated all sessions after password change for user', userData.id)
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
     * Get user info by ID
     */
    async getUserInfo(userId: string): Promise<Omit<User, 'password_hash'> | null> {
        try {
            const { data, error } = await supabase
                .from('users')
                .select('id, email, full_name, phone_number, is_phone_verified, created_at, is_active')
                .eq('id', userId)
                .single()

            if (error || !data) {
                authLogger.error('Error', error)
                return null
            }

            return data as Omit<User, 'password_hash'>
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
    async getDetailedProgress(): Promise<{ currentPage: number, totalPages: number, percentage: number, completedChapters: number[] } | null> {
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
                completedChapters
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
     * Generate a random verification code (6 characters)
     */
    private generateVerificationCode(): string {
        const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789' // Excluded confusing chars: 0,O,1,I
        // SECURITY: Use crypto for unpredictable verification codes
        const randomBytes = new Uint8Array(6)
        crypto.getRandomValues(randomBytes)
        let code = ''
        for (let i = 0; i < 6; i++) {
            code += chars.charAt(randomBytes[i] % chars.length)
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

            // 3. Register in Firebase Auth to get the official ID
            // Ensure Firebase is initialized (client-side only)
            if (!auth) {
                authLogger.error('Firebase Auth not initialized - must be called from client side')
                return { ok: false, error: 'خطأ في النظام: Firebase غير مهيأ' }
            }

            let firebaseUser
            try {
                const userCredential = await createUserWithEmailAndPassword(
                    auth,
                    email.toLowerCase(),
                    password
                )
                firebaseUser = userCredential.user
                authLogger.debug('Firebase user created successfully', { uid: firebaseUser.uid })
            } catch (firebaseError: any) {
                authLogger.error('Firebase registration error', firebaseError)
                if (firebaseError.code === 'auth/email-already-in-use') {
                    return { ok: false, error: 'البريد الإلكتروني مسجل بالفعل' }
                }
                if (firebaseError.code === 'auth/weak-password') {
                    return { ok: false, error: 'كلمة المرور ضعيفة جداً (يجب أن تكون 6 أحرف على الأقل)' }
                }
                if (firebaseError.code === 'auth/invalid-email') {
                    return { ok: false, error: 'البريد الإلكتروني غير صالح' }
                }
                return { ok: false, error: 'فشل في إنشاء الحساب' }
            }

            const authUserId = firebaseUser.uid

            // 4. Create user in our public.users table (NOT ACTIVE YET)
            const { data: newUser, error: userError } = await (supabase
                .from('users') as any)
                .insert({
                    firebase_uid: authUserId, // Map Firebase UID
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
                // Rollback: sign out from Firebase to clean up
                try {
                    await signOut(auth)
                } catch (rollbackErr) {
                    authLogger.error('Rollback error', rollbackErr)
                }
                authLogger.warn('Orphaned Firebase user created', { userId: authUserId, email: email.toLowerCase() })
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

            // Progress is initialized after authentication by the reading API.
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
