import type { LearningPath, LearningPathId } from '@/types/learning'
import { SECTION_REGISTRY } from '@/config/sections'

/* ──────────────────────────────────────────────
   Section → Page count helper
   ────────────────────────────────────────────── */
function countPages(sectionIds: string[]): number {
    let total = 0
    for (let i = 0; i < SECTION_REGISTRY.length; i++) {
        if (!sectionIds.includes(SECTION_REGISTRY[i].id)) continue
        const nextOffset =
            i + 1 < SECTION_REGISTRY.length
                ? SECTION_REGISTRY[i + 1].progressOffset
                : SECTION_REGISTRY[i].progressOffset + SECTION_REGISTRY[i].pageCount
        total += nextOffset - SECTION_REGISTRY[i].progressOffset
    }
    return total
}

/* ──────────────────────────────────────────────
   The three learning paths
   ────────────────────────────────────────────── */
const QUICK_SECTIONS = ['intro', 'section-1', 'section-2']
const INTERMEDIATE_SECTIONS = [
    'intro',
    'section-1',
    'section-2',
    'section-3',
    'section-4',
    'section-5',
    'section-6',
]
const COMPREHENSIVE_SECTIONS = SECTION_REGISTRY.map((s) => s.id)

export const LEARNING_PATHS: Record<LearningPathId, LearningPath> = {
    quick: {
        id: 'quick',
        nameAr: 'المسار السريع',
        descriptionAr: 'أساسيات البرومبت — مثالي لأول تجربة سريعة',
        icon: '⚡',
        sections: QUICK_SECTIONS,
        totalPages: countPages(QUICK_SECTIONS),
        estimatedHours: 4,
        exerciseCount: 5,
        features: [
            'ما هو AI التوليدي',
            'أساسيات البرومبتات',
            'أول تقنيات التواصل',
        ],
    },
    intermediate: {
        id: 'intermediate',
        nameAr: 'المسار المتوسط',
        descriptionAr: 'تعمّق في تقنيات البرومبت والأدوات',
        icon: '📘',
        sections: INTERMEDIATE_SECTIONS,
        totalPages: countPages(INTERMEDIATE_SECTIONS),
        estimatedHours: 12,
        exerciseCount: 20,
        features: [
            'كل محتوى المسار السريع',
            'إطار GOLDS',
            'البرومبتات المتسلسلة',
            'ضمان الجودة',
            'الذكاء متعدد الوسائط',
        ],
    },
    comprehensive: {
        id: 'comprehensive',
        nameAr: 'المسار الشامل',
        descriptionAr: 'إتقان كامل — كل المحتوى + المشروع الممتد',
        icon: '🏆',
        sections: COMPREHENSIVE_SECTIONS,
        totalPages: countPages(COMPREHENSIVE_SECTIONS),
        estimatedHours: 20,
        exerciseCount: 40,
        features: [
            'كل المحتوى',
            'وكلاء الذكاء الاصطناعي',
            'مكتبة القوالب',
            'المشروع الممتد',
            'شهادة إتمام',
        ],
    },
}

/* ──────────────────────────────────────────────
   Helpers
   ────────────────────────────────────────────── */

/** Check if a section is included in a given learning path */
export function isSectionInPath(
    sectionId: string,
    pathId: LearningPathId,
): boolean {
    return LEARNING_PATHS[pathId].sections.includes(sectionId)
}

/** Map chapter index (0-based from RoadmapPath chapters array) to section id */
export const CHAPTER_TO_SECTION: Record<number, string> = {
    0: 'intro',
    1: 'section-1',
    2: 'section-2',
    3: 'section-3',
    4: 'section-4',
    5: 'section-5',
    6: 'section-6',
    7: 'section-7',
    // 8 = library, 9 = appendix — only in comprehensive
}

/** Check if a roadmap chapter index is included in a path */
export function isChapterInPath(
    chapterIndex: number,
    pathId: LearningPathId,
): boolean {
    const sectionId = CHAPTER_TO_SECTION[chapterIndex]
    if (!sectionId) {
        // Library (8) and Appendix (9) only in comprehensive
        return pathId === 'comprehensive'
    }
    return isSectionInPath(sectionId, pathId)
}

/** Calculate path completion % from global page number and completed chapters */
export function getPathCompletion(
    currentPage: number,
    pathId: LearningPathId,
): number {
    const path = LEARNING_PATHS[pathId]
    // Last section in this path
    const lastSectionId = path.sections[path.sections.length - 1]
    const lastSection = SECTION_REGISTRY.find((s) => s.id === lastSectionId)
    if (!lastSection) return 0

    const lastSectionIdx = SECTION_REGISTRY.indexOf(lastSection)
    const pathEndPage =
        lastSectionIdx + 1 < SECTION_REGISTRY.length
            ? SECTION_REGISTRY[lastSectionIdx + 1].progressOffset
            : lastSection.progressOffset + lastSection.pageCount

    const clamped = Math.min(currentPage, pathEndPage)
    return Math.round((clamped / pathEndPage) * 100)
}
