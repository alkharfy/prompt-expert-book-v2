/**
 * CSRF Protection Utilities
 * حماية من هجمات Cross-Site Request Forgery
 */

// مدة صلاحية التوكن بالملي ثانية (ساعة واحدة)
const TOKEN_EXPIRY = 60 * 60 * 1000

/**
 * توليد random bytes بشكل آمن
 */
function getSecureRandom(): string {
    if (typeof crypto !== 'undefined' && crypto.randomUUID) {
        // استخدام crypto.randomUUID (الأكثر أماناً)
        return crypto.randomUUID().replace(/-/g, '')
    }
    if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
        // استخدام crypto.getRandomValues
        const array = new Uint8Array(16)
        crypto.getRandomValues(array)
        return Array.from(array, b => b.toString(16).padStart(2, '0')).join('')
    }
    // Fallback (أقل أماناً، للبيئات القديمة فقط)
    return Math.random().toString(36).substring(2) + Date.now().toString(36)
}

/**
 * توليد CSRF token آمن
 */
export function generateCsrfToken(): string {
    const timestamp = Date.now().toString(36)
    const random = getSecureRandom()
    const token = `${timestamp}-${random}`
    return token
}

/**
 * التحقق من صلاحية CSRF token
 */
export function validateCsrfToken(token: string | null, storedToken: string | null): boolean {
    if (!token || !storedToken) return false
    if (token !== storedToken) return false
    
    // استخراج الـ timestamp من التوكن
    const parts = token.split('-')
    if (parts.length !== 2) return false
    
    const timestamp = parseInt(parts[0], 36)
    const now = Date.now()
    
    // التحقق من أن التوكن لم تنتهِ صلاحيته
    if (now - timestamp > TOKEN_EXPIRY) return false
    
    return true
}

/**
 * حفظ CSRF token في cookie
 * نستخدم SameSite=Strict و Secure في الإنتاج
 */
export function setCsrfCookie(token: string): void {
    if (typeof document === 'undefined') return
    
    const maxAge = TOKEN_EXPIRY / 1000 // تحويل لثواني
    const isProduction = typeof window !== 'undefined' && window.location.protocol === 'https:'
    const secureFlag = isProduction ? '; Secure' : ''
    
    // ملاحظة: لا نستخدم HttpOnly لأننا نحتاج قراءة التوكن من JavaScript
    // الحماية تأتي من SameSite=Strict + مطابقة التوكن في Header
    document.cookie = `csrf_token=${token}; Path=/; Max-Age=${maxAge}; SameSite=Strict${secureFlag}`
}

/**
 * قراءة CSRF token من cookie
 */
export function getCsrfCookie(): string | null {
    if (typeof document === 'undefined') return null
    
    const cookies = document.cookie.split(';')
    for (const cookie of cookies) {
        const [name, value] = cookie.trim().split('=')
        if (name === 'csrf_token') {
            return value
        }
    }
    return null
}

/**
 * إنشاء وحفظ توكن جديد
 */
export function createAndStoreCsrfToken(): string {
    const token = generateCsrfToken()
    setCsrfCookie(token)
    return token
}

/**
 * التحقق من CSRF في request headers
 */
export function verifyCsrfFromRequest(request: Request): boolean {
    const headerToken = request.headers.get('X-CSRF-Token')
    const cookieHeader = request.headers.get('Cookie')
    
    if (!cookieHeader || !headerToken) return false
    
    // استخراج التوكن من الكوكيز
    const cookies = cookieHeader.split(';')
    let cookieToken: string | null = null
    
    for (const cookie of cookies) {
        const [name, value] = cookie.trim().split('=')
        if (name === 'csrf_token') {
            cookieToken = value
            break
        }
    }
    
    return validateCsrfToken(headerToken, cookieToken)
}
