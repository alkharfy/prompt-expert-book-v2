import { SECTION_REGISTRY } from '@/config/sections'

// These IDs match completeChapter and the existing reading_progress text[] schema.
// Reading is self-reported; a chapter marker does not prove attendance or skill.
export const MAIN_CHAPTER_IDS = SECTION_REGISTRY
    .filter(section => section.sectionNumber > 0)
    .map(section => String(section.chapterIndex))
export const CERTIFICATE_CHAPTER_COUNT = MAIN_CHAPTER_IDS.length
export const CERTIFICATE_COURSE_NAME = 'PromptMaster — إتمام الفصول الأساسية العشرة'

const chapterEndPages: Record<string, number> = Object.fromEntries(
    SECTION_REGISTRY.map(section => [String(section.chapterIndex), section.progressOffset + section.pageCount])
)
chapterEndPages['11'] = 194 // Template library
chapterEndPages['12'] = 214 // Appendix; glossary is bonus content without a chapter marker.

export const FREE_READING_LAST_PAGE = chapterEndPages['1']

export function parseChapterId(value: unknown): string | null {
    const id = typeof value === 'number' && Number.isInteger(value) ? String(value) : value
    return typeof id === 'string' && Object.hasOwn(chapterEndPages, id) ? id : null
}

/** Sanitize legacy stored data without counting duplicate, unknown or malformed IDs. */
export function normalizeCompletedChapters(value: unknown): string[] {
    if (!Array.isArray(value)) return []
    return [...new Set(value.map(parseChapterId).filter((id): id is string => id !== null))]
        .sort((a, b) => Number(a) - Number(b))
}

export function isValidCompletedChapters(value: unknown): value is Array<string | number> {
    return Array.isArray(value) && value.length <= Object.keys(chapterEndPages).length
        && value.every(id => parseChapterId(id) !== null)
        && new Set(value.map(parseChapterId)).size === value.length
}

export function getChapterEndPage(id: string): number | undefined {
    return chapterEndPages[id]
}

export function getMainChapterCompletion(value: unknown): { completed: number; percentage: number; eligible: boolean } {
    const ids = new Set(normalizeCompletedChapters(value))
    const completed = MAIN_CHAPTER_IDS.filter(id => ids.has(id)).length
    return {
        completed,
        percentage: Math.round(completed / CERTIFICATE_CHAPTER_COUNT * 100),
        eligible: completed === CERTIFICATE_CHAPTER_COUNT,
    }
}
