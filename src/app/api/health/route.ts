import { NextResponse } from 'next/server'
import { SITE_URL, SITE_DOMAIN } from '@/lib/config'
import { alertMoneyPath } from '@/lib/alert'

export const dynamic = 'force-dynamic'

export async function GET() {
  // Distributed rate limiting requires Upstash; in production an in-memory
  // fallback silently fails-open across serverless instances (WS8). Surface it.
  const rateLimitRedis = !!(process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN)
  const emailFromVerified = !!process.env.EMAIL_FROM
  const isProd = process.env.NODE_ENV === 'production'

  if (isProd && !rateLimitRedis) {
    alertMoneyPath('rate_limit_redis_missing', {
      note: 'Upstash env not set — money-path rate limits fall back to in-memory (fails-open cross-instance)',
    })
  }

  return NextResponse.json({
    ok: true,
    siteUrl: SITE_URL,
    domain: SITE_DOMAIN,
    rateLimitRedis,
    emailFromVerified,
    metaCapiConfigured: !!process.env.META_CONVERSIONS_TOKEN,
  })
}
