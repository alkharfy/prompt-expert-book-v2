// Configuration for the authentication and device fingerprinting system

// ⚠️ Supabase Configuration - يتم جلبها من environment variables في supabase.ts
// لا تضع المفاتيح هنا أبداً!

// Session Configuration
// 14 days balances "stay logged in" UX with limiting blast radius if a token leaks.
const SESSION_DURATION_DAYS = 14 // Session validity in days
export const SESSION_DURATION_MS = SESSION_DURATION_DAYS * 24 * 60 * 60 * 1000 // In milliseconds

// Cookie Names
export const COOKIE_SESSION_TOKEN = 'ebook_session_token'
export const COOKIE_DEVICE_ID = 'ebook_device_id'
export const COOKIE_USER_ID = 'ebook_user_id'

// Cookie Settings
export const COOKIE_MAX_AGE = SESSION_DURATION_DAYS * 24 * 60 * 60 // In seconds
export const COOKIE_PATH = '/'
export const COOKIE_SECURE = process.env.NODE_ENV === 'production' // Use secure cookies in production
export const COOKIE_SAME_SITE = 'Lax' as const

// Total pages in the book (for reading progress)
// Intro 6 + main chapters 176 + library 12 + appendix 20 + glossary 8 = 222
export const TOTAL_BOOK_PAGES = 222

// Total main chapters (excluding Glossary which is bonus content)
// Intro + S1-S10 + Library + Appendix = 13 chapters
export const TOTAL_CHAPTERS = 13

// ───────────────────────────────────────────────────────────────────────────
// Canonical site identity (WS5) — single source of truth for the production
// domain, support email and sender. Every URL the site emits is built from this.
// Trailing slash is stripped so `${SITE_URL}/path` never produces `//path`.
// ───────────────────────────────────────────────────────────────────────────
export const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL || 'https://www.prompt-mr.com').replace(/\/+$/, '')
/** Host only, e.g. "www.prompt-mr.com" — for footers/share cards. */
export const SITE_DOMAIN = SITE_URL.replace(/^https?:\/\//, '')
/** Single support/legal contact address. */
export const SUPPORT_EMAIL = 'support@prompt-mr.com'
/** Default email "From" — overridden by the verified EMAIL_FROM env in production. */
export const EMAIL_FROM_DEFAULT = process.env.EMAIL_FROM || `PromptMaster <noreply@${SITE_DOMAIN.replace(/^www\./, '')}>`

// Single canonical page-count shown anywhere in marketing copy / structured data.
// Includes the introduction, chapters, library, appendix and glossary.
export const BOOK_PAGES_DISPLAY = TOTAL_BOOK_PAGES
