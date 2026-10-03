/**
 * Middleware — Route Protection
 *
 * يحمي المسارات المحددة بناءً على اشتراك المستخدم.
 * يعمل على Edge Runtime — لا يستخدم Node.js APIs.
 *
 * IMPORTANT: Fail-closed mode.
 * If subscription check fails, deny access and log error.
 *
 * @module middleware
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import type { Database } from '@/lib/database.types'
import type { PlanId } from '@/types/subscription'
import { getPlanFeatures, isActivePlanSubscription } from '@/lib/features'

// ─────────────────────────────────────────────
// Security Headers (applied to every response)
// ─────────────────────────────────────────────
function applySecurityHeaders(response: NextResponse): NextResponse {
  // Clickjacking + MIME sniffing
  response.headers.set('X-Frame-Options', 'DENY')
  response.headers.set('X-Content-Type-Options', 'nosniff')
  // Referrer leak prevention
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin')
  // Disable powerful browser features we don't use
  response.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=(), interest-cohort=()')
  // HSTS — only meaningful in production over HTTPS
  if (process.env.NODE_ENV === 'production') {
    response.headers.set('Strict-Transport-Security', 'max-age=63072000; includeSubDomains; preload')
  }
  // Content-Security-Policy: unsafe-inline retained for next/script + framer-motion;
  // upgrade-insecure-requests + strict default-src cuts the obvious XSS surface.
  // This is the ONLY CSP the site sends — browsers enforce every CSP header they
  // receive, so a second policy (e.g. in next.config.js) silently blocks anything
  // it omits. Every third party below is load-bearing:
  //   Firebase Auth (Google sign-in): apis.google.com script + firebaseapp.com / accounts.google.com frames
  //   GA4: googletagmanager + google-analytics + analytics.google.com + g/collect on google.com / doubleclick
  //   Meta Pixel: connect.facebook.net script + facebook.com connect/frame/form (noscript + iframe fallbacks)
  //   Kashier checkout, Supabase, and Chart.js (cdn.jsdelivr.net) on the admin dashboard.
  if (process.env.NODE_ENV === 'production') {
    response.headers.set(
      'Content-Security-Policy',
      [
        "default-src 'self'",
        "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://apis.google.com https://www.gstatic.com https://*.firebaseapp.com https://www.googletagmanager.com https://www.google-analytics.com https://connect.facebook.net https://*.kashier.io https://cdn.jsdelivr.net",
        "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
        "font-src 'self' data: https://fonts.gstatic.com",
        "img-src 'self' data: blob: https: http:",
        "media-src 'self' blob: https:",
        "connect-src 'self' https://*.supabase.co wss://*.supabase.co https://*.firebaseio.com https://*.googleapis.com https://*.firebaseapp.com https://www.googletagmanager.com https://*.google-analytics.com https://*.analytics.google.com https://analytics.google.com https://stats.g.doubleclick.net https://www.google.com https://www.google.com.eg https://connect.facebook.net https://*.facebook.com https://*.kashier.io https://cdn.jsdelivr.net",
        "frame-src 'self' https://*.kashier.io https://www.google.com https://*.firebaseapp.com https://accounts.google.com https://www.facebook.com",
        "frame-ancestors 'none'",
        "base-uri 'self'",
        "object-src 'none'",
        "form-action 'self' https://*.kashier.io https://www.facebook.com",
        "upgrade-insecure-requests",
      ].join('; ')
    )
  }
  return response
}

// ─────────────────────────────────────────────
// Security: Allowed internal redirect paths
// ─────────────────────────────────────────────
const ALLOWED_REDIRECT_PREFIXES = [
  '/exercises', '/tools', '/running-project', '/prompt-hospital',
  '/chat', '/achievements', '/leaderboard', '/certificate',
  '/profile', '/bookmarks', '/billing', '/read/', '/toc',
  '/library', '/notes', '/community', '/onboarding',
]

/**
 * Validate that a redirect path is safe (internal only)
 */
function isSafeRedirectPath(path: string): boolean {
  if (!path || !path.startsWith('/')) return false
  // Block protocol-relative URLs (//evil.com)
  if (path.startsWith('//')) return false
  // Block encoded characters that could form a URL
  if (path.includes('%2f') || path.includes('%2F') || path.includes('\\')) return false
  return ALLOWED_REDIRECT_PREFIXES.some(prefix => path === prefix || path.startsWith(prefix + '/'))
}

// ─────────────────────────────────────────────
// Configuration
// ─────────────────────────────────────────────

/**
 * مسارات محمية — تحتاج اشتراك نشط
 * Map: pathname → required feature
 */
const PROTECTED_ROUTES: Record<string, string> = {
  '/exercises': 'exercises',
  '/tools': 'tools',
  '/running-project': 'tools',
  '/prompt-hospital': 'tools',
  '/chat': 'chat',
  '/achievements': 'gamification',
  '/leaderboard': 'gamification',
}

/**
 * مسارات عامة — دائماً متاحة
 */
const PUBLIC_PATHS = [
  '/',
  '/login',
  '/register',
  '/forgot-password',
  '/reset-password',
  '/verify-code',
  '/payment',
  '/payment/callback',
  '/library',
  '/toc',
  '/certificate',
  '/resources',
  '/ai-updates',
]

/**
 * مسارات تحتاج تسجيل دخول فقط (بدون اشتراك محدد)
 */
const LOGIN_REQUIRED_PATHS = [
  '/profile',
  '/bookmarks',
]

// ─────────────────────────────────────────────
// Helper Functions
// ─────────────────────────────────────────────

/**
 * التحقق من أن المسار عام (لا يحتاج حماية)
 */
function isPublicPath(pathname: string): boolean {
  // مسارات عامة محددة
  if (PUBLIC_PATHS.includes(pathname)) {
    return true
  }

  // مسارات تبدأ بـ /read/ أو /api/ أو /_next/
  if (
    pathname.startsWith('/read/') ||
    pathname.startsWith('/certificate/') ||
    pathname.startsWith('/api/') ||
    pathname.startsWith('/_next/') ||
    pathname === '/favicon.ico'
  ) {
    return true
  }

  return false
}

// ─────────────────────────────────────────────
// Cached Supabase Client (module-level singleton for edge runtime)
// ─────────────────────────────────────────────
let _cachedSupabase: ReturnType<typeof createClient<Database>> | null = null

function getMiddlewareSupabase() {
  if (_cachedSupabase) return _cachedSupabase
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!supabaseUrl || !supabaseServiceKey) return null
  _cachedSupabase = createClient<Database>(supabaseUrl, supabaseServiceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  })
  return _cachedSupabase
}

/**
 * التحقق من اشتراك المستخدم
 * يستدعي get_user_plan RPC function
 */
async function checkUserSubscription(userId: string): Promise<{
  hasPlan: boolean
  planId: string | null
  features: string[]
}> {
  try {
    const supabase = getMiddlewareSupabase()

    if (!supabase) {
      console.error('[Middleware] Missing Supabase credentials')
      // Fail-closed: رفض الوصول عند فقدان المتغيرات
      return { hasPlan: false, planId: null, features: [] }
    }

    // Strategy 1: Try RPC function get_user_plan
    let planId: PlanId | null = null

    try {
      const { data, error } = await (supabase.rpc as any)('get_user_plan', {
        p_user_id: userId,
      })

      if (!error) {
        const row = Array.isArray(data) ? data[0] : data
        if (row && row.plan_id) {
          if (!isActivePlanSubscription(row)) return { hasPlan: false, planId: null, features: [] }
          planId = row.plan_id
        }
      }
    } catch {
      // RPC not available
    }

    // Strategy 2: Direct query on subscriptions table
    if (!planId) {
      try {
        const { data: sub } = await (supabase.from('subscriptions') as any)
          .select('plan_id, status, expires_at')
          .eq('user_id', userId)
          .eq('status', 'active')
          .gt('expires_at', new Date().toISOString())
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle()
        if (isActivePlanSubscription(sub)) planId = sub.plan_id
      } catch { /* table might not exist */ }
    }

    // Strategy 3: Check users table current_plan (with expiry check)
    if (!planId) {
      try {
        const { data: user } = await (supabase.from('users') as any)
          .select('current_plan, is_active, plan_expires_at')
          .eq('id', userId)
          .maybeSingle()
        const userPlan = user ? { plan_id: user.current_plan, expires_at: user.plan_expires_at,
          status: user.is_active === true ? 'active' as const : null } : null
        if (isActivePlanSubscription(userPlan)) {
          planId = userPlan.plan_id
        }
      } catch { /* fallback */ }
    }

    // Strategy 4 REMOVED: Payments table fallback was unsafe — a historical
    // successful payment does NOT imply an active subscription.
    // Subscription creation is handled by webhook and verify endpoints.

    if (!planId) {
      return { hasPlan: false, planId: null, features: [] }
    }

    // جلب ميزات الباقة — استخدام القيم الثابتة لضمان الاتساق (المصدر الوحيد للحقيقة)
    const features = [...getPlanFeatures(planId)]

    return {
      hasPlan: true,
      planId,
      features,
    }
  } catch (err) {
    console.error('[Middleware] Unexpected error:', err)
    // Fail-closed: رفض الوصول عند الاستثناءات
    return { hasPlan: false, planId: null, features: [] }
  }
}

// ─────────────────────────────────────────────
// Middleware Function
// ─────────────────────────────────────────────

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // 0. حماية مسارات الإدارة (Admin Panel)
  if (pathname.startsWith('/billing/admin')) {
    const userId = request.cookies.get('ebook_user_id')?.value
    const sessionToken = request.cookies.get('ebook_session_token')?.value

    if (!userId || !sessionToken) {
      const loginUrl = new URL('/login', request.url)
      if (isSafeRedirectPath(pathname)) {
        loginUrl.searchParams.set('next', pathname)
      }
      return applySecurityHeaders(NextResponse.redirect(loginUrl))
    }

    // التحقق من صلاحية admin مع التحقق من الجلسة
    try {
      const supabase = getMiddlewareSupabase()

      if (supabase) {
        // التحقق من صحة الجلسة أولاً
        const { data: session } = await (supabase as any)
          .from('sessions')
          .select('id')
          .eq('user_id', userId)
          .eq('session_token', sessionToken)
          .gt('expires_at', new Date().toISOString())
          .maybeSingle()

        if (!session) {
          const loginUrl = new URL('/login', request.url)
          if (isSafeRedirectPath(pathname)) {
            loginUrl.searchParams.set('next', pathname)
          }
          return applySecurityHeaders(NextResponse.redirect(loginUrl))
        }

        const { data: user } = await (supabase as any)
          .from('users')
          .select('is_admin, is_active')
          .eq('id', userId)
          .single()

        if (!user || !user.is_admin || user.is_active === false) {
          // ليس admin أو حساب معطل — إعادة التوجيه للرئيسية
          return applySecurityHeaders(NextResponse.redirect(new URL('/', request.url)))
        }
      }
    } catch (err) {
      console.error('[Middleware] Admin check error:', err)
      return applySecurityHeaders(NextResponse.redirect(new URL('/', request.url)))
    }

    // السماح بالوصول للـ admin
    return applySecurityHeaders(NextResponse.next())
  }

  // 1. تجاهل المسارات العامة
  if (isPublicPath(pathname)) {
    return applySecurityHeaders(NextResponse.next())
  }

  // 2. فحص المسارات التي تحتاج تسجيل دخول فقط (بدون اشتراك)
  if (LOGIN_REQUIRED_PATHS.some(p => pathname.startsWith(p))) {
    const userId = request.cookies.get('ebook_user_id')?.value
    const sessionToken = request.cookies.get('ebook_session_token')?.value
    if (!userId || !sessionToken) {
      const loginUrl = new URL('/login', request.url)
      if (isSafeRedirectPath(pathname)) {
        loginUrl.searchParams.set('next', pathname)
      }
      return applySecurityHeaders(NextResponse.redirect(loginUrl))
    }

    // التحقق من صحة الجلسة + حالة الحساب
    const supabase = getMiddlewareSupabase()
    if (supabase) {
      const { data: session } = await (supabase as any)
        .from('sessions')
        .select('id')
        .eq('user_id', userId)
        .eq('session_token', sessionToken)
        .gt('expires_at', new Date().toISOString())
        .maybeSingle()

      if (!session) {
        const loginUrl = new URL('/login', request.url)
        if (isSafeRedirectPath(pathname)) {
          loginUrl.searchParams.set('next', pathname)
        }
        return applySecurityHeaders(NextResponse.redirect(loginUrl))
      }

      // NOTE: No is_active check for LOGIN_REQUIRED_PATHS (profile, bookmarks)
      // These pages should be accessible to any logged-in user regardless of payment status.
      // is_active=false means the user hasn't paid yet, NOT that their account is disabled.
    }
    return applySecurityHeaders(NextResponse.next())
  }

  // 3. التحقق من أن المسار محمي
  // SECURITY: Normalize pathname — strip trailing slash and compare prefix
  // to prevent bypass via /exercises/ or /exercises/sub-path
  const normalizedPath = pathname.endsWith('/') && pathname.length > 1
    ? pathname.slice(0, -1)
    : pathname
  const requiredFeature = PROTECTED_ROUTES[normalizedPath]
    ?? Object.entries(PROTECTED_ROUTES).find(([route]) => normalizedPath.startsWith(route + '/'))?.[1]
    ?? null

  if (!requiredFeature) {
    // المسار غير محمي — السماح بالوصول
    return applySecurityHeaders(NextResponse.next())
  }

  // 4. استخراج معرّف المستخدم وتوكن الجلسة من الكوكيز
  const userId = request.cookies.get('ebook_user_id')?.value
  const sessionToken = request.cookies.get('ebook_session_token')?.value

  if (!userId || !sessionToken) {
    // لا يوجد مستخدم أو جلسة — إعادة التوجيه لتسجيل الدخول
    const loginUrl = new URL('/login', request.url)
    if (isSafeRedirectPath(pathname)) {
      loginUrl.searchParams.set('next', pathname)
    }
    return applySecurityHeaders(NextResponse.redirect(loginUrl))
  }

  // 4.1. التحقق من صحة الجلسة
  const supabase = getMiddlewareSupabase()
  if (supabase) {
    const { data: session } = await (supabase as any)
      .from('sessions')
      .select('id')
      .eq('user_id', userId)
      .eq('session_token', sessionToken)
      .gt('expires_at', new Date().toISOString())
      .maybeSingle()

    if (!session) {
      const loginUrl = new URL('/login', request.url)
      if (isSafeRedirectPath(pathname)) {
        loginUrl.searchParams.set('next', pathname)
      }
      return applySecurityHeaders(NextResponse.redirect(loginUrl))
    }

    // Check is_active — if false, user hasn't paid yet → redirect to payment, NOT login.
    // is_active=false means unpaid account, NOT disabled account.
    const { data: userRecord } = await (supabase as any)
      .from('users')
      .select('is_active')
      .eq('id', userId)
      .maybeSingle()

    if (userRecord && userRecord.is_active === false) {
      // User is logged in but hasn't subscribed yet → redirect to payment page
      const paymentUrl = new URL('/payment', request.url)
      if (requiredFeature) {
        paymentUrl.searchParams.set('feature', requiredFeature)
      }
      if (isSafeRedirectPath(pathname)) {
        paymentUrl.searchParams.set('redirect', pathname)
      }
      return applySecurityHeaders(NextResponse.redirect(paymentUrl))
    }

    if (!userRecord) {
      // User record not found — possible data integrity issue → redirect to login
      const loginUrl = new URL('/login', request.url)
      if (isSafeRedirectPath(pathname)) {
        loginUrl.searchParams.set('next', pathname)
      }
      return applySecurityHeaders(NextResponse.redirect(loginUrl))
    }
  }

  // 4.2. التحقق من اشتراك المستخدم
  const { hasPlan, planId, features } = await checkUserSubscription(userId)

  if (!hasPlan) {
    // لا يوجد اشتراك نشط — إعادة التوجيه للدفع
    // SECURITY: لا نمرر userId في URL — سيُقرأ من الكوكيز في صفحة الدفع
    const paymentUrl = new URL('/payment', request.url)
    if (requiredFeature) {
      paymentUrl.searchParams.set('feature', requiredFeature)
    }
    if (isSafeRedirectPath(pathname)) {
      paymentUrl.searchParams.set('redirect', pathname)
    }
    return applySecurityHeaders(NextResponse.redirect(paymentUrl))
  }

  // 5. التحقق من الميزة المطلوبة
  if (!features.includes(requiredFeature)) {
    // الباقة لا تتضمن هذه الميزة — إعادة التوجيه للترقية
    // SECURITY: لا نمرر userId في URL — سيُقرأ من الكوكيز
    const paymentUrl = new URL('/payment', request.url)
    paymentUrl.searchParams.set('upgrade', 'true')
    paymentUrl.searchParams.set('feature', requiredFeature)
    if (planId) paymentUrl.searchParams.set('currentPlan', planId)
    if (isSafeRedirectPath(pathname)) {
      paymentUrl.searchParams.set('redirect', pathname)
    }
    return applySecurityHeaders(NextResponse.redirect(paymentUrl))
  }

  // 6. السماح بالوصول
  return applySecurityHeaders(NextResponse.next())
}

// ─────────────────────────────────────────────
// Matcher Configuration
// ─────────────────────────────────────────────

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
