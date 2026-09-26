import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase-admin'
import { apiLogger } from '@/lib/logger'

// =====================================================
// API: /api/email/unsubscribe
// GET  → Show confirmation page (safe for link scanners)
// POST → Actually perform the unsubscribe
// =====================================================

/**
 * GET: Show a confirmation page instead of performing the write directly.
 * This prevents email link scanners/prefetchers from auto-unsubscribing users.
 */
export async function GET(request: NextRequest) {
    const { searchParams } = new URL(request.url)
    const token = searchParams.get('token') || ''
    const type = searchParams.get('type') || 'all'

    // SECURITY: Escape HTML special characters to prevent XSS
    const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;')

    // Return an HTML confirmation page with a form that POSTs
    const html = `<!DOCTYPE html>
<html dir="rtl" lang="ar">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>إلغاء الاشتراك — PromptMaster</title>
<style>body{margin:0;padding:40px 20px;background:#050505;color:#e0e0e0;font-family:'Tajawal',Arial,sans-serif;direction:rtl;text-align:center}
.card{max-width:480px;margin:0 auto;background:#111;border:1px solid rgba(255,107,53,.2);border-radius:12px;padding:32px}
h2{color:#FF6B35;margin-bottom:16px}p{color:#ccc;line-height:1.7}
button{background:#FF6B35;color:#fff;border:none;padding:14px 32px;border-radius:8px;font-size:16px;cursor:pointer;margin-top:16px;font-family:inherit}
button:hover{background:#e55a2b}.cancel{background:transparent;color:#888;border:1px solid #333;margin-right:12px}
.cancel:hover{color:#fff;border-color:#666}</style></head>
<body><div class="card">
<h2>إلغاء الاشتراك</h2>
<p>هل أنت متأكد إنك عايز تلغي الاشتراك في الإيميلات؟</p>
<form method="POST" action="/api/email/unsubscribe">
<input type="hidden" name="token" value="${esc(token)}">
<input type="hidden" name="type" value="${esc(type)}">
<a href="/" class="cancel" style="display:inline-block;padding:14px 32px;border-radius:8px;font-size:16px;text-decoration:none">لا، رجّعني</a>
<button type="submit">نعم، ألغِ الاشتراك</button>
</form></div></body></html>`

    return new NextResponse(html, {
        status: 200,
        headers: { 'Content-Type': 'text/html; charset=utf-8' },
    })
}

/**
 * POST: Actually perform the unsubscribe (requires user confirmation via form)
 */
export async function POST(request: NextRequest) {
    try {
        // Parse body — supports both form data (from HTML form) and JSON (from React client)
        let token: string | null = null
        let type: string = 'all'
        const contentType = request.headers.get('content-type') || ''
        if (contentType.includes('application/json')) {
            const body = await request.json()
            token = body.token || null
            type = body.type || 'all'
        } else {
            const formData = await request.formData()
            token = formData.get('token') as string | null
            type = (formData.get('type') as string) || 'all'
        }

        if (!token) {
            return NextResponse.json({ error: 'رابط غير صالح' }, { status: 400 })
        }

        const supabase = getSupabaseAdmin()

        // Find user by unsubscribe token
        const { data: prefs } = await supabase
            .from('email_preferences')
            .select('user_id, unsubscribe_token')
            .eq('unsubscribe_token', token)
            .maybeSingle()

        if (!prefs) {
            return NextResponse.json({ error: 'رابط غير صالح أو منتهي الصلاحية' }, { status: 404 })
        }

        const updateData: Record<string, unknown> = { updated_at: new Date().toISOString() }

        switch (type) {
            case 'all':
                updateData.reminders_enabled = false
                updateData.streak_reminders = false
                updateData.mission_reminders = false
                updateData.milestone_notifications = false
                updateData.weekly_recap = false
                updateData.upgrade_emails = false
                updateData.cart_recovery_emails = false
                break
            case 'streak':
                updateData.streak_reminders = false
                break
            case 'missions':
                updateData.mission_reminders = false
                break
            case 'recap':
                updateData.weekly_recap = false
                break
            case 'milestone':
                updateData.milestone_notifications = false
                break
            case 'upgrade':
                updateData.upgrade_emails = false
                break
            case 'cart_recovery':
                updateData.cart_recovery_emails = false
                break
            case 'reduce':
                // Just reduce frequency instead of unsubscribing
                updateData.reminder_frequency = 'weekly'
                break
            default:
                return NextResponse.json({ error: 'نوع غير صالح' }, { status: 400 })
        }

        const { error: updateError } = await supabase
            .from('email_preferences')
            .update(updateData)
            .eq('unsubscribe_token', token)

        if (updateError) {
            apiLogger.error('Error updating unsubscribe preferences', updateError)
            return NextResponse.json({ error: 'فشل في تحديث التفضيلات' }, { status: 500 })
        }

        apiLogger.info(`User ${prefs.user_id} unsubscribed from ${type}`)

        return NextResponse.json({
            ok: true,
            type,
            message: type === 'all'
                ? 'تم إلغاء كل الإيميلات بنجاح'
                : type === 'reduce'
                    ? 'تم تقليل التكرار إلى مرة أسبوعياً'
                    : `تم إلغاء إيميلات ${type === 'streak' ? 'الـ Streak' : type === 'missions' ? 'المهام' : type === 'recap' ? 'الملخص الأسبوعي' : type === 'upgrade' ? 'الترقية' : type === 'cart_recovery' ? 'تذكير إكمال الاشتراك' : 'التهنئة'}`,
        })
    } catch (error) {
        apiLogger.error('Error in unsubscribe', error)
        return NextResponse.json({ error: 'خطأ في الخادم' }, { status: 500 })
    }
}
