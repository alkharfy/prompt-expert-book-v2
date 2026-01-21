/**
 * Password Utilities
 * دوال آمنة لهاش والتحقق من كلمات المرور باستخدام bcrypt
 */

import bcrypt from 'bcryptjs'

// عدد جولات التشفير (12 هو توازن جيد بين الأمان والسرعة)
const SALT_ROUNDS = 12

// الحد الأقصى لطول كلمة المرور (لمنع DOS attacks على bcrypt)
// bcrypt يعالج فقط أول 72 bytes، لكن نحد أكثر للأمان
export const MAX_PASSWORD_LENGTH = 128
export const MIN_PASSWORD_LENGTH = 6

/**
 * التحقق من طول كلمة المرور
 */
export function isValidPasswordLength(password: string): boolean {
    return password.length >= MIN_PASSWORD_LENGTH && password.length <= MAX_PASSWORD_LENGTH
}

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
    return bcrypt.hash(password, SALT_ROUNDS)
}

/**
 * التحقق من كلمة المرور
 * @param password كلمة المرور النصية
 * @param hash الهاش المخزن
 * @returns true إذا تطابقت
 */
export async function verifyPassword(password: string, hash: string): Promise<boolean> {
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
    const encoder = new TextEncoder()
    const data = encoder.encode(password)
    const hashBuffer = await crypto.subtle.digest('SHA-256', data)
    const hashArray = Array.from(new Uint8Array(hashBuffer))
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('')
}
