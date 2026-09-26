/**
 * Input Sanitization Utilities
 * أدوات تنظيف المدخلات لمنع XSS وحقن SQL
 */

/**
 * تنظيف البريد الإلكتروني
 */
export function sanitizeEmail(email: string): string {
    if (!email || typeof email !== 'string') return ''

    // تحويل لحروف صغيرة وإزالة المسافات
    return email.toLowerCase().trim()
}

/**
 * التحقق من صحة البريد الإلكتروني
 */
export function isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return emailRegex.test(email)
}

/**
 * تنظيف رقم الهاتف
 */
export function sanitizePhone(phone: string): string {
    if (!phone || typeof phone !== 'string') return ''

    // إزالة كل شيء ما عدا الأرقام و +
    return phone.replace(/[^\d+]/g, '')
}

/**
 * تنظيف الاسم
 */
export function sanitizeName(name: string): string {
    if (!name || typeof name !== 'string') return ''

    // إزالة الأحرف الخاصة الخطرة مع الحفاظ على الحروف العربية والإنجليزية
    return name
        .trim()
        // SECURITY: Strip Unicode control characters (bidi overrides, zero-width chars)
        .replace(/[\u200B-\u200F\u202A-\u202E\u2066-\u2069\uFEFF\u00AD]/g, '')
        // Normalize Unicode to NFC form to prevent homoglyph attacks
        .normalize('NFC')
        .replace(/[<>\"'&;]/g, '') // إزالة أحرف HTML الخطرة
        .slice(0, 100) // حد أقصى 100 حرف
}

/**
 * تنظيف كلمة المرور (لا تغيير، فقط تقليم وفحص الطول)
 */
export function sanitizePassword(password: string): string {
    if (!password || typeof password !== 'string') return ''
    // حد أقصى 128 حرف لمنع DOS attacks على bcrypt
    // SECURITY: لا نستخدم trim() لأنها تزيل المسافات من كلمة المرور بشكل صامت
    return password.slice(0, 128)
}
