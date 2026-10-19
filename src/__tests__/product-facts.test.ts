import { describe, expect, it } from 'vitest'
import * as book from '@/data/bookData'
import { allExercises } from '@/data/exercisesData'
import { PRODUCT_STATS } from '@/lib/pricing'
import { BOOK_PAGES_DISPLAY, TOTAL_BOOK_PAGES } from '@/lib/config'
import { FREE_READING_LAST_PAGE } from '@/lib/reading-completion'
import { SECTION_REGISTRY } from '@/config/sections'
import { LEARNING_SECTIONS } from '@/config/learningCatalog'
import { LEARNING_PATHS, getPathCompletion } from '@/data/learningPaths'

describe('product facts match the shipped lessons', () => {
  it('counts every reading page, exercise and numbered library template', () => {
    const pages = Object.values(book).filter(Array.isArray).flat()
    expect(PRODUCT_STATS.readingPages).toBe(pages.length)
    expect(pages.length).toBe(192)
    expect(BOOK_PAGES_DISPLAY).toBe(192)
    expect(TOTAL_BOOK_PAGES).toBe(222)
    expect(PRODUCT_STATS.freePages).toBe(3) // only the intro is free since 2026-10-16
    expect(FREE_READING_LAST_PAGE).toBe(6)
    expect(PRODUCT_STATS.exercises).toBe(Object.values(allExercises).flat().length)
    const templates = book.libraryData.flatMap(page => page.contentBlocks)
      .filter(block => block.type === 'card' && /^\d+\)/.test(block.title || ''))
    expect(PRODUCT_STATS.templates).toBe(templates.length)
  })
  it('keeps reading offsets and the final chapter learning plan in sync', () => {
    expect(SECTION_REGISTRY.map(section => section.progressOffset)).toEqual([0, 6, 23, 41, 59, 77, 95, 115, 133, 149, 165])
    expect(SECTION_REGISTRY[0]).toMatchObject({ pageCount: 3, slotSize: 6 })
    expect(SECTION_REGISTRY[1]).toMatchObject({ pageCount: 9, slotSize: 17, freePageLimit: 0, prevSection: { lastPage: 3 } })
    expect(SECTION_REGISTRY[2]).toMatchObject({ pageCount: 9, slotSize: 18, freePageLimit: 0, prevSection: { lastPage: 9 } })
    expect(SECTION_REGISTRY[3]).toMatchObject({ pageCount: 8, slotSize: 18, freePageLimit: 0, prevSection: { lastPage: 9 } })
    expect(SECTION_REGISTRY[4].prevSection?.lastPage).toBe(8)
    let offset = 0
    for (const section of SECTION_REGISTRY) {
      const data = section.id === 'intro' ? book.introData : book[`unit${section.sectionNumber}Data` as keyof typeof book]
      expect(section.progressOffset).toBe(offset)
      expect(section.pageCount).toBe(data.length)
      expect(section.slotSize).toBeGreaterThanOrEqual(section.pageCount)
      if (section.sectionNumber >= 4) expect(section.slotSize).toBe(section.pageCount)
      offset += section.slotSize
    }
    expect(offset).toBe(182)
    const fullPath = Object.values(LEARNING_PATHS).find(p => p.sections.includes('section-10'))!
    const fullPageCount = LEARNING_SECTIONS.reduce((sum, section) => sum + section.pageCount, 0)
    expect(fullPath.totalPages).toBe(fullPageCount)
    expect(getPathCompletion(TOTAL_BOOK_PAGES, fullPath.id)).toBe(100)
  })
})
