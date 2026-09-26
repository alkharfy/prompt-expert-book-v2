import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase-admin'
import { authLogger } from '@/lib/logger'
import { cookies } from 'next/headers'

/**
 * Device Management API
 * GET /api/auth/devices — List user's devices
 * DELETE /api/auth/devices — Remove a specific device
 */

function getSupabase() {
    return getSupabaseAdmin()
}

async function getUserIdFromCookies(): Promise<string | null> {
    const cookieStore = await cookies()
    const userId = cookieStore.get('ebook_user_id')?.value
    const sessionToken = cookieStore.get('ebook_session_token')?.value

    if (!userId || !sessionToken) return null

    // Verify session is valid
    const supabase = getSupabase()
    const { data: session } = await supabase
        .from('sessions')
        .select('user_id')
        .eq('user_id', userId)
        .eq('session_token', sessionToken)
        .gt('expires_at', new Date().toISOString())
        .maybeSingle()

    return session ? session.user_id : null
}

/**
 * GET — List user's registered devices
 */
export async function GET() {
    try {
        const userId = await getUserIdFromCookies()
        if (!userId) {
            return NextResponse.json(
                { ok: false, error: 'غير مصرح' },
                { status: 401 }
            )
        }

        const supabase = getSupabase()
        const cookieStore = await cookies()
        const currentDeviceId = cookieStore.get('ebook_device_id')?.value || ''

        const { data: devices, error } = await supabase
            .from('devices')
            .select('id, device_id, device_info, last_used, registered_at')
            .eq('user_id', userId)
            .eq('is_active', true)
            .order('last_used', { ascending: false })

        if (error) {
            authLogger.error('Failed to fetch devices', error)
            return NextResponse.json(
                { ok: false, error: 'فشل في جلب الأجهزة' },
                { status: 500 }
            )
        }

        // Parse device info for display
        const parsedDevices = (devices || []).map(device => {
            const info = device.device_info || {}
            const userAgent = (info.userAgent || '').toLowerCase()
            const platform = (info.platform || '').toLowerCase()

            // Detect device type
            let deviceType = 'Desktop'
            if (platform.includes('android') || userAgent.includes('android') || userAgent.includes('mobile')) {
                deviceType = 'Mobile'
            } else if (platform.includes('iphone') || userAgent.includes('iphone')) {
                deviceType = 'Mobile'
            } else if (platform.includes('ipad') || userAgent.includes('ipad') || userAgent.includes('tablet')) {
                deviceType = 'Tablet'
            }

            // Detect browser
            let browser = 'Unknown'
            if (userAgent.includes('edg/') || userAgent.includes('edge')) browser = 'Edge'
            else if (userAgent.includes('chrome') && !userAgent.includes('edg')) browser = 'Chrome'
            else if (userAgent.includes('firefox')) browser = 'Firefox'
            else if (userAgent.includes('safari') && !userAgent.includes('chrome')) browser = 'Safari'
            else if (userAgent.includes('opera') || userAgent.includes('opr')) browser = 'Opera'

            // Detect OS
            let os = info.platform || 'Unknown'
            if (userAgent.includes('windows')) os = 'Windows'
            else if (userAgent.includes('mac os') || userAgent.includes('macos')) os = 'macOS'
            else if (userAgent.includes('linux') && !userAgent.includes('android')) os = 'Linux'
            else if (userAgent.includes('android')) os = 'Android'
            else if (userAgent.includes('iphone') || userAgent.includes('ipad')) os = 'iOS'

            return {
                id: device.id,
                device_id: device.device_id,
                device_type: deviceType,
                browser,
                os,
                last_used: device.last_used || device.registered_at || '',
                is_current: device.device_id === currentDeviceId,
            }
        })

        return NextResponse.json({
            ok: true,
            devices: parsedDevices,
            maxDevices: 3,
        })
    } catch (error) {
        authLogger.error('Devices API error', error)
        return NextResponse.json(
            { ok: false, error: 'حدث خطأ غير متوقع' },
            { status: 500 }
        )
    }
}

/**
 * DELETE — Remove a specific device
 */
export async function DELETE(request: NextRequest) {
    try {
        const userId = await getUserIdFromCookies()
        if (!userId) {
            return NextResponse.json(
                { ok: false, error: 'غير مصرح' },
                { status: 401 }
            )
        }

        const { deviceId } = await request.json()
        if (!deviceId) {
            return NextResponse.json(
                { ok: false, error: 'معرف الجهاز مطلوب' },
                { status: 400 }
            )
        }

        // Don't allow removing current device
        const cookieStore = await cookies()
        const currentDeviceId = cookieStore.get('ebook_device_id')?.value
        if (deviceId === currentDeviceId) {
            return NextResponse.json(
                { ok: false, error: 'لا يمكن إزالة الجهاز الحالي' },
                { status: 400 }
            )
        }

        const supabase = getSupabase()

        // Delete device
        const { error: deviceError } = await supabase
            .from('devices')
            .delete()
            .eq('user_id', userId)
            .eq('device_id', deviceId)

        if (deviceError) {
            authLogger.error('Failed to delete device', deviceError)
            return NextResponse.json(
                { ok: false, error: 'فشل في إزالة الجهاز' },
                { status: 500 }
            )
        }

        // Delete sessions for that device
        await supabase
            .from('sessions')
            .delete()
            .eq('user_id', userId)
            .eq('device_id', deviceId)

        authLogger.info('Device removed', { userId, deviceId })

        return NextResponse.json({ ok: true, message: 'تم إزالة الجهاز بنجاح' })
    } catch (error) {
        authLogger.error('Delete device API error', error)
        return NextResponse.json(
            { ok: false, error: 'حدث خطأ غير متوقع' },
            { status: 500 }
        )
    }
}
