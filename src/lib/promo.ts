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
import { fetchPricingPlans } from './pricing'
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
    return fetchPricingPlans()
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
