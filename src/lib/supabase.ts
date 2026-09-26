import { createClient, SupabaseClient } from '@supabase/supabase-js'
import { Database } from './database.types'

// متغيرات Supabase - يجب تعيينها في .env.local
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

// التحقق من وجود المتغيرات
let supabase: SupabaseClient

if (supabaseUrl && supabaseAnonKey) {
    supabase = createClient(supabaseUrl, supabaseAnonKey)
} else {
    // في بيئة الإنتاج يجب أن تكون المتغيرات موجودة — إظهار خطأ واضح
    const errorMessage = '⚠️ CRITICAL: Missing Supabase environment variables (NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY). Set them in .env.local'
    
    if (process.env.NODE_ENV === 'production') {
        throw new Error(errorMessage)
    }
    
    // في بيئة البناء (build time): إنشاء Proxy يرمي خطأ عند أي استخدام فعلي
    console.warn(errorMessage)
    supabase = new Proxy({} as SupabaseClient, {
        get(_target, prop) {
            if (prop === 'then' || prop === 'catch') return undefined
            return () => {
                throw new Error(errorMessage)
            }
        },
    })
}

export { supabase }
