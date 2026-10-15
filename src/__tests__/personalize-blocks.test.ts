import { describe, expect, it } from 'vitest'
import { introData } from '@/data/introData'
import { PROFESSION_TRIES } from '@/data/professionTries'
import { unit1Data } from '@/data/unit1Data'
import { personalizeBlocks } from '@/lib/personalizeBlocks'

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
      result.forEach((block, index) => {
        const original = page.contentBlocks[index]
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
    const advancedCards = unit1Data.flatMap(page => page.contentBlocks)
      .filter(block => block.type === 'card' && block.title?.startsWith('⚡') && block.audience === 'advanced')
    expect(advancedCards.length).toBeGreaterThanOrEqual(9)
  })
})
