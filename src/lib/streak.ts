/**
 * Reading streak as the learner should see it.
 *
 * update_user_streak() counts days with the database's CURRENT_DATE (UTC), so the same
 * day is used here. The stored current_streak only changes when the learner is active
 * again, so after a missed day it still holds the old number: anything older than
 * yesterday is a streak that already broke and shows as 0.
 */
export interface StreakRow {
    current_streak?: number | null
    last_activity_date?: string | null
}

export function streakDay(date: Date = new Date()): string {
    return date.toISOString().slice(0, 10)
}

export function previousDay(day: string): string {
    const date = new Date(`${day}T00:00:00Z`)
    date.setUTCDate(date.getUTCDate() - 1)
    return streakDay(date)
}

export function liveStreak(row: StreakRow | null | undefined, today: string = streakDay()) {
    const last = row?.last_activity_date ?? null
    const activeToday = last === today
    const alive = activeToday || last === previousDay(today)
    const current = alive ? Math.max(0, row?.current_streak ?? 0) : 0
    // Worth a warning only for a real streak (2+ days) that ends tonight.
    return { current, activeToday, atRisk: !activeToday && alive && current >= 2 }
}

/** «يوم واحد / يومين / 3 أيام / 14 يوم» */
export function daysWord(n: number): string {
    if (n === 1) return 'يوم واحد'
    if (n === 2) return 'يومين'
    return `${n} ${n >= 3 && n <= 10 ? 'أيام' : 'يوم'}`
}
