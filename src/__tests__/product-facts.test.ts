import { describe, expect, it } from 'vitest'
import * as book from '@/data/bookData'
import { allExercises } from '@/data/exercisesData'
import { PRODUCT_STATS } from '@/lib/pricing'
import { TOTAL_BOOK_PAGES } from '@/lib/config'
import { SECTION_REGISTRY } from '@/config/sections'
import { LEARNING_PATHS, getPathCompletion } from '@/data/learningPaths'

describe('product facts match the shipped lessons', () => {
  it('counts every reading page, exercise and numbered library template', () => {
    const pages = Object.values(book).filter(Array.isArray).flat()
    expect(PRODUCT_STATS.readingPages).toBe(pages.length)
    expect(TOTAL_BOOK_PAGES).toBe(pages.length)
    expect(PRODUCT_STATS.exercises).toBe(Object.values(allExercises).flat().length)
    const templates = book.libraryData.flatMap(page => page.contentBlocks)
      .filter(block => block.type === 'card' && /^\d+\)/.test(block.title || ''))
    expect(PRODUCT_STATS.templates).toBe(templates.length)
  })
  it('keeps reading offsets and the final chapter learning plan in sync', () => {
    let offset = 0
    for (const section of SECTION_REGISTRY) {
      const data = section.id === 'intro' ? book.introData : book[`unit${section.sectionNumber}Data` as keyof typeof book]
      expect(section.progressOffset).toBe(offset)
      expect(section.pageCount).toBe(data.length)
      offset += section.pageCount
    }
    expect(offset).toBe(182)
    const fullPath = Object.values(LEARNING_PATHS).find(p => p.sections.includes('section-10'))!
    expect(fullPath.totalPages).toBe(offset)
    expect(getPathCompletion(offset, fullPath.id)).toBe(100)
  })
})
