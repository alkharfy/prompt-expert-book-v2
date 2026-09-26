import { NextRequest, NextResponse } from 'next/server'
import crypto from 'crypto'
import { getSupabaseAdmin } from '@/lib/supabase-admin'
import { SITE_URL, EMAIL_FROM_DEFAULT } from '@/lib/config'
import { sendCAPILead } from '@/lib/meta-capi'

// Simple in-memory rate limiter per IP (resets on deploy)
const rateLimitMap = new Map<string, { count: number; resetAt: number }>()
const RATE_LIMIT = 5 // max requests
const RATE_WINDOW = 3600_000 // per hour

function isRateLimited(ip: string): boolean {
    const now = Date.now()
    const entry = rateLimitMap.get(ip)
    if (!entry || now > entry.resetAt) {
        rateLimitMap.set(ip, { count: 1, resetAt: now + RATE_WINDOW })
        return false
    }
    entry.count++
    return entry.count > RATE_LIMIT
}

export async function POST(request: NextRequest) {
    try {
        const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown'
        if (isRateLimited(ip)) {
            return NextResponse.json({ error: 'حاول مرة أخرى لاحقاً' }, { status: 429 })
        }

        const body = await request.json()
        const email = typeof body?.email === 'string' ? body.email.trim().toLowerCase() : ''

        // Basic email validation
        if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
            return NextResponse.json({ error: 'بريد إلكتروني غير صالح' }, { status: 400 })
        }

        const supabase = getSupabaseAdmin()

        // Upsert lead — idempotent (safe to submit twice)
        const { error: dbError } = await supabase
            .from('lead_magnet_subscribers')
            .upsert(
                { email, source: 'landing_modal', subscribed_at: new Date().toISOString() },
                { onConflict: 'email' }
            )

        if (dbError) {
            console.error('[lead-magnet] DB error:', dbError.message)
            // Don't fail the request — still send the PDF link
        }

        // Send email with PDF link using Resend
        try {
            const { Resend } = await import('resend')
            const resend = new Resend(process.env.RESEND_API_KEY)
            const fromEmail = EMAIL_FROM_DEFAULT
            const siteUrl = SITE_URL
            const pdfUrl = `${siteUrl}/assets/content/golds-mini-guide.pdf`

            await resend.emails.send({
                from: fromEmail,
                to: email,
                subject: '📘 دليل GOLDS المصغّر — جاهز للتحميل',
                html: `<!DOCTYPE html>
<html dir="rtl" lang="ar">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin:0;padding:0;background:#050505;color:#e0e0e0;font-family:'Tajawal','Cairo',Arial,sans-serif;direction:rtl;">
<div style="max-width:600px;margin:0 auto;padding:30px 20px;">
    <div style="text-align:center;margin-bottom:30px;">
        <h1 style="color:#FF6B35;font-size:24px;margin:0;">🤖 PromptMaster</h1>
    </div>
    <div style="background:#111;border:1px solid rgba(255,107,53,0.2);border-radius:12px;padding:24px;margin-bottom:20px;">
        <h2 style="color:#FF6B35;font-size:20px;margin:0 0 16px 0;">📘 دليل GOLDS المصغّر</h2>
        <p style="color:#ccc;font-size:15px;line-height:1.7;">شكراً لاهتمامك! الدليل جاهز للتحميل — فيه 5 تقنيات Prompt أساسية مع أمثلة عملية.</p>
        <div style="text-align:center;margin-top:20px;">
            <a href="${pdfUrl}" style="display:inline-block;background:#FF6B35;color:#fff;text-decoration:none;padding:14px 32px;border-radius:8px;font-size:16px;font-weight:bold;">حمّل الدليل الآن</a>
        </div>
    </div>
    <div style="background:#111;border:1px solid rgba(255,107,53,0.1);border-radius:12px;padding:20px;text-align:center;">
        <p style="color:#888;font-size:14px;margin:0 0 12px 0;">عايز تاخد الموضوع لمستوى تاني؟</p>
        <a href="${siteUrl}/register" style="display:inline-block;background:transparent;color:#FF6B35;text-decoration:none;padding:10px 24px;border-radius:8px;font-size:14px;font-weight:bold;border:1px solid #FF6B35;">سجّل حساب مجاني وابدأ رحلتك</a>
    </div>
    <div style="text-align:center;margin-top:30px;padding-top:15px;border-top:1px solid rgba(255,255,255,0.05);">
        <p style="color:#555;font-size:11px;">هذا الإيميل أُرسل لأنك طلبت دليل GOLDS المصغّر من PromptMaster</p>
    </div>
</div>
</body></html>`,
            })
        } catch (emailErr) {
            console.error('[lead-magnet] Email send error:', emailErr)
            // Still return success — the user can download from landing
        }

        // Track the lead-magnet signup as a Lead. Deterministic event_id derived
        // from the email (non-PII hash) so the browser Pixel Lead fired with the
        // returned id deduplicates against this server CAPI Lead.
        const eventId = 'leadmag_' + crypto.createHash('sha256').update(email).digest('hex').slice(0, 24)
        sendCAPILead({
            eventId,
            email,
            clientIp: ip !== 'unknown' ? ip : undefined,
            userAgent: request.headers.get('user-agent') || undefined,
            fbp: request.cookies.get('_fbp')?.value || undefined,
            fbc: request.cookies.get('_fbc')?.value || undefined,
        }).catch(() => { /* non-critical */ })

        return NextResponse.json({ success: true, eventId })
    } catch {
        return NextResponse.json({ error: 'حدث خطأ غير متوقع' }, { status: 500 })
    }
}
