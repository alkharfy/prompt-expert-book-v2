import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase-admin'
import { getAuthenticatedUserId } from '@/lib/firebase_auth_middleware'
import { checkRateLimit, getClientIP } from '@/lib/rate-limit'
import { dbLogger } from '@/lib/logger'

/**
 * GET /api/user/profile - Get current user profile
 */
export async function GET(request: NextRequest) {
    try {
        const userId = await getAuthenticatedUserId(request)
        if (!userId) {
            return NextResponse.json(
                { ok: false, error: 'غير مصرح' },
                { status: 401 }
            )
        }

        const supabase = getSupabaseAdmin()
        // SECURITY: Never use SELECT * — explicitly list safe columns (excludes password_hash, firebase_uid, is_admin)
        const { data: user, error } = await supabase
            .from('users')
            .select('id, email, full_name, phone_number, is_verified, is_active, current_plan, plan_expires_at, created_at, updated_at')
            .eq('id', userId)
            .single()

        if (error || !user) {
            dbLogger.error('Failed to fetch user profile:', error)
            return NextResponse.json(
                { ok: false, error: 'فشل في تحميل بيانات المستخدم' },
                { status: 500 }
            )
        }

        return NextResponse.json({ ok: true, user })
    } catch (error) {
        dbLogger.error('Profile API error:', error)
        return NextResponse.json(
            { ok: false, error: 'خطأ في الخادم' },
            { status: 500 }
        )
    }
}

/**
 * PUT /api/user/profile - Update current user profile
 */
export async function PUT(request: NextRequest) {
    try {
        const userId = await getAuthenticatedUserId(request)
        if (!userId) {
            return NextResponse.json(
                { ok: false, error: 'غير مصرح' },
                { status: 401 }
            )
        }

        // SECURITY: Rate limit profile updates
        const clientIP = getClientIP(request)
        const rateLimit = checkRateLimit(`profile-update:${userId}:${clientIP}`, { maxRequests: 10, windowSeconds: 60 })
        if (!rateLimit.allowed) {
            return NextResponse.json(
                { ok: false, error: 'طلبات كثيرة، حاول بعد قليل' },
                { status: 429 }
            )
        }

        const body = await request.json()
        const { full_name, email } = body

        const supabase = getSupabaseAdmin()
        const updates: Record<string, any> = {}

        // SECURITY: Validate full_name
        if (full_name !== undefined) {
            if (typeof full_name !== 'string' || full_name.length > 100) {
                return NextResponse.json(
                    { ok: false, error: 'الاسم غير صالح (الحد الأقصى 100 حرف)' },
                    { status: 400 }
                )
            }
            updates.full_name = full_name.trim()
        }

        // SECURITY: Validate email format
        if (email !== undefined) {
            if (typeof email !== 'string' || email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
                return NextResponse.json(
                    { ok: false, error: 'البريد الإلكتروني غير صالح' },
                    { status: 400 }
                )
            }
            updates.email = email.toLowerCase()
        }

        if (Object.keys(updates).length === 0) {
            return NextResponse.json(
                { ok: false, error: 'لا توجد بيانات للتحديث' },
                { status: 400 }
            )
        }

        // Check email uniqueness if changing email
        if (email) {
            const { data: existing } = await supabase
                .from('users')
                .select('id')
                .eq('email', email.toLowerCase())
                .neq('id', userId)
                .single()

            if (existing) {
                return NextResponse.json(
                    { ok: false, error: 'البريد الإلكتروني مستخدم بالفعل' },
                    { status: 400 }
                )
            }
        }

        const { data: user, error } = await supabase
            .from('users')
            .update(updates)
            .eq('id', userId)
            .select('id, email, full_name, phone_number, is_verified, is_active, current_plan, plan_expires_at, created_at, updated_at')
            .single()

        if (error) {
            dbLogger.error('Failed to update profile:', error)
            return NextResponse.json(
                { ok: false, error: 'فشل في تحديث البيانات' },
                { status: 500 }
            )
        }

        return NextResponse.json({ ok: true, user, message: 'تم تحديث الملف الشخصي بنجاح' })
    } catch (error) {
        dbLogger.error('Profile update API error:', error)
        return NextResponse.json(
            { ok: false, error: 'خطأ في الخادم' },
            { status: 500 }
        )
    }
}
