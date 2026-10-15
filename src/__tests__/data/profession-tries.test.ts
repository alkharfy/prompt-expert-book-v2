import { describe, expect, it } from 'vitest'
import { getProfessionTry, PROFESSION_TRIES } from '@/data/professionTries'
import { PROFESSION_IDS } from '@/lib/onboarding'

const formatNumber = (value: number) => value.toLocaleString('en-US')
const forbiddenTerms = ['ريال', 'السعودية', 'سعودي', 'درهم', 'دينار', 'GPT-', 'Gemini 2', 'Claude 3']

describe('profession practice examples', () => {
  it.each(PROFESSION_IDS)('%s has a matching id and complete copy', profession => {
    const item = PROFESSION_TRIES[profession]
    expect(item).toBeDefined()
    expect(item.id).toBe(profession)
    for (const field of ['icon', 'label', 'asRole', 'request', 'claim', 'feedback', 'reviewTip'] as const) {
      expect(item[field].trim()).not.toBe('')
    }
  })

  it.each(PROFESSION_IDS)('%s avoids Gulf currencies and model versions in every string', profession => {
    for (const value of Object.values(PROFESSION_TRIES[profession])) {
      for (const term of forbiddenTerms) expect(value).not.toContain(term)
    }
  })

  // A CV summary has no money in it; every other example is priced in EGP.
  it.each(PROFESSION_IDS.filter(id => id !== 'student_jobseeker'))('%s uses جنيه in the request', profession => {
    expect(PROFESSION_TRIES[profession].request).toContain('جنيه')
  })

  it('keeps the correct invoice sum and the planted accounting mistake distinct', () => {
    const total = 3400 + 1850 + 2700
    const plantedTotal = 8950
    expect(PROFESSION_TRIES.accounting.feedback).toContain(formatNumber(total))
    expect(PROFESSION_TRIES.accounting.claim).toContain(formatNumber(plantedTotal))
    expect(plantedTotal).not.toBe(total)
  })

  it('explains the correct price after the teacher’s discount', () => {
    const discountedPrice = 400 * (1 - 0.25)
    expect(PROFESSION_TRIES.teacher.feedback).toContain(formatNumber(discountedPrice))
    expect(PROFESSION_TRIES.teacher.claim).toContain(formatNumber(325))
  })

  it('explains the correct marketing discount percentage', () => {
    const discountPercent = (350 - 280) / 350 * 100
    expect(PROFESSION_TRIES.marketing_business.feedback).toContain(`${discountPercent}%`)
    expect(PROFESSION_TRIES.marketing_business.claim).toContain(`${30}%`)
  })

  it('averages only the programmer’s prices above the requested threshold', () => {
    const filteredAverage = (600 + 800) / 2
    const unfilteredAverage = ((600 + 800 + 300) / 3).toFixed(2)
    expect(PROFESSION_TRIES.programmer.feedback).toContain(formatNumber(filteredAverage))
    expect(PROFESSION_TRIES.programmer.reviewTip).toContain(formatNumber(filteredAverage))
    expect(PROFESSION_TRIES.programmer.claim).toContain(unfilteredAverage)
  })

  it('explains the correct household expense total', () => {
    const total = 4500 + 650 + 3200 + 900 + 350
    expect(PROFESSION_TRIES.other.feedback).toContain(formatNumber(total))
    expect(PROFESSION_TRIES.other.claim).toContain(formatNumber(10600))
  })

  it.each(['nope', null])('falls back to the other example for %s', profession => {
    expect(getProfessionTry(profession)).toBe(PROFESSION_TRIES.other)
  })
})
