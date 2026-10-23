import { NextRequest, NextResponse } from 'next/server'
import { isCronAuthorized } from '@/lib/cron-auth'
import { processCartRecovery } from '@/lib/cart-recovery'

// =====================================================
// API: /api/cron/cart-recovery — GET
// Called hourly via Vercel Cron or external cron
// Sends abandoned cart recovery emails
// =====================================================

export async function GET(request: NextRequest) {
    try {
        // SECURITY: Verify cron secret with timing-safe comparison
        if (!isCronAuthorized(request)) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const result = await processCartRecovery()

        return NextResponse.json({
            success: true,
            sent: result.sent,
            errors: result.errors,
            timestamp: new Date().toISOString(),
        })
    } catch (error) {
        console.error('[cart-recovery] Cron error:', error)
        return NextResponse.json({ error: 'Internal error' }, { status: 500 })
    }
}
