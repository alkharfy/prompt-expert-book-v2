import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

// Security headers لجميع الاستجابات
const securityHeaders = {
    'X-Content-Type-Options': 'nosniff',
    'X-Frame-Options': 'DENY',
    'X-XSS-Protection': '1; mode=block',
    'Referrer-Policy': 'strict-origin-when-cross-origin',
    'Permissions-Policy': 'camera=(), microphone=(), geolocation=()',
}

// CSP header - Content Security Policy
const cspHeader = process.env.NODE_ENV === 'production' 
    ? "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self' data:; connect-src 'self' https://*.supabase.co wss://*.supabase.co;"
    : '' // تعطيل CSP في التطوير لتسهيل الـ debugging

export function middleware(request: NextRequest) {
    const { pathname } = request.nextUrl
    
    // إنشاء Response
    const response = NextResponse.next()
    
    // إضافة Security Headers لجميع الطلبات
    Object.entries(securityHeaders).forEach(([key, value]) => {
        response.headers.set(key, value)
    })
    
    // إضافة CSP في الإنتاج فقط
    if (cspHeader) {
        response.headers.set('Content-Security-Policy', cspHeader)
    }
    
    // حماية خاصة لمسارات Admin API
    if (pathname.startsWith('/api/admin')) {
        // التحقق من Content-Type للـ POST requests
        if (request.method === 'POST') {
            const contentType = request.headers.get('content-type')
            if (!contentType?.includes('application/json')) {
                return NextResponse.json(
                    { error: 'Content-Type must be application/json' },
                    { status: 415 }
                )
            }
        }
        
        // منع التخزين المؤقت للـ Admin API
        response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate')
        response.headers.set('Pragma', 'no-cache')
        response.headers.set('Expires', '0')
    }
    
    // حماية صفحة Admin Dashboard
    if (pathname.startsWith('/admin')) {
        // منع التخزين المؤقت
        response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate')
        
        // يمكن إضافة التحقق من الـ session هنا لاحقاً
        // حالياً التحقق يتم من جانب العميل
    }
    
    return response
}

// تحديد المسارات التي يُطبق عليها الـ middleware
export const config = {
    matcher: [
        // تطبيق على جميع المسارات ما عدا الملفات الثابتة
        '/((?!_next/static|_next/image|favicon.ico|assets/).*)',
    ],
}
