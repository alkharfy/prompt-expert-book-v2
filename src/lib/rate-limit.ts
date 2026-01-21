/**
 * Simple in-memory rate limiter
 * يحد من عدد الطلبات لكل IP خلال فترة زمنية محددة
 */

interface RateLimitEntry {
    count: number
    resetTime: number
}

// تخزين الطلبات لكل IP
const rateLimitStore = new Map<string, RateLimitEntry>()

// متغير للتحكم في interval التنظيف
let cleanupInterval: ReturnType<typeof setInterval> | null = null

/**
 * بدء تنظيف القيم القديمة (يُستدعى تلقائياً عند أول استخدام)
 */
function startCleanup(): void {
    if (cleanupInterval) return
    
    cleanupInterval = setInterval(() => {
        const now = Date.now()
        const keysToDelete: string[] = []
        rateLimitStore.forEach((entry, key) => {
            if (entry.resetTime < now) {
                keysToDelete.push(key)
            }
        })
        keysToDelete.forEach(key => rateLimitStore.delete(key))
    }, 5 * 60 * 1000)
    
    // لا يمنع إغلاق العملية
    if (cleanupInterval.unref) {
        cleanupInterval.unref()
    }
}

/**
 * إيقاف التنظيف (للاختبارات أو إغلاق التطبيق)
 */
export function stopRateLimitCleanup(): void {
    if (cleanupInterval) {
        clearInterval(cleanupInterval)
        cleanupInterval = null
    }
}

export interface RateLimitConfig {
    /** عدد الطلبات المسموحة */
    maxRequests: number
    /** فترة النافذة الزمنية بالثواني */
    windowSeconds: number
}

export interface RateLimitResult {
    /** هل مسموح بالطلب */
    allowed: boolean
    /** عدد الطلبات المتبقية */
    remaining: number
    /** وقت إعادة تعيين العداد (Unix timestamp) */
    resetTime: number
    /** الوقت المتبقي بالثواني */
    retryAfter?: number
}

/**
 * فحص rate limit لـ IP معين
 */
export function checkRateLimit(
    identifier: string,
    config: RateLimitConfig = { maxRequests: 10, windowSeconds: 60 }
): RateLimitResult {
    // بدء التنظيف التلقائي عند أول استخدام
    startCleanup()
    
    const now = Date.now()
    const windowMs = config.windowSeconds * 1000

    let entry = rateLimitStore.get(identifier)

    // إذا لم يكن هناك سجل أو انتهت النافذة الزمنية
    if (!entry || entry.resetTime < now) {
        entry = {
            count: 1,
            resetTime: now + windowMs
        }
        rateLimitStore.set(identifier, entry)

        return {
            allowed: true,
            remaining: config.maxRequests - 1,
            resetTime: entry.resetTime
        }
    }

    // زيادة العداد
    entry.count++

    // فحص إذا تجاوز الحد
    if (entry.count > config.maxRequests) {
        const retryAfter = Math.ceil((entry.resetTime - now) / 1000)
        return {
            allowed: false,
            remaining: 0,
            resetTime: entry.resetTime,
            retryAfter
        }
    }

    return {
        allowed: true,
        remaining: config.maxRequests - entry.count,
        resetTime: entry.resetTime
    }
}

/**
 * الحصول على IP من الطلب
 */
export function getClientIP(request: Request): string {
    // Try different headers for IP
    const forwardedFor = request.headers.get('x-forwarded-for')
    if (forwardedFor) {
        return forwardedFor.split(',')[0].trim()
    }

    const realIP = request.headers.get('x-real-ip')
    if (realIP) {
        return realIP
    }

    // Fallback
    return 'unknown'
}

/**
 * Rate limit presets for different endpoints
 */
export const RATE_LIMITS = {
    // Admin login: 5 محاولات كل 15 دقيقة
    ADMIN_LOGIN: { maxRequests: 5, windowSeconds: 15 * 60 },
    
    // User login: 10 محاولات كل 5 دقائق
    USER_LOGIN: { maxRequests: 10, windowSeconds: 5 * 60 },
    LOGIN: { maxRequests: 10, windowSeconds: 5 * 60 },
    
    // Registration: 3 محاولات كل ساعة
    REGISTRATION: { maxRequests: 3, windowSeconds: 60 * 60 },
    REGISTER: { maxRequests: 3, windowSeconds: 60 * 60 },
    
    // Verification code: 5 محاولات كل 10 دقائق
    VERIFY_CODE: { maxRequests: 5, windowSeconds: 10 * 60 },
    
    // API general: 100 طلب كل دقيقة
    API_GENERAL: { maxRequests: 100, windowSeconds: 60 },
    
    // Password reset: 3 محاولات كل ساعة
    PASSWORD_RESET: { maxRequests: 3, windowSeconds: 60 * 60 }
}
