/**
 * Promo & Pricing module
 * 
 * ℹ️ NOTE: This module uses the anon-key Supabase client intentionally.
 * It is imported by client components (PricingSection, PromoBanner).
 * Switching to service_role would expose the key in the client bundle.
 * Ensure site_settings table has appropriate RLS policies.
 * Admin writes (updatePromoSettings) also run client-side from admin dashboard.
 */
import { supabase } from './supabase'
import { z } from 'zod'
import { dbLogger } from './logger'

// Helper type for upsert operations
type UpsertTable = {
    upsert: (data: Record<string, unknown>, options?: { onConflict?: string }) => Promise<{ error: { message: string } | null }>
}

// Zod schemas for validation
const PromoSettingsSchema = z.object({
    is_active: z.boolean(),
    discount_percentage: z.number().min(0).max(100),
    end_date: z.string().refine((date) => !isNaN(Date.parse(date)), {
        message: 'تاريخ غير صالح'
    }),
    promo_text: z.string().min(1).max(500)
})

const PartialPromoSettingsSchema = PromoSettingsSchema.partial()

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
    description?: string
    cta_link?: string
    cta_text?: string
}

// Default promo settings (fallback)
const DEFAULT_PROMO_SETTINGS: PromoSettings = {
    is_active: false,
    discount_percentage: 30,
    end_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
    promo_text: 'عرض افتتاحي: خصم 30% لفترة محدودة!'
}

// Default pricing plans (fallback)
// Pricing realigned 2026-05: previous 299/499/999 with 98% discount triggered
// "scam" perception. New ladder is honest sticker pricing aligned with the
// Egyptian/Gulf market and competitor benchmarks.
const DEFAULT_PRICING_PLANS: PricingPlan[] = [
    {
        id: 'basic',
        name: 'الأساسية',
        price: 99,
        duration: 'سنة',
        features: [
            '📖 الكتاب كامل (188+ صفحة)',
            '✏️ التمارين التفاعلية',
            '🏆 نظام النقاط والإنجازات (60+)',
            '🔥 Streak يومي ولوحة المتصدرين',
            '🧭 مهام يومية (3 مهام/يوم)',
            '📝 ملاحظات وتظليل النصوص',
            '🔖 حفظ الإشارات المرجعية',
            '⏳ وصول لمدة سنة كاملة'
        ],
        is_popular: false,
        description: 'ابدأ رحلتك في احتراف البرومبت مع كل أدوات التعلم التفاعلي.',
        cta_link: '/payment?plan=basic',
        cta_text: 'ابدأ الآن'
    },
    {
        id: 'pro',
        name: 'المتقدمة',
        price: 199,
        duration: 'سنة',
        features: [
            '✅ كل مميزات الأساسية',
            '📋 95 قالب جاهز للنسخ',
            '🎓 شهادة إتمام معتمدة + QR',
            '🛠️ أدوات AI (مولد + محلل البرومبت)',
            '♾️ تحديثات مجانية مدى الحياة'
        ],
        is_popular: true,
        description: 'الأكثر شيوعاً - كل الأدوات التي تحتاجها للاحتراف الحقيقي.',
        cta_link: '/payment?plan=pro',
        cta_text: 'احصل على العرض'
    },
    {
        id: 'vip',
        name: 'VIP',
        price: 399,
        duration: 'سنة',
        features: [
            '✅ كل مميزات المتقدمة',
            '⚡ مقارن الردود AI (حصري)',
            '🎯 استشارة خاصة 30 دقيقة',
            '💬 دعم أولوية عبر WhatsApp',
            '🚀 وصول مبكر للمحتوى الجديد'
        ],
        is_popular: false,
        description: 'للمحترفين الجادين - دعم شخصي وأدوات AI حصرية.',
        cta_link: '/payment?plan=vip',
        cta_text: 'تواصل معنا'
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
