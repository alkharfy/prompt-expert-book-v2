import { getGlobalReadingTarget, getLearningReadingUrl } from '@/config/learningCatalog'
import { BOOK_CHAPTERS, COURSE_LEVELS, isReleased } from '@/data/courseOutline'

/**
 * Where a learner stands in the course TOC, worked out from what the site saves:
 * reading_progress.current_page (the last page opened), completed_chapters (levels finished
 * from their last page) and completed_lessons (each lesson finished with «next»).
 * Guests, and readers saved before completed_lessons existed, have no per-lesson record:
 * then the lessons before the last page opened count as done.
 */
export type Access = 'guest' | 'registered' | 'member'
export type LevelState = 'done' | 'here' | 'gate' | 'lock' | 'todo' | 'soon' | 'waiting'
export type LessonState = 'done' | 'here' | 'lock' | 'todo' | 'soon'

export interface TocInput {
    access: Access
    /** reading_progress.current_page, for signed-in readers. */
    currentPage?: number | null
    /** Reader path a guest opened last, e.g. /read/intro/2. */
    guestPath?: string | null
    completedChapters?: number[]
    /** '<section>:<page>' keys; undefined when there is no per-lesson record. */
    completedLessons?: string[] | null
}

export interface TocView {
    /** Level index the robot stands at; COURSE_LEVELS.length = the whole course is done. */
    level: number
    /** Lesson inside that level (0 when the robot waits at the station). */
    lesson: number
    /** Reading an old book chapter: continue there. */
    book: { n: number; title: string; page: number; url: string } | null
    levels: LevelState[]
    lessons: LessonState[][]
    done: number
    available: number
}

const N = COURSE_LEVELS.length
const firstUnreleased = () => { const i = COURSE_LEVELS.findIndex(level => !isReleased(level)); return i === -1 ? N : i }

function parseReaderPath(path: string | null | undefined): { sectionId: string; page: number } | null {
    const match = /^\/read\/(intro|section-\d+)\/(\d+)/.exec(path ?? '')
    return match ? { sectionId: match[1], page: Number(match[2]) } : null
}

function position(input: TocInput): { sectionId: string; page: number } | null {
    if (input.access === 'guest') return parseReaderPath(input.guestPath)
    const target = input.currentPage ? getGlobalReadingTarget(input.currentPage) : null
    return target ? { sectionId: target.section.id, page: target.page } : null
}

export function buildToc(input: TocInput): TocView {
    const member = input.access === 'member'
    const finished = new Set(input.completedChapters ?? [])
    const tracked = Array.isArray(input.completedLessons)
    const lessonsDone = new Set(input.completedLessons ?? [])
    const lessonDone = (i: number, k: number) => lessonsDone.has(`${COURSE_LEVELS[i].sectionId}:${k + 1}`)
    const levelFinished = (i: number) => finished.has(COURSE_LEVELS[i].chapter)
        || (tracked && isReleased(COURSE_LEVELS[i]) && COURSE_LEVELS[i].lessons.every((_, k) => lessonDone(i, k)))
    const pos = position(input)
    const levelIndex = pos ? COURSE_LEVELS.findIndex(level => level.sectionId === pos.sectionId) : -1
    const chapter = pos && levelIndex === -1 ? BOOK_CHAPTERS.find(c => `section-${c.n}` === pos.sectionId) : undefined

    let level = 0, lesson = 0, book: TocView['book'] = null
    if (chapter && pos) {
        // Old book chapters stand in for Levels 3–5, so the robot waits at Level 3.
        level = firstUnreleased()
        book = { n: chapter.n, title: chapter.title, page: pos.page, url: getLearningReadingUrl(pos.sectionId, pos.page) }
    } else if (levelIndex !== -1 && pos) {
        const lessons = COURSE_LEVELS[levelIndex].lessons.length
        level = levelIndex
        lesson = Math.max(0, Math.min(pos.page, lessons) - 1)
        // Finished the level on its last page: the next step is the next level.
        if (lesson === lessons - 1 && levelFinished(levelIndex)) { level += 1; lesson = 0 }
    }

    const levels = COURSE_LEVELS.map((item, i): LevelState => {
        if (!isReleased(item)) return i === level ? 'waiting' : 'soon'
        if (i === level) return !member && !item.free ? 'gate' : 'here'
        // ✓ only for a level really finished; one skipped behind the learner stays unticked.
        if (levelFinished(i) || (!tracked && item.free && i < level)) return 'done'
        return !member && !item.free ? 'lock' : 'todo'
    })
    const lessons = COURSE_LEVELS.map((item, i) => item.lessons.map((_, k): LessonState => {
        const state = levels[i]
        if (state === 'soon' || state === 'waiting') return 'soon'
        if (state === 'done') return 'done'
        if (state === 'gate' || state === 'lock') return 'lock'
        if (state === 'here' && k === lesson) return 'here'
        if (tracked) return lessonDone(i, k) ? 'done' : 'todo'
        return state === 'here' && k < lesson ? 'done' : 'todo'
    }))
    let done = 0, available = 0
    COURSE_LEVELS.forEach((item, i) => {
        if (!isReleased(item)) return
        available += item.lessons.length
        done += lessons[i].filter(state => state === 'done').length
    })
    return { level, lesson, book, levels, lessons, done, available }
}

/** «درس واحد / درسين / 3 دروس / 11 درس» */
export function lessonsWord(n: number): string {
    if (n === 1) return 'درس واحد'
    if (n === 2) return 'درسين'
    return `${n} ${n >= 3 && n <= 10 ? 'دروس' : 'درس'}`
}
