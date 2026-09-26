import { NextRequest, NextResponse } from 'next/server'
import { dbLogger } from '@/lib/logger'
import { checkRateLimit } from '@/lib/rate-limit'
import { getAuthenticatedUser } from '@/lib/auth-middleware'
import { SITE_URL } from '@/lib/config'

// =====================================================
// API: /api/share/generate-card — POST
// Generate a share card URL with OG image support
// =====================================================

const APP_URL = SITE_URL

export async function POST(request: NextRequest) {
    try {
        // SECURITY: Require authentication
        const userId = await getAuthenticatedUser()
        if (!userId) {
            return NextResponse.json({ error: 'غير مصرح' }, { status: 401 })
        }

        // Rate limiting to prevent abuse
        const rateLimit = checkRateLimit(`share-card-${userId}`, { maxRequests: 10, windowSeconds: 60 })
        if (!rateLimit.allowed) {
            return NextResponse.json(
                { error: 'طلبات كثيرة، حاول بعد قليل', retryAfter: rateLimit.retryAfter },
                { status: 429 }
            )
        }

        const body = await request.json()
        const { type, data } = body

        if (!type || !data) {
            return NextResponse.json({ error: 'Missing type or data' }, { status: 400 })
        }

        const validTypes = ['chapter', 'achievement', 'streak', 'weekly']
        if (!validTypes.includes(type)) {
            return NextResponse.json({ error: 'Invalid type' }, { status: 400 })
        }

        // Build the share page URL
        const shareId = encodeURIComponent(data.id || data.title || 'my-progress')
        const shareUrl = `${APP_URL}/share/${type}/${shareId}`

        // Build the OG image URL with dynamic query params for Satori
        const ogParams = new URLSearchParams()
        if (data.title) ogParams.set('title', data.title)
        if (data.subtitle) ogParams.set('subtitle', data.subtitle)
        if (data.user) ogParams.set('user', data.user)
        if (data.stats && data.stats.length > 0) {
            data.stats.slice(0, 3).forEach((stat: { label: string; value: string | number }, i: number) => {
                ogParams.set(`stat${i + 1}`, `${stat.value} ${stat.label}`)
            })
        }
        const ogImageUrl = `${APP_URL}/api/share/og/${type}?${ogParams.toString()}`

        return NextResponse.json({
            ok: true,
            shareUrl,
            ogImageUrl,
            type,
        })
    } catch (error) {
        dbLogger.error('Share generate-card error:', error)
        return NextResponse.json({ error: 'Internal error' }, { status: 500 })
    }
}
