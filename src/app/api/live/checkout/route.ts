import { NextRequest, NextResponse } from 'next/server'
import { createPaymentSession } from '@/lib/kashier'
import { getSupabaseAdmin } from '@/lib/supabase-admin'
import { dbLogger } from '@/lib/logger'
import { getAuthenticatedUser } from '@/lib/auth-middleware'
import { checkRateLimitAsync, getClientIP, RATE_LIMITS } from '@/lib/rate-limit'
import { SITE_URL } from '@/lib/config'
import { LIVE_PLAN_ID, cohortDatesLabel, liveOrderNotes, livePricing, normalizeEgyptMobile } from '@/lib/live'

/** POST { whatsapp }: open a Kashier session for one seat in the current cohort. The price is read here, never from the client. */
export async function POST(request: NextRequest) {
    try {
        const userId = await getAuthenticatedUser({ skipActiveCheck: true })
        if (!userId) return NextResponse.json({ error: 'سجّل دخولك الأول' }, { status: 401 })

        const body = await request.json().catch(() => null)
        const whatsapp = normalizeEgyptMobile(body?.whatsapp)
        if (!whatsapp) return NextResponse.json({ error: 'اكتب رقم واتساب مصري صح، زي 01012345678' }, { status: 400 })

        const limit = await checkRateLimitAsync(`live-checkout:${userId}:${getClientIP(request)}`, RATE_LIMITS.PAYMENT_CREATE)
        if (!limit.allowed) return NextResponse.json({ error: `محاولات كتير. جرّب تاني بعد ${limit.retryAfter} ثانية` }, { status: 429 })

        const supabase = getSupabaseAdmin()
        const { cohort, phase } = livePricing()

        const { data: seat } = await (supabase.from('live_enrollments') as any)
            .select('id').eq('user_id', userId).eq('cohort_id', cohort.id).maybeSingle()
        if (seat) return NextResponse.json({ error: 'انت محجوز فعلًا في الدفعة دي', enrolled: true }, { status: 409 })

        const { data: user } = await (supabase.from('users') as any)
            .select('id, email').eq('id', userId).single()
        if (!user) return NextResponse.json({ error: 'الحساب مش موجود' }, { status: 404 })

        const orderId = `LIVE-${Date.now()}-${userId.substring(0, 8)}`
        const session = await createPaymentSession({
            orderId,
            amount: phase.price.toFixed(2),
            customerEmail: user.email,
            customerReference: userId,
            description: `تحدّي ٣ أيام لايف - ${cohortDatesLabel(cohort)}`,
            redirectUrl: `${SITE_URL}/payment/callback`,
            webhookUrl: `${SITE_URL}/api/payment/webhook`,
        })
        if (!session.success || !session.sessionId) {
            return NextResponse.json({ error: session.error || 'مقدرناش نفتح صفحة الدفع' }, { status: 500 })
        }

        const { error: insertError } = await (supabase.from('payments') as any).insert({
            user_id: userId,
            kashier_session_id: session.sessionId,
            kashier_order_id: orderId,
            amount: phase.price,
            currency: 'EGP',
            plan_id: LIVE_PLAN_ID,
            status: 'pending',
            notes: liveOrderNotes(cohort.id, whatsapp),
        })
        if (insertError) {
            dbLogger.error('[live] payment insert failed:', insertError)
            return NextResponse.json({ error: 'مقدرناش نسجّل الطلب' }, { status: 500 })
        }

        return NextResponse.json({ success: true, sessionUrl: session.sessionUrl, amount: phase.price, orderId })
    } catch (error) {
        dbLogger.error('[live] checkout error:', error)
        return NextResponse.json({ error: 'حصل خطأ، جرّب تاني' }, { status: 500 })
    }
}
