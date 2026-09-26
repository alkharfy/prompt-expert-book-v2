# 00 — Baseline Audit: Payment & Access Control System

> **Date:** 2026-02-12  
> **Stage:** 0 (Pre-migration — Read-only audit, zero code changes)  
> **Scope:** Document the current state of payment flow, access control, price sources, and DB tables  

---

## 1. Current Payment Flow

```
User Journey (current):

  /register ──POST──▶ authSystem.register()
      │                 ├─ creates user in DB
      │                 └─ redirects to /payment?uid=xxx
      ▼
  /payment (page.tsx)
      │   ├─ Shows 3 plan cards (basic/pro/vip)
      │   └─ User picks plan, clicks "ادفع الآن"
      │
      │──POST──▶ /api/payment/create-session
      │             ├─ Validates user exists in DB
      │             ├─ Looks up hardcoded plan prices
      │             ├─ Calls kashier.createPaymentSession()
      │             ├─ Inserts row into `payments` table (status='pending')
      │             └─ Returns sessionUrl
      ▼
  window.location.href = sessionUrl  (Kashier hosted page)
      │
      │── User pays via card/wallet ──▶ Kashier redirects back
      ▼
  /payment/callback (page.tsx)
      │   ├─ Reads query params: paymentStatus, sessionId, uid
      │   └─ Calls verify API
      │
      │──POST──▶ /api/payment/verify
      │             ├─ Calls kashier.verifyPaymentSession(sessionId)
      │             ├─ If paid: UPDATE payments SET status='success'
      │             ├─ ⚠️ Does NOT create subscription record
      │             ├─ ⚠️ Does NOT update user record with plan info
      │             └─ Returns { success: true, userId }
      ▼
  Redirect to /verify-code?uid=xxx  (phone verification)
      ▼
  User is now "paid" — access checked via checkPaymentStatus()
```

### Key observation
After successful payment, the **only** record is in the `payments` table with `status='success'`. There is **no** subscription table, **no** user plan field, and **no** expiry date. The system treats payment as a binary flag.

---

## 2. `checkPaymentStatus()` — All References

### Definition

| File | Line | Signature |
|------|------|-----------|
| [src/lib/auth_system.ts](../../src/lib/auth_system.ts#L747) | 747 | `async checkPaymentStatus(userId?: string): Promise<boolean>` |

### Implementation logic
```
1. Get userId from param or cookies
2. Query: payments WHERE user_id = ? AND status = 'success' (maybeSingle)
3. Return !!data (boolean — paid or not)
```

**⚠️ Critical gap:** Does NOT check `plan_id`. Any successful payment = full access.

### Callers

| File | Line | Context |
|------|------|---------|
| [src/components/Navigation.tsx](../../src/components/Navigation.tsx#L59) | 59 | `const paid = await authSystem.checkPaymentStatus(userId)` — sets `hasPaid` state, controls "اشترك الآن" button visibility |
| [src/components/reading/LockedOverlay.tsx](../../src/components/reading/LockedOverlay.tsx#L43) | 43 | `const hasPaid = await authSystem.checkPaymentStatus(userId)` — determines `unpaid` vs `paid` status |

**Total callers: 2** (Navigation + LockedOverlay)

---

## 3. Payment API Routes

### 3.1 POST `/api/payment/create-session`

| Property | Value |
|----------|-------|
| File | [src/app/api/payment/create-session/route.ts](../../src/app/api/payment/create-session/route.ts) |
| Input | `{ userId, planId }` |
| Hardcoded prices | `basic: 299`, `pro: 499`, `vip: 999` (lines 34-36) |
| DB write | `INSERT INTO payments (user_id, kashier_session_id, kashier_order_id, amount, currency, plan_id, status)` |
| Type safety | Uses `(supabase.from('payments') as any)` — no TypeScript types |
| Webhook | ❌ **Not sent** to Kashier (no `webhookUrl` param) |

### 3.2 POST `/api/payment/verify`

| Property | Value |
|----------|-------|
| File | [src/app/api/payment/verify/route.ts](../../src/app/api/payment/verify/route.ts) |
| Input | `{ sessionId, userId? }` |
| On success | `UPDATE payments SET status='success', paid_at=NOW()` |
| Subscription activation | ❌ **None** — does not create subscription record |
| User record update | ❌ **None** — does not update user with plan info |
| Type safety | Uses `(supabase.from('payments') as any)` x3 times |

### 3.3 Webhook endpoint

❌ **Does not exist.** No file at `src/app/api/payment/webhook/`.

---

## 4. Protected Routes Status — Middleware

### middleware.ts

❌ **Does NOT exist.** File search for `middleware.ts` returned zero results.

**Impact:** All route protection is client-side only. Any user can navigate directly to any URL (e.g., `/read/section-5/3`, `/tools`, `/exercises`) via the browser address bar and see the page content briefly before the client-side JavaScript check triggers the lock overlay.

### Current client-side protection mechanisms

| Mechanism | File | How it works |
|-----------|------|-------------|
| `verifySession()` | [src/lib/auth.ts](../../src/lib/auth.ts) | Checks 3 cookies exist in `document.cookie` (client-side only) |
| `SectionPage` lock logic | [src/components/reading/SectionPage.tsx](../../src/components/reading/SectionPage.tsx#L66-L72) | Checks `isAuthed` (from `verifySession()`) + `freePageLimit` from config |
| `LockedOverlay` | [src/components/reading/LockedOverlay.tsx](../../src/components/reading/LockedOverlay.tsx) | Modal overlay — checks `getCurrentUserId()` then `checkPaymentStatus()` |
| Navigation hide/show | [src/components/Navigation.tsx](../../src/components/Navigation.tsx#L59) | Hides "اشترك الآن" if paid, shows profile menu if logged in |

---

## 5. All Plan/Price Sources — Exact Values

### ⚠️ PRICE INCONSISTENCY FOUND

| Source | File | basic | pro | vip |
|--------|------|-------|-----|-----|
| **Payment page UI** | [src/app/payment/page.tsx](../../src/app/payment/page.tsx#L20-L41) | **299** | **499** | **999** |
| **Create-session API** | [src/app/api/payment/create-session/route.ts](../../src/app/api/payment/create-session/route.ts#L34-L36) | **299** | **499** | **999** |
| **Promo fallback (code)** | [src/lib/promo.ts](../../src/lib/promo.ts#L54-L85) | **299** | **499** | **999** |
| **DB seed (SQL)** | [supabase_landing_page.sql](../../supabase_landing_page.sql#L73-L98) | **299** | **699** | **1499** |

**Conflict:**
- Code sources all agree: `299 / 499 / 999`
- DB seed disagrees: `299 / 699 / 1499`
- The `PricingSection` landing component loads from `site_settings.pricing_plans` (DB), so the **landing page shows DB prices** while the **payment page and actual charge use code prices**.

### Where prices are defined (code)

1. **`src/app/payment/page.tsx`** — `PLANS` const, lines 14-50 (UI display)
2. **`src/app/api/payment/create-session/route.ts`** — `plans` const, lines 33-37 (actual charge amount)
3. **`src/lib/promo.ts`** — `DEFAULT_PRICING_PLANS` const, lines 52-97 (landing page fallback)

### Where prices are defined (DB)

4. **`supabase_landing_page.sql`** — `INSERT INTO site_settings` key=`pricing_plans`, lines 69-108 (landing page display from DB)

### Promo discount

- DB seed: `discount_percentage: 40`, `end_date: "2026-02-28"`
- Code fallback: `discount_percentage: 30`
- Applied to: landing page pricing section only (via `getPromoSettings()`)
- **NOT** applied to actual payment amount in create-session API

---

## 6. Auth Cookies Usage

### Cookie names (defined in [src/lib/config.ts](../../src/lib/config.ts#L11-L13))

| Constant | Cookie name | Purpose |
|----------|-------------|---------|
| `COOKIE_SESSION_TOKEN` | `ebook_session_token` | Session authentication token |
| `COOKIE_DEVICE_ID` | `ebook_device_id` | Device fingerprint ID |
| `COOKIE_USER_ID` | `ebook_user_id` | User UUID |

### Cookie settings

| Setting | Value | Security concern |
|---------|-------|-----------------|
| `Max-Age` | 604800 (7 days) | — |
| `Path` | `/` | — |
| `Secure` | `true` in production only | — |
| `SameSite` | `Strict` | ✅ Good |
| `httpOnly` | ❌ **NOT SET** | ⚠️ Cookies accessible via JavaScript (XSS risk) |

### Client-side cookie access (via `document.cookie`)

| File | Function | Lines |
|------|----------|-------|
| [src/lib/cookie_utils.ts](../../src/lib/cookie_utils.ts#L76) | `saveAuthCookies()` | Sets 3 cookies |
| [src/lib/cookie_utils.ts](../../src/lib/cookie_utils.ts#L86) | `getAuthCookies()` | Reads 3 cookies |
| [src/lib/cookie_utils.ts](../../src/lib/cookie_utils.ts#L97) | `clearAuthCookies()` | Deletes 3 cookies |
| [src/lib/auth.ts](../../src/lib/auth.ts#L1) | `verifySession()` | Calls `getAuthCookies()` |

### Server-side cookie access (via `cookies()` from `next/headers`)

| File | Line | Cookie read |
|------|------|-------------|
| [src/app/api/chat/route.ts](../../src/app/api/chat/route.ts#L135) | 135 | `cookieStore.get('ebook_user_id')` |
| [src/app/api/chat/rate/route.ts](../../src/app/api/chat/rate/route.ts#L34) | 34 | `cookieStore.get('ebook_user_id')` |
| [src/app/api/reading-progress/route.ts](../../src/app/api/reading-progress/route.ts#L21) | 21 | `cookieStore.get('ebook_user_id')` |
| [src/actions/certificates.ts](../../src/actions/certificates.ts#L19) | 19 | `cookieStore.get('ebook_user_id')` |
| [src/actions/bookmarks.ts](../../src/actions/bookmarks.ts#L27) | 27 | `cookieStore.get('ebook_user_id')` |

**Note:** Server-side API routes only read `ebook_user_id`, never `ebook_session_token`. They trust the cookie value without verifying the session in DB.

### Cookie lifecycle in auth_system.ts

| Operation | Function | Lines |
|-----------|----------|-------|
| Write (register) | `saveAuthCookies(session.token, deviceId, newUser.id)` | L256 |
| Write (login — matched device) | `saveAuthCookies(session.token, matchedDevice.device_id, user.id)` | L382 |
| Write (login — new device) | `saveAuthCookies(session.token, deviceId, user.id)` | L414 |
| Write (login — verification) | `saveAuthCookies(session.token, newDeviceId, user.id)` | L480 |
| Write (reset password) | `saveAuthCookies(session.token, deviceId, user.id)` | L1220 |
| Read (session verify) | `getAuthCookies()` | L496 |
| Read (get current user) | `getAuthCookies()` | L740 |
| Clear (logout) | `clearAuthCookies()` | L720-L732 |
| Clear (invalid session) | `clearAuthCookies()` | L512, L520, L535, L546 |

---

## 7. Content Locking Logic — Access Control Points

### 7.1 `sections.ts` — freePageLimit configuration

| Section | `id` | `freePageLimit` | Behavior |
|---------|------|-----------------|----------|
| المقدمة | `intro` | `0` | Always free (special: `isIntro` flag in SectionPage) |
| الفصل 01 | `section-1` | `4` | Pages 1-4 free, pages 5+ require auth |
| الفصل 02 | `section-2` | `0` | All pages require auth |
| الفصل 03-10 | `section-3` to `section-10` | `0` | All pages require auth |

**File:** [src/config/sections.ts](../../src/config/sections.ts)

### 7.2 `SectionPage.tsx` — Lock decision logic

**File:** [src/components/reading/SectionPage.tsx](../../src/components/reading/SectionPage.tsx#L66-L72)

```
Lock Logic (lines 66-72):

isIntro?
  └─ YES → never locked (isCurrentPageLocked = false)
  └─ NO  → hasFreePages?
              └─ YES → locked if pageNum > freePageLimit AND !isAuthed
              └─ NO  → locked if !isAuthed

isNextPageLocked = hasFreePages AND pageNum === freePageLimit AND !isAuthed
```

**Key observation:** `isAuthed` comes from `verifySession()` which only checks if 3 cookies exist. It does **NOT** check payment status. Payment check happens only in `LockedOverlay`.

### 7.3 `LockedOverlay.tsx` — Payment gate

**File:** [src/components/reading/LockedOverlay.tsx](../../src/components/reading/LockedOverlay.tsx)

| Status | Condition | Action |
|--------|-----------|--------|
| `unauthenticated` | No `userId` cookie | → `/login?next=...` |
| `unpaid` | Has userId but `checkPaymentStatus()` returns false | → `/payment?uid=...` |
| `paid` | `checkPaymentStatus()` returns true | Close overlay |

**⚠️ Critical gap:** No `needs_upgrade` status. Any successful payment = full access regardless of plan.

### 7.4 Authentication check in other pages

| Page | Auth check method | Payment check |
|------|------------------|---------------|
| `/exercises` | `verifySession()` + `getCurrentUserId()` → redirect to `/login` | ❌ None |
| `/tools` | `getCurrentUserId()` → redirect to `/login` | ❌ None |
| `/achievements` | `getCurrentUserId()` → redirect to `/login` | ❌ None |
| `/bookmarks` | Server action reads `ebook_user_id` cookie | ❌ None |
| `/library/[page]` | `LockedOverlay` (same as reading) | Binary via `checkPaymentStatus()` |

### 7.5 Navigation conditional rendering

**File:** [src/components/Navigation.tsx](../../src/components/Navigation.tsx#L50-L67)

```
On mount:
  1. authSystem.getCurrentUserId() → if exists:
  2. authSystem.verifySession() → if valid:
  3. authSystem.checkPaymentStatus(userId) → setHasPaid(true/false)

When hasPaid=false AND isLoggedIn=true:
  → Shows "اشترك الآن" button linking to /payment?uid=...
```

**No plan-based conditional rendering.** All nav items (exercises, tools, etc.) show the same regardless of plan.

---

## 8. Database Tables — Current State

### 8.1 Tables directly involved in payment/access

| Table | SQL file | In `database.types.ts`? | Used via |
|-------|----------|------------------------|----------|
| `payments` | [supabase_payments.sql](../../supabase_payments.sql) | ❌ **NO** (uses `as any`) | create-session, verify, checkPaymentStatus |
| `users` | (main schema) | ✅ Yes | auth_system.ts |
| `sessions` | (main schema) | ✅ Yes | auth_system.ts |
| `devices` | (main schema) | ✅ Yes | auth_system.ts |

### 8.2 `payments` table schema

```sql
payments (
    id              UUID PK
    user_id         UUID FK → users(id) ON DELETE CASCADE
    kashier_session_id  TEXT
    kashier_order_id    TEXT UNIQUE
    amount          DECIMAL(10,2)
    currency        TEXT DEFAULT 'EGP'
    plan_id         TEXT NOT NULL          -- ✅ plan_id IS stored
    payment_method  TEXT
    status          TEXT CHECK ('pending','success','failed','expired')
    created_at      TIMESTAMPTZ
    paid_at         TIMESTAMPTZ
    notes           TEXT
)
```

**Key finding:** `plan_id` IS stored in payments table, but `checkPaymentStatus()` ignores it completely.

### 8.3 `users` table — plan-related columns

| Column | Exists? |
|--------|---------|
| `current_plan` | ❌ No |
| `plan_expires_at` | ❌ No |
| `subscription_id` | ❌ No |

### 8.4 `subscriptions` table

❌ **Does not exist.**

### 8.5 Other relevant tables

| Table | Purpose | TypeScript types? |
|-------|---------|------------------|
| `reading_progress` | Reading progress tracking | ✅ |
| `exercise_progress` | Exercise completion | ✅ |
| `user_gamification` | Points, levels, streaks | ✅ |
| `user_exercise_stats` | Aggregated exercise stats | ✅ |
| `certificates` / `user_certificates` | Achievement certificates | ✅ |
| `chat_messages` | AI chat history | ❌ (uses `as any`) |
| `chat_ratings` | Chat feedback | ❌ (uses `as any`) |
| `site_settings` | Promo settings + pricing plans (JSONB) | ❌ |
| `testimonials` | Landing page testimonials | ❌ |
| `verification_codes` | Phone verification | ✅ |
| `badges` / `user_badges` | Gamification badges | ✅ |

### 8.6 DB function for payment check

```sql
-- In supabase_payments.sql:
CREATE OR REPLACE FUNCTION has_successful_payment(p_user_id UUID)
RETURNS BOOLEAN  -- ⚠️ Also binary, does not return plan_id
```

---

## 9. `as any` Usage in Payment Code

All payment-related DB operations bypass TypeScript safety:

| File | Line | Code |
|------|------|------|
| [create-session/route.ts](../../src/app/api/payment/create-session/route.ts#L81) | 81 | `(supabase.from('payments') as any).insert(...)` |
| [verify/route.ts](../../src/app/api/payment/verify/route.ts#L21) | 21 | `(supabase.from('payments') as any).select(...)` |
| [verify/route.ts](../../src/app/api/payment/verify/route.ts#L49) | 49 | `(supabase.from('payments') as any).update(...)` |
| [verify/route.ts](../../src/app/api/payment/verify/route.ts#L71) | 71 | `(supabase.from('payments') as any).update(...)` |

**Root cause:** `payments` table type is missing from `database.types.ts`.

---

## 10. Existing Paid Users — Migration Risk

### Current data landscape

- `payments` table stores `plan_id` for each payment.
- Possible `plan_id` values: `'basic'`, `'pro'`, `'vip'`.
- Successful payments have `status = 'success'` and a `paid_at` timestamp.

### Migration consideration

When adding the `subscriptions` table, a migration script must:
1. Query all rows from `payments WHERE status = 'success'`
2. For each, create a `subscriptions` row with:
   - `plan_id` from the payment record
   - `starts_at` = payment's `paid_at` 
   - `expires_at` = `paid_at + 365 days`
   - `payment_id` = payment's `id`
3. Update `users` table with `current_plan` and `plan_expires_at`

**Risk:** If any existing user paid without a `plan_id` being stored (edge case), they'd have no valid subscription after migration. Need to verify data before running.

---

## 11. Risks & Blockers

### 🔴 Critical

| # | Risk | Impact | Mitigation |
|---|------|--------|------------|
| R1 | **No middleware** — all routes accessible via direct URL | Users can bypass client-side locks by navigating to protected URLs | Create `middleware.ts` before any subscription logic |
| R2 | **checkPaymentStatus ignores plan_id** — any payment = full access | Basic plan users get VIP features | Must add plan-aware check before going live with tiered plans |
| R3 | **No subscription table** — no way to track plan, expiry, upgrade history | Cannot implement tiered access | DB migration required as first step |
| R4 | **No webhook endpoint** — if user closes browser after payment, subscription may not activate | Lost payments with no activation | Must create webhook before live launch |

### 🟡 Medium

| # | Risk | Impact | Mitigation |
|---|------|--------|------------|
| R5 | **Price inconsistency** — Landing page (from DB) shows 699/1499, payment page charges 499/999 | User confusion, trust issue | Unify all prices to single source |
| R6 | **Cookies not httpOnly** — accessible via JavaScript | XSS can steal session tokens | Future: move to server-side cookie management |
| R7 | **`payments` table has no TypeScript types** — all operations use `as any` | Runtime errors won't be caught at compile time | Add types to `database.types.ts` |
| R8 | **API routes don't verify session** — server-side routes trust `ebook_user_id` cookie without DB verification | Cookie forgery could access API | Add session validation in API routes |
| R9 | **No auth context** — `src/context/` is empty | Each component independently fetches auth state (redundant calls) | Create SubscriptionContext |
| R10 | **verify/route.ts doesn't create subscription** — only updates payment status | No subscription record after successful payment | Add `activateSubscription()` call |

### 🟢 Low

| # | Risk | Impact | Mitigation |
|---|------|--------|------------|
| R11 | Rate limiter is in-memory only | Resets on deploy, not shared across serverless instances | Acceptable for now, upgrade later if needed |
| R12 | Promo discount not applied to actual charges | Discounted prices shown on landing, full price charged | Either apply discount in create-session or remove from landing |

---

## 12. Summary — What Exists vs What's Needed

```
                    CURRENT STATE              NEEDED STATE
                    ─────────────              ────────────
Middleware          ❌ None                    ✅ Edge auth check
Subscription table  ❌ None                    ✅ With plan, expiry, status
User plan field     ❌ None                    ✅ current_plan, plan_expires_at
Access check        Binary (paid/not)          Tiered (plan features)
Price source        3 separate definitions     Single source of truth
Payment types       ❌ Missing in TS           ✅ Full types
Webhook             ❌ None                    ✅ Backup activation
Auth context        ❌ Empty directory          ✅ SubscriptionContext
Plan-aware UI       ❌ Same for all            ✅ Nav/pages adapt to plan
Feature gating      ❌ None                    ✅ FeatureGate component
Upgrade flow        ❌ None                    ✅ /payment/upgrade page
Admin management    ❌ No subscription mgmt    ✅ Admin subscriptions page
```

---

> **This document is the authoritative baseline for the subscription migration.**  
> Next stage: Stage 1 — DB migrations + `subscription.ts` + types update.  
> **No existing code was modified in this stage.**
