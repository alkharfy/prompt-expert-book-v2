import { LEARNING_SECTIONS } from '@/config/learningCatalog'

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

// Global page index space for saved progress validation, including reserved slots.
// Intro slots 6 + main chapter slots 176 + library 12 + appendix 20 + glossary 8 = 222.
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

/** Customer service on WhatsApp (owner, 2026-10-18). Used everywhere a learner can ask for help. */
export const SUPPORT_WHATSAPP = '201030181695'
export const SUPPORT_WHATSAPP_DISPLAY = '0103 018 1695'
export function supportWhatsAppUrl(message = 'السلام عليكم، محتاج مساعدة في PromptMaster'): string {
    return `https://wa.me/${SUPPORT_WHATSAPP}?text=${encodeURIComponent(message)}`
}

/** What the Kashier checkout takes (owner, 2026-10-18). */
export const PAYMENT_METHODS_TEXT = 'بالفيزا أو الكريدت كارد، أو بمحفظة الموبايل'

/** Refund guarantee (owner, 2026-10-19): 7 days on the monthly plan, 30 on the yearly ones, counted from payment. */
export const REFUND_DAYS = { monthly: 7, yearly: 30 } as const
export function refundDaysFor(planId: string): number {
    return planId === 'monthly' ? REFUND_DAYS.monthly : REFUND_DAYS.yearly
}
/** "7 أيام" / "30 يوم" — Arabic counts 3–10 take the plural. */
export function refundDaysLabel(days: number): string {
    return days >= 3 && days <= 10 ? `${days} أيام` : `${days} يوم`
}
export const REFUND_GUARANTEE_TEXT = `ضمان استرداد: ${refundDaysLabel(REFUND_DAYS.monthly)} للشهري و${refundDaysLabel(REFUND_DAYS.yearly)} للسنوي`
/** Default email "From" — overridden by the verified EMAIL_FROM env in production. */
export const EMAIL_FROM_DEFAULT = process.env.EMAIL_FROM || `PromptMaster <noreply@${SITE_DOMAIN.replace(/^www\./, '')}>`

// Single canonical page-count shown anywhere in marketing copy / structured data.
// Includes the introduction, chapters, library, appendix and glossary.
export const BOOK_PAGES_DISPLAY = LEARNING_SECTIONS.reduce((total, section) => total + section.pageCount, 0)
