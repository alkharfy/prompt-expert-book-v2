import type { LearningPath, LearningPathId } from '@/types/learning'
import { LEARNING_SECTIONS, EXERCISE_COUNTS_BY_SECTION } from '@/config/learningCatalog'

/* ──────────────────────────────────────────────
   Section → Page count helper
   ────────────────────────────────────────────── */
function countPages(sectionIds: string[]): number {
    return LEARNING_SECTIONS.filter(section => sectionIds.includes(section.id))
        .reduce((total, section) => total + section.pageCount, 0)
}

function countExercises(sectionIds: string[]): number {
    return sectionIds.reduce((total, id) => total + (EXERCISE_COUNTS_BY_SECTION[id] || 0), 0)
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
const COMPREHENSIVE_SECTIONS = LEARNING_SECTIONS.map((s) => s.id)

export const LEARNING_PATHS: Record<LearningPathId, LearningPath> = {
    quick: {
        id: 'quick',
        nameAr: 'المسار السريع',
        descriptionAr: 'أساسيات البرومبت — مثالي لأول تجربة سريعة',
        icon: '⚡',
        sections: QUICK_SECTIONS,
        totalPages: countPages(QUICK_SECTIONS),
        estimatedHours: 4,
        exerciseCount: countExercises(QUICK_SECTIONS),
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
        exerciseCount: countExercises(INTERMEDIATE_SECTIONS),
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
        descriptionAr: 'الفصول العشرة والمراجع والتمارين؛ مراحل المشروع تُضاف عند توفر أدوات البرومبت في باقتك',
        icon: '🏆',
        sections: COMPREHENSIVE_SECTIONS,
        totalPages: countPages(COMPREHENSIVE_SECTIONS),
        estimatedHours: 20,
        exerciseCount: countExercises(COMPREHENSIVE_SECTIONS),
        features: [
            'كل المحتوى',
            'وكلاء الذكاء الاصطناعي',
            'مكتبة القوالب',
            'مراحل المشروع الممتد عند توفر الأدوات في الباقة',
            'شهادة إتمام وفق متطلباتها وباقتك',
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
    8: 'section-8',
    9: 'section-9',
    10: 'section-10',
    11: 'library',
    12: 'appendix',
}

/** Check if a roadmap chapter index is included in a path */
export function isChapterInPath(
    chapterIndex: number,
    pathId: LearningPathId,
): boolean {
    const sectionId = CHAPTER_TO_SECTION[chapterIndex]
    if (!sectionId) {
        return false
    }
    return isSectionInPath(sectionId, pathId)
}

/** Reading resume position; visiting a page does not prove earlier pages were completed. */
export function getPathCompletion(
    currentPage: number,
    pathId: LearningPathId,
): number {
    const path = LEARNING_PATHS[pathId]
    // Last section in this path
    const lastSectionId = path.sections[path.sections.length - 1]
    const lastSection = LEARNING_SECTIONS.find((s) => s.id === lastSectionId)
    if (!lastSection) return 0

    const pathEndPage = lastSection.progressOffset + lastSection.pageCount
    const clamped = Number.isFinite(currentPage) ? Math.max(0, Math.min(currentPage, pathEndPage)) : 0
    return Math.round((clamped / pathEndPage) * 100)
}
