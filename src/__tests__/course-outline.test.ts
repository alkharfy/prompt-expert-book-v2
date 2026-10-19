import { describe, expect, it } from 'vitest'
import { COURSE_LEVELS, isReleased, lessonHref } from '@/data/courseOutline'
import { SECTION_REGISTRY } from '@/config/sections'
import { buildToc, lessonsWord } from '@/lib/tocProgress'
import { introData } from '@/data/introData'
import { unit1Data } from '@/data/unit1Data'
import { unit2Data } from '@/data/unit2Data'

const PAGES: Record<string, { title: string }[]> = { intro: introData, 'section-1': unit1Data, 'section-2': unit2Data }
const globalPage = (sectionId: string, page: number) => {
    const section = SECTION_REGISTRY.find(s => s.id === sectionId)!
    return section.progressOffset + page
}

describe('course outline (TOC data)', () => {
    it('lists every released lesson under its real page title', () => {
        for (const level of COURSE_LEVELS.filter(isReleased)) {
            const pages = PAGES[level.sectionId!]
            expect(level.lessons).toEqual(pages.map(page => page.title))
            expect(level.lessons.length).toBe(SECTION_REGISTRY.find(s => s.id === level.sectionId)!.pageCount)
            expect(level.chapter).toBe(SECTION_REGISTRY.find(s => s.id === level.sectionId)!.chapterIndex)
        }
    })

    it('links lessons to the reader', () => {
        expect(lessonHref(COURSE_LEVELS[1], 3)).toBe('/read/section-1/4')
    })

    it('says lesson counts in Egyptian', () => {
        expect([1, 2, 3, 10, 11].map(lessonsWord)).toEqual(['درس واحد', 'درسين', '3 دروس', '10 دروس', '11 درس'])
    })
})

describe('where the learner stands in the TOC', () => {
    it('starts a new visitor at the first intro lesson, with paid levels locked and unwritten ones coming soon', () => {
        const view = buildToc({ access: 'guest' })
        expect([view.level, view.lesson]).toEqual([0, 0])
        expect(view.levels).toEqual(['here', 'lock', 'lock', 'soon', 'soon', 'soon'])
        expect(view.available).toBe(21)
    })

    it('remembers the intro page a guest opened last', () => {
        const view = buildToc({ access: 'guest', guestPath: '/read/intro/2' })
        expect([view.level, view.lesson]).toEqual([0, 1])
        expect(view.lessons[0]).toEqual(['done', 'here', 'todo'])
    })

    it('stops a visitor without a plan at the gate of Level 1', () => {
        expect(buildToc({ access: 'guest', guestPath: '/read/section-1/3' }).levels.slice(0, 2)).toEqual(['done', 'gate'])
        const view = buildToc({ access: 'registered', currentPage: 3, completedChapters: [0] })
        expect([view.level, view.lesson]).toEqual([1, 0])
        expect(view.levels[1]).toBe('gate')
        expect(view.lessons[1].every(state => state === 'lock')).toBe(true)
    })

    it('puts a subscriber on the lesson they opened last', () => {
        const view = buildToc({ access: 'member', currentPage: globalPage('section-1', 4), completedChapters: [0] })
        expect([view.level, view.lesson]).toEqual([1, 3])
        expect(view.levels.slice(0, 3)).toEqual(['done', 'here', 'todo'])
        expect(view.done).toBe(3 + 3)
    })

    it('never ticks a level the subscriber skipped', () => {
        const view = buildToc({ access: 'member', currentPage: globalPage('section-2', 2), completedChapters: [] })
        expect(view.levels.slice(0, 3)).toEqual(['done', 'todo', 'here'])
        expect(view.lessons[1].includes('done')).toBe(false)
    })

    it('waits at Level 3 once everything released is finished', () => {
        const view = buildToc({ access: 'member', currentPage: globalPage('section-2', 9), completedChapters: [0, 1, 2] })
        expect(view.level).toBe(3)
        expect(view.levels).toEqual(['done', 'done', 'done', 'waiting', 'soon', 'soon'])
        expect(view.done).toBe(view.available)
    })

    it('sends a subscriber reading an old book chapter back to that page', () => {
        const view = buildToc({ access: 'member', currentPage: globalPage('section-4', 5), completedChapters: [0] })
        expect(view.level).toBe(3)
        expect(view.book).toMatchObject({ n: 4, page: 5, url: '/read/section-4/5' })
        expect(view.levels.slice(0, 3)).toEqual(['done', 'todo', 'todo'])
    })
})
