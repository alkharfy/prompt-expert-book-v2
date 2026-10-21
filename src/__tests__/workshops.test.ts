import { describe, expect, it } from 'vitest'
import { existsSync } from 'fs'
import { join } from 'path'
import { WORKSHOPS, isOpen, workshopBySlug } from '@/data/workshopsData'
import { isAcceptedAnswer } from '@/components/reading/AnswerCheck'
import { COURSE_EXTRAS } from '@/data/courseOutline'
import { unit1Data } from '@/data/unit1Data'

const answerOf = (slug: string) => workshopBySlug(slug)!.blocks.find(b => b.type === 'answer')!

describe('الورش', () => {
    it('images and video are free for everyone; the rest are for subscribers', () => {
        expect(WORKSHOPS.filter(w => w.free).map(w => w.slug)).toEqual(['images', 'video'])
        expect(new Set(WORKSHOPS.map(x => x.slug)).size).toBe(WORKSHOPS.length)
        expect(workshopBySlug('sub-agents')?.free).toBe(false)
    })

    it('every workshop was tried (21 Oct 2026 for the last five) and carries its review date', () => {
        expect(WORKSHOPS.filter(isOpen).map(w => w.slug)).toEqual(['images', 'video', 'ad-script', 'voice', 'talking-photo', 'sub-agents', 'full-ad'])
        for (const w of WORKSHOPS) expect(w.reviewed, w.slug).toMatch(/^2[01] أكتوبر 2026$/)
    })

    it('every image, video and sound in a workshop is shipped', () => {
        for (const w of WORKSHOPS) for (const b of w.blocks) {
            for (const file of [b.imageUrl, b.videoUrl, b.poster, b.audioUrl].filter(Boolean) as string[]) {
                expect(existsSync(join(process.cwd(), 'public', file)), file).toBe(true)
            }
        }
    })

    it('the sums match what we saw on the free plans', () => {
        // Flow: 50 credits a day, 10 a video
        expect(isAcceptedAnswer('٥', answerOf('video').accept!)).toBe(true)
        expect(50 / 10).toBe(5)
        // ChatGPT said «حاسس بريحة العيش السخن؟» was 5 words; it is 4
        expect('حاسس بريحة العيش السخن'.split(' ')).toHaveLength(4)
        expect(isAcceptedAnswer('٤', answerOf('ad-script').accept!)).toBe(true)
        // ElevenLabs: 10,000 credits, one per character, our ad is 163 characters
        expect(Math.floor(10000 / 163)).toBe(61)
        expect(isAcceptedAnswer('61', answerOf('voice').accept!)).toBe(true)
        // the full ad: two talking shots at 10 credits each
        expect(50 - 2 * 10).toBe(30)
        expect(isAcceptedAnswer('٣٠', answerOf('full-ad').accept!)).toBe(true)
    })

    it('the recorded voice text is the script from the ad workshop, with the hour in words', () => {
        const recorded = workshopBySlug('voice')!.blocks.find(b => b.type === 'code')!.code!
        expect(recorded).toHaveLength(163)
        expect(recorded).toContain('سبعة الصبح')
        expect(recorded).not.toMatch(/\d/)
    })

    it('links between workshops point to real workshops', () => {
        const slugs = new Set(WORKSHOPS.map(w => w.slug))
        for (const w of WORKSHOPS) for (const b of w.blocks) {
            const text = [b.content, ...(b.items ?? []).map(i => i.content)].join('\n')
            for (const [, slug] of text.matchAll(/\]\(\/workshops\/([a-z-]+)\)/g)) expect(slugs.has(slug), `${w.slug} → ${slug}`).toBe(true)
        }
    })

    it('never glues «و» to an English word (it renders backwards)', () => {
        for (const w of WORKSHOPS) {
            const texts = [w.title, w.outcome, w.tool, ...w.blocks.flatMap(b => [b.title ?? '', b.content, ...(b.items ?? []).flatMap(i => [i.title, i.content])])]
            for (const text of texts) expect(text, w.slug).not.toMatch(/و[A-Za-z]/)
        }
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
