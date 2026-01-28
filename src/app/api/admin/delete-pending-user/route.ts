import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { verifyToken } from '@/lib/admin-session'

export const dynamic = 'force-dynamic'

// Create Supabase client with service role for admin operations
function getSupabaseAdmin() {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY
    if (!url || !key) {
        throw new Error('Missing Supabase environment variables for admin operations')
    }
    return createClient(url, key, { auth: { persistSession: false } })
}

/**
 * Delete a pending user registration (user who hasn't verified their code)
 * This allows the email to be used again for a new registration
 */
export async function POST(request: NextRequest) {
    try {
        const body = await request.json()
        const { token, userId, verificationCodeId } = body

        // Verify admin session
        const isValidSession = await verifyToken(token)
        if (!isValidSession) {
            return NextResponse.json({ success: false, error: 'غير مصرح' }, { status: 401 })
        }

        if (!userId || !verificationCodeId) {
            return NextResponse.json({ success: false, error: 'بيانات ناقصة' }, { status: 400 })
        }

        const supabaseAdmin = getSupabaseAdmin()
        // Check if the verification code is still pending (not used)
        const { data: codeData, error: codeError } = await supabaseAdmin
            .from('verification_codes')
            .select('is_used')
            .eq('id', verificationCodeId)
            .eq('user_id', userId)
            .single()

        if (codeError || !codeData) {
            return NextResponse.json({ success: false, error: 'الكود غير موجود' }, { status: 404 })
        }

        if (codeData.is_used) {
            return NextResponse.json({
                success: false,
                error: 'لا يمكن حذف كود تم استخدامه. الحساب مفعّل بالفعل.'
            }, { status: 400 })
        }

        // Delete in order to maintain referential integrity
        // 1. Delete verification codes for this user
        const { error: deleteCodeError } = await supabaseAdmin
            .from('verification_codes')
            .delete()
            .eq('user_id', userId)

        if (deleteCodeError) {
            console.error('Error deleting verification code:', deleteCodeError)
        }

        // 2. Delete reading progress
        const { error: deleteProgressError } = await supabaseAdmin
            .from('reading_progress')
            .delete()
            .eq('user_id', userId)

        if (deleteProgressError) {
            console.error('Error deleting reading progress:', deleteProgressError)
        }

        // 3. Delete devices
        const { error: deleteDevicesError } = await supabaseAdmin
            .from('devices')
            .delete()
            .eq('user_id', userId)

        if (deleteDevicesError) {
            console.error('Error deleting devices:', deleteDevicesError)
        }

        // 4. Delete sessions
        const { error: deleteSessionsError } = await supabaseAdmin
            .from('sessions')
            .delete()
            .eq('user_id', userId)

        if (deleteSessionsError) {
            console.error('Error deleting sessions:', deleteSessionsError)
        }

        // 5. Delete from public.users table
        const { error: deleteUserError } = await supabaseAdmin
            .from('users')
            .delete()
            .eq('id', userId)

        if (deleteUserError) {
            console.error('Error deleting user from users table:', deleteUserError)
            return NextResponse.json({
                success: false,
                error: 'فشل في حذف المستخدم: ' + deleteUserError.message
            }, { status: 500 })
        }

        // 6. Delete from Supabase Auth (using admin API)
        const { error: deleteAuthError } = await supabaseAdmin.auth.admin.deleteUser(userId)

        if (deleteAuthError) {
            console.error('Error deleting user from auth:', deleteAuthError)
            // We continue anyway since the main data is deleted
            // The orphaned auth user won't cause registration issues
        }

        return NextResponse.json({
            success: true,
            message: 'تم حذف التسجيل بنجاح. يمكن للمستخدم التسجيل مرة أخرى بنفس البريد.'
        })

    } catch (error) {
        console.error('Error in delete-pending-user:', error)
        return NextResponse.json({ success: false, error: 'خطأ في الخادم' }, { status: 500 })
    }
}
