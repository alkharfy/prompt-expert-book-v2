# Security Audit Report — book2 Codebase

**Date:** 2026-02-20  
**Scope:** Full codebase at `e:\testbookF\new-book\book2\`  
**Auditor:** Automated Security Review

---

## Executive Summary

The codebase has a generally good security posture with rate limiting, bcrypt password hashing, HMAC webhook verification, and service_role key isolation. However, **15 vulnerabilities** were identified across Critical, High, Medium, and Low severity levels.

| Severity | Count |
|----------|-------|
| Critical | 3     |
| High     | 5     |
| Medium   | 5     |
| Low      | 2     |

---

## CRITICAL Vulnerabilities

---

### VULN-01: Device Replace Endpoint Has No Authentication — Account Takeover

**File:** `src/app/api/auth/devices/replace/route.ts`, Lines 30-62  
**Severity:** CRITICAL

**Vulnerable Code:**
```typescript
export async function POST(request: NextRequest) {
    try {
        const body = await request.json()
        const { email, oldDeviceId } = body
        // ...
        // Get user
        const { data: user, error: userError } = await supabase
            .from('users')
            .select('id')
            .eq('email', email.toLowerCase())
            .single()
        // ...
        // Delete the old device
        await supabase
            .from('devices')
            .delete()
            .eq('user_id', user.id)
            .eq('device_id', oldDeviceId)
        // ...
        // Create session — grants full access
        cookieStore.set('ebook_user_id', user.id, cookieOptions)
        cookieStore.set('ebook_session_token', sessionToken, cookieOptions)
```

**Exploitation:** An attacker only needs a victim's email address (no password) to:
1. Call `POST /api/auth/devices/replace` with `{ email: "victim@example.com", oldDeviceId: "any-guess" }`
2. Receive a valid session token and `ebook_user_id` cookie for the victim's account
3. Gain full access to the victim's account, subscription, and data

The endpoint does NOT verify the user's password or require an existing authenticated session. It only requires an email and a device ID (which can be guessed or enumerated).

**Fix:** Require authentication (valid session) OR verify the user's password before allowing device replacement. The `switchDevice()` method in `auth_system.ts` correctly requires password verification — this API route bypasses that.

---

### VULN-02: Admin Subscription Routes Use Client-Side Cookie Auth — Privilege Escalation

**File:** `src/app/api/admin/subscriptions/cancel/route.ts`, Lines 29-31  
**File:** `src/app/api/admin/subscriptions/extend/route.ts`, Lines 29-31  
**Severity:** CRITICAL

**Vulnerable Code:**
```typescript
// 1. التحقق من صلاحية admin
const userId = authSystem.getCurrentUserId()
```

`authSystem.getCurrentUserId()` reads from client-side cookies via `document.cookie` (see `cookie_utils.ts`). On the server, `document` is `undefined`, so this returns `null`. But the real problem is that this function is designed for client-side use and reads `ebook_user_id` — a **non-httpOnly** cookie that any JavaScript on the page can forge.

In practice, since `document` is undefined on the server, `getCurrentUserId()` always returns `null`, making these admin endpoints **completely unusable** (rejected with 401). However, if anyone "fixes" this by switching to reading cookies via Next.js `cookies()` API, the admin check relies only on a non-httpOnly cookie value, which is trivially forgeable.

**Exploitation:** If the cookie reading were fixed to work server-side (using `cookies()` API), any user could:
1. Set their `ebook_user_id` cookie to match an admin user's ID
2. Call `/api/admin/subscriptions/cancel` or `/api/admin/subscriptions/extend`
3. Cancel or extend any subscription

**Fix:** Use proper server-side auth: read `ebook_user_id` + `ebook_session_token` from `cookies()`, validate the session in the database, then check `is_admin`. Use `getAuthenticatedUser()` from `auth-middleware.ts`.

---

### VULN-03: db-operation Proxy Allows Arbitrary Column Updates — Data Manipulation

**File:** `src/app/api/auth/db-operation/route.ts`, Lines 89-119  
**Severity:** CRITICAL

**Vulnerable Code:**
```typescript
case 'update': {
    const safeFilters = ensureUserFilter(filters)
    query = supabase.from(table).update(data) // 'data' is user-provided
    for (const f of safeFilters) {
        if (f.op === 'eq') query = query.eq(f.column, f.value)
    }
```

The `data` payload for `update` is passed directly without any column whitelist. The `user_id` filter prevents updating other users' rows, but a user can update **any column** on their own records in the allowed tables.

**Exploitation:**
```json
{
  "operation": "update",
  "table": "users",
  "data": { "is_admin": true, "is_active": true, "current_plan": "vip" },
  "filters": [{ "op": "eq", "column": "id", "value": "my-user-id" }]
}
```

An authenticated user can escalate themselves to admin, activate their account, or set their plan to VIP — all through this proxy endpoint.

**Fix:** Implement a column whitelist per table. For `users` table, only allow updates to `full_name` and similar non-sensitive fields. **Never** allow `is_admin`, `is_active`, `current_plan`, `password_hash`, `is_verified` to be updated through this proxy.

---

## HIGH Vulnerabilities

---

### VULN-04: Webhook HMAC Signature Comparison Is Not Timing-Safe

**File:** `src/app/api/webhooks/kashier/route.ts`, Lines 54-56  
**Severity:** HIGH

**Vulnerable Code:**
```typescript
// مقارنة آمنة (timing-safe comparison)
const isValid = signature === expectedSignature
```

Despite the comment claiming "timing-safe comparison," the code uses plain `===` string comparison, which is vulnerable to timing attacks. An attacker can progressively determine the correct HMAC byte-by-byte by measuring response times.

**Exploitation:** An attacker sends many webhook requests with varying signatures, measuring response times to deduce the correct HMAC one character at a time. This could allow forging fake payment success webhooks.

**Fix:** Use `crypto.timingSafeEqual()`:
```typescript
import { timingSafeEqual } from 'crypto'
const isValid = timingSafeEqual(Buffer.from(signature), Buffer.from(expectedSignature))
```

---

### VULN-05: Session Token Cookie Is Non-httpOnly in Google Auth and Device Replace

**File:** `src/app/api/auth/google/route.ts`, Line 154  
**File:** `src/app/api/auth/devices/replace/route.ts`, Line 121  
**Severity:** HIGH

**Vulnerable Code (Google Auth):**
```typescript
const cookieOptions = {
    httpOnly: false, // ALL cookies including session_token!
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax' as const,
    maxAge: SESSION_DURATION_MS / 1000,
    path: '/',
}
cookieStore.set('ebook_user_id', userId, cookieOptions)
cookieStore.set('ebook_session_token', sessionToken, cookieOptions) // Session token exposed to JS!
cookieStore.set('ebook_device_id', deviceId, cookieOptions)
```

The login route (`/api/auth/login`) correctly sets `ebook_session_token` as `httpOnly: true`, but the Google Auth route and device replace route set **all** cookies including the session token as `httpOnly: false`.

**Exploitation:** If there is any XSS vulnerability anywhere in the application, an attacker can steal the session token via `document.cookie` for users who authenticated through Google or device replacement.

**Fix:** Set `httpOnly: true` for `ebook_session_token` in all routes, consistent with the login route.

---

### VULN-06: User Profile API Returns `SELECT *` Including password_hash

**File:** `src/app/api/user/profile/route.ts`, Lines 26-30  
**Severity:** HIGH

**Vulnerable Code:**
```typescript
const { data: user, error } = await supabase
    .from('users')
    .select('*')
    .eq('id', userId)
    .single()
// ...
return NextResponse.json({ ok: true, user })
```

The endpoint returns all columns from the `users` table, which includes `password_hash`, `is_admin`, `verification_code`, `firebase_uid`, and any other sensitive columns. This data is sent to the client as JSON.

**Exploitation:** Any authenticated user can call `GET /api/user/profile` and receive their own `password_hash` and other sensitive fields. While a bcrypt hash is not directly reversible, leaking it:
- Allows offline brute-force attacks
- Reveals the hashing algorithm and salt rounds
- Violates principle of least privilege
- Leaks `firebase_uid` which could be used in other attacks

**Fix:** Use explicit column selection:
```typescript
.select('id, email, full_name, phone_number, current_plan, created_at')
```

---

### VULN-07: Login Route Returns User Data via `SELECT *`

**File:** `src/app/api/auth/login/route.ts`, Lines 63-72  
**Severity:** HIGH

**Vulnerable Code:**
```typescript
let { data: user, error: userError } = await supabase
    .from('users')
    .select('*')
    .eq('firebase_uid', firebaseUid)
    .single()
```

While the response at the end filters to `user.id, user.email, user.full_name`, the `SELECT *` query loads all data into memory including `password_hash`. If a future code change introduces a different response pattern (e.g., returning the whole `user` object for debugging), this becomes a direct data leak. The `auth_system.ts` login also queries `select('*')` (line 400).

**Fix:** Use explicit column selection to enforce defense in depth:
```typescript
.select('id, email, full_name, is_active, firebase_uid')
```

---

### VULN-08: Process-Callback Trusts Redirect Parameters Without Kashier API Verification

**File:** `src/app/api/payment/process-callback/route.ts`, Lines 121-124  
**Severity:** HIGH

**Vulnerable Code:**
```typescript
// Fallback: إذا لم يتوفر session_id للتحقق عبر API، نثق بالـ redirect فقط مع تسجيل تحذير
if (!verified && !payment.kashier_session_id && (paymentStatus === 'SUCCESS' || paymentStatus === 'success')) {
    dbLogger.warn(`[process-callback] No session_id for API verification, trusting redirect for payment ${payment.id}`)
    verified = true
}
```

If a payment record exists without a `kashier_session_id`, the endpoint trusts the client-supplied `paymentStatus` parameter directly. An attacker can forge this redirect parameter.

**Exploitation:**
1. Create a payment session (which stores a record with status 'pending')
2. If the record somehow lacks a `kashier_session_id`, call `/api/payment/process-callback` with `{ paymentStatus: "SUCCESS", merchantOrderId: "ORD-..." }`
3. The payment gets marked as successful without actual payment

**Fix:** Never trust client-supplied payment status. If `kashier_session_id` is missing, treat it as unverified and fail closed.

---

## MEDIUM Vulnerabilities

---

### VULN-09: No Subscription Feature Check on Chat and Hospital Endpoints

**File:** `src/app/api/chat/route.ts`, Lines 293-298  
**File:** `src/app/api/prompt-hospital/diagnose/route.ts`  
**Severity:** MEDIUM

**Vulnerable Code:**
```typescript
// 1. Auth check
const userId = await getAuthenticatedUser()
if (!userId) {
    return NextResponse.json(
        { error: 'يجب تسجيل الدخول لاستخدام المساعد الذكي' },
        { status: 401 }
    )
}
// No subscription/feature check — proceeds directly to AI call
```

The chat endpoint requires login only, not a VIP subscription. While the middleware protects the frontend `/chat` route, a user can bypass the UI and call the API directly at `POST /api/chat` with a valid session. Same issue for `/api/prompt-hospital/diagnose` — the tools feature is only gated at the middleware level.

The middleware only runs on page navigations, not direct API calls (the middleware config skips `/api/` paths via `isPublicPath`).

**Exploitation:** A user with a 'basic' plan (no 'chat' feature) can call `POST /api/chat` directly and use the AI assistant.

**Fix:** Add server-side subscription/feature verification in each API route handler:
```typescript
const plan = await getUserSubscription(userId)
if (!plan || !getPlanFeatures(plan.plan_id).includes('chat')) {
    return NextResponse.json({ error: 'Feature not available' }, { status: 403 })
}
```

---

### VULN-10: In-Memory Rate Limiting Does Not Work Across Serverless Instances

**File:** `src/lib/rate-limit.ts`, Lines 1-10  
**Severity:** MEDIUM

**Vulnerable Code:**
```typescript
const rateLimitStore = new Map<string, RateLimitEntry>()
```

The rate limiter uses an in-memory `Map`. In serverless/edge deployments (Vercel), each request may hit a different instance, so the rate limit is effectively per-instance, not per-user. An attacker can brute-force login, registration, or admin login by spreading requests across instances.

**Exploitation:** On a serverless platform, the rate limit of 5 admin login attempts per 15 minutes becomes effectively unlimited as each cold start gets a fresh `Map`.

**Fix:** Use a persistent store (Redis, Supabase, or Vercel KV) for rate limiting in production. The current in-memory approach is only effective for single-instance deployments.

---

### VULN-11: Verification Code Has Weak Entropy (6-digit numeric via Math.random)

**File:** `src/lib/auth_system.ts`, Lines 773-774  
**Severity:** MEDIUM

**Vulnerable Code:**
```typescript
const code = Math.floor(100000 + Math.random() * 900000).toString()
```

`Math.random()` is not cryptographically secure. The verification code space is only 900,000 possible values. Combined with the rate limit being in-memory (VULN-10), an attacker could brute-force the code.

Note: The `generateVerificationCode()` method at line 1242 uses a 6-character alphanumeric code from a CSPRNG-adequate `Math.random` with a 32-char alphabet (32^6 ≈ 1 billion combos), which is much better.

**Fix:** Use `crypto.getRandomValues()` instead of `Math.random()`, and use the alphanumeric approach consistently:
```typescript
const array = new Uint32Array(1)
crypto.getRandomValues(array)
const code = (array[0] % 900000 + 100000).toString()
```

---

### VULN-12: Google Auth Users Have Identifiable password_hash Value

**File:** `src/app/api/auth/google/route.ts`, Line 90  
**Severity:** MEDIUM

**Vulnerable Code:**
```typescript
password_hash: 'google-auth', // No password for Google users
```

This stores a literal string `'google-auth'` instead of a proper password hash. Combined with VULN-06 (profile returns `SELECT *`), a client receives this value and can identify Google-auth users. More importantly, the `switchDevice()` method in `auth_system.ts` uses `verifyUserPassword()` which would compare against this literal — any call to `switchDevice` with password `'google-auth'` would fail the SHA-256 comparison but the intent is dangerous.

**Fix:** Store a null/empty value or a randomly generated hash for Google users, and ensure `switchDevice` is not callable for Google-auth users.

---

### VULN-13: CSRF Protection Bypassed in Development Mode

**File:** `src/app/api/admin/verify/route.ts`, Lines 26-29  
**File:** `src/app/api/admin/verify-session/route.ts`, Lines 14-17  
**Severity:** MEDIUM

**Vulnerable Code:**
```typescript
function validateOrigin(request: Request): boolean {
    // في بيئة التطوير، السماح بـ localhost
    if (process.env.NODE_ENV === 'development') {
        return true // Bypasses ALL CSRF checks
    }
```

In development mode, CSRF protection is completely disabled. If `NODE_ENV` is accidentally set to `development` in production, CSRF protection is gone for admin routes.

**Fix:** Use an allowlist of development origins instead of completely bypassing the check:
```typescript
if (process.env.NODE_ENV === 'development') {
    return !origin || origin.includes('localhost') || origin.includes('127.0.0.1')
}
```

---

## LOW Vulnerabilities

---

### VULN-14: Missing Rate Limiting on Multiple Payment Endpoints

**File:** `src/app/api/payment/create-session/route.ts`  
**File:** `src/app/api/payment/verify/route.ts`  
**File:** `src/app/api/payment/activate/route.ts`  
**File:** `src/app/api/payment/process-callback/route.ts`  
**File:** `src/app/api/payment/verify-by-order/route.ts`  
**File:** `src/app/api/payment/verify-by-user/route.ts`  
**Severity:** LOW

None of the payment endpoints implement rate limiting. While the auth check prevents anonymous abuse, an authenticated user can rapidly poll payment verification endpoints, potentially causing excessive API calls to Kashier.

**Fix:** Add rate limiting to payment endpoints, especially `create-session` (prevent spam payment sessions) and verification endpoints.

---

### VULN-15: db-operation Proxy Filter Operations Are Incomplete

**File:** `src/app/api/auth/db-operation/route.ts`, Lines 82-95  
**Severity:** LOW

**Vulnerable Code:**
```typescript
for (const f of safeFilters) {
    if (f.op === 'eq') query = query.eq(f.column, f.value)
    else if (f.op === 'neq') query = query.neq(f.column, f.value)
    else if (f.op === 'in') query = query.in(f.column, f.value)
}
```

Only `eq`, `neq`, and `in` filters are supported, but there's no protection against injecting filter operators like `gt`, `lt`, `like`, `ilike` that could be used to extract data through boolean-based enumeration. The user_id filter is properly enforced, which limits the impact.

**Fix:** This is defense-in-depth. The main fix is VULN-03. Additionally, consider removing this generic proxy entirely and creating purpose-specific endpoints.

---

## Additional Observations (Not Vulnerabilities)

### Positive Security Measures Already in Place:
1. ✅ Bcrypt password hashing with 12 rounds and max length protection
2. ✅ Firebase UID verification on login and registration
3. ✅ Session token generation using `crypto.randomUUID()` (CSPRNG)
4. ✅ HMAC webhook signature verification (needs timing-safe fix)
5. ✅ Rate limiting on auth endpoints (needs persistent store)
6. ✅ Idempotent subscription creation (prevents duplicate subscriptions)
7. ✅ Admin login uses `timingSafeEqual` for password comparison
8. ✅ Payment verification always checks Kashier API (not just redirect params)
9. ✅ Cookie value sanitization to prevent injection
10. ✅ Server-side session validation in `getAuthenticatedUser()`
11. ✅ Service role key is not exposed in `NEXT_PUBLIC_` variables
12. ✅ Input validation using Zod schemas on chat/hospital endpoints
13. ✅ Legacy SHA-256 hashes are auto-upgraded to bcrypt on login
14. ✅ Fail-closed middleware: denies access on errors

---

## Priority Remediation Order

1. **VULN-01** (Critical) — Device replace without auth → account takeover. Fix immediately.
2. **VULN-03** (Critical) — db-operation allows `is_admin` escalation. Fix immediately.
3. **VULN-02** (Critical) — Admin subscription routes broken auth. Fix immediately.
4. **VULN-04** (High) — Webhook signature timing attack. Fix immediately.
5. **VULN-05** (High) — Session token httpOnly inconsistency. Fix today.
6. **VULN-06** (High) — Profile returns password_hash. Fix today.
7. **VULN-08** (High) — Trusting redirect payment status. Fix today.
8. **VULN-07** (High) — Login SELECT * exposes sensitive data. Fix today.
9. **VULN-09** (Medium) — API routes bypass subscription checks. Fix this week.
10. **VULN-10** (Medium) — In-memory rate limiting. Plan migration to persistent store.
11. **VULN-11** (Medium) — Weak verification code entropy. Fix this week.
12. **VULN-12** (Medium) — Google auth identifiable hash. Fix this week.
13. **VULN-13** (Medium) — CSRF bypass in dev mode. Fix this week.
14. **VULN-14** (Low) — Missing payment rate limits. Schedule fix.
15. **VULN-15** (Low) — db-operation filter gaps. Schedule fix or remove proxy.

---

*End of Security Audit Report*
