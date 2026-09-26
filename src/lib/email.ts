// Email Service — محرك الإيميلات باستخدام Resend
// المرحلة 3: نظام التذكيرات بالإيميل

import 'server-only'
import { Resend } from 'resend'
import { getSupabaseAdmin } from '@/lib/supabase-admin'
import { dbLogger } from './logger'
import { SITE_URL, SITE_DOMAIN, EMAIL_FROM_DEFAULT } from '@/lib/config'

let _resend: Resend | null = null
function getResend(): Resend {
    if (!_resend) {
        const apiKey = process.env.RESEND_API_KEY
        if (!apiKey) {
            throw new Error('RESEND_API_KEY environment variable is not set')
        }
        _resend = new Resend(apiKey)
    }
    return _resend
}

const FROM_EMAIL = EMAIL_FROM_DEFAULT
const APP_URL = SITE_URL

/**
 * SECURITY: Escape HTML special characters to prevent injection in email templates
 */
function escapeHtml(text: string): string {
    return text
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;')
}

function getServiceClient() {
    return getSupabaseAdmin()
}

// =====================================================
// Types
// =====================================================

export interface UserEmailInfo {
    id: string
    email: string
    full_name: string
    current_streak?: number
    longest_streak?: number
    total_points?: number
    chapters_completed?: number
    last_activity_date?: string | null
}

export interface MilestoneInfo {
    type: 'chapter' | 'achievement' | 'level' | 'certificate'
    title: string
    description: string
    icon: string
    points?: number
}

// =====================================================
// Base Email Layout (HTML)
// =====================================================

function baseLayout(content: string, unsubscribeToken: string, unsubscribeType: string = 'all'): string {
    const unsubscribeUrl = `${APP_URL}/unsubscribe?token=${encodeURIComponent(unsubscribeToken)}&type=${encodeURIComponent(unsubscribeType)}`
    return `<!DOCTYPE html>
<html dir="rtl" lang="ar">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<style>
body { margin: 0; padding: 0; background-color: #050505; color: #e0e0e0; font-family: 'Tajawal', 'Cairo', Arial, sans-serif; direction: rtl; }
.container { max-width: 600px; margin: 0 auto; padding: 30px 20px; }
.header { text-align: center; margin-bottom: 30px; }
.header h1 { color: #FF6B35; font-size: 24px; margin: 0; }
.header .subtitle { color: #888; font-size: 14px; margin-top: 8px; }
.card { background: #111; border: 1px solid rgba(255,107,53,0.2); border-radius: 12px; padding: 24px; margin-bottom: 20px; }
.card h2 { color: #FF6B35; font-size: 20px; margin: 0 0 16px 0; }
.card p { color: #ccc; font-size: 15px; line-height: 1.7; margin: 8px 0; }
.btn { display: inline-block; background: #FF6B35; color: #fff !important; text-decoration: none; padding: 12px 28px; border-radius: 8px; font-size: 16px; font-weight: bold; margin-top: 16px; }
.btn:hover { background: #e55a2b; }
.stats { display: flex; justify-content: center; gap: 24px; margin: 20px 0; text-align: center; }
.stat { flex: 1; }
.stat .num { font-size: 28px; font-weight: bold; color: #FF6B35; }
.stat .label { font-size: 12px; color: #888; margin-top: 4px; }
.footer { text-align: center; margin-top: 40px; padding-top: 20px; border-top: 1px solid rgba(255,255,255,0.1); }
.footer p { color: #555; font-size: 12px; margin: 4px 0; }
.footer a { color: #FF6B35; text-decoration: none; }
.divider { border: none; border-top: 1px solid rgba(255,107,53,0.15); margin: 20px 0; }
.emoji-large { font-size: 48px; display: block; text-align: center; margin: 16px 0; }
</style>
</head>
<body>
<div class="container">
    <div class="header">
        <h1>🤖 PromptMaster</h1>
        <div class="subtitle">رحلتك نحو احتراف الذكاء الاصطناعي</div>
    </div>
    ${content}
    <div class="footer">
        <p><a href="${APP_URL}">PromptMaster — ${SITE_DOMAIN}</a></p>
        <p><a href="${unsubscribeUrl}">إلغاء الاشتراك</a> | <a href="${APP_URL}/profile">إدارة التفضيلات</a></p>
    </div>
</div>
</body>
</html>`
}

// =====================================================
// Email Sending Functions
// =====================================================

/**
 * تذكير بسلسلة القراءة — يُرسَل عند streak >= 3 + لا نشاط اليوم
 */
export async function sendStreakReminder(user: UserEmailInfo, unsubscribeToken: string): Promise<boolean> {
    const subject = `🔥 سلسلتك ${user.current_streak} أيام — لا تخليها تنكسر!`
    const content = `
        <div class="card">
            <span class="emoji-large">😰</span>
            <h2>سلسلتك في خطر!</h2>
            <p>يا <strong>${escapeHtml(user.full_name)}</strong>، أنت عندك سلسلة قراءة <strong>${user.current_streak} أيام</strong> متتالية! لا تخليها تنكسر النهاردة.</p>
            <p>5 دقايق بس — اقرأ صفحة واحدة وحافظ على السلسلة 💪</p>
            <hr class="divider">
            <div style="text-align: center;">
                <a href="${APP_URL}/toc" class="btn">ارجع أكمل ←</a>
            </div>
        </div>`
    
    return await sendEmail(user, subject, content, 'streak_reminder', unsubscribeToken)
}

/**
 * تذكير بالمهام اليومية — يُرسَل عند مهام 0/3 بعد الساعة 4 مساءً
 */
export async function sendMissionReminder(user: UserEmailInfo, unsubscribeToken: string): Promise<boolean> {
    const subject = `🎯 عندك 3 مهام مستنياك — 10 دقايق بس!`
    const content = `
        <div class="card">
            <span class="emoji-large">🎯</span>
            <h2>المهام اليومية مستنياك!</h2>
            <p>يا <strong>${escapeHtml(user.full_name)}</strong>، عندك 3 مهام يومية جديدة. خلّصهم في أقل من 10 دقايق واكسب نقاط إضافية!</p>
            <p>🏆 إكمال كل المهام = <strong>+50 نقطة bonus</strong></p>
            <hr class="divider">
            <div style="text-align: center;">
                <a href="${APP_URL}/toc" class="btn">ابدأ دلوقتي ←</a>
            </div>
        </div>`
    
    return await sendEmail(user, subject, content, 'mission_reminder', unsubscribeToken)
}

/**
 * الملخص الأسبوعي — يُرسَل كل جمعة
 */
export async function sendWeeklyRecap(
    user: UserEmailInfo, 
    weeklyStats: { pages: number; exercises: number; points: number; streak: number },
    unsubscribeToken: string
): Promise<boolean> {
    const subject = `📊 ملخصك الأسبوعي — قرأت ${weeklyStats.pages} صفحة وكسبت ${weeklyStats.points} نقطة!`
    const content = `
        <div class="card">
            <span class="emoji-large">📊</span>
            <h2>ملخصك الأسبوعي</h2>
            <p>يا <strong>${escapeHtml(user.full_name)}</strong>، ده اللي حققته الأسبوع ده:</p>
            <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
                <tr>
                    <td style="text-align: center; padding: 12px;">
                        <div style="font-size: 28px; font-weight: bold; color: #FF6B35;">${weeklyStats.pages}</div>
                        <div style="font-size: 12px; color: #888;">📖 صفحة</div>
                    </td>
                    <td style="text-align: center; padding: 12px;">
                        <div style="font-size: 28px; font-weight: bold; color: #FF6B35;">${weeklyStats.exercises}</div>
                        <div style="font-size: 12px; color: #888;">✏️ تمرين</div>
                    </td>
                    <td style="text-align: center; padding: 12px;">
                        <div style="font-size: 28px; font-weight: bold; color: #FF6B35;">${weeklyStats.points}</div>
                        <div style="font-size: 12px; color: #888;">⭐ نقطة</div>
                    </td>
                    <td style="text-align: center; padding: 12px;">
                        <div style="font-size: 28px; font-weight: bold; color: #FF6B35;">${weeklyStats.streak}</div>
                        <div style="font-size: 12px; color: #888;">🔥 أيام streak</div>
                    </td>
                </tr>
            </table>
            ${weeklyStats.pages > 0 ? '<p>🎉 أداء ممتاز! استمر كده والأسبوع الجاي يبقى أحسن.</p>' : '<p>💪 الأسبوع الجاي إن شاء الله أحسن! ابدأ بصفحة واحدة بس.</p>'}
            <hr class="divider">
            <div style="text-align: center;">
                <a href="${APP_URL}/toc" class="btn">أكمل القراءة ←</a>
            </div>
        </div>`
    
    return await sendEmail(user, subject, content, 'weekly_recap', unsubscribeToken)
}

/**
 * إيميل تهنئة بإنجاز — يُرسَل عند إكمال فصل / إنجاز / مستوى جديد
 */
export async function sendMilestoneEmail(
    user: UserEmailInfo, 
    milestone: MilestoneInfo,
    unsubscribeToken: string
): Promise<boolean> {
    const subject = `🏆 مبروك! ${milestone.title}`
    const content = `
        <div class="card">
            <span class="emoji-large">${milestone.icon}</span>
            <h2>مبروك يا ${escapeHtml(user.full_name)}! 🎉</h2>
            <p style="font-size: 18px; text-align: center; color: #FF6B35;">${milestone.title}</p>
            <p style="text-align: center;">${milestone.description}</p>
            ${milestone.points ? `<p style="text-align: center; font-size: 20px; color: #FF6B35;">+${milestone.points} نقطة ⭐</p>` : ''}
            <hr class="divider">
            <div style="text-align: center;">
                <a href="${APP_URL}/achievements" class="btn">شوف إنجازاتك ←</a>
            </div>
        </div>`
    
    return await sendEmail(user, subject, content, 'milestone', unsubscribeToken)
}

/**
 * إيميل ترحيب — يُرسَل بعد التسجيل
 */
export async function sendWelcomeEmail(user: UserEmailInfo, unsubscribeToken: string): Promise<boolean> {
    const subject = `🚀 أهلاً بيك في PromptMaster!`
    const content = `
        <div class="card">
            <span class="emoji-large">🚀</span>
            <h2>أهلاً بيك يا ${escapeHtml(user.full_name)}!</h2>
            <p>مبروك! بدأت رحلتك في عالم البرومبتات والذكاء الاصطناعي.</p>
            <hr class="divider">
            <h3 style="color: #FF6B35;">🗺️ خطوات البداية:</h3>
            <p>1️⃣ ابدأ بقراءة المقدمة — مجانية وبتشرح كل حاجة</p>
            <p>2️⃣ جرّب التمارين التفاعلية بعد كل درس</p>
            <p>3️⃣ تابع المهام اليومية واكسب نقاط</p>
            <p>4️⃣ شارك إنجازاتك مع أصحابك!</p>
            <hr class="divider">
            <div style="text-align: center;">
                <a href="${APP_URL}/read/intro/1" class="btn">ابدأ القراءة ←</a>
            </div>
        </div>`
    
    return await sendEmail(user, subject, content, 'welcome', unsubscribeToken)
}

/**
 * تذكير يومي بخطة التعلم — يُرسَل صباحاً لأصحاب الخطة الزمنية
 */
export async function sendPlanDailyReminder(
    user: UserEmailInfo,
    planInfo: { dayNumber: number; totalDays: number; readingTask: string; exerciseTask?: string },
    unsubscribeToken: string
): Promise<boolean> {
    const progressPercent = Math.round((planInfo.dayNumber / planInfo.totalDays) * 100)
    const subject = `📅 يوم ${planInfo.dayNumber} — مهمتك اليوم جاهزة!`
    const content = `
        <div class="card">
            <span class="emoji-large">📅</span>
            <h2>يوم ${planInfo.dayNumber} من ${planInfo.totalDays}</h2>
            <div style="background: rgba(255,255,255,0.05); border-radius: 8px; padding: 4px; margin: 16px 0;">
                <div style="background: linear-gradient(90deg, #FF6B35, #ff8f5e); height: 8px; border-radius: 8px; width: ${progressPercent}%;"></div>
            </div>
            <p style="text-align: center; color: #FF6B35; font-size: 14px;">${progressPercent}% مكتمل</p>

            <p>يا <strong>${escapeHtml(user.full_name)}</strong>، مهامك اليوم:</p>
            <p>📖 <strong>${escapeHtml(planInfo.readingTask)}</strong></p>
            ${planInfo.exerciseTask ? `<p>✏️ <strong>${escapeHtml(planInfo.exerciseTask)}</strong></p>` : ''}
            <hr class="divider">
            <div style="text-align: center;">
                <a href="${APP_URL}/my-plan" class="btn">افتح خطتك ←</a>
            </div>
        </div>`
    
    return await sendEmail(user, subject, content, 'plan_daily', unsubscribeToken)
}

/**
 * تقرير أسبوعي للخطة — يُرسَل مع الملخص الأسبوعي
 */
export async function sendPlanWeeklyReport(
    user: UserEmailInfo,
    planStats: { completedDays: number; totalDays: number; daysThisWeek: number; progressPercent: number },
    unsubscribeToken: string
): Promise<boolean> {
    const subject = `📊 تقرير خطتك — أنجزت ${planStats.daysThisWeek}/7 أيام هذا الأسبوع`
    const emoji = planStats.daysThisWeek >= 5 ? '🏆' : planStats.daysThisWeek >= 3 ? '💪' : '🌱'
    const message = planStats.daysThisWeek >= 5
        ? 'أداء ممتاز! استمر كده 🔥'
        : planStats.daysThisWeek >= 3
        ? 'أداء كويس! حاول تزود يوم الأسبوع الجاي'
        : 'اشتقنالك! جهزنالك ملخص اللي فاتك'
    
    const content = `
        <div class="card">
            <span class="emoji-large">${emoji}</span>
            <h2>تقرير خطتك الأسبوعي</h2>
            <p>يا <strong>${escapeHtml(user.full_name)}</strong>،</p>
            <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
                <tr>
                    <td style="text-align: center; padding: 12px;">
                        <div style="font-size: 28px; font-weight: bold; color: #FF6B35;">${planStats.daysThisWeek}/7</div>
                        <div style="font-size: 12px; color: #888;">📅 أيام هذا الأسبوع</div>
                    </td>
                    <td style="text-align: center; padding: 12px;">
                        <div style="font-size: 28px; font-weight: bold; color: #FF6B35;">${planStats.completedDays}/${planStats.totalDays}</div>
                        <div style="font-size: 12px; color: #888;">✅ إجمالي التقدم</div>
                    </td>
                    <td style="text-align: center; padding: 12px;">
                        <div style="font-size: 28px; font-weight: bold; color: #FF6B35;">${planStats.progressPercent}%</div>
                        <div style="font-size: 12px; color: #888;">📈 مكتمل</div>
                    </td>
                </tr>
            </table>
            <p style="text-align: center;">${message}</p>
            <hr class="divider">
            <div style="text-align: center;">
                <a href="${APP_URL}/my-plan" class="btn">شوف خطتك ←</a>
            </div>
        </div>`
    
    return await sendEmail(user, subject, content, 'plan_weekly', unsubscribeToken)
}

/**
 * إيميل إنجاز الخطة — يُرسَل عند إكمال كل المهام
 */
export async function sendPlanCompletionEmail(
    user: UserEmailInfo,
    unsubscribeToken: string
): Promise<boolean> {
    const subject = `🎉 مبروك! أنهيت خطة التعلم بتاعتك!`
    const content = `
        <div class="card">
            <span class="emoji-large">🎉</span>
            <h2>مبروك يا ${escapeHtml(user.full_name)}!</h2>
            <p style="font-size: 18px; text-align: center; color: #FF6B35;">أنهيت خطة التعلم بتاعتك بنجاح!</p>
            <p style="text-align: center;">أنت من القليلين اللي خلّصوا الخطة كاملة. افتخر بإنجازك ده وشاركه مع أصحابك!</p>
            <hr class="divider">
            <div style="text-align: center;">
                <a href="${APP_URL}/certificate" class="btn">خد شهادتك ←</a>
            </div>
        </div>`
    
    return await sendEmail(user, subject, content, 'plan_completion', unsubscribeToken)
}

// =====================================================
// Core Helper — Send Email via Resend + Log
// =====================================================

async function sendEmail(
    user: UserEmailInfo,
    subject: string,
    htmlContent: string,
    emailType: string,
    unsubscribeToken: string
): Promise<boolean> {
    const supabase = getServiceClient()
    const fullHtml = baseLayout(htmlContent, unsubscribeToken, emailType === 'streak_reminder' ? 'streak' : emailType === 'mission_reminder' ? 'missions' : emailType === 'weekly_recap' ? 'recap' : 'all')
    
    try {
        const { error } = await getResend().emails.send({
            from: FROM_EMAIL,
            to: user.email,
            subject,
            html: fullHtml,
        })

        if (error) {
            dbLogger.error(`Failed to send ${emailType} email to ${user.id}`, error)
            // Log failure
            await supabase.from('email_log').insert({
                user_id: user.id,
                email_type: emailType,
                subject,
                status: 'failed',
            })
            return false
        }

        // Log success
        const { error: logError } = await supabase.from('email_log').insert({
            user_id: user.id,
            email_type: emailType,
            subject,
            status: 'sent',
        })
        if (logError) {
            dbLogger.error(`Failed to log sent email for ${user.id}`, logError)
        }

        // Update preferences tracking — atomic increment via RPC-style raw update
        // Avoid read-then-write race condition by using SQL increment
        const { error: updateError } = await supabase.rpc('increment_email_sent', { p_user_id: user.id })
        if (updateError) {
            // Fallback: simple update without increment if RPC doesn't exist
            await supabase
                .from('email_preferences')
                .update({
                    last_email_sent_at: new Date().toISOString(),
                    updated_at: new Date().toISOString(),
                })
                .eq('user_id', user.id)
        }

        dbLogger.info(`Sent ${emailType} email to ${user.id}`)
        return true
    } catch (error) {
        dbLogger.error(`Error sending ${emailType} email`, error)
        return false
    }
}

// =====================================================
// Helper: Ensure email preferences exist for user
// =====================================================

export async function ensureEmailPreferences(userId: string): Promise<void> {
    const supabase = getServiceClient()
    const { data } = await supabase
        .from('email_preferences')
        .select('id')
        .eq('user_id', userId)
        .maybeSingle()
    
    if (!data) {
        await supabase.from('email_preferences').insert({ user_id: userId })
    }
}

// =====================================================
// Helper: Get weekly stats for a user
// =====================================================

export async function getWeeklyStats(userId: string): Promise<{ pages: number; exercises: number; points: number; streak: number }> {
    const supabase = getServiceClient()
    const oneWeekAgo = new Date()
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7)
    const weekAgoStr = oneWeekAgo.toISOString()

    // Get reading progress this week
    const { data: readingData } = await supabase
        .from('reading_progress')
        .select('page_number')
        .eq('user_id', userId)
        .gte('created_at', weekAgoStr)

    // Get exercises this week
    const { data: exerciseData } = await supabase
        .from('exercise_progress')
        .select('id')
        .eq('user_id', userId)
        .eq('is_completed', true)
        .gte('completed_at', weekAgoStr)

    // Get points this week
    const { data: pointsData } = await supabase
        .from('points_history')
        .select('points')
        .eq('user_id', userId)
        .gte('created_at', weekAgoStr)

    // Get current streak
    const { data: gamData } = await supabase
        .from('user_gamification')
        .select('current_streak')
        .eq('user_id', userId)
        .single()

    const totalPoints = (pointsData || []).reduce((sum: number, p: { points: number }) => sum + p.points, 0)

    return {
        pages: readingData?.length || 0,
        exercises: exerciseData?.length || 0,
        points: totalPoints,
        streak: (gamData as { current_streak: number } | null)?.current_streak || 0,
    }
}
