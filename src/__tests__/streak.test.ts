import { describe, expect, it } from 'vitest'
import { daysWord, liveStreak, previousDay } from '@/lib/streak'

const TODAY = '2026-10-19'

describe('reading streak as the learner sees it', () => {
    it('knows the day before, across months', () => {
        expect(previousDay(TODAY)).toBe('2026-10-18')
        expect(previousDay('2026-11-01')).toBe('2026-10-31')
    })

    it('keeps a streak that was active today or yesterday', () => {
        expect(liveStreak({ current_streak: 5, last_activity_date: TODAY }, TODAY)).toEqual({ current: 5, activeToday: true, atRisk: false })
        expect(liveStreak({ current_streak: 5, last_activity_date: '2026-10-18' }, TODAY)).toEqual({ current: 5, activeToday: false, atRisk: true })
    })

    it('shows 0 once a day was missed, even though the row still holds the old number', () => {
        expect(liveStreak({ current_streak: 9, last_activity_date: '2026-10-12' }, TODAY)).toEqual({ current: 0, activeToday: false, atRisk: false })
        expect(liveStreak(null, TODAY)).toEqual({ current: 0, activeToday: false, atRisk: false })
    })

    it('does not warn about a one-day streak', () => {
        expect(liveStreak({ current_streak: 1, last_activity_date: '2026-10-18' }, TODAY).atRisk).toBe(false)
    })

    it('says days in Egyptian', () => {
        expect([1, 2, 3, 10, 14].map(daysWord)).toEqual(['يوم واحد', 'يومين', '3 أيام', '10 أيام', '14 يوم'])
    })
})
