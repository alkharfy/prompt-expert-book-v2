// «تحدّي ٣ أيام لايف» — a separate paid product, not part of the subscription (owner, 2026-10-22).
// One cohort a month starting on the 10th, three evenings in a row. The price rises on real dates
// and never resets: the page and the checkout must both read it from here.

export const LIVE_TIME_ZONE = 'Africa/Cairo'
export const LIVE_START_DAY = 10
export const LIVE_DAYS = 3
export const LIVE_START_HOUR = 20 // 8 PM Cairo
export const LIVE_SESSION_HOURS = 2

export type LivePhaseId = 'early' | 'regular' | 'last'

export interface LivePhase {
    id: LivePhaseId
    label: string
    price: number
    /** Cairo day of the cohort month on which this phase starts (early starts when the previous cohort begins). */
    fromDay: number | null
}

/** Owner, 2026-10-22: «اضرب الأسعار في 2» → 599 / 799 / 999 EGP. */
export const LIVE_PHASES: LivePhase[] = [
    { id: 'early', label: 'الحجز المبكر', price: 599, fromDay: null },
    { id: 'regular', label: 'السعر العادي', price: 799, fromDay: 1 },
    { id: 'last', label: 'آخر يومين', price: 999, fromDay: 8 },
]

/** Minutes Cairo is ahead of UTC at a given instant (Egypt has summer time, so this changes). */
function cairoOffsetMinutes(at: Date): number {
    const parts = new Intl.DateTimeFormat('en-US', {
        timeZone: LIVE_TIME_ZONE, hourCycle: 'h23',
        year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit',
    }).formatToParts(at)
    const n = (t: string) => Number(parts.find(p => p.type === t)!.value)
    const asUtc = Date.UTC(n('year'), n('month') - 1, n('day'), n('hour'), n('minute'), n('second'))
    return Math.round((asUtc - Math.floor(at.getTime() / 1000) * 1000) / 60000)
}

/** The UTC instant of a Cairo wall-clock time. `month` is 0-based and may overflow into the next year. */
export function cairoTime(year: number, month: number, day: number, hour = 0): Date {
    const guess = new Date(Date.UTC(year, month, day, hour))
    const first = new Date(guess.getTime() - cairoOffsetMinutes(guess) * 60000)
    // Re-check at the corrected instant in case the guess fell on the other side of a clock change.
    return new Date(guess.getTime() - cairoOffsetMinutes(first) * 60000)
}

function cairoYearMonth(at: Date): { year: number; month: number } {
    const [y, m] = new Intl.DateTimeFormat('en-CA', { timeZone: LIVE_TIME_ZONE, year: 'numeric', month: '2-digit' })
        .format(at).split('-').map(Number)
    return { year: y, month: m - 1 }
}

export interface LiveCohort {
    /** e.g. "2026-11" — stored with each enrollment. */
    id: string
    /** Day 1 session start. Registration stays open until then. */
    startsAt: Date
    sessions: Date[]
}

/** `month` is 0-based and may overflow into the next year. */
function cohortOf(year: number, month: number): LiveCohort {
    const startsAt = cairoTime(year, month, LIVE_START_DAY, LIVE_START_HOUR)
    const sessions = Array.from({ length: LIVE_DAYS }, (_, i) => cairoTime(year, month, LIVE_START_DAY + i, LIVE_START_HOUR))
    const ym = cairoYearMonth(startsAt)
    return { id: `${ym.year}-${String(ym.month + 1).padStart(2, '0')}`, startsAt, sessions }
}

/** The cohort a visitor would join right now: this month's if day 1 hasn't started yet, else next month's. */
export function currentCohort(now: Date = new Date()): LiveCohort {
    let { year, month } = cairoYearMonth(now)
    if (now.getTime() >= cairoTime(year, month, LIVE_START_DAY, LIVE_START_HOUR).getTime()) month += 1
    return cohortOf(year, month)
}

/** A stored cohort id ("2026-11") back to its dates, else null. */
export function cohortById(id: unknown): LiveCohort | null {
    const m = typeof id === 'string' ? id.match(/^(\d{4})-(\d{2})$/) : null
    if (!m || Number(m[2]) < 1 || Number(m[2]) > 12) return null
    return cohortOf(Number(m[1]), Number(m[2]) - 1)
}

/** True from day 1's start until the last session ends. */
export function cohortIsRunning(cohort: LiveCohort, now: Date = new Date()): boolean {
    const end = cohort.sessions[cohort.sessions.length - 1].getTime() + LIVE_SESSION_HOURS * 3600000
    return now.getTime() >= cohort.startsAt.getTime() && now.getTime() < end
}

export interface LivePricing {
    cohort: LiveCohort
    phase: LivePhase
    /** When the current price ends (null on the last phase: it ends when registration closes). */
    phaseEndsAt: Date | null
    next: LivePhase | null
}

export function livePricing(now: Date = new Date()): LivePricing {
    const cohort = currentCohort(now)
    const { year, month } = cairoYearMonth(cohort.startsAt)
    let index = 0
    LIVE_PHASES.forEach((p, i) => {
        if (p.fromDay !== null && now.getTime() >= cairoTime(year, month, p.fromDay).getTime()) index = i
    })
    const next = LIVE_PHASES[index + 1] ?? null
    return {
        cohort,
        phase: LIVE_PHASES[index],
        phaseEndsAt: next?.fromDay != null ? cairoTime(year, month, next.fromDay) : null,
        next,
    }
}

const AR_DIGITS = '٠١٢٣٤٥٦٧٨٩'
export function arabicDigits(value: number | string): string {
    return String(value).replace(/\d/g, d => AR_DIGITS[Number(d)])
}

/** "من ١٠ لـ ١٢ نوفمبر" — words, not a dash: "١٠–١٢" flips to "١٢–١٠" inside right-to-left text. */
export function cohortDatesLabel(cohort: LiveCohort): string {
    const day = (d: Date) => new Intl.DateTimeFormat('ar-EG', { timeZone: LIVE_TIME_ZONE, day: 'numeric' }).format(d)
    const month = new Intl.DateTimeFormat('ar-EG', { timeZone: LIVE_TIME_ZONE, month: 'long' }).format(cohort.startsAt)
    return `من ${day(cohort.sessions[0])} لـ ${day(cohort.sessions[cohort.sessions.length - 1])} ${month}`
}

/** "من ٨ لـ ١٠ بالليل" — the session hours, from LIVE_START_HOUR and LIVE_SESSION_HOURS. */
export function sessionHoursLabel(): string {
    const clock = (h: number) => arabicDigits(((h + 11) % 12) + 1)
    return `من ${clock(LIVE_START_HOUR)} لـ ${clock(LIVE_START_HOUR + LIVE_SESSION_HOURS)} بالليل`
}

/** "١ نوفمبر" — the Cairo date a phase starts on. */
export function cairoDayLabel(at: Date): string {
    return new Intl.DateTimeFormat('ar-EG', { timeZone: LIVE_TIME_ZONE, day: 'numeric', month: 'long' }).format(at)
}

/** plan_id on a `payments` row for the live challenge. Not a subscription plan. */
export const LIVE_PLAN_ID = 'live'

export function liveOrderNotes(cohortId: string, whatsapp: string): string {
    return `live:${cohortId}|wa:${whatsapp}`
}

export function parseLiveOrderNotes(notes: unknown): { cohortId: string; whatsapp: string | null } | null {
    if (typeof notes !== 'string') return null
    const cohort = notes.match(/^live:(\d{4}-\d{2})/)?.[1]
    if (!cohort) return null
    return { cohortId: cohort, whatsapp: notes.match(/\|wa:([^|]+)/)?.[1] ?? null }
}

/** Egyptian mobile in any common spelling → "201XXXXXXXXX", else null. */
export function normalizeEgyptMobile(raw: unknown): string | null {
    if (typeof raw !== 'string') return null
    const western = raw.replace(/[٠-٩]/g, d => String(AR_DIGITS.indexOf(d))).replace(/[^\d+]/g, '')
    const digits = western.replace(/^\+/, '').replace(/^0020/, '20')
    // "+20 010…" keeps the local 0 after the country code; drop it either way.
    const local = (digits.startsWith('20') ? digits.slice(2) : digits).replace(/^0/, '')
    return /^1[0125]\d{8}$/.test(local) ? `20${local}` : null
}
