import { NextRequest, NextResponse } from 'next/server'
import crypto from 'crypto'
import { processUpgradeDrip } from '@/lib/upgrade-emails'

// =====================================================
// API: /api/cron/upgrade-drip — GET
// Called daily via Vercel Cron or external cron
// Sends upgrade email drip sequence to free users
// =====================================================

export async function GET(request: NextRequest) {
    try {
        // SECURITY: Verify cron secret with timing-safe comparison
        const authHeader = request.headers.get('authorization')
        const cronSecret = process.env.CRON_SECRET

        if (!cronSecret || !authHeader) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const expectedHeader = `Bearer ${cronSecret}`
        const headerBuf = Buffer.from(authHeader)
        const expectedBuf = Buffer.from(expectedHeader)
        if (headerBuf.length !== expectedBuf.length || !crypto.timingSafeEqual(headerBuf, expectedBuf)) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const result = await processUpgradeDrip()

        return NextResponse.json({
            success: true,
            sent: result.sent,
            errors: result.errors,
            timestamp: new Date().toISOString(),
        })
    } catch (error) {
        console.error('[upgrade-drip] Cron error:', error)
        return NextResponse.json({ error: 'Internal error' }, { status: 500 })
    }
}
