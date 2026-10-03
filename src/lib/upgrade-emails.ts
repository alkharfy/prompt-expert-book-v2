// Upgrade Email Drip — 6 emails over 14 days for free users
// Sends via the existing email infrastructure (Resend + email_log)

import 'server-only'
import { getSupabaseAdmin } from '@/lib/supabase-admin'
import { Resend } from 'resend'
import { dbLogger } from './logger'
import { SITE_URL, SITE_DOMAIN, EMAIL_FROM_DEFAULT } from '@/lib/config'

const FROM_EMAIL = EMAIL_FROM_DEFAULT
const APP_URL = SITE_URL

function escapeHtml(text: string): string {
    return text
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;')
}

function wrapEmail(content: string, unsubscribeToken: string): string {
    const unsubscribeUrl = `${APP_URL}/unsubscribe?token=${encodeURIComponent(unsubscribeToken)}&type=upgrade`
    return `<!DOCTYPE html>
<html dir="rtl" lang="ar">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0">
<style>
body { margin:0; padding:0; background:#050505; color:#e0e0e0; font-family:'Tajawal','Cairo',Arial,sans-serif; direction:rtl; }
.container { max-width:600px; margin:0 auto; padding:30px 20px; }
.header { text-align:center; margin-bottom:30px; }
.header h1 { color:#FF6B35; font-size:24px; margin:0; }
.card { background:#111; border:1px solid rgba(255,107,53,0.2); border-radius:12px; padding:24px; margin-bottom:20px; }
.card h2 { color:#FF6B35; font-size:20px; margin:0 0 16px 0; }
.card p { color:#ccc; font-size:15px; line-height:1.7; margin:8px 0; }
.btn { display:inline-block; background:#FF6B35; color:#fff !important; text-decoration:none; padding:12px 28px; border-radius:8px; font-size:16px; font-weight:bold; margin-top:16px; }
.footer { text-align:center; margin-top:40px; padding-top:20px; border-top:1px solid rgba(255,255,255,0.1); }
.footer p { color:#555; font-size:12px; margin:4px 0; }
.footer a { color:#FF6B35; text-decoration:none; }
.divider { border:none; border-top:1px solid rgba(255,107,53,0.15); margin:20px 0; }
.emoji-large { font-size:48px; display:block; text-align:center; margin:16px 0; }
</style></head>
<body><div class="container">
    <div class="header"><h1>🤖 PromptMaster</h1></div>
    ${content}
    <div class="footer">
        <p><a href="${APP_URL}">PromptMaster — ${SITE_DOMAIN}</a></p>
        <p><a href="${unsubscribeUrl}">إلغاء الاشتراك من رسائل الترقية</a> | <a href="${APP_URL}/profile">إدارة التفضيلات</a></p>
    </div>
</div></body></html>`
}

interface DripUser {
    id: string
    email: string
    full_name: string
    unsubscribe_token: string
}

// The 6 drip email templates
const dripTemplates = [
    {
        day: 1,
        type: 'upgrade_drip_1' as const,
        subject: (name: string) => `🎁 أهلاً ${name}! فصل 1 كامل مجاناً بيستناك`,
        body: (name: string) => `
            <div class="card">
                <span class="emoji-large">🎁</span>
                <h2>مرحباً يا ${escapeHtml(name)}!</h2>
                <p>جهزنالك <strong>فصل 1 كامل مجاناً</strong> — 17 صفحة عن كيفية عمل AI ونماذجه وحدوده واختيار الأدوات والاستخدام المسؤول.</p>
                <p>فيه تمارين عملية تقدر تجربها فوراً مع ChatGPT وأي أداة AI ثانية.</p>
                <hr class="divider">
                <div style="text-align:center;">
                    <a href="${APP_URL}/read/section-1/1" class="btn">ابدأ فصل 1 مجاناً ←</a>
                </div>
            </div>`,
    },
    {
        day: 3,
        type: 'upgrade_drip_2' as const,
        subject: (name: string) => `💡 خلصت فصل 1 يا ${name}؟ أهم 3 حاجات اتعلمتها`,
        body: (name: string) => `
            <div class="card">
                <span class="emoji-large">💡</span>
                <h2>ملخص سريع — فصل 1</h2>
                <p>يا <strong>${escapeHtml(name)}</strong>، لو خلصت فصل 1 فأنت دلوقتي بتعرف:</p>
                <p>1️⃣ <strong>كيف يعمل AI</strong> — مقدمة مبسطة عن توليد النصوص</p>
                <p>2️⃣ <strong>النماذج وحدودها</strong> — السياق والمعلومات التي تحتاج مراجعة</p>
                <p>3️⃣ <strong>اختيار الأدوات واستخدامها بمسؤولية</strong> — التكلفة والخصوصية والأخلاقيات</p>
                <p>💪 الجزء الأحلى؟ فصل 2 فيه تطبيقات أقوى بكتير!</p>
                <hr class="divider">
                <div style="text-align:center;">
                    <a href="${APP_URL}/read/section-2/1" class="btn">أكمل لفصل 2 ←</a>
                </div>
            </div>`,
    },
    {
        day: 5,
        type: 'upgrade_drip_3' as const,
        subject: () => `📋 95 قالب prompt قابلة للتعديل في كل الباقات`,
        body: (name: string) => `
            <div class="card">
                <span class="emoji-large">🔥</span>
                <h2>95 قالب جاهز!</h2>
                <p>يا <strong>${escapeHtml(name)}</strong>، في المحتوى والمكتبة ضمن كل الباقات فيه:</p>
                <p>📝 <strong>95 قالب prompt</strong> جاهز تنسخه وتستخدمه فوراً</p>
                <p>🤖 <strong>بناء AI Agents</strong> — فصل كامل عن أتمتة المهام</p>
                <p>🎨 <strong>الصور والصوت والفيديو</strong> — أمثلة على توجيه الأدوات ومراجعة مخرجاتها</p>
                <p>📊 <strong>تحليل البيانات</strong> — أمثلة لإعداد تحليل ومراجعة دقته</p>
                <hr class="divider">
                <div style="text-align:center;">
                    <a href="${APP_URL}/payment" class="btn">شوف الخطط المتاحة ←</a>
                </div>
            </div>`,
    },
    {
        day: 7,
        type: 'upgrade_drip_4' as const,
        subject: () => `📖 فصل 7: تصميم وكيل AI وحدود تنفيذه`,
        body: (name: string) => `
            <div class="card">
                <span class="emoji-large">🤖</span>
                <h2>تصميم الوكلاء — فصل 7</h2>
                <p>يا <strong>${escapeHtml(name)}</strong>، أحمد شخصية تعليمية في الكتاب. الفصل 7 يوضح كيف تصمم مهمة الوكيل وأدواته وحدود تنفيذه:</p>
                <p>✅ تقسيم المهمة ومراجعة النتائج</p>
                <p>✅ اختيار الأدوات وتحديد صلاحياتها</p>
                <p>✅ طلب موافقة بشرية عند الإجراءات الحساسة</p>
                <p>ابدأ بمهمة صغيرة واختبرها قبل الاعتماد عليها في شغلك.</p>
                <hr class="divider">
                <div style="text-align:center;">
                    <a href="${APP_URL}/payment" class="btn">أكمل رحلتك مع أحمد ←</a>
                </div>
            </div>`,
    },
    {
        day: 10,
        type: 'upgrade_drip_5' as const,
        subject: () => `⏰ جاهز تتعلّم AI عمليًا؟ شاهد الباقات والأسعار الحالية`,
        body: (name: string) => `
            <div class="card">
                <span class="emoji-large">⏰</span>
                <h2>خطوة واحدة وتبدأ!</h2>
                <p>يا <strong>${escapeHtml(name)}</strong>، الكتاب كامل (10 فصول + 95 قالب + 45 تمرين + شهادة إتمام في الباقات التي تشملها) في انتظارك.</p>
                <div style="background:rgba(255,107,53,0.08); border:1px solid rgba(255,107,53,0.2); border-radius:8px; padding:16px; text-align:center; margin:16px 0;">
                    <p style="font-size:24px; font-weight:bold; color:#FF6B35; margin:0;">بالسعر الموضّح قبل الدفع</p>
                    <p style="color:#888; margin:8px 0 0 0;">وصول سنة كاملة — السعر وشروط الباقة موضحان قبل الدفع</p>
                </div>
                <hr class="divider">
                <div style="text-align:center;">
                    <a href="${APP_URL}/payment" class="btn">شاهد الباقات الحالية ←</a>
                </div>
            </div>`,
    },
    {
        day: 14,
        type: 'upgrade_drip_6' as const,
        subject: () => `⚡ آخر تذكير — ابدأ رحلتك مع AI النهاردة`,
        body: (name: string) => `
            <div class="card">
                <span class="emoji-large">⚡</span>
                <h2>آخر تذكير!</h2>
                <p>يا <strong>${escapeHtml(name)}</strong>، لسه ما بدأتش رحلتك في تعلّم استخدام الذكاء الاصطناعي؟</p>
                <p>ده آخر تذكير مننا — المحتوى كامل في انتظارك بالسعر الموضّح قبل الدفع.</p>
                <div style="background:rgba(255,107,53,0.08); border:1px solid rgba(255,107,53,0.2); border-radius:8px; padding:16px; margin:16px 0;">
                    <p style="color:#ccc; margin:0;">🎯 45 تمرين تفاعلي</p>
                    <p style="color:#ccc; margin:8px 0 0 0;">📜 شهادة إتمام قراءة في المتقدمة وVIP عند استيفاء المتطلبات</p>
                    <p style="color:#ccc; margin:8px 0 0 0;">🏆 لوحة المتصدرين والإنجازات في المتقدمة وVIP</p>
                    <p style="color:#ccc; margin:8px 0 0 0;">📚 المصادر وأخبار AI متاحة مجانًا للجميع</p>
                </div>
                <hr class="divider">
                <div style="text-align:center;">
                    <a href="${APP_URL}/payment" class="btn">اختر الباقة المناسبة ←</a>
                </div>
            </div>`,
    },
]

/**
 * Process upgrade drip emails for all eligible free users.
 * Called by cron job: /api/cron/upgrade-drip
 */
export async function processUpgradeDrip(): Promise<{ sent: number; errors: number }> {
    const supabase = getSupabaseAdmin()
    let sent = 0
    let errors = 0

    // Get free users (no active subscription) who haven't opted out of upgrade emails
    // The users table's plan column is `current_plan` (there is no per-user id-style
    // plan column). Also exclude any already-active account (covers the edge case of
    // a paid user whose current_plan write lagged) so we never drip a paying customer.
    const { data: freeUsers, error: fetchErr } = await supabase
        .from('users')
        .select('id, email, full_name, created_at')
        .is('current_plan', null)
        .eq('is_active', false)
        .not('email', 'is', null)

    if (fetchErr || !freeUsers) {
        dbLogger.error('Failed to fetch free users for upgrade drip', fetchErr)
        return { sent: 0, errors: 1 }
    }

    let resend: Resend | null = null
    try {
        resend = new Resend(process.env.RESEND_API_KEY!)
    } catch {
        dbLogger.error('Failed to initialize Resend for upgrade drip')
        return { sent: 0, errors: 1 }
    }

    for (const user of freeUsers) {
        try {
            // Check if user has opted out of upgrade emails
            const { data: prefs } = await supabase
                .from('email_preferences')
                .select('upgrade_emails, unsubscribe_token')
                .eq('user_id', user.id)
                .maybeSingle()

            if (prefs?.upgrade_emails === false) continue

            const unsubscribeToken = prefs?.unsubscribe_token || user.id

            // Calculate days since registration
            const daysSinceReg = Math.floor(
                (Date.now() - new Date(user.created_at).getTime()) / (1000 * 60 * 60 * 24)
            )

            // Find which drip email should be sent
            const nextDrip = dripTemplates.find(t => t.day === daysSinceReg)
            if (!nextDrip) continue

            // Check if this specific email was already sent
            const { data: alreadySent } = await supabase
                .from('email_log')
                .select('id')
                .eq('user_id', user.id)
                .eq('email_type', nextDrip.type)
                .limit(1)

            if (alreadySent && alreadySent.length > 0) continue

            // Check daily email limit (max 1/day)
            const todayStart = new Date()
            todayStart.setHours(0, 0, 0, 0)
            const { data: todayEmails } = await supabase
                .from('email_log')
                .select('id')
                .eq('user_id', user.id)
                .gte('sent_at', todayStart.toISOString())
                .limit(1)

            if (todayEmails && todayEmails.length > 0) continue

            // Send the email
            const dripUser: DripUser = {
                id: user.id,
                email: user.email,
                full_name: user.full_name || 'صديقنا',
                unsubscribe_token: unsubscribeToken,
            }

            const subject = nextDrip.subject(dripUser.full_name)
            const bodyHtml = nextDrip.body(dripUser.full_name)
            const fullHtml = wrapEmail(bodyHtml, dripUser.unsubscribe_token)

            const { error: sendErr } = await resend.emails.send({
                from: FROM_EMAIL,
                to: dripUser.email,
                subject,
                html: fullHtml,
            })

            if (sendErr) {
                dbLogger.error(`Upgrade drip ${nextDrip.type} failed for ${user.id}`, sendErr)
                await supabase.from('email_log').insert({
                    user_id: user.id,
                    email_type: nextDrip.type,
                    subject,
                    status: 'failed',
                })
                errors++
                continue
            }

            // Log success
            await supabase.from('email_log').insert({
                user_id: user.id,
                email_type: nextDrip.type,
                subject,
                status: 'sent',
            })

            sent++
        } catch (err) {
            dbLogger.error(`Upgrade drip error for user ${user.id}`, err)
            errors++
        }
    }

    return { sent, errors }
}
