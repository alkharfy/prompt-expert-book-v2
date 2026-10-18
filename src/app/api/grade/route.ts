import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { checkRateLimitAsync } from '@/lib/rate-limit'
import { getAuthenticatedUser } from '@/lib/auth-middleware'
import { userHasFeature } from '@/lib/subscription'
import { apiLogger } from '@/lib/logger'
import { GRADE_RUBRICS } from '@/data/gradeRubrics'
import { buildGraderPrompt, findSensitiveData, parseGraderResult, placeholderCriterion } from '@/lib/grader'
import { gradeWithModel } from '@/lib/grader-model'

/**
 * «المستر بيصحّح» — POST { rubric, text } → per-criterion feedback.
 * Owner decision 2026-10-18: a paid API (src/lib/grader-model.ts), nothing the learner sends is stored or logged,
 * 10 gradings a day per learner. The intro demo rubric is open to any registered account (2 a day).
 */

export const dynamic = 'force-dynamic'

const DAY = 24 * 60 * 60
const PER_DAY = 10
const DEMO_PER_DAY = 2
/** Site-wide ceiling per 30 days, so a bug or abuse can't run up the bill. */
const MONTHLY_CAP = Number(process.env.GRADER_MONTHLY_CAP) || 5000
const BodySchema = z.object({
    rubric: z.string().min(1).max(60),
    text: z.string().max(4000),
})

export async function POST(request: NextRequest) {
    const userId = await getAuthenticatedUser()
    if (!userId) {
        return NextResponse.json({ error: 'login', message: 'سجّل دخولك الأول عشان المستر يصحّحلك.' }, { status: 401 })
    }

    let body: z.infer<typeof BodySchema>
    try {
        const parsed = BodySchema.safeParse(await request.json())
        if (!parsed.success) return NextResponse.json({ error: 'bad_request', message: 'فيه حاجة غلط في الطلب.' }, { status: 400 })
        body = parsed.data
    } catch {
        return NextResponse.json({ error: 'bad_request', message: 'فيه حاجة غلط في الطلب.' }, { status: 400 })
    }

    const rubric = GRADE_RUBRICS[body.rubric]
    if (!rubric) return NextResponse.json({ error: 'bad_request', message: 'التمرين ده مش موجود.' }, { status: 400 })

    const text = body.text.trim()
    if (text.length < 15) {
        return NextResponse.json({ error: 'too_short', message: 'اكتب أكتر شوية عشان المستر يقدر يحكم.' }, { status: 400 })
    }
    if (text.length > rubric.maxChars) {
        return NextResponse.json({ error: 'too_long', message: `أقصى طول هنا ${rubric.maxChars} حرف. قصّره وابعت تاني.` }, { status: 400 })
    }

    // Before anything leaves our server: stop on personal data instead of sending it on.
    const sensitive = findSensitiveData(text)
    if (sensitive.length) {
        return NextResponse.json({ error: 'sensitive', found: sensitive, message: `لقيت في كلامك: ${sensitive.join('، ')}. شيله أو غيّره لرقم وهمي، وابعت تاني.` }, { status: 422 })
    }

    const subscribed = await userHasFeature(userId, 'reading')
    if (!rubric.demo && !subscribed) {
        return NextResponse.json({ error: 'subscription', message: 'المصحّح جوه الدروس للمشتركين. وتقدر تجرّبه ببلاش في آخر التمهيد.' }, { status: 403 })
    }

    const limit = !subscribed
        ? await checkRateLimitAsync(`grade-demo:${userId}`, { maxRequests: DEMO_PER_DAY, windowSeconds: DAY })
        : await checkRateLimitAsync(`grade:${userId}`, { maxRequests: PER_DAY, windowSeconds: DAY })
    if (!limit.allowed) {
        const hours = Math.max(1, Math.ceil((limit.retryAfter || DAY) / 3600))
        return NextResponse.json({ error: 'limit', message: `خلّصت تصحيحات النهارده (${subscribed ? PER_DAY : DEMO_PER_DAY}). جرّب تاني بعد حوالي ${hours} ساعة.` }, { status: 429 })
    }
    const site = await checkRateLimitAsync('grade:site', { maxRequests: MONTHLY_CAP, windowSeconds: 30 * DAY })
    if (!site.allowed) {
        return NextResponse.json({ error: 'busy', message: 'المستر واخد استراحة شوية. جرّب بكرة.' }, { status: 503 })
    }

    try {
        const { system, user } = buildGraderPrompt(rubric, text)
        const raw = await gradeWithModel(rubric, system, user)
        const result = parseGraderResult(raw, rubric, text)
        if (!result) {
            apiLogger.warn('grade: unusable model reply', { rubric: rubric.id })
            return NextResponse.json({ error: 'model', message: 'المستر مقدرش يصحّح المرة دي. ابعت تاني.' }, { status: 502 })
        }
        if (rubric.placeholders) result.criteria.unshift(placeholderCriterion(text))
        return NextResponse.json({ ...result, remaining: limit.remaining })
    } catch (err) {
        // Log the failure only — never the learner's text.
        apiLogger.error('grade: model call failed', { rubric: rubric.id, message: err instanceof Error ? err.message : 'unknown' })
        return NextResponse.json({ error: 'model', message: 'المستر مقدرش يصحّح دلوقتي. جرّب كمان شوية.' }, { status: 502 })
    }
}
