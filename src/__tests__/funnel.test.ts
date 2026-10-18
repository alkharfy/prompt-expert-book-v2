import { describe, expect, it } from 'vitest'
import { buildFunnelReport, describeGlobalPage } from '@/lib/funnel'

const now = new Date('2026-10-18T12:00:00Z')
const old = '2026-10-01T00:00:00Z'
const recent = '2026-10-17T00:00:00Z'

describe('funnel report', () => {
  it('maps global pages to where the reader is', () => {
    expect(describeGlobalPage(0)).toBe('لسه مابدأش يقرا')
    expect(describeGlobalPage(2)).toBe('المقدمة · صفحة 2')
    expect(describeGlobalPage(5)).toBe('المقدمة · صفحة 3') // reserved gap → last real page
    expect(describeGlobalPage(9)).toBe('المستوى ١ · صفحة 3')
  })

  it('counts each step once per person, skips admins, and only stale readers count as stopped', () => {
    const report = buildFunnelReport({
      users: [
        { id: 'a', created_at: old }, { id: 'b', created_at: old }, { id: 'c', created_at: old },
        { id: 'admin', created_at: old, is_admin: true },
      ],
      preferences: [{ user_id: 'a', onboarding_status: 'completed', profession: 'accounting' }, { user_id: 'b', onboarding_status: null, profession: null }],
      progress: [
        { user_id: 'a', current_page: 9, completed_chapters: ['0'], updated_at: old },
        { user_id: 'b', current_page: 2, completed_chapters: [], updated_at: recent },
        { user_id: 'admin', current_page: 50, completed_chapters: [], updated_at: old },
      ],
      intents: [{ user_id: 'a' }, { user_id: 'a' }],
      payments: [{ user_id: 'a', status: 'failed' }, { user_id: 'a', status: 'success' }],
    }, now)
    const count = (id: string) => report.steps.find(s => s.id === id)!.count
    expect(count('signed_up')).toBe(3)
    expect(count('onboarded')).toBe(1)
    expect(count('reading')).toBe(2)
    expect(count('intro_done')).toBe(1)
    expect(count('level1')).toBe(1)
    expect(count('payment_page')).toBe(1)
    expect(count('checkout')).toBe(1)
    expect(count('paid')).toBe(1)
    // b read yesterday (still reading); a stopped in Level 1; c never started
    expect(report.stoppedAt).toEqual(expect.arrayContaining([
      { where: 'المستوى ١ · صفحة 3', count: 1 }, { where: 'لسه مابدأش يقرا', count: 1 },
    ]))
    expect(report.stoppedAt.some(r => r.where.startsWith('المقدمة'))).toBe(false)
    expect(report.payments).toEqual({ success: 1, pending: 0, failed: 1, other: 0 })
  })
})
