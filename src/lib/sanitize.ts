/**
 * Input Sanitization Utilities
 * أدوات تنظيف المدخلات لمنع XSS وحقن SQL
 */

/**
 * تنظيف النص من أكواد HTML الخطرة
 */
export function sanitizeHTML(input: string): string {
    if (!input || typeof input !== 'string') return ''
    
    return input
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#x27;')
        .replace(/\//g, '&#x2F;')
}

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
 * التحقق من صحة رقم الهاتف السعودي
 */
export function isValidSaudiPhone(phone: string): boolean {
    // يقبل الصيغ: 05xxxxxxxx, +9665xxxxxxxx, 009665xxxxxxxx
    const saudiPhoneRegex = /^(05|5|\+9665|009665)\d{8}$/
    return saudiPhoneRegex.test(phone.replace(/\s/g, ''))
}

/**
 * تنظيف الاسم
 */
export function sanitizeName(name: string): string {
    if (!name || typeof name !== 'string') return ''
    
    // إزالة الأحرف الخاصة الخطرة مع الحفاظ على الحروف العربية والإنجليزية
    return name
        .trim()
        .replace(/[<>\"'&;]/g, '') // إزالة أحرف HTML الخطرة
        .slice(0, 100) // حد أقصى 100 حرف
}

/**
 * تنظيف كلمة المرور (لا تغيير، فقط تقليم وفحص الطول)
 */
export function sanitizePassword(password: string): string {
    if (!password || typeof password !== 'string') return ''
    // حد أقصى 128 حرف لمنع DOS attacks على bcrypt
    return password.trim().slice(0, 128)
}

/**
 * التحقق من صحة طول كلمة المرور
 */
export function isValidPasswordLength(password: string): boolean {
    return password.length >= 6 && password.length <= 128
}

/**
 * التحقق من قوة كلمة المرور
 */
export function isStrongPassword(password: string): { valid: boolean; message?: string } {
    if (password.length < 8) {
        return { valid: false, message: 'كلمة المرور يجب أن تكون 8 أحرف على الأقل' }
    }
    
    if (!/[A-Z]/.test(password)) {
        return { valid: false, message: 'كلمة المرور يجب أن تحتوي على حرف كبير' }
    }
    
    if (!/[a-z]/.test(password)) {
        return { valid: false, message: 'كلمة المرور يجب أن تحتوي على حرف صغير' }
    }
    
    if (!/[0-9]/.test(password)) {
        return { valid: false, message: 'كلمة المرور يجب أن تحتوي على رقم' }
    }
    
    return { valid: true }
}

/**
 * تنظيف UUID
 */
export function sanitizeUUID(uuid: string): string | null {
    if (!uuid || typeof uuid !== 'string') return null
    
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
    const cleaned = uuid.trim().toLowerCase()
    
    return uuidRegex.test(cleaned) ? cleaned : null
}

/**
 * تنظيف معرف الصفحة (page ID)
 */
export function sanitizePageId(pageId: string): string {
    if (!pageId || typeof pageId !== 'string') return ''
    
    // يسمح فقط بالحروف والأرقام والشرطات
    return pageId
        .trim()
        .toLowerCase()
        .replace(/[^a-z0-9-]/g, '')
        .slice(0, 50)
}

/**
 * تنظيف النص العام (للتعليقات والمحتوى)
 */
export function sanitizeText(text: string, maxLength: number = 1000): string {
    if (!text || typeof text !== 'string') return ''
    
    return sanitizeHTML(text.trim().slice(0, maxLength))
}

/**
 * التحقق من أن المدخل رقم صحيح موجب
 */
export function isPositiveInteger(value: unknown): boolean {
    if (typeof value === 'number') {
        return Number.isInteger(value) && value > 0
    }
    if (typeof value === 'string') {
        const num = parseInt(value, 10)
        return !isNaN(num) && num > 0 && num.toString() === value
    }
    return false
}

/**
 * تنظيف رقم صفحة
 */
export function sanitizePageNumber(page: unknown): number {
    if (typeof page === 'number' && Number.isInteger(page) && page > 0) {
        return page
    }
    if (typeof page === 'string') {
        const num = parseInt(page, 10)
        if (!isNaN(num) && num > 0) {
            return num
        }
    }
    return 1
}
