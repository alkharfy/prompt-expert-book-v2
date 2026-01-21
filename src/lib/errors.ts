/**
 * Custom Application Errors
 * أخطاء مخصصة للتطبيق مع رسائل واضحة
 */

/**
 * خطأ أساسي للتطبيق
 */
export class AppError extends Error {
    public readonly statusCode: number
    public readonly isOperational: boolean
    public readonly code: string

    constructor(
        message: string,
        statusCode: number = 500,
        code: string = 'INTERNAL_ERROR',
        isOperational: boolean = true
    ) {
        super(message)
        this.statusCode = statusCode
        this.code = code
        this.isOperational = isOperational
        
        // الحفاظ على prototype chain
        Object.setPrototypeOf(this, AppError.prototype)
        Error.captureStackTrace(this, this.constructor)
    }
}

// ============ Auth Errors ============

export class AuthenticationError extends AppError {
    constructor(message: string = 'فشل التحقق من الهوية') {
        super(message, 401, 'AUTHENTICATION_FAILED')
    }
}

export class AuthorizationError extends AppError {
    constructor(message: string = 'غير مصرح لك بهذا الإجراء') {
        super(message, 403, 'AUTHORIZATION_FAILED')
    }
}

export class InvalidCredentialsError extends AppError {
    constructor() {
        super('البريد الإلكتروني أو كلمة المرور غير صحيحة', 401, 'INVALID_CREDENTIALS')
    }
}

export class SessionExpiredError extends AppError {
    constructor() {
        super('انتهت صلاحية الجلسة، يرجى تسجيل الدخول مرة أخرى', 401, 'SESSION_EXPIRED')
    }
}

export class DeviceLimitError extends AppError {
    constructor() {
        super('تم الوصول للحد الأقصى من الأجهزة المسجلة', 403, 'DEVICE_LIMIT_EXCEEDED')
    }
}

export class EmailAlreadyExistsError extends AppError {
    constructor() {
        super('البريد الإلكتروني مسجل مسبقاً', 409, 'EMAIL_EXISTS')
    }
}

// ============ Rate Limit Errors ============

export class RateLimitError extends AppError {
    public readonly retryAfter: number

    constructor(retryAfter: number) {
        super(`تم تجاوز الحد المسموح من المحاولات، حاول بعد ${Math.ceil(retryAfter / 60)} دقيقة`, 429, 'RATE_LIMIT_EXCEEDED')
        this.retryAfter = retryAfter
    }
}

// ============ Validation Errors ============

export class ValidationError extends AppError {
    public readonly errors: string[]

    constructor(errors: string[]) {
        super(errors[0] || 'خطأ في البيانات المدخلة', 400, 'VALIDATION_ERROR')
        this.errors = errors
    }
}

export class InvalidInputError extends AppError {
    constructor(field: string, message?: string) {
        super(message || `قيمة غير صحيحة للحقل: ${field}`, 400, 'INVALID_INPUT')
    }
}

// ============ Resource Errors ============

export class NotFoundError extends AppError {
    constructor(resource: string = 'المورد') {
        super(`${resource} غير موجود`, 404, 'NOT_FOUND')
    }
}

export class ConflictError extends AppError {
    constructor(message: string = 'تعارض في البيانات') {
        super(message, 409, 'CONFLICT')
    }
}

// ============ Database Errors ============

export class DatabaseError extends AppError {
    constructor(message: string = 'خطأ في قاعدة البيانات') {
        super(message, 500, 'DATABASE_ERROR', false)
    }
}

export class ConnectionError extends AppError {
    constructor() {
        super('فشل الاتصال بقاعدة البيانات', 503, 'CONNECTION_ERROR', false)
    }
}

// ============ Premium Errors ============

export class PremiumRequiredError extends AppError {
    constructor(feature: string = 'هذه الميزة') {
        super(`${feature} تتطلب اشتراكاً مميزاً`, 402, 'PREMIUM_REQUIRED')
    }
}

// ============ Helper Functions ============

/**
 * التحقق مما إذا كان الخطأ من نوع AppError
 */
export function isAppError(error: unknown): error is AppError {
    return error instanceof AppError
}

/**
 * تحويل أي خطأ إلى AppError
 */
export function normalizeError(error: unknown): AppError {
    if (isAppError(error)) {
        return error
    }
    
    if (error instanceof Error) {
        return new AppError(error.message, 500, 'INTERNAL_ERROR', false)
    }
    
    return new AppError('حدث خطأ غير متوقع', 500, 'UNKNOWN_ERROR', false)
}

/**
 * تحويل الخطأ إلى صيغة JSON للاستجابة
 */
export function errorToJSON(error: AppError): {
    success: false
    error: {
        message: string
        code: string
        statusCode: number
    }
} {
    return {
        success: false,
        error: {
            message: error.message,
            code: error.code,
            statusCode: error.statusCode,
        },
    }
}

/**
 * تسجيل الخطأ (للاستخدام مع logger)
 */
export function shouldLogError(error: AppError): boolean {
    // لا نسجل الأخطاء التشغيلية المتوقعة
    return !error.isOperational
}
