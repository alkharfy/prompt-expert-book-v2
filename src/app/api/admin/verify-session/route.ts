import { NextResponse } from 'next/server'
import { verifyToken, SESSION_DURATION } from '@/lib/admin-session'

// Regex للتحقق من أن التوكن يحتوي على hex characters فقط
const TOKEN_REGEX = /^[a-f0-9]{64}$/i

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
    
    // رفض الطلبات بدون origin
    return false
}

export async function POST(request: Request) {
    try {
        // التحقق من CSRF
        if (!validateOrigin(request)) {
            return NextResponse.json({ valid: false })
        }

        const { token } = await request.json()

        // تحقق قوي من التوكن
        if (!token || typeof token !== 'string' || !TOKEN_REGEX.test(token)) {
            return NextResponse.json({ valid: false })
        }

        // التحقق من صحة التوكن
        const isValid = await verifyToken(token)

        if (!isValid) {
            return NextResponse.json({ valid: false })
        }

        return NextResponse.json({
            valid: true,
            expiresIn: SESSION_DURATION
        })
    } catch {
        return NextResponse.json({ valid: false })
    }
}
