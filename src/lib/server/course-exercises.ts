import 'server-only'
import { introData, unit1Data, unit2Data, unit3Data, unit4Data, unit5Data } from '@/data/bookData'
import { COURSE_LEVELS } from '@/data/courseOutline'
import type { PageContent } from '@/types/book'

/**
 * /exercises (rebuilt 2026-11-01 on the five levels): the practice that lives inside the lessons, listed lesson by
 * lesson. Only each exercise's kind leaves the server, never its question or answer: the page is a map that sends
 * the learner into the lesson, where the exercise uses the lesson's own files and examples.
 */
export type ExerciseKind = 'grade' | 'answer' | 'quiz' | 'checklist'
export type ExerciseTrack = 'accounting' | 'service'

export interface LessonPractice {
    page: number
    title: string
    /** In page order. `track`: only Ahmed's (accounting) or Mona's (service) readers see it. */
    exercises: { kind: ExerciseKind; track?: ExerciseTrack; rubric?: string }[]
}

export interface LevelPractice {
    sectionId: string
    label: string
    name: string
    icon: string
    free: boolean
    lessons: LessonPractice[]
}

const KINDS: readonly string[] = ['grade', 'answer', 'quiz', 'checklist'] satisfies ExerciseKind[]

const SECTION_PAGES: Record<string, PageContent[]> = {
    intro: introData,
    'section-1': unit1Data,
    'section-2': unit2Data,
    'section-3': unit3Data,
    'section-4': unit4Data,
    'section-5': unit5Data,
}

function lessonPractice(page: PageContent, index: number): LessonPractice {
    return {
        page: index + 1,
        title: page.title,
        exercises: page.contentBlocks
            .filter(block => KINDS.includes(block.type))
            .map(block => ({
                kind: block.type as ExerciseKind,
                ...(block.track ? { track: block.track } : {}),
                ...(block.type === 'grade' && block.rubric ? { rubric: block.rubric } : {}),
            })),
    }
}

export function getCoursePractice(): LevelPractice[] {
    return COURSE_LEVELS.map(level => ({
        sectionId: level.sectionId!,
        label: level.label,
        name: level.name,
        icon: level.icon,
        free: !!level.free,
        lessons: (SECTION_PAGES[level.sectionId!] ?? []).map(lessonPractice),
    }))
}

/** What one reader meets in a section: shared exercises plus their own track's (Mona's mirror Ahmed's). */
export function countSectionExercises(sectionId: string, track: ExerciseTrack = 'accounting'): number {
    return (SECTION_PAGES[sectionId] ?? []).map(lessonPractice)
        .reduce((total, lesson) => total + lesson.exercises.filter(exercise => !exercise.track || exercise.track === track).length, 0)
}
