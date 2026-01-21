/**
 * Input Validation Schemas
 * مخططات التحقق من المدخلات باستخدام Zod
 */

import { z } from 'zod'

// ============ Auth Schemas ============

/**
 * مخطط التحقق من البريد الإلكتروني
 */
export const emailSchema = z
    .string()
    .min(1, 'البريد الإلكتروني مطلوب')
    .email('صيغة البريد الإلكتروني غير صحيحة')
    .max(255, 'البريد الإلكتروني طويل جداً')
    .transform(email => email.toLowerCase().trim())

/**
 * مخطط التحقق من كلمة المرور
 */
export const passwordSchema = z
    .string()
    .min(6, 'كلمة المرور يجب أن تكون 6 أحرف على الأقل')
    .max(128, 'كلمة المرور طويلة جداً')

/**
 * مخطط التحقق من الاسم
 */
export const nameSchema = z
    .string()
    .min(2, 'الاسم يجب أن يكون حرفين على الأقل')
    .max(100, 'الاسم طويل جداً')
    .regex(/^[\u0600-\u06FFa-zA-Z\s]+$/, 'الاسم يجب أن يحتوي على أحرف فقط')
    .transform(name => name.trim())

/**
 * مخطط تسجيل الدخول
 */
export const loginSchema = z.object({
    email: emailSchema,
    password: passwordSchema,
})

/**
 * مخطط إنشاء حساب
 */
export const registerSchema = z.object({
    email: emailSchema,
    password: passwordSchema,
    name: nameSchema,
})

/**
 * مخطط تغيير كلمة المرور
 */
export const changePasswordSchema = z.object({
    currentPassword: passwordSchema,
    newPassword: passwordSchema,
}).refine(data => data.currentPassword !== data.newPassword, {
    message: 'كلمة المرور الجديدة يجب أن تختلف عن الحالية',
    path: ['newPassword'],
})

// ============ Exercise Schemas ============

/**
 * أنواع التمارين المسموحة
 */
export const exerciseTypeSchema = z.enum(['quiz', 'fill_blank', 'prompt_builder'])

/**
 * مخطط إكمال تمرين
 */
export const exerciseCompletionSchema = z.object({
    exerciseId: z.string().min(1).max(100),
    exerciseType: exerciseTypeSchema,
    isCorrect: z.boolean(),
    pointsEarned: z.number().int().min(0).max(1000),
})

// ============ Reading Progress Schemas ============

/**
 * مخطط تحديث تقدم القراءة
 */
export const readingProgressSchema = z.object({
    pageId: z.string().min(1).max(100),
    isCompleted: z.boolean().default(true),
})

// ============ Bookmark Schemas ============

/**
 * مخطط إضافة إشارة مرجعية
 */
export const bookmarkSchema = z.object({
    pageId: z.string().min(1).max(100),
})

// ============ Admin Schemas ============

/**
 * مخطط تسجيل دخول الأدمن
 */
export const adminLoginSchema = z.object({
    password: z.string().min(1).max(256),
})

// ============ Verification Schemas ============

/**
 * مخطط التحقق من الكود
 */
export const verificationCodeSchema = z.object({
    email: emailSchema,
    code: z.string().length(6, 'الكود يجب أن يكون 6 أرقام').regex(/^\d{6}$/, 'الكود يجب أن يحتوي على أرقام فقط'),
})

// ============ Helper Functions ============

/**
 * دالة مساعدة للتحقق وإرجاع النتيجة
 */
export function validateInput<T>(schema: z.ZodSchema<T>, data: unknown): {
    success: true
    data: T
} | {
    success: false
    errors: string[]
} {
    const result = schema.safeParse(data)
    
    if (result.success) {
        return { success: true, data: result.data }
    }
    
    const errors = result.error.issues.map(issue => issue.message)
    return { success: false, errors }
}

/**
 * دالة للتحقق مع رمي خطأ
 */
export function parseInput<T>(schema: z.ZodSchema<T>, data: unknown): T {
    return schema.parse(data)
}

// ============ Types ============

export type LoginInput = z.infer<typeof loginSchema>
export type RegisterInput = z.infer<typeof registerSchema>
export type ExerciseCompletionInput = z.infer<typeof exerciseCompletionSchema>
export type ReadingProgressInput = z.infer<typeof readingProgressSchema>
export type BookmarkInput = z.infer<typeof bookmarkSchema>
export type AdminLoginInput = z.infer<typeof adminLoginSchema>
export type VerificationCodeInput = z.infer<typeof verificationCodeSchema>
