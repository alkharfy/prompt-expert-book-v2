import { NextResponse } from 'next/server'
import { timingSafeEqual } from 'crypto'
import { 
    SESSION_DURATION, 
    createSession,
} from '@/lib/admin-session'
import { checkRateLimit, getClientIP, RATE_LIMITS } from '@/lib/rate-limit'
import { apiLogger } from '@/lib/logger'
import { adminLoginSchema, validateInput } from '@/lib/validation'

// Timing-safe string comparison to prevent timing attacks
function safeCompare(a: string, b: string): boolean {
    if (a.length !== b.length) {
        // Compare with dummy to maintain constant time
        timingSafeEqual(Buffer.from(a), Buffer.from(a))
        return false
    }
    return timingSafeEqual(Buffer.from(a), Buffer.from(b))
}

// التحقق من أن الطلب قادم من نفس الموقع (حماية CSRF)
function validateOrigin(request: Request): boolean {
    const origin = request.headers.get('origin')
    const host = request.headers.get('host')
    
    // في بيئة التطوير، السماح بـ localhost
    if (process.env.NODE_ENV === 'development') {
        return true
    }
    
    // التحقق من أن الـ origin يطابق الـ host
    if (origin && host) {
        try {
            const originUrl = new URL(origin)
            return originUrl.host === host
        } catch {
            return false
        }
    }
    
    // رفض الطلبات بدون origin (من أدوات خارجية)
    return false
}

export async function POST(request: Request) {
    try {
        // التحقق من CSRF
        if (!validateOrigin(request)) {
            apiLogger.warn('CSRF validation failed')
            return NextResponse.json(
                { success: false, error: 'Invalid request origin' },
                { status: 403 }
            )
        }

        // Rate limiting
        const clientIP = getClientIP(request)
        const rateLimitResult = checkRateLimit(`admin-login:${clientIP}`, RATE_LIMITS.ADMIN_LOGIN)
        
        if (!rateLimitResult.allowed) {
            return NextResponse.json(
                { 
                    success: false, 
                    error: `تم تجاوز عدد المحاولات المسموحة. حاول مجدداً بعد ${rateLimitResult.retryAfter} ثانية` 
                },
                { 
                    status: 429,
                    headers: {
                        'Retry-After': String(rateLimitResult.retryAfter),
                        'X-RateLimit-Remaining': '0',
                        'X-RateLimit-Reset': String(rateLimitResult.resetTime)
                    }
                }
            )
        }

        const body = await request.json()
        
        // التحقق من صحة المدخلات باستخدام Zod
        const validation = validateInput(adminLoginSchema, body)
        if (!validation.success) {
            return NextResponse.json(
                { success: false, error: validation.errors[0] },
                { status: 400 }
            )
        }
        
        const { password } = validation.data

        // التحقق من كلمة المرور من Environment Variable
        const adminPassword = process.env.ADMIN_PASSWORD

        if (!adminPassword) {
            apiLogger.error('ADMIN_PASSWORD not configured')
            return NextResponse.json(
                { success: false, error: 'Server configuration error' },
                { status: 500 }
            )
        }

        if (safeCompare(password, adminPassword)) {
            // إنشاء جلسة جديدة مع IP
            const token = await createSession(clientIP)

            apiLogger.debug('Admin session created')

            return NextResponse.json({
                success: true,
                token,
                expiresIn: SESSION_DURATION
            })
        }

        return NextResponse.json(
            { success: false, error: 'Invalid password' },
            { status: 401 }
        )
    } catch {
        return NextResponse.json(
            { success: false, error: 'Invalid request' },
            { status: 400 }
        )
    }
}
