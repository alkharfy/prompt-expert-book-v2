// Cart Recovery Emails — 3 emails for abandoned payment pages
// Email 1: 1 hour after visit | Email 2: 24 hours | Email 3: 72 hours with discount code

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
    const unsubscribeUrl = `${APP_URL}/unsubscribe?token=${encodeURIComponent(unsubscribeToken)}&type=cart_recovery`
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
        <p><a href="${unsubscribeUrl}">إلغاء الاشتراك</a></p>
    </div>
</div></body></html>`
}

const planNames: Record<string, string> = {
    basic: 'Basic — الأساسية',
    pro: 'Pro — المتقدمة',
    vip: 'VIP',
}

function getPlanName(planId: string): string {
    return planNames[planId] || planId
}

const cartEmails = [
    {
        reminderNum: 1,
        minHoursAfter: 1,
        maxHoursAfter: 23,
        type: 'cart_recovery_1' as const,
        subject: (planName: string) => `🛒 نسيت حاجة؟ خطة ${planName} بتستناك!`,
        body: (name: string, planName: string) => `
            <div class="card">
                <span class="emoji-large">🛒</span>
                <h2>لسه مهتم؟</h2>
                <p>يا <strong>${escapeHtml(name)}</strong>، لاحظنا إنك كنت بتتصفح خطة <strong>${escapeHtml(planName)}</strong> لكن ما كملتش.</p>
                <p>عادي! خد وقتك — بس عايزين نأكدلك إن الخطة لسه متاحة 🙌</p>
                <hr class="divider">
                <div style="text-align:center;">
                    <a href="${APP_URL}/payment" class="btn">أكمل الاشتراك ←</a>
                </div>
            </div>`,
    },
    {
        reminderNum: 2,
        minHoursAfter: 24,
        maxHoursAfter: 71,
        type: 'cart_recovery_2' as const,
        subject: (planName: string) => `💡 3 فوائد تعليمية في ${planName}`,
        body: (name: string, planName: string) => `
            <div class="card">
                <span class="emoji-large">💡</span>
                <h2>ليه ${escapeHtml(planName)}؟</h2>
                <p>يا <strong>${escapeHtml(name)}</strong>، دي 3 فوائد تعليمية متاحة في الاشتراك:</p>
                <p>1️⃣ <strong>محتوى منظّم</strong> — فصول وأمثلة مرتبة تساعدك تبدأ وتواصل</p>
                <p>2️⃣ <strong>تطبيق عملي</strong> — 45 تمرينًا لتجربة ما تتعلّمه</p>
                <p>3️⃣ <strong>تابع تقدّمك</strong> — قراءة وقوالب وتمارين في كل الباقات؛ المتقدمة وVIP تضيفان أدوات وشهادة إتمام قراءة من PromptMaster وفق متطلباتها.</p>
                <hr class="divider">
                <div style="text-align:center;">
                    <a href="${APP_URL}/payment" class="btn">ابدأ رحلتك ←</a>
                </div>
            </div>`,
    },
    {
        reminderNum: 3,
        minHoursAfter: 72,
        maxHoursAfter: 168,
        type: 'cart_recovery_3' as const,
        subject: () => `🚀 لسه فاكر PromptMaster؟ الكتاب كامل في انتظارك`,
        body: (name: string) => `
            <div class="card">
                <span class="emoji-large">🚀</span>
                <h2>خطوة واحدة وتبدأ!</h2>
                <p>يا <strong>${escapeHtml(name)}</strong>، وصلت لصفحة الاشتراك ومكمّلتش — الكتاب كامل (10 فصول + 95 قالب + 45 تمرين + شهادة إتمام في الباقات التي تشملها) مستنيك.</p>
                <p>ابدأ تتعلّم تكتب تعليمات واضحة، وتجرب الناتج وتراجعه وتحسّنه خطوة بخطوة.</p>
                <hr class="divider">
                <div style="text-align:center;">
                    <a href="${APP_URL}/payment" class="btn">أكمل اشتراكك ←</a>
                </div>
            </div>`,
    },
]

/**
 * Process abandoned cart recovery emails.
 * Called by cron: /api/cron/cart-recovery
 */
export async function processCartRecovery(): Promise<{ sent: number; errors: number }> {
    const supabase = getSupabaseAdmin()
    let sent = 0
    let errors = 0

    // Get uncompleted payment intents
    const { data: intents, error: fetchErr } = await supabase
        .from('payment_intents')
        .select('id, user_id, selected_plan, visited_at, reminder_sent_count')
        .eq('completed', false)
        .lt('reminder_sent_count', 3)
        .order('visited_at', { ascending: true })

    if (fetchErr || !intents) {
        dbLogger.error('Failed to fetch payment intents for cart recovery', fetchErr)
        return { sent: 0, errors: 1 }
    }

    let resend: Resend | null = null
    try {
        resend = new Resend(process.env.RESEND_API_KEY!)
    } catch {
        dbLogger.error('Failed to initialize Resend for cart recovery')
        return { sent: 0, errors: 1 }
    }

    for (const intent of intents) {
        try {
            const hoursSinceVisit = (Date.now() - new Date(intent.visited_at).getTime()) / (1000 * 60 * 60)
            const nextReminder = cartEmails[intent.reminder_sent_count]

            if (!nextReminder) continue
            if (hoursSinceVisit < nextReminder.minHoursAfter || hoursSinceVisit > nextReminder.maxHoursAfter) continue

            // Check user hasn't paid since. The users table's plan column is
            // `current_plan`; also treat is_active=true as paid, covering a paid
            // user whose current_plan write lagged behind activation.
            const { data: user } = await supabase
                .from('users')
                .select('id, email, full_name, current_plan, is_active')
                .eq('id', intent.user_id)
                .single()

            if (!user) continue
            if (user.current_plan || user.is_active) {
                // User has subscribed — mark intent as completed
                await supabase
                    .from('payment_intents')
                    .update({ completed: true })
                    .eq('id', intent.id)
                continue
            }

            // Check opt-out
            const { data: prefs } = await supabase
                .from('email_preferences')
                .select('cart_recovery_emails, unsubscribe_token')
                .eq('user_id', user.id)
                .maybeSingle()

            if (prefs?.cart_recovery_emails === false) continue

            const unsubscribeToken = prefs?.unsubscribe_token || user.id
            const planName = getPlanName(intent.selected_plan)
            const subject = nextReminder.subject(planName)
            const bodyHtml = nextReminder.body(user.full_name || 'صديقنا', planName)
            const fullHtml = wrapEmail(bodyHtml, unsubscribeToken)

            const { error: sendErr } = await resend.emails.send({
                from: FROM_EMAIL,
                to: user.email,
                subject,
                html: fullHtml,
            })

            if (sendErr) {
                dbLogger.error(`Cart recovery email ${nextReminder.type} failed for ${user.id}`, sendErr)
                errors++
                continue
            }

            // Update intent
            await supabase
                .from('payment_intents')
                .update({
                    reminder_sent_count: intent.reminder_sent_count + 1,
                    last_reminder_at: new Date().toISOString(),
                })
                .eq('id', intent.id)

            // Log
            await supabase.from('email_log').insert({
                user_id: user.id,
                email_type: nextReminder.type,
                subject,
                status: 'sent',
            })

            sent++
        } catch (err) {
            dbLogger.error(`Cart recovery error for intent ${intent.id}`, err)
            errors++
        }
    }

    return { sent, errors }
}
