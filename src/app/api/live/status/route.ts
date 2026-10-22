import { NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase-admin'
import { dbLogger } from '@/lib/logger'
import { getAuthenticatedUser } from '@/lib/auth-middleware'
import { cohortById, cohortDatesLabel, cohortIsRunning, livePricing } from '@/lib/live'

/**
 * GET: the price and cohort open for booking right now, whether this user has a seat in it,
 * and their latest seat (which may be a cohort that already started — the welcome page needs it).
 */
export async function GET() {
    const { cohort, phase } = livePricing()
    const userId = await getAuthenticatedUser({ skipActiveCheck: true })
    let seat: { cohortId: string; dates: string; startsAt: string; running: boolean } | null = null
    let enrolled = false
    if (userId) {
        const { data, error } = await (getSupabaseAdmin().from('live_enrollments') as any)
            .select('cohort_id').eq('user_id', userId).order('cohort_id', { ascending: false }).limit(1).maybeSingle()
        if (error) {
            dbLogger.error('[live] status lookup failed:', error)
            return NextResponse.json({ error: 'مقدرناش نحمّل حجزك' }, { status: 500 })
        }
        const seatCohort = cohortById(data?.cohort_id)
        if (seatCohort) {
            seat = {
                cohortId: seatCohort.id, dates: cohortDatesLabel(seatCohort),
                startsAt: seatCohort.startsAt.toISOString(), running: cohortIsRunning(seatCohort),
            }
            enrolled = seatCohort.id === cohort.id
        }
    }
    return NextResponse.json({
        loggedIn: !!userId, enrolled, seat, cohortId: cohort.id, dates: cohortDatesLabel(cohort),
        startsAt: cohort.startsAt.toISOString(), price: phase.price, phase: phase.label,
    })
}
