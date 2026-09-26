import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { getSupabaseAdmin } from '@/lib/supabase-admin'
import { checkRateLimit } from '@/lib/rate-limit'
import { getAuthenticatedUser } from '@/lib/auth-middleware'
import { dbLogger } from '@/lib/logger'

export const dynamic = 'force-dynamic'

const RateRequestSchema = z.object({
    messageContent: z.string().min(1).max(10000),
    queryContent: z.string().min(1).max(2000),
    model: z.string().min(1).max(50),
    rating: z.union([z.literal(1), z.literal(-1)]),
})

export async function POST(request: NextRequest) {
    try {
        // Auth check — session token validated
        const userId = await getAuthenticatedUser()
        if (!userId) {
            return NextResponse.json(
                { error: 'Unauthorized' },
                { status: 401 }
            )
        }

        // Rate limit: 10 ratings per minute per user
        const rateResult = checkRateLimit(`rate:${userId}`, { maxRequests: 10, windowSeconds: 60 })
        if (!rateResult.allowed) {
            return NextResponse.json(
                { error: 'Too many ratings' },
                { status: 429 }
            )
        }

        // Parse body
        const body = await request.json()
        const parsed = RateRequestSchema.safeParse(body)
        if (!parsed.success) {
            return NextResponse.json(
                { error: 'Invalid request' },
                { status: 400 }
            )
        }

        const { messageContent, queryContent, model, rating } = parsed.data

        const supabase = getSupabaseAdmin()
        if (!supabase) {
            return NextResponse.json(
                { error: 'Database not configured' },
                { status: 503 }
            )
        }

        const { error } = await (supabase.from('chat_ratings') as any).insert({
            user_id: userId,
            message_content: messageContent,
            query_content: queryContent,
            model,
            rating,
        })

        if (error) {
            dbLogger.error('[Rate] Failed to save rating:', error)
            return NextResponse.json(
                { error: 'Failed to save rating' },
                { status: 500 }
            )
        }

        return NextResponse.json({ success: true })
    } catch (err) {
        dbLogger.error('[Rate] Error:', err)
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        )
    }
}
