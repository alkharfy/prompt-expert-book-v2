import { describe, expect, it } from 'vitest'
import { introData } from '@/data/introData'
import { scoreMessage } from '@/components/reading/QuizBlock'

const blocks = introData.flatMap(page => page.contentBlocks.map(block => ({ page: page.pageNumber, block })))

describe('free intro: something to do on every page', () => {
  it('puts six flip cards on page 2', () => {
    const decks = blocks.filter(({ block }) => block.type === 'flashcards')
    expect(decks.map(d => d.page)).toEqual([2])
    expect(decks[0].block.items).toHaveLength(6)
    expect(decks[0].block.items!.every(card => card.title && card.content)).toBe(true)
  })

  it('asks three recall questions on page 3 before the offer, with the completion reward after', () => {
    const page3 = introData[2].contentBlocks
    const quizIndex = page3.findIndex(block => block.type === 'quiz')
    expect(quizIndex).toBeGreaterThan(-1)
    expect(page3.findIndex(block => block.rewardId === 'intro_complete')).toBeGreaterThan(quizIndex)
    const quiz = page3[quizIndex].quiz!
    expect(quiz).toHaveLength(3)
    for (const q of quiz) {
      expect(q.options).toHaveLength(3)
      expect(q.answer).toBeGreaterThanOrEqual(0)
      expect(q.answer).toBeLessThan(q.options.length)
      expect(q.why.length).toBeGreaterThan(20)
    }
    // Not every right answer in the same spot.
    expect(new Set(quiz.map(q => q.answer)).size).toBeGreaterThan(1)
  })

  it('reports the score in plain Egyptian Arabic', () => {
    expect(scoreMessage(5, 5)).toContain('ممتاز')
    expect(scoreMessage(3, 5)).toContain('كويس')
    expect(scoreMessage(1, 5)).toContain('طبيعي')
  })
})
