import { createClient, SupabaseClient } from '@supabase/supabase-js'
import { Database } from './database.types'

// متغيرات Supabase - يجب تعيينها في .env.local
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

// التحقق من وجود المتغيرات
let supabase: SupabaseClient<Database>

// Flag لتتبع ما إذا كان Supabase متاحاً
let isSupabaseConfigured = false

if (supabaseUrl && supabaseAnonKey) {
    supabase = createClient<Database>(supabaseUrl, supabaseAnonKey)
    isSupabaseConfigured = true
} else {
    // في بيئة البناء (build time)، نستخدم placeholder مؤقت
    // لكن في وقت التشغيل، سيتم رمي خطأ عند أول محاولة استخدام
    if (typeof window !== 'undefined' || process.env.NODE_ENV === 'production') {
        // في الإنتاج أو العميل، هذا خطأ حقيقي
        console.error('⚠️ CRITICAL: Missing Supabase environment variables!')
        console.error('The application will not function correctly.')
    }
    
    // إنشاء عميل وهمي فقط للسماح بالبناء
    supabase = createClient<Database>('https://placeholder.supabase.co', 'placeholder-key')
}

/**
 * التحقق من أن Supabase متاح قبل استخدامه
 */
export function ensureSupabaseConfigured(): void {
    if (!isSupabaseConfigured) {
        throw new Error('Supabase is not configured. Please set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY environment variables.')
    }
}

export { supabase, isSupabaseConfigured }
