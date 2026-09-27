// @vitest-environment node
// The book assistant answers ONLY from retrieved pages — a concept missing from them
// becomes a "not found" reply even though the book covers it. Real book data, no mocks.
import { describe, expect, it } from 'vitest'
import { retrieveContext } from '@/lib/chat-context'
import { extractKeywords } from '@/lib/arabic-normalize'

const mentions = (pages: { title: string; body: string }[], term: RegExp) =>
  pages.some(p => term.test(p.title) || term.test(p.body))

describe('book assistant retrieval', () => {
  it('drops question punctuation and framing words from keywords', () => {
    expect(extractKeywords('ما الفرق بين Zero-shot و Few-shot؟')).toEqual(['Zero-shot', 'Few-shot'])
  })

  it('covers both concepts of a comparison question', async () => {
    const pages = await retrieveContext('ما الفرق بين Zero-shot و Few-shot؟', 5)
    expect(mentions(pages, /zero-?shot/i)).toBe(true)
    expect(mentions(pages, /few-?shot/i)).toBe(true)
  }, 30000)

  it('finds the page that defines a short term', async () => {
    const pages = await retrieveContext('ما هو RAG؟', 5)
    expect(pages[0].title).toContain('RAG')
  }, 30000)

  it('finds a concept that only appears deep inside a page', async () => {
    const pages = await retrieveContext('ما هي الهلوسة؟', 5)
    expect(mentions(pages, /الهلوسة/)).toBe(true)
  }, 30000)

  it('answers each suggested question in the chat window from matching pages', async () => {
    for (const [q, term] of [['ما هو إطار GOLDS؟', /GOLDS/], ['ما هي تقنية Chain of Thought؟', /Chain[- ]of[- ]Thought/i]] as const) {
      expect(mentions(await retrieveContext(q, 5), term)).toBe(true)
    }
  }, 30000)
})
