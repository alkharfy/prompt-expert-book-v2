import { describe, expect, it } from 'vitest'
import { readFileSync } from 'fs'
import { join } from 'path'
import { FALLBACK_PLAN_PRICES, MONTHLY_PRICE_EGP, GRADER_DAILY_LIMIT } from '@/lib/pricing'
import { PLAN_FEATURES } from '@/lib/features'
import { PLAN_DURATION_DAYS, PLAN_IDS } from '@/types/subscription'
import { introData } from '@/data/introData'
import { REFUND_DAYS, REFUND_GUARANTEE_TEXT, refundDaysFor, refundDaysLabel } from '@/lib/config'

const read = (file: string) => readFileSync(join(process.cwd(), file), 'utf8')
const migration = read('supabase/migrations/20261018_monthly_plan.sql')

describe('the 100 EGP monthly plan says the same thing everywhere', () => {
  it('is a 30-day plan with the basic content and no extra features', () => {
    expect(PLAN_IDS).toContain('monthly')
    expect(PLAN_DURATION_DAYS.monthly).toBe(30)
    expect([...PLAN_FEATURES.monthly]).toEqual([...PLAN_FEATURES.basic])
  })

  it('seeds the same price and features the code sells', () => {
    expect(FALLBACK_PLAN_PRICES.monthly).toBe(MONTHLY_PRICE_EGP)
    expect(migration).toContain(`('monthly', 'Monthly', 'الشهري', ${MONTHLY_PRICE_EGP},`)
    for (const feature of PLAN_FEATURES.monthly) expect(migration).toContain(`('monthly', '${feature}', true)`)
  })

  it('uses the same price in the text that is not built from the constant', () => {
    const intro = introData.flatMap(page => page.contentBlocks).map(block => block.content).join('\n')
    expect(intro).toContain(`الشهري بـ${MONTHLY_PRICE_EGP} جنيه`)
    expect(read('src/app/layout.tsx')).toContain(`${MONTHLY_PRICE_EGP} جنيه في الشهر`)
  })

  it('promises the grader limit the API enforces', () => {
    expect(read('src/app/api/grade/route.ts')).toContain('const PER_DAY = GRADER_DAILY_LIMIT')
    expect(GRADER_DAILY_LIMIT).toBe(10)
  })

  it('gives the monthly plan a 7-day refund and the yearly ones 30, in every text', () => {
    expect(REFUND_DAYS).toEqual({ monthly: 7, yearly: 30 })
    expect(refundDaysFor('monthly')).toBe(7)
    expect(refundDaysFor('pro')).toBe(30)
    expect(refundDaysLabel(7)).toBe('7 أيام')
    expect(refundDaysLabel(30)).toBe('30 يوم')
    expect(REFUND_GUARANTEE_TEXT).toBe('ضمان استرداد: 7 أيام للشهري و30 يوم للسنوي')
    const intro = introData.flatMap(page => page.contentBlocks).map(block => block.content).join('\n')
    expect(intro).toContain('خلال 7 أيام من الدفع في الشهري، و30 يوم في السنوي')
    expect(read('src/app/terms/page.tsx')).toContain('خلال 7 أيام من تاريخ الدفع للاشتراك الشهري')
    expect(read('src/app/contact/page.tsx')).toContain('خلال 7 أيام في الشهري و30 يوم في السنوي')
    const oldPromise = /ضمان استرداد(?: فلوسك)? 30 يوم|ضمان الـ 30 يوم|خلال 30 يوماً من تاريخ الشراء|خلال 30 يوم من الشراء/
    for (const file of [
      'src/components/landing/HeroSection.tsx', 'src/components/landing/FinalCTA.tsx',
      'src/components/landing/PricingSection.tsx', 'src/components/landing/FAQSection.tsx',
      'src/components/reading/LockedOverlay.tsx', 'src/components/SubscriptionGateModal.tsx',
      'src/app/refund-policy/page.tsx', 'src/app/terms/page.tsx', 'src/app/contact/page.tsx',
    ]) expect(read(file), file).not.toMatch(oldPromise)
    expect(intro).not.toMatch(oldPromise)
  })
})
