import { describe, expect, it } from 'vitest'
import { introData } from '@/data/introData'
import { PROFESSION_TRIES } from '@/data/professionTries'
import { unit1Data } from '@/data/unit1Data'
import { personalizeBlocks, readerTrack } from '@/lib/personalizeBlocks'

const introBlocks = introData[0].contentBlocks
const pages = [...introData, ...unit1Data]

describe('reading block personalization', () => {
  it('replaces the intro profession try with the teacher request and its review instructions', () => {
    const index = introBlocks.findIndex(block => block.personalize === 'profession-try')
    expect(index).toBeGreaterThanOrEqual(0)
    const result = personalizeBlocks(introBlocks, { profession: 'teacher', aiLevel: null })
    expect(result).toHaveLength(introBlocks.length + 1)
    expect(result[index]).toMatchObject({ type: 'code', personalize: 'profession-try', code: PROFESSION_TRIES.teacher.request })
    expect(result[index].title).toContain('مدرس')
    expect(result[index + 1].type).toBe('card')
    expect(result[index + 1].content).toContain(PROFESSION_TRIES.teacher.reviewTip)
    expect(result[index + 1].content).toContain('تجريبية')
    introBlocks.forEach((block, blockIndex) => {
      if (blockIndex === index) return
      expect(result[blockIndex < index ? blockIndex : blockIndex + 1]).toBe(block)
    })
  })

  it.each([null, 'some', 'daily'] as const)('preserves the array reference without a profession for AI level %s', aiLevel => {
    expect(personalizeBlocks(introBlocks, { profession: null, aiLevel })).toBe(introBlocks)
  })

  it('collapses every advanced block and no other block for a first-time AI reader', () => {
    for (const page of pages) {
      const result = personalizeBlocks(page.contentBlocks, { profession: null, aiLevel: 'new' })
      const visible = page.contentBlocks.filter(block => !block.track || block.track === 'accounting')
      expect(result).toHaveLength(visible.length)
      result.forEach((block, index) => {
        const original = visible[index]
        if (original.audience === 'advanced') {
          expect(block).toEqual({ ...original, collapsed: true })
        } else {
          expect(block).toBe(original)
          expect(block).not.toHaveProperty('collapsed')
        }
      })
      expect(page.contentBlocks.every(block => !Object.hasOwn(block, 'collapsed'))).toBe(true)
    }
  })

  it.each(['some', 'daily'] as const)('leaves all blocks expanded for AI level %s, including a personalized profession try', aiLevel => {
    for (const page of pages) {
      const result = personalizeBlocks(page.contentBlocks, { profession: 'teacher', aiLevel })
      expect(result.every(block => !Object.hasOwn(block, 'collapsed'))).toBe(true)
    }
  })

  it('marks all lightning cards as advanced and all advanced blocks with lightning titles', () => {
    for (const page of pages) {
      for (const block of page.contentBlocks) {
        if (block.type === 'card' && block.title?.startsWith('⚡')) expect(block.audience).toBe('advanced')
        if (block.audience === 'advanced') expect(block.title?.startsWith('⚡')).toBe(true)
      }
    }
  })

  it("maps people-facing jobs to Mona's service track; accounting, students and unknown readers get Ahmed", () => {
    for (const profession of ['sales_service', 'marketing_business', 'hr_admin', 'teacher', 'programmer'] as const) {
      expect(readerTrack(profession)).toBe('service')
    }
    for (const profession of ['accounting', 'student_jobseeker', 'other', null] as const) {
      expect(readerTrack(profession)).toBe('accounting')
    }
  })

  it("lets the reader's own pick beat the guess from their profession", () => {
    const page = unit1Data.find(page => page.contentBlocks.some(block => block.track))!
    const result = personalizeBlocks(page.contentBlocks, { profession: 'programmer', aiLevel: 'some', track: 'accounting' })
    expect(result.some(block => block.track === 'service')).toBe(false)
    expect(result.some(block => block.track === 'accounting')).toBe(true)
  })

  it.each([
    ['sales_service', 'service', 'accounting'],
    ['accounting', 'accounting', 'service'],
    ['teacher', 'service', 'accounting'],
    ['student_jobseeker', 'accounting', 'service'],
  ] as const)('shows a %s reader the %s blocks and hides the %s blocks on every Level 1 page', (profession, shown, hidden) => {
    for (const page of unit1Data) {
      const result = personalizeBlocks(page.contentBlocks, { profession, aiLevel: 'some' })
      expect(result.some(block => block.track === hidden)).toBe(false)
      expect(result.filter(block => block.track === shown)).toHaveLength(page.contentBlocks.filter(block => block.track === shown).length)
      expect(result.filter(block => !block.track)).toHaveLength(page.contentBlocks.filter(block => !block.track).length)
    }
  })

  it('gives both pilot tracks their own version of every lesson and answer key', () => {
    // Lessons with a worked case per track; 1, 2, 5 and the project are the same for everyone.
    for (const page of unit1Data.filter(page => [3, 4, 6, 7, 8].includes(page.pageNumber))) {
      expect(page.contentBlocks.some(block => block.track === 'accounting'), page.title).toBe(true)
      expect(page.contentBlocks.some(block => block.track === 'service'), page.title).toBe(true)
    }
    const hiddenAnswers = unit1Data.flatMap(page => page.contentBlocks).filter(block => block.reveal)
    expect(hiddenAnswers.length).toBeGreaterThanOrEqual(10)
    expect(hiddenAnswers.every(block => block.type === 'card')).toBe(true)
  })
})
