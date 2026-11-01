import { describe, expect, it, vi } from 'vitest'
vi.mock('server-only', () => ({}))
import * as book from '@/data/bookData'
import { countSectionExercises } from '@/lib/server/course-exercises'
import { EXERCISE_COUNTS_BY_SECTION, getGlobalReadingTarget, getGlobalReadingUrl, getLearningReadingUrl, LEARNING_SECTIONS } from '@/config/learningCatalog'
import { getPathCompletion, isSectionInPath, LEARNING_PATHS } from '@/data/learningPaths'
import type { LearningPathId } from '@/types/learning'

const actualPages = {
    intro: book.introData,
    'section-1': book.unit1Data, 'section-2': book.unit2Data,
    'section-3': book.unit3Data, 'section-4': book.unit4Data,
    'section-5': book.unit5Data,
    library: book.libraryData, appendix: book.appendixData, glossary: book.glossaryData,
}
const expectedExerciseCounts: Record<LearningPathId, number> = { quick: 23, intermediate: 38, comprehensive: 62 }
/** What one reader meets in a section: the track (Ahmed's or Mona's) with fewer exercises. */
const lessonExercises = (sectionId: string) => Math.min(countSectionExercises(sectionId, 'accounting'), countSectionExercises(sectionId, 'service'))

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
        expect(actualTotal).toBe(83)
    })

    it('has continuous reserved global slots, including the references', () => {
        let expectedOffset = 0
        for (const section of LEARNING_SECTIONS) {
            // 96–182 stay reserved for the removed book chapters 6–10, so saved positions keep their meaning.
            if (section.id === 'library') expectedOffset = 182
            expect(section.progressOffset, section.id).toBe(expectedOffset)
            expect(section.slotSize).toBeGreaterThanOrEqual(section.pageCount)
            expectedOffset += section.slotSize
        }
        expect(expectedOffset).toBe(222)
    })

    it('keeps its lightweight exercise counts equal to the exercises inside the lessons', () => {
        expect(Object.keys(EXERCISE_COUNTS_BY_SECTION)).toEqual(['intro', 'section-1', 'section-2', 'section-3', 'section-4', 'section-5'])
        for (const sectionId of Object.keys(EXERCISE_COUNTS_BY_SECTION)) {
            expect(EXERCISE_COUNTS_BY_SECTION[sectionId], sectionId).toBe(lessonExercises(sectionId))
        }
        expect(Object.values(EXERCISE_COUNTS_BY_SECTION).reduce((sum, count) => sum + count, 0)).toBe(62)
    })

    it('uses the appropriate reading route and clamps unsafe page numbers', () => {
        expect(getLearningReadingUrl('intro')).toBe('/read/intro/1')
        expect(getLearningReadingUrl('library', 12)).toBe('/library/12')
        expect(getLearningReadingUrl('appendix', 20)).toBe('/read/appendix/20')
        expect(getLearningReadingUrl('glossary', 8)).toBe('/read/glossary/8')
        expect(getLearningReadingUrl('section-1', 999)).toBe('/read/section-1/9')
        expect(getLearningReadingUrl('section-1', -1)).toBe('/read/section-1/1')
        expect(getLearningReadingUrl('section-1', 1.5)).toBe('/read/section-1/1')
        expect(getLearningReadingUrl('section-1', Number.NaN)).toBe('/read/section-1/1')
        expect(getLearningReadingUrl('unknown', 1)).toBe('/toc')
    })

    it.each([
        [4, '/read/intro/3'], [6, '/read/intro/3'],
        [17, '/read/section-1/9'], [23, '/read/section-1/9'],
    ])('clamps saved global gap %s to %s', (globalPage, url) => {
        expect(getGlobalReadingUrl(globalPage)).toBe(url)
        expect(getGlobalReadingTarget(globalPage)?.url).toBe(url)
    })

    it.each([96, 100, 182])('puts saved page %s of the removed book chapters at the end of Level 5', globalPage => {
        expect(getGlobalReadingUrl(globalPage)).toBe('/read/section-5/8')
        expect(getGlobalReadingUrl(183)).toBe('/library/1')
    })

    it('keeps every real global position on its original section and page', () => {
        for (const section of LEARNING_SECTIONS) {
            for (let page = 1; page <= section.pageCount; page++) {
                expect(getGlobalReadingTarget(section.progressOffset + page)).toEqual({
                    section, page, url: getLearningReadingUrl(section.id, page),
                })
            }
        }
    })

    it.each([0, -1, 223, 1.5, Number.NaN, Number.POSITIVE_INFINITY])('rejects invalid global position %s', page => {
        expect(getGlobalReadingTarget(page)).toBeNull()
        expect(getGlobalReadingUrl(page)).toBe('/toc')
    })
})

describe('learning path totals', () => {
    it.each(Object.keys(LEARNING_PATHS) as LearningPathId[])('%s counts its actual pages and exercises', pathId => {
        const path = LEARNING_PATHS[pathId]
        expect(new Set(path.sections).size).toBe(path.sections.length)
        const pages = path.sections.flatMap(id => actualPages[id as keyof typeof actualPages])
        const exercises = path.sections.reduce((sum, id) => sum + lessonExercises(id), 0)
        expect(pages.every(Boolean)).toBe(true)
        expect(path.totalPages).toBe(pages.length)
        expect(path.exerciseCount).toBe(exercises)
        expect(path.exerciseCount).toBe(expectedExerciseCounts[pathId])
        for (const section of LEARNING_SECTIONS) {
            expect(isSectionInPath(section.id, pathId)).toBe(path.sections.includes(section.id))
        }
    })

    it('covers the intro and the five levels in the comprehensive path, not the references', () => {
        expect(LEARNING_PATHS.comprehensive.sections).toEqual(['intro', 'section-1', 'section-2', 'section-3', 'section-4', 'section-5'])
        expect(LEARNING_PATHS.comprehensive.totalPages).toBe(43)
        expect(getPathCompletion(78, 'comprehensive')).toBeLessThan(100)
        expect(getPathCompletion(95, 'comprehensive')).toBe(100)
    })

    it.each(Object.keys(LEARNING_PATHS) as LearningPathId[])('%s clamps reading progress at its boundaries', pathId => {
        const path = LEARNING_PATHS[pathId]
        const lastSection = LEARNING_SECTIONS.find(section => section.id === path.sections.at(-1))!
        const end = lastSection.progressOffset + lastSection.slotSize
        expect(getPathCompletion(-1, pathId)).toBe(0)
        expect(getPathCompletion(Number.NaN, pathId)).toBe(0)
        expect(getPathCompletion(end, pathId)).toBe(100)
        expect(getPathCompletion(end + 100, pathId)).toBe(100)
    })
})
