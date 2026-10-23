import crypto from 'crypto'
import type { NextRequest } from 'next/server'

/** SECURITY: true only for `Authorization: Bearer <CRON_SECRET>`, compared in constant time. */
export function isCronAuthorized(request: NextRequest): boolean {
    const authHeader = request.headers.get('authorization')
    const cronSecret = process.env.CRON_SECRET
    if (!cronSecret || !authHeader) return false

    const headerBuf = Buffer.from(authHeader)
    const expectedBuf = Buffer.from(`Bearer ${cronSecret}`)
    return headerBuf.length === expectedBuf.length && crypto.timingSafeEqual(headerBuf, expectedBuf)
}
