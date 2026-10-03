import { describe, expect, it } from 'vitest'
import * as book from '@/data/bookData'
import { allExercises } from '@/data/exercisesData'
import { EXERCISE_COUNTS_BY_SECTION, getLearningReadingUrl, LEARNING_SECTIONS } from '@/config/learningCatalog'
import { getPathCompletion, isSectionInPath, LEARNING_PATHS } from '@/data/learningPaths'
import type { LearningPathId } from '@/types/learning'

const actualPages = {
    intro: book.introData,
    'section-1': book.unit1Data, 'section-2': book.unit2Data,
    'section-3': book.unit3Data, 'section-4': book.unit4Data,
    'section-5': book.unit5Data, 'section-6': book.unit6Data,
    'section-7': book.unit7Data, 'section-8': book.unit8Data,
    'section-9': book.unit9Data, 'section-10': book.unit10Data,
    library: book.libraryData, appendix: book.appendixData, glossary: book.glossaryData,
}
const expectedExerciseCounts: Record<LearningPathId, number> = { quick: 10, intermediate: 28, comprehensive: 45 }

describe('learning catalog matches the shipped data', () => {
    it('contains the advertised 95 numbered library templates without gaps or duplicates', () => {
        const numbers = book.libraryData.flatMap(page => page.contentBlocks)
            .map(block => block.title?.match(/^(\d+)\)/)?.[1])
            .filter((value): value is string => !!value).map(Number)
        expect(numbers).toEqual(Array.from({ length: 95 }, (_, index) => index + 1))
    })
    it('includes every reading section once with its actual number of pages', () => {
        expect(LEARNING_SECTIONS.map(section => section.id).sort()).toEqual(Object.keys(actualPages).sort())
        for (const section of LEARNING_SECTIONS) {
            expect(section.pageCount, section.id).toBe(actualPages[section.id as keyof typeof actualPages].length)
        }
        const actualTotal = Object.values(actualPages).reduce((sum, pages) => sum + pages.length, 0)
        expect(LEARNING_SECTIONS.reduce((sum, section) => sum + section.pageCount, 0)).toBe(actualTotal)
        expect(actualTotal).toBe(222)
    })

    it('has continuous global reading offsets, including the references', () => {
        let expectedOffset = 0
        for (const section of LEARNING_SECTIONS) {
            expect(section.progressOffset, section.id).toBe(expectedOffset)
            expectedOffset += section.pageCount
        }
        expect(expectedOffset).toBe(222)
    })

    it('keeps its lightweight exercise counts equal to the actual exercises', () => {
        expect(Object.keys(EXERCISE_COUNTS_BY_SECTION).sort()).toEqual(Object.keys(allExercises).sort())
        for (const [sectionId, exercises] of Object.entries(allExercises)) {
            expect(EXERCISE_COUNTS_BY_SECTION[sectionId], sectionId).toBe(exercises.length)
        }
        expect(EXERCISE_COUNTS_BY_SECTION.intro).toBeUndefined()
        expect(Object.values(EXERCISE_COUNTS_BY_SECTION).reduce((sum, count) => sum + count, 0)).toBe(45)
    })

    it('uses the appropriate reading route and clamps unsafe page numbers', () => {
        expect(getLearningReadingUrl('intro')).toBe('/read/intro/1')
        expect(getLearningReadingUrl('library', 12)).toBe('/library/12')
        expect(getLearningReadingUrl('appendix', 20)).toBe('/read/appendix/20')
        expect(getLearningReadingUrl('glossary', 8)).toBe('/read/glossary/8')
        expect(getLearningReadingUrl('section-1', 999)).toBe('/read/section-1/17')
        expect(getLearningReadingUrl('section-1', -1)).toBe('/read/section-1/1')
        expect(getLearningReadingUrl('section-1', 1.5)).toBe('/read/section-1/1')
        expect(getLearningReadingUrl('section-1', Number.NaN)).toBe('/read/section-1/1')
        expect(getLearningReadingUrl('unknown', 1)).toBe('/toc')
    })
})

describe('learning path totals', () => {
    it.each(Object.keys(LEARNING_PATHS) as LearningPathId[])('%s counts its actual pages and exercises', pathId => {
        const path = LEARNING_PATHS[pathId]
        expect(new Set(path.sections).size).toBe(path.sections.length)
        const pages = path.sections.flatMap(id => actualPages[id as keyof typeof actualPages])
        const exercises = path.sections.flatMap(id => allExercises[id] || [])
        expect(pages.every(Boolean)).toBe(true)
        expect(path.totalPages).toBe(pages.length)
        expect(path.exerciseCount).toBe(exercises.length)
        expect(path.exerciseCount).toBe(expectedExerciseCounts[pathId])
        for (const section of LEARNING_SECTIONS) {
            expect(isSectionInPath(section.id, pathId)).toBe(path.sections.includes(section.id))
        }
    })

    it('includes the whole catalog in the comprehensive path', () => {
        expect(LEARNING_PATHS.comprehensive.sections).toEqual(LEARNING_SECTIONS.map(section => section.id))
        expect(LEARNING_PATHS.comprehensive.totalPages).toBe(222)
        expect(getPathCompletion(182, 'comprehensive')).toBeLessThan(100)
        expect(getPathCompletion(222, 'comprehensive')).toBe(100)
    })

    it.each(Object.keys(LEARNING_PATHS) as LearningPathId[])('%s clamps reading progress at its boundaries', pathId => {
        const path = LEARNING_PATHS[pathId]
        const lastSection = LEARNING_SECTIONS.find(section => section.id === path.sections.at(-1))!
        const end = lastSection.progressOffset + lastSection.pageCount
        expect(getPathCompletion(-1, pathId)).toBe(0)
        expect(getPathCompletion(Number.NaN, pathId)).toBe(0)
        expect(getPathCompletion(end, pathId)).toBe(100)
        expect(getPathCompletion(end + 100, pathId)).toBe(100)
    })
})
