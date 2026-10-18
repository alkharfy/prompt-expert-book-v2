import { SECTION_REGISTRY } from '@/config/sections'

/**
 * «الناس بتقف فين؟» — pure aggregation for the admin funnel page.
 * Works only on registered users (guests are not in the database; see Google Analytics for them).
 * Returns counts only, never emails or names.
 */

export interface FunnelInput {
    users: { id: string; created_at: string; is_admin?: boolean | null }[]
    preferences: { user_id: string; onboarding_status: string | null; profession: string | null }[]
    progress: { user_id: string; current_page: number; completed_chapters: string[] | null; updated_at: string }[]
    intents: { user_id: string }[]
    payments: { user_id: string; status: string }[]
}

export interface FunnelStep { id: string; label: string; count: number }
export interface StopRow { where: string; count: number }

export interface FunnelReport {
    steps: FunnelStep[]
    stoppedAt: StopRow[]
    professions: StopRow[]
    payments: { success: number; pending: number; failed: number; other: number }
}

const PAID = new Set(['success', 'paid', 'completed'])
/** No reading for this long = the reader stopped there. */
export const STALE_DAYS = 7

/** Global page → «التمهيد · صفحة 2» / «المستوى ١ · صفحة 5» using the reserved slots. */
export function describeGlobalPage(page: number): string {
    if (!page || page < 1) return 'لسه مابدأش يقرا'
    for (const section of SECTION_REGISTRY) {
        if (page > section.progressOffset && page <= section.progressOffset + section.slotSize) {
            const local = Math.min(page - section.progressOffset, section.pageCount)
            return `${section.chapterLabel} · صفحة ${local}`
        }
    }
    return `صفحة ${page}`
}

const PROFESSION_AR: Record<string, string> = {
    accounting: 'محاسبة', sales_service: 'مبيعات وخدمة عملاء', hr_admin: 'HR وإدارة', teaching: 'تدريس',
    marketing_business: 'تسويق وبيزنس', programmer: 'برمجة', student: 'طالب', other: 'تاني',
}

export function buildFunnelReport(input: FunnelInput, now = new Date()): FunnelReport {
    const users = input.users.filter(u => !u.is_admin)
    const ids = new Set(users.map(u => u.id))
    const prefs = new Map(input.preferences.filter(p => ids.has(p.user_id)).map(p => [p.user_id, p]))
    const progress = new Map(input.progress.filter(p => ids.has(p.user_id)).map(p => [p.user_id, p]))
    const introDone = (p: FunnelInput['progress'][number]) =>
        (p.completed_chapters || []).includes('0') || p.current_page >= SECTION_REGISTRY[0].pageCount
    const level1 = SECTION_REGISTRY[1]

    const onboarded = users.filter(u => ['completed', 'skipped'].includes(prefs.get(u.id)?.onboarding_status || '')).length
    const reading = users.filter(u => (progress.get(u.id)?.current_page || 0) >= 1).length
    const finishedIntro = users.filter(u => { const p = progress.get(u.id); return !!p && introDone(p) }).length
    const inLevel1 = users.filter(u => (progress.get(u.id)?.current_page || 0) > level1.progressOffset).length
    const sawPayment = new Set(input.intents.filter(i => ids.has(i.user_id)).map(i => i.user_id)).size
    const tried = new Set(input.payments.filter(p => ids.has(p.user_id)).map(p => p.user_id)).size
    const paid = new Set(input.payments.filter(p => ids.has(p.user_id) && PAID.has(p.status)).map(p => p.user_id)).size

    const steps: FunnelStep[] = [
        { id: 'signed_up', label: 'سجّل حساب', count: users.length },
        { id: 'onboarded', label: 'جاوب أسئلة البداية', count: onboarded },
        { id: 'reading', label: 'بدأ يقرا', count: reading },
        { id: 'intro_done', label: 'خلّص التمهيد (3 صفحات)', count: finishedIntro },
        { id: 'level1', label: 'وصل للمستوى ١ أو بعده', count: inLevel1 },
        { id: 'payment_page', label: 'فتح صفحة الدفع', count: sawPayment },
        { id: 'checkout', label: 'بدأ يدفع', count: tried },
        { id: 'paid', label: 'دفع فعلاً', count: paid },
    ]

    const staleBefore = now.getTime() - STALE_DAYS * 86_400_000
    const stops = new Map<string, number>()
    for (const u of users) {
        const p = progress.get(u.id)
        if (p && new Date(p.updated_at).getTime() > staleBefore) continue // still reading
        const where = describeGlobalPage(p?.current_page || 0)
        stops.set(where, (stops.get(where) || 0) + 1)
    }
    const stoppedAt = [...stops].map(([where, count]) => ({ where, count })).sort((a, b) => b.count - a.count)

    const prof = new Map<string, number>()
    for (const u of users) {
        const key = prefs.get(u.id)?.profession || ''
        const label = key ? (PROFESSION_AR[key] || key) : 'ماجاوبش'
        prof.set(label, (prof.get(label) || 0) + 1)
    }
    const professions = [...prof].map(([where, count]) => ({ where, count })).sort((a, b) => b.count - a.count)

    const payments = { success: 0, pending: 0, failed: 0, other: 0 }
    for (const p of input.payments.filter(p => ids.has(p.user_id))) {
        if (PAID.has(p.status)) payments.success++
        else if (p.status === 'pending') payments.pending++
        else if (p.status === 'failed') payments.failed++
        else payments.other++
    }
    return { steps, stoppedAt, professions, payments }
}
