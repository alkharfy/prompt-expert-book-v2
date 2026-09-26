/**
 * Password Utilities
 * دوال آمنة لهاش والتحقق من كلمات المرور باستخدام bcrypt
 */

// bcryptjs is loaded ONLY inside the (server-side, already-async) hash/verify
// functions via dynamic import, so it is never pulled into the client first-load
// bundle by the many client components that transitively import auth_system.
const SALT_ROUNDS = 12

// الحد الأقصى لطول كلمة المرور (لمنع DOS attacks على bcrypt)
// bcrypt يعالج فقط أول 72 bytes، لكن نحد أكثر للأمان
const MAX_PASSWORD_LENGTH = 128

/**
 * هاش كلمة المرور باستخدام bcrypt
 * @param password كلمة المرور النصية
 * @returns الهاش المشفر
 * @throws Error إذا كانت كلمة المرور طويلة جداً
 */
export async function hashPassword(password: string): Promise<string> {
    if (password.length > MAX_PASSWORD_LENGTH) {
        throw new Error('Password too long')
    }
    const bcrypt = (await import('bcryptjs')).default
    return bcrypt.hash(password, SALT_ROUNDS)
}

/**
 * التحقق من كلمة المرور
 * @param password كلمة المرور النصية
 * @param hash الهاش المخزن
 * @returns true إذا تطابقت
 */
export async function verifyPassword(password: string, hash: string): Promise<boolean> {
    // SECURITY: Reject overly long passwords to prevent DoS on bcrypt
    if (!password || password.length > MAX_PASSWORD_LENGTH) {
        return false
    }
    const bcrypt = (await import('bcryptjs')).default
    return bcrypt.compare(password, hash)
}

/**
 * التحقق من أن الهاش هو bcrypt (يبدأ بـ $2)
 */
export function isBcryptHash(hash: string): boolean {
    return hash.startsWith('$2a$') || hash.startsWith('$2b$') || hash.startsWith('$2y$')
}

/**
 * هاش سريع باستخدام SHA-256 (للتوافق مع الهاشات القديمة)
 * ⚠️ لا تستخدم هذا للهاشات الجديدة!
 */
export async function legacySha256Hash(password: string): Promise<string> {
    if (typeof crypto !== 'undefined' && crypto.subtle) {
        const encoder = new TextEncoder()
        const data = encoder.encode(password)
        const hashBuffer = await crypto.subtle.digest('SHA-256', data)
        const hashArray = Array.from(new Uint8Array(hashBuffer))
        return hashArray.map(b => b.toString(16).padStart(2, '0')).join('')
    }
    // crypto.subtle is available in all modern runtimes (Node 15+, all browsers)
    throw new Error('crypto.subtle is not available. Cannot compute SHA-256 hash.')
}
