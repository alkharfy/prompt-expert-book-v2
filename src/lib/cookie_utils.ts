// Cookie Utility Functions
// Helpers for setting, getting, and clearing cookies

import {
    COOKIE_MAX_AGE,
    COOKIE_PATH,
    COOKIE_SECURE,
    COOKIE_SAME_SITE,
    COOKIE_SESSION_TOKEN,
    COOKIE_DEVICE_ID,
    COOKIE_USER_ID,
} from './config'

/**
 * Sanitize cookie value to prevent injection
 * يزيل الأحرف الخطرة من قيم الكوكيز
 */
function sanitizeCookieValue(value: string): string {
    // إزالة أي أحرف قد تستخدم للـ injection
    return value.replace(/[;\r\n]/g, '')
}

/**
 * Set a cookie with the configured security settings
 * @param name Cookie name
 * @param value Cookie value
 * @param maxAge Max age in seconds (optional, defaults to config)
 */
export function setCookie(name: string, value: string, maxAge: number = COOKIE_MAX_AGE): void {
    // SSR guard - document is not available on server
    if (typeof document === 'undefined') return
    
    // تنظيف القيمة من الأحرف الخطرة
    const safeValue = sanitizeCookieValue(value)
    
    const secureFlag = COOKIE_SECURE ? '; Secure' : ''
    document.cookie = `${name}=${encodeURIComponent(safeValue)}; Path=${COOKIE_PATH}; Max-Age=${maxAge}; SameSite=${COOKIE_SAME_SITE}${secureFlag}`
}

/**
 * Get a cookie value by name
 * @param name Cookie name
 * @returns Cookie value or null if not found
 */
export function getCookie(name: string): string | null {
    // SSR guard - document is not available on server
    if (typeof document === 'undefined') return null
    
    const cookies = document.cookie.split(';')
    for (const cookie of cookies) {
        const [cookieName, cookieValue] = cookie.trim().split('=')
        if (cookieName === name) {
            return decodeURIComponent(cookieValue)
        }
    }
    return null
}

/**
 * Delete a cookie by name
 * @param name Cookie name
 */
export function deleteCookie(name: string): void {
    // SSR guard - document is not available on server
    if (typeof document === 'undefined') return
    
    document.cookie = `${name}=; Path=${COOKIE_PATH}; Max-Age=0`
}

/**
 * Save auth session data to cookies
 * @param sessionToken The session token
 * @param deviceId The device ID
 * @param userId The user ID
 */
export function saveAuthCookies(sessionToken: string, deviceId: string, userId: string): void {
    setCookie(COOKIE_SESSION_TOKEN, sessionToken)
    setCookie(COOKIE_DEVICE_ID, deviceId)
    setCookie(COOKIE_USER_ID, userId)
}

/**
 * Get all auth cookies
 * @returns Object with session token, device id, and user id (or nulls)
 */
export function getAuthCookies(): { sessionToken: string | null; deviceId: string | null; userId: string | null } {
    return {
        sessionToken: getCookie(COOKIE_SESSION_TOKEN),
        deviceId: getCookie(COOKIE_DEVICE_ID),
        userId: getCookie(COOKIE_USER_ID),
    }
}

/**
 * Clear all auth cookies (logout)
 */
export function clearAuthCookies(): void {
    deleteCookie(COOKIE_SESSION_TOKEN)
    deleteCookie(COOKIE_DEVICE_ID)
    deleteCookie(COOKIE_USER_ID)
}
