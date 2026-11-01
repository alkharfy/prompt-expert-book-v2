import { SECTION_REGISTRY } from '@/config/sections'

/** Public learning metadata only; no premium lesson text or quiz answers. */
export interface LearningSection {
    id: string
    label: string
    pageCount: number
    slotSize: number
    progressOffset: number
    basePath: string
}

export const LEARNING_SECTIONS: LearningSection[] = [
    ...SECTION_REGISTRY.map(section => ({
        id: section.id,
        label: section.chapterLabel,
        pageCount: section.pageCount,
        slotSize: section.slotSize,
        progressOffset: section.progressOffset,
        basePath: `/read/${section.id}`,
    })),
    { id: 'library', label: 'مكتبة القوالب', pageCount: 12, slotSize: 12, progressOffset: 182, basePath: '/library' },
    { id: 'appendix', label: 'الملحق', pageCount: 20, slotSize: 20, progressOffset: 194, basePath: '/read/appendix' },
    { id: 'glossary', label: 'المصطلحات', pageCount: 8, slotSize: 8, progressOffset: 214, basePath: '/read/glossary' },
]

const LAST_LEVEL = LEARNING_SECTIONS[SECTION_REGISTRY.length - 1]
/** Global pages 96–182 were the old book chapters 6–10, removed on 2026-11-01; the library's pages start at 183. */
const REMOVED_BOOK_PAGES = {
    from: LAST_LEVEL.progressOffset + LAST_LEVEL.slotSize + 1,
    to: LEARNING_SECTIONS.find(section => section.id === 'library')!.progressOffset,
}

/** Resolve a saved global position; unused slots land on the last real page. */
export function getGlobalReadingTarget(globalPage: number): { section: LearningSection; page: number; url: string } | null {
    if (!Number.isInteger(globalPage)) return null
    // A reader saved inside the removed book chapters had already passed Level 5: they stand at its end.
    const removed = globalPage >= REMOVED_BOOK_PAGES.from && globalPage <= REMOVED_BOOK_PAGES.to
    const section = removed ? LAST_LEVEL : LEARNING_SECTIONS.find(item => globalPage > item.progressOffset
        && globalPage <= item.progressOffset + item.slotSize)
    if (!section) return null
    if (removed) return { section, page: section.pageCount, url: getLearningReadingUrl(section.id, section.pageCount) }
    const page = Math.min(globalPage - section.progressOffset, section.pageCount)
    return { section, page, url: getLearningReadingUrl(section.id, page) }
}

export function getGlobalReadingUrl(globalPage: number): string {
    return getGlobalReadingTarget(globalPage)?.url ?? '/toc'
}

// The exercises inside each section's lessons, for the track with fewer (Ahmed's or Mona's); the
// catalog regression test checks them against the lessons. Keeping this lightweight prevents
// importing paid lessons into onboarding bundles.
export const EXERCISE_COUNTS_BY_SECTION: Readonly<Record<string, number>> = {
    intro: 2, 'section-1': 6, 'section-2': 15, 'section-3': 15, 'section-4': 10, 'section-5': 14,
}

export function getLearningReadingUrl(sectionId: string, page: number = 1): string {
    const section = LEARNING_SECTIONS.find(item => item.id === sectionId)
    if (!section) return '/toc'
    const safePage = Number.isInteger(page) ? Math.max(1, Math.min(page, section.pageCount)) : 1
    return `${section.basePath}/${safePage}`
}
