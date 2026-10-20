import { describe, expect, it } from 'vitest'
import { existsSync } from 'fs'
import { join } from 'path'
import { WORKSHOPS, isOpen, workshopBySlug } from '@/data/workshopsData'
import { isAcceptedAnswer } from '@/components/reading/AnswerCheck'
import { COURSE_EXTRAS } from '@/data/courseOutline'
import { unit1Data } from '@/data/unit1Data'

describe('الورش', () => {
    it('images and video are open and free for everyone; the rest are for subscribers', () => {
        expect(WORKSHOPS.filter(w => w.free).map(w => w.slug)).toEqual(['images', 'video'])
        expect(WORKSHOPS.filter(isOpen).map(w => w.slug)).toEqual(['images', 'video'])
        for (const w of WORKSHOPS) {
            expect(new Set(WORKSHOPS.map(x => x.slug)).size).toBe(WORKSHOPS.length)
            // An open workshop was tried and carries its review date; one still being tried has no blocks.
            if (isOpen(w)) expect(w.reviewed).toBe('20 أكتوبر 2026')
            else expect(w.blocks).toHaveLength(0)
        }
        expect(workshopBySlug('sub-agents')?.free).toBe(false)
    })

    it('every image and video in a workshop is shipped', () => {
        for (const w of WORKSHOPS) for (const b of w.blocks) {
            for (const file of [b.imageUrl, b.videoUrl, b.poster].filter(Boolean) as string[]) {
                expect(existsSync(join(process.cwd(), 'public', file)), file).toBe(true)
            }
        }
    })

    it('the video credits sum matches the free plan we saw: 50 a day, 10 a video', () => {
        const credits = workshopBySlug('video')!.blocks.find(b => b.type === 'answer')!
        expect(isAcceptedAnswer('٥', credits.accept!)).toBe(true)
        expect(50 / 10).toBe(5)
    })

    it('shows from the start of Level 1 and in the course extras', () => {
        expect(COURSE_EXTRAS.some(extra => extra.href === '/workshops')).toBe(true)
        expect(unit1Data[0].contentBlocks[1].content).toContain('(/workshops)')
    })

    it('every quiz has one right option per question', () => {
        for (const w of WORKSHOPS) for (const b of w.blocks.filter(x => x.type === 'quiz')) {
            for (const q of b.quiz!) expect(q.answer, q.question).toBeLessThan(q.options.length)
        }
    })
})
