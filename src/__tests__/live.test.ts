import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const h = vi.hoisted(() => ({ upsert: vi.fn(), maybeSingle: vi.fn(), auth: vi.fn(), alert: vi.fn() }))
vi.mock('server-only', () => ({}))
vi.mock('@/lib/alert', () => ({ alertMoneyPath: h.alert }))
vi.mock('@/lib/logger', () => ({ dbLogger: { error: vi.fn(), info: vi.fn() } }))
vi.mock('@/lib/auth-middleware', () => ({ getAuthenticatedUser: h.auth }))
vi.mock('@/lib/supabase-admin', () => {
    const query = { select: () => query, eq: () => query, order: () => query, limit: () => query, maybeSingle: h.maybeSingle }
    return { getSupabaseAdmin: () => ({ from: () => ({ ...query, upsert: h.upsert }) }) }
})

import {
    cairoTime, cohortById, cohortDatesLabel, cohortIsRunning, currentCohort, liveOrderNotes, livePricing,
    normalizeEgyptMobile, parseLiveOrderNotes, sessionHoursLabel,
} from '@/lib/live'
import { activateLiveEnrollment } from '@/lib/live-enrollment'
import { GET as liveStatus } from '@/app/api/live/status/route'
import { PLAN_IDS } from '@/types/subscription'

const at = (iso: string) => new Date(iso)

describe('تحدّي ٣ أيام لايف', () => {
    it('Cairo wall time follows Egypt summer time', () => {
        expect(cairoTime(2026, 10, 10, 20).toISOString()).toBe('2026-11-10T18:00:00.000Z') // winter, UTC+2
        expect(cairoTime(2026, 6, 10, 20).toISOString()).toBe('2026-07-10T17:00:00.000Z') // summer, UTC+3
    })

    it('joins this month until day 1 starts, then next month', () => {
        expect(currentCohort(at('2026-10-22T12:00:00Z')).id).toBe('2026-11')
        expect(currentCohort(at('2026-11-10T17:59:00Z')).id).toBe('2026-11')
        expect(currentCohort(at('2026-11-10T18:00:00Z')).id).toBe('2026-12')
        expect(currentCohort(at('2026-12-31T23:00:00Z')).id).toBe('2027-01')
    })

    it('has three evening sessions in a row', () => {
        const c = currentCohort(at('2026-10-22T12:00:00Z'))
        expect(c.sessions.map(d => d.toISOString())).toEqual([
            '2026-11-10T18:00:00.000Z', '2026-11-11T18:00:00.000Z', '2026-11-12T18:00:00.000Z',
        ])
        expect(cohortDatesLabel(c)).toBe('من ١٠ لـ ١٢ نوفمبر')
        expect(sessionHoursLabel()).toBe('من ٨ لـ ١٠ بالليل')
    })

    it('rebuilds a stored cohort id and knows when it is running', () => {
        const nov = cohortById('2026-11')!
        expect(nov.startsAt.toISOString()).toBe('2026-11-10T18:00:00.000Z')
        expect(cohortById('2026-12')!.id).toBe('2026-12')
        for (const bad of ['2026-13', '2026-00', 'live:2026-11', null]) expect(cohortById(bad)).toBeNull()
        expect(cohortIsRunning(nov, at('2026-11-10T17:59:00Z'))).toBe(false)
        expect(cohortIsRunning(nov, at('2026-11-11T12:00:00Z'))).toBe(true)
        expect(cohortIsRunning(nov, at('2026-11-12T19:59:00Z'))).toBe(true)
        expect(cohortIsRunning(nov, at('2026-11-12T20:00:00Z'))).toBe(false)
    })

    it('price rises on fixed Cairo dates and never resets inside a cohort', () => {
        const p = (iso: string) => livePricing(at(iso))
        expect(p('2026-10-22T12:00:00Z').phase.price).toBe(599)
        expect(p('2026-10-22T12:00:00Z').phaseEndsAt?.toISOString()).toBe('2026-10-31T22:00:00.000Z')
        expect(p('2026-10-31T21:59:00Z').phase.price).toBe(599)
        expect(p('2026-10-31T22:00:00Z').phase.price).toBe(799)
        expect(p('2026-11-07T22:00:00Z').phase.price).toBe(999)
        expect(p('2026-11-07T22:00:00Z').next).toBeNull()
        // Right after day 1 starts, the next cohort opens at the early price.
        expect(p('2026-11-10T18:00:00Z').phase.price).toBe(599)
    })
})

describe('حجز التحدّي', () => {
    it('accepts Egyptian mobiles in every common spelling', () => {
        for (const raw of ['01012345678', '+201012345678', '00201012345678', '0101 234 5678', '٠١٠١٢٣٤٥٦٧٨', '1012345678', '+20 01012345678']) {
            expect(normalizeEgyptMobile(raw)).toBe('201012345678')
        }
        for (const raw of ['0101234567', '01312345678', '0221234567', '', null, 'abc']) {
            expect(normalizeEgyptMobile(raw)).toBeNull()
        }
    })

    it('keeps cohort and WhatsApp on the payment row', () => {
        expect(parseLiveOrderNotes(liveOrderNotes('2026-11', '201012345678'))).toEqual({ cohortId: '2026-11', whatsapp: '201012345678' })
        expect(parseLiveOrderNotes('upgrade:basic->pro|diff:100')).toBeNull()
        expect(parseLiveOrderNotes(null)).toBeNull()
    })

    it('payments.plan_id check allows every plan checkout can write, plus live', () => {
        const sql = readFileSync(join(process.cwd(), 'supabase/migrations/20261023_payments_plan_check.sql'), 'utf8')
        for (const plan of [...PLAN_IDS, 'live']) expect(sql).toContain(`'${plan}'`)
    })
})

describe('activateLiveEnrollment', () => {
    const payment = { user_id: 'u1', amount: '599.00', notes: liveOrderNotes('2026-11', '201012345678') }
    beforeEach(() => vi.clearAllMocks())

    it('writes one seat keyed on the payment, never a subscription', async () => {
        h.upsert.mockResolvedValue({ error: null })
        expect(await activateLiveEnrollment('u1', 'p1', payment, 'webhook')).toEqual({ ok: true, activated: true })
        expect(h.upsert).toHaveBeenCalledWith(
            { user_id: 'u1', cohort_id: '2026-11', payment_id: 'p1', amount: 599, whatsapp: '201012345678' },
            { onConflict: 'payment_id', ignoreDuplicates: true },
        )
        expect(h.alert).not.toHaveBeenCalled()
    })

    it('a second paid order for the same cohort keeps the seat and alerts for a refund', async () => {
        h.upsert.mockResolvedValue({ error: { code: '23505', message: 'duplicate' } })
        expect(await activateLiveEnrollment('u1', 'p2', payment, 'webhook')).toEqual({ ok: true, activated: false, alreadyActive: true })
        expect(h.alert).toHaveBeenCalledWith('live_paid_twice', expect.objectContaining({ paymentId: 'p2', cohort: '2026-11' }))
    })

    it('fails loudly on other DB errors and on missing notes', async () => {
        h.upsert.mockResolvedValue({ error: { code: '500', message: 'down' } })
        expect(await activateLiveEnrollment('u1', 'p3', payment, 'webhook')).toEqual({ ok: false, error: 'live_enrollment_failed' })
        expect(h.alert).toHaveBeenCalledWith('live_enrollment_failed', expect.anything())
        expect(await activateLiveEnrollment('u1', 'p4', { ...payment, notes: null }, 'webhook')).toEqual({ ok: false, error: 'live_notes_missing' })
        expect(h.upsert).toHaveBeenCalledTimes(1)
    })
})

describe('GET /api/live/status', () => {
    beforeEach(() => { vi.clearAllMocks(); vi.useFakeTimers() })
    afterEach(() => vi.useRealTimers())

    it('still finds a November seat while November is running (booking has moved to December)', async () => {
        vi.setSystemTime(at('2026-11-11T19:00:00Z'))
        h.auth.mockResolvedValue('u1')
        h.maybeSingle.mockResolvedValue({ data: { cohort_id: '2026-11' }, error: null })
        const body = await (await liveStatus()).json()
        expect(body.cohortId).toBe('2026-12')
        expect(body.enrolled).toBe(false)
        expect(body.seat).toMatchObject({ cohortId: '2026-11', running: true, dates: 'من ١٠ لـ ١٢ نوفمبر' })
    })

    it('reports a seat in the open cohort as enrolled', async () => {
        vi.setSystemTime(at('2026-10-23T12:00:00Z'))
        h.auth.mockResolvedValue('u1')
        h.maybeSingle.mockResolvedValue({ data: { cohort_id: '2026-11' }, error: null })
        const body = await (await liveStatus()).json()
        expect(body).toMatchObject({ enrolled: true, seat: { cohortId: '2026-11', running: false }, price: 599 })
    })

    it('answers 500 instead of "no seat" when the lookup fails', async () => {
        h.auth.mockResolvedValue('u1')
        h.maybeSingle.mockResolvedValue({ data: null, error: { message: 'down' } })
        expect((await liveStatus()).status).toBe(500)
    })

    it('a visitor gets prices and no seat', async () => {
        h.auth.mockResolvedValue(null)
        const body = await (await liveStatus()).json()
        expect(body).toMatchObject({ loggedIn: false, enrolled: false, seat: null })
        expect(h.maybeSingle).not.toHaveBeenCalled()
    })
})
