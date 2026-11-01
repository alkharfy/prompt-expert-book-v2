import type { LearningPath, LearningPathId } from '@/types/learning'
import { LEARNING_SECTIONS, EXERCISE_COUNTS_BY_SECTION } from '@/config/learningCatalog'
import { SECTION_REGISTRY } from '@/config/sections'

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
const INTERMEDIATE_SECTIONS = ['intro', 'section-1', 'section-2', 'section-3']
// The intro and the five levels (the old book chapters 6–10 left on 2026-11-01; the library, appendix and
// glossary are references, not part of a plan).
const COMPREHENSIVE_SECTIONS = SECTION_REGISTRY.map((s) => s.id)

export const LEARNING_PATHS: Record<LearningPathId, LearningPath> = {
    quick: {
        id: 'quick',
        nameAr: 'المسار السريع',
        descriptionAr: 'التمهيد والمستوى 1 و2: تستخدمه صح، وتطلب زي المحترف',
        icon: '⚡',
        sections: QUICK_SECTIONS,
        totalPages: countPages(QUICK_SECTIONS),
        estimatedHours: 4,
        exerciseCount: countExercises(QUICK_SECTIONS),
        features: [
            'بتستخدمه صح',
            'بتطلب زي المحترف',
            '«شنطة طلباتك»',
        ],
    },
    intermediate: {
        id: 'intermediate',
        nameAr: 'المسار المتوسط',
        descriptionAr: 'لحد المستوى 3: مساعد جاهز لشغلانتك',
        icon: '📘',
        sections: INTERMEDIATE_SECTIONS,
        totalPages: countPages(INTERMEDIATE_SECTIONS),
        estimatedHours: 12,
        exerciseCount: countExercises(INTERMEDIATE_SECTIONS),
        features: [
            'كل المسار السريع',
            'بتجهّزه لشغلك',
            '«مساعد شغلانتك»',
        ],
    },
    comprehensive: {
        id: 'comprehensive',
        nameAr: 'المسار الشامل',
        descriptionAr: 'التمهيد والمستويات الخمسة، بتمارينها',
        icon: '🏆',
        sections: COMPREHENSIVE_SECTIONS,
        totalPages: countPages(COMPREHENSIVE_SECTIONS),
        estimatedHours: 20,
        exerciseCount: countExercises(COMPREHENSIVE_SECTIONS),
        features: [
            'المستويات الخمسة',
            'بيشتغل معاك',
            'نظام شغلك',
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

    const pathEndPage = lastSection.progressOffset + lastSection.slotSize
    const clamped = Number.isFinite(currentPage) ? Math.max(0, Math.min(currentPage, pathEndPage)) : 0
    return Math.round((clamped / pathEndPage) * 100)
}
