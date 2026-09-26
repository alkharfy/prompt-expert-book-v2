import { dbLogger } from '@/lib/logger'

/**
 * Money-path alerting (WS8).
 * ALWAYS logs via dbLogger.error (durable signal even with no webhook set);
 * additionally POSTs to ALERT_WEBHOOK_URL with a HARD 3s timeout. Fire-and-forget:
 * never throws, never blocks the caller, never delays the HTTP response.
 */
export function alertMoneyPath(kind: string, details: Record<string, unknown> = {}): void {
  const payload = { kind, ...details, at: new Date().toISOString() }
  dbLogger.error(`[ALERT][money-path] ${kind}`, payload)

  const url = process.env.ALERT_WEBHOOK_URL
  if (!url) return
  try {
    const controller = new AbortController()
    const timer = setTimeout(() => controller.abort(), 3000)
    void fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text: `🚨 money-path: ${kind}`, payload }),
      signal: controller.signal,
    })
      .catch(() => { /* swallow network/abort errors */ })
      .finally(() => clearTimeout(timer))
  } catch {
    /* never throw from an alert */
  }
}
