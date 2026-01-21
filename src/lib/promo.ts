import { supabase } from './supabase'
import { z } from 'zod'
import { dbLogger } from './logger'

// Helper type for upsert operations
type UpsertTable = {
    upsert: (data: Record<string, unknown>, options?: { onConflict?: string }) => Promise<{ error: { message: string } | null }>
}

// Zod schemas for validation
export const PromoSettingsSchema = z.object({
    is_active: z.boolean(),
    discount_percentage: z.number().min(0).max(100),
    end_date: z.string().refine((date) => !isNaN(Date.parse(date)), {
        message: 'تاريخ غير صالح'
    }),
    promo_text: z.string().min(1).max(500)
})

export const PartialPromoSettingsSchema = PromoSettingsSchema.partial()

export interface PromoSettings {
    is_active: boolean
    discount_percentage: number
    end_date: string
    promo_text: string
}

export interface PricingPlan {
    id: string
    name: string
    price: number
    duration: string
    features: string[]
    is_popular: boolean
}

// Default promo settings (fallback)
const DEFAULT_PROMO_SETTINGS: PromoSettings = {
    is_active: false,
    discount_percentage: 40,
    end_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
    promo_text: 'عرض افتتاحي: خصم 40% لفترة محدودة!'
}

// Default pricing plans (fallback)
const DEFAULT_PRICING_PLANS: PricingPlan[] = [
    {
        id: 'basic',
        name: 'الأساسية',
        price: 299,
        duration: 'سنة',
        features: [
            'الكتاب كامل (89 صفحة)',
            'التمارين التفاعلية',
            'الوصول لمدة سنة'
        ],
        is_popular: false
    },
    {
        id: 'pro',
        name: 'المتقدمة',
        price: 699,
        duration: 'سنة',
        features: [
            'كل مميزات الأساسية',
            '50+ قالب جاهز للنسخ',
            'شهادة إتمام معتمدة',
            'تحديثات مجانية مدى الحياة'
        ],
        is_popular: true
    },
    {
        id: 'vip',
        name: 'VIP',
        price: 1499,
        duration: 'سنة',
        features: [
            'كل مميزات المتقدمة',
            'استشارة خاصة 30 دقيقة',
            'دعم أولوية عبر WhatsApp',
            'وصول مبكر للمحتوى الجديد'
        ],
        is_popular: false
    }
]

// Fetch promo settings
export async function getPromoSettings(): Promise<PromoSettings> {
    try {
        const { data, error } = await supabase
            .from('site_settings')
            .select('value')
            .eq('key', 'promo_settings')
            .single() as { data: { value: PromoSettings } | null; error: unknown }

        if (error || !data) {
            dbLogger.warn('Warning')
            return DEFAULT_PROMO_SETTINGS
        }

        return data.value as PromoSettings
    } catch (err) {
        dbLogger.error('Error', err)
        return DEFAULT_PROMO_SETTINGS
    }
}

// Update promo settings
export async function updatePromoSettings(settings: Partial<PromoSettings>): Promise<{ success: boolean; error?: string }> {
    try {
        // Zod validation
        const validationResult = PartialPromoSettingsSchema.safeParse(settings)
        if (!validationResult.success) {
            const firstError = validationResult.error.issues[0]
            return { success: false, error: firstError?.message || 'بيانات غير صالحة' }
        }

        const validatedSettings = validationResult.data

        // التحقق من أن التاريخ في المستقبل (عند تفعيل العرض)
        if (validatedSettings.end_date && validatedSettings.is_active) {
            const endDate = new Date(validatedSettings.end_date)
            if (endDate <= new Date()) {
                return { success: false, error: 'تاريخ الانتهاء يجب أن يكون في المستقبل' }
            }
        }

        // First get current settings
        const current = await getPromoSettings()
        const updated = { ...current, ...validatedSettings }

        const { error } = await (supabase
            .from('site_settings') as unknown as UpsertTable)
            .upsert({
                key: 'promo_settings',
                value: updated,
                updated_at: new Date().toISOString()
            }, {
                onConflict: 'key'
            })

        if (error) {
            dbLogger.error('Error', error)
            return { success: false, error: 'حدث خطأ في حفظ الإعدادات' }
        }

        return { success: true }
    } catch (err) {
        dbLogger.error('Error', err)
        return { success: false, error: 'حدث خطأ غير متوقع' }
    }
}

// Toggle promo active status
export async function togglePromoActive(isActive: boolean): Promise<{ success: boolean; error?: string }> {
    return updatePromoSettings({ is_active: isActive })
}

// Fetch pricing plans
export async function getPricingPlans(): Promise<PricingPlan[]> {
    try {
        const { data, error } = await supabase
            .from('site_settings')
            .select('value')
            .eq('key', 'pricing_plans')
            .single() as { data: { value: PricingPlan[] } | null; error: unknown }

        if (error || !data) {
            dbLogger.warn('Warning')
            return DEFAULT_PRICING_PLANS
        }

        return data.value as PricingPlan[]
    } catch (err) {
        dbLogger.error('Error', err)
        return DEFAULT_PRICING_PLANS
    }
}

// Calculate discounted price
export function calculateDiscountedPrice(originalPrice: number, discountPercentage: number): number {
    return Math.round(originalPrice * (1 - discountPercentage / 100))
}

// Check if promo is still valid (not expired)
export function isPromoValid(endDate: string): boolean {
    return new Date(endDate) > new Date()
}

// Get time remaining for promo
export function getPromoTimeRemaining(endDate: string): { days: number; hours: number; minutes: number; seconds: number } {
    const end = new Date(endDate).getTime()
    const now = Date.now()
    const diff = Math.max(0, end - now)

    const days = Math.floor(diff / (1000 * 60 * 60 * 24))
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))
    const seconds = Math.floor((diff % (1000 * 60)) / 1000)

    return { days, hours, minutes, seconds }
}
