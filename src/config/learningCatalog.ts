import { SECTION_REGISTRY } from '@/config/sections'

/** Public learning metadata only; no premium lesson text or quiz answers. */
export interface LearningSection {
    id: string
    label: string
    pageCount: number
    progressOffset: number
    basePath: string
}

export const LEARNING_SECTIONS: LearningSection[] = [
    ...SECTION_REGISTRY.map(section => ({
        id: section.id,
        label: section.chapterLabel,
        pageCount: section.pageCount,
        progressOffset: section.progressOffset,
        basePath: `/read/${section.id}`,
    })),
    { id: 'library', label: 'مكتبة القوالب', pageCount: 12, progressOffset: 182, basePath: '/library' },
    { id: 'appendix', label: 'الملحق', pageCount: 20, progressOffset: 194, basePath: '/read/appendix' },
    { id: 'glossary', label: 'المصطلحات', pageCount: 8, progressOffset: 214, basePath: '/read/glossary' },
]

// Checked against the exercise data by the catalog regression test. Keeping this
// lightweight prevents importing paid questions/answers into onboarding bundles.
export const EXERCISE_COUNTS_BY_SECTION: Readonly<Record<string, number>> = {
    'section-1': 5, 'section-2': 5, 'section-3': 5, 'section-4': 4,
    'section-5': 5, 'section-6': 4, 'section-7': 5, 'section-8': 4,
    'section-9': 4, 'section-10': 4,
}

export function getLearningReadingUrl(sectionId: string, page: number = 1): string {
    const section = LEARNING_SECTIONS.find(item => item.id === sectionId)
    if (!section) return '/toc'
    const safePage = Number.isInteger(page) ? Math.max(1, Math.min(page, section.pageCount)) : 1
    return `${section.basePath}/${safePage}`
}
