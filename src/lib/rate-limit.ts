/**
 * Rate limiter with Upstash Redis (production) + in-memory fallback (dev/cold-start)
 *
 * Production: Uses Upstash Redis for consistent rate limiting across serverless instances.
 * Fallback:   In-memory Map if UPSTASH_REDIS_REST_URL is not configured.
 *
 * Required env vars for Redis mode:
 *   UPSTASH_REDIS_REST_URL
 *   UPSTASH_REDIS_REST_TOKEN
 */

import { Ratelimit } from '@upstash/ratelimit'
import { Redis } from '@upstash/redis'

// ─── Redis-backed rate limiter (shared across serverless instances) ───────────

let redis: Redis | null = null
let useRedis = false

try {
    if (process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN) {
        redis = new Redis({
            url: process.env.UPSTASH_REDIS_REST_URL,
            token: process.env.UPSTASH_REDIS_REST_TOKEN,
        })
        useRedis = true
    }
} catch {
    // Fallback to in-memory silently
}

/**
 * Create an Upstash Ratelimit instance for a given config.
 * Cached per unique (maxRequests, windowSeconds) pair.
 */
const ratelimitCache = new Map<string, Ratelimit>()
function getUpstashLimiter(maxRequests: number, windowSeconds: number): Ratelimit {
    const key = `${maxRequests}:${windowSeconds}`
    let limiter = ratelimitCache.get(key)
    if (!limiter && redis) {
        limiter = new Ratelimit({
            redis,
            limiter: Ratelimit.slidingWindow(maxRequests, `${windowSeconds} s`),
            analytics: false,
            prefix: 'rl',
        })
        ratelimitCache.set(key, limiter)
    }
    return limiter!
}

// ─── In-memory fallback (resets on cold start) ──────────────────────────────

interface RateLimitEntry {
    count: number
    resetTime: number
}

const rateLimitStore = new Map<string, RateLimitEntry>()

let cleanupInterval: ReturnType<typeof setInterval> | null = null

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

    if (cleanupInterval.unref) {
        cleanupInterval.unref()
    }
}

interface RateLimitConfig {
    /** عدد الطلبات المسموحة */
    maxRequests: number
    /** فترة النافذة الزمنية بالثواني */
    windowSeconds: number
}

interface RateLimitResult {
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
 * Check rate limit — uses Redis if configured, otherwise in-memory fallback.
 * The API is synchronous for in-memory and returns a Promise-compatible result.
 * For Redis mode, call checkRateLimitAsync() instead for true distributed limiting.
 */
export function checkRateLimit(
    identifier: string,
    config: RateLimitConfig = { maxRequests: 10, windowSeconds: 60 }
): RateLimitResult {
    // In-memory fallback (same as before — best-effort on serverless)
    startCleanup()

    const now = Date.now()
    const windowMs = config.windowSeconds * 1000

    let entry = rateLimitStore.get(identifier)

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

    entry.count++

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
 * Async rate limit check — uses Upstash Redis when available, in-memory fallback otherwise.
 * Preferred for API routes where `await` is available.
 */
export async function checkRateLimitAsync(
    identifier: string,
    config: RateLimitConfig = { maxRequests: 10, windowSeconds: 60 }
): Promise<RateLimitResult> {
    // Try Redis first
    if (useRedis && redis) {
        try {
            const limiter = getUpstashLimiter(config.maxRequests, config.windowSeconds)
            const result = await limiter.limit(identifier)
            return {
                allowed: result.success,
                remaining: result.remaining,
                resetTime: result.reset,
                retryAfter: result.success ? undefined : Math.ceil((result.reset - Date.now()) / 1000),
            }
        } catch {
            // Redis error — fall through to in-memory
        }
    }

    // Fallback to synchronous in-memory
    return checkRateLimit(identifier, config)
}

/**
 * الحصول على IP من الطلب
 * يفضل x-vercel-forwarded-for على Vercel (لا يمكن تزويره)
 */
export function getClientIP(request: Request): string {
    // Prefer Vercel's trusted header (cannot be spoofed by clients)
    const vercelForwardedFor = request.headers.get('x-vercel-forwarded-for')
    if (vercelForwardedFor) {
        return vercelForwardedFor.split(',')[0].trim()
    }

    // Fallback to standard x-forwarded-for (trusted on known proxies)
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
    LOGIN: { maxRequests: 10, windowSeconds: 5 * 60 },

    // Registration: 3 محاولات كل ساعة
    REGISTER: { maxRequests: 3, windowSeconds: 60 * 60 },

    // Verification code: 5 محاولات كل 10 دقائق
    VERIFY_CODE: { maxRequests: 5, windowSeconds: 10 * 60 },

    // Chat AI: 30 رسالة كل 24 ساعة لكل مستخدم
    CHAT: { maxRequests: 30, windowSeconds: 24 * 60 * 60 },

    // Hospital Diagnose: 10 تشخيصات كل 24 ساعة
    HOSPITAL_DIAGNOSE: { maxRequests: 10, windowSeconds: 24 * 60 * 60 },

    // Promo code validate: 5 محاولات كل دقيقة لكل IP
    PROMO_VALIDATE: { maxRequests: 5, windowSeconds: 60 },

    // Payment create-session: 5 محاولات كل ساعة لكل مستخدم
    PAYMENT_CREATE: { maxRequests: 5, windowSeconds: 60 * 60 },

    // Payment verify: 10 محاولات كل دقيقة لكل مستخدم
    PAYMENT_VERIFY: { maxRequests: 10, windowSeconds: 60 },

    // Payment activate: 10 محاولات كل دقيقة لكل مستخدم
    PAYMENT_ACTIVATE: { maxRequests: 10, windowSeconds: 60 },

    // Payment process-callback: 5 محاولات كل دقيقة لكل مستخدم
    PAYMENT_CALLBACK: { maxRequests: 20, windowSeconds: 60 },
}
