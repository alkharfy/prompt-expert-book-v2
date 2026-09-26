/**
 * Input Validation Schemas
 * مخططات التحقق من المدخلات باستخدام Zod
 */

import { z } from 'zod'

// ============ Admin Schemas ============

/**
 * مخطط تسجيل دخول الأدمن
 */
export const adminLoginSchema = z.object({
    password: z.string().min(1).max(256),
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
