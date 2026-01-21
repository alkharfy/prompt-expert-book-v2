// Configuration for the authentication and device fingerprinting system

// ⚠️ Supabase Configuration - يتم جلبها من environment variables في supabase.ts
// لا تضع المفاتيح هنا أبداً!

// Session Configuration
export const SESSION_DURATION_DAYS = 7 // Session validity in days
export const SESSION_DURATION_MS = SESSION_DURATION_DAYS * 24 * 60 * 60 * 1000 // In milliseconds

// Cookie Names
export const COOKIE_SESSION_TOKEN = 'ebook_session_token'
export const COOKIE_DEVICE_ID = 'ebook_device_id'
export const COOKIE_USER_ID = 'ebook_user_id'

// Cookie Settings
export const COOKIE_MAX_AGE = SESSION_DURATION_DAYS * 24 * 60 * 60 // In seconds
export const COOKIE_PATH = '/'
export const COOKIE_SECURE = process.env.NODE_ENV === 'production' // Use secure cookies in production
export const COOKIE_SAME_SITE = 'Strict' as const

// Total pages in the book (for reading progress)
// Intro: 2 + S1: 11 + S2: 6 + S3: 9 + S4: 11 + S5: 10 + S6: 9 + Library: 8 + Appendix: 18 + Glossary: 5 = 89
export const TOTAL_BOOK_PAGES = 89

// Total main chapters (excluding Glossary which is bonus content)
// Intro + S1-S6 + Library + Appendix = 9 chapters
export const TOTAL_CHAPTERS = 9
