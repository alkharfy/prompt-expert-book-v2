import { describe, expect, it } from 'vitest'
import { isAcceptedAnswer, normalizeAnswer } from '@/components/reading/AnswerCheck'
import { unit1Data } from '@/data/unit1Data'

describe('type-your-answer check', () => {
  it('accepts what an Arabic phone keyboard types', () => {
    expect(normalizeAnswer(' ١٠ ')).toBe('10')
    expect(isAcceptedAnswer('24,820', ['24820'])).toBe(true)
    expect(isAcceptedAnswer('٢٤٬٨٢٠', ['24820'])).toBe(true)
    expect(isAcceptedAnswer('10٪', ['10'])).toBe(true)
    expect(isAcceptedAnswer('11', ['10'])).toBe(false)
    expect(isAcceptedAnswer('', ['10'])).toBe(false)
  })

  it('every answer block in Level 1 has a question, an accepted answer and an explanation', () => {
    const blocks = unit1Data.flatMap(page => page.contentBlocks).filter(block => block.type === 'answer')
    expect(blocks.length).toBeGreaterThanOrEqual(5)
    for (const block of blocks) {
      expect(block.title).toBeTruthy()
      expect(block.accept?.length).toBeGreaterThan(0)
      expect(block.content.length).toBeGreaterThan(10)
    }
  })
})
