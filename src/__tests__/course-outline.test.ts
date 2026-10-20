import { describe, expect, it } from 'vitest'
import { COURSE_LEVELS, isReleased, lessonHref } from '@/data/courseOutline'
import { SECTION_REGISTRY } from '@/config/sections'
import { buildToc, lessonsWord } from '@/lib/tocProgress'
import { introData } from '@/data/introData'
import { unit1Data } from '@/data/unit1Data'
import { unit2Data } from '@/data/unit2Data'
import { unit3Data } from '@/data/unit3Data'
import { unit4Data } from '@/data/unit4Data'
import { unit5Data } from '@/data/unit5Data'

const PAGES: Record<string, { title: string }[]> = { intro: introData, 'section-1': unit1Data, 'section-2': unit2Data, 'section-3': unit3Data, 'section-4': unit4Data, 'section-5': unit5Data }
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
    it('starts a new visitor at the first intro lesson, with all five paid levels locked', () => {
        const view = buildToc({ access: 'guest' })
        expect([view.level, view.lesson]).toEqual([0, 0])
        expect(view.levels).toEqual(['here', 'lock', 'lock', 'lock', 'lock', 'lock'])
        expect(view.available).toBe(43)
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

    it('reaches the end once all five levels are finished', () => {
        const view = buildToc({ access: 'member', currentPage: globalPage('section-5', 8), completedChapters: [0, 1, 2, 3, 4, 5] })
        expect(view.level).toBe(6)
        expect(view.levels).toEqual(['done', 'done', 'done', 'done', 'done', 'done'])
        expect(view.done).toBe(view.available)
    })

    it('ticks exactly the lessons finished with «next» when there is a per-lesson record', () => {
        const view = buildToc({
            access: 'member', currentPage: globalPage('section-1', 5), completedChapters: [],
            completedLessons: ['intro:1', 'intro:2', 'intro:3', 'section-1:1', 'section-1:3', 'section-2:2'],
        })
        expect([view.level, view.lesson]).toEqual([1, 4])
        expect(view.levels.slice(0, 3)).toEqual(['done', 'here', 'todo'])
        expect(view.lessons[1].slice(0, 6)).toEqual(['done', 'todo', 'done', 'todo', 'here', 'todo'])
        expect(view.lessons[2].slice(0, 3)).toEqual(['todo', 'done', 'todo'])
        expect(view.done).toBe(3 + 2 + 1)
    })

    it('leaves the intro unticked when it was skipped, once lessons are recorded', () => {
        const view = buildToc({ access: 'member', currentPage: globalPage('section-1', 2), completedLessons: ['intro:1'] })
        expect(view.levels[0]).toBe('todo')
        expect(view.lessons[0]).toEqual(['done', 'todo', 'todo'])
    })

    it('opens the gate once every intro lesson is finished', () => {
        const view = buildToc({ access: 'registered', currentPage: 3, completedLessons: ['intro:1', 'intro:2', 'intro:3'] })
        expect([view.level, view.levels[0], view.levels[1]]).toEqual([1, 'done', 'gate'])
    })

    it('sends a subscriber reading an old book chapter back to that page', () => {
        const view = buildToc({ access: 'member', currentPage: globalPage('section-6', 5), completedChapters: [0] })
        expect(view.level).toBe(6)
        expect(view.book).toMatchObject({ n: 6, page: 5, url: '/read/section-6/5' })
        expect(view.levels).toEqual(['done', 'todo', 'todo', 'todo', 'todo', 'todo'])
    })
})
