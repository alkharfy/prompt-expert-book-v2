import { getGlobalReadingTarget, getLearningReadingUrl } from '@/config/learningCatalog'
import { BOOK_CHAPTERS, COURSE_LEVELS, isReleased } from '@/data/courseOutline'

/**
 * Where a learner stands in the course TOC, worked out from what the site already saves:
 * reading_progress.current_page (the last page opened) and completed_chapters (levels
 * finished from their last page). Guests only have the last free page they opened.
 * There is no per-lesson record yet, so lessons before the current one count as done.
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
        if (lesson === lessons - 1 && finished.has(COURSE_LEVELS[levelIndex].chapter)) { level += 1; lesson = 0 }
    }

    const levels = COURSE_LEVELS.map((item, i): LevelState => {
        if (!isReleased(item)) return i === level ? 'waiting' : 'soon'
        if (i === level) return !member && !item.free ? 'gate' : 'here'
        // ✓ only for a level really finished; one skipped behind the learner stays unticked.
        if (finished.has(item.chapter) || (item.free && i < level)) return 'done'
        return !member && !item.free ? 'lock' : 'todo'
    })
    const lessons = COURSE_LEVELS.map((item, i) => item.lessons.map((_, k): LessonState => {
        const state = levels[i]
        if (state === 'soon' || state === 'waiting') return 'soon'
        if (state === 'here') return k < lesson ? 'done' : k === lesson ? 'here' : 'todo'
        if (state === 'gate') return 'lock'
        return state
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
