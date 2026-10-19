import { SECTION_REGISTRY } from '@/config/sections'

/**
 * Finished lessons are stored as '<section>:<page>' in reading_progress.completed_lessons
 * (supabase/migrations/20261019_completed_lessons.sql). A lesson counts as finished when
 * the learner presses «next» at its end.
 */
export const lessonKey = (sectionId: string, page: number) => `${sectionId}:${page}`

export function parseLessonKey(value: unknown): { sectionId: string; page: number } | null {
    if (typeof value !== 'string' || value.length > 40) return null
    const match = /^([a-z0-9-]+):(\d{1,3})$/.exec(value)
    if (!match) return null
    const section = SECTION_REGISTRY.find(item => item.id === match[1])
    const page = Number(match[2])
    if (!section || page < 1 || page > section.pageCount) return null
    return { sectionId: section.id, page }
}

/** Fire-and-forget from the reader; keepalive lets it finish while the next lesson loads. */
export function markLessonDone(sectionId: string, page: number): void {
    try {
        fetch('/api/reading-progress/lesson', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            keepalive: true,
            body: JSON.stringify({ lesson: lessonKey(sectionId, page) }),
        }).catch(() => { /* the TOC falls back to the last page opened */ })
    } catch { /* offline */ }
}
