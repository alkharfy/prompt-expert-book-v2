import { describe, expect, it } from 'vitest'
import { existsSync } from 'fs'
import { join } from 'path'
import { unit3Data } from '@/data/unit3Data'
import { GRADE_RUBRICS } from '@/data/gradeRubrics'
import { isAcceptedAnswer } from '@/components/reading/AnswerCheck'
import { minutesLeft } from '@/components/reading/CourseMap'
import { findSensitiveData } from '@/lib/grader'

const blocks = unit3Data.flatMap(page => page.contentBlocks)
const allText = blocks.flatMap(block => [block.content, block.code ?? '', ...(block.items ?? []).map(item => item.content)])
const answer = (title: string) => blocks.find(block => block.type === 'answer' && block.title?.includes(title))!
const vat = (net: number) => Math.round(net * 14) / 100

describe('Level 3 — بتجهّزه لشغلك', () => {
    it('has 7 lessons and a project, about 3 hours on the planned minutes', () => {
        expect(unit3Data).toHaveLength(8)
        expect(unit3Data.map(page => page.pageNumber)).toEqual([1, 2, 3, 4, 5, 6, 7, 8])
        expect(unit3Data.map(page => page.id)).toEqual([1, 2, 3, 4, 5, 6, 7, 8])
        expect(unit3Data.every(page => page.chapterNumber === 3 && page.minutes)).toBe(true)
        expect(minutesLeft(unit3Data, 1)).toBe(195)
    })

    it('ships every step clip (memory 3.2, projects 3.5) and its poster, at phone width with play controls', () => {
        const clips = blocks.filter(block => block.type === 'video' && !block.narrated)
        expect(clips).toHaveLength(4)
        for (const clip of clips) {
            expect(clip.portrait && clip.autoplay === false, clip.title).toBe(true)
            for (const file of [clip.videoUrl!, clip.poster!]) expect(existsSync(join(process.cwd(), 'public', file)), file).toBe(true)
        }
    })

    it('reviews the «ملف شغلي» draft with one line of each kind, on both tracks', () => {
        const reviews = unit3Data[1].contentBlocks.filter(block => block.type === 'quiz' && block.track)
        expect(reviews.map(block => block.track)).toEqual(['accounting', 'service'])
        for (const review of reviews) expect(review.quiz!.map(q => q.answer)).toEqual([0, 1, 2, 2, 3])
    })

    it('grades only with rubrics the server knows', () => {
        const graded = blocks.filter(block => block.type === 'grade')
        expect(graded.map(block => block.rubric)).toEqual(['l3-runbook', 'l3-testsheet', 'l3-fix'])
        for (const block of graded) {
            expect(GRADE_RUBRICS[block.rubric!], block.rubric).toBeDefined()
            expect(GRADE_RUBRICS[block.rubric!].criteria.length).toBeLessThanOrEqual(3)
            expect(block.bag).toBeTruthy()
        }
    })

    it('links only to practice files that exist', () => {
        const links = allText.flatMap(text => [...text.matchAll(/\]\((\/assets\/practice\/[^)]+)\)/g)].map(match => match[1]))
        expect(links).toEqual(expect.arrayContaining(['/assets/practice/approved-suppliers.pdf', '/assets/practice/approved-replies.pdf', '/assets/practice/delivery-exchange-policy.pdf']))
        for (const link of links) expect(existsSync(join(process.cwd(), 'public', link)), link).toBe(true)
    })

    it('gives every test case its own copy button, on both tracks', () => {
        const caseCards = blocks.filter(block => block.copyItems)
        expect(caseCards.map(block => [block.track, block.items?.length])).toEqual([['accounting', 6], ['service', 6], ['accounting', 3], ['service', 3]])
    })

    it('keeps the invoice arithmetic of the exercises right', () => {
        // 3.4: only D-108 is over the 5,000 approval limit.
        expect([vat(2600), vat(1600), vat(6200)]).toEqual([364, 224, 868])
        // 3.5: the normal, missing-number, contract and credit-note cases carry the right VAT; D-112 does not.
        expect([vat(1850), vat(1440), vat(1900), vat(450)]).toEqual([259, 201.6, 266, 63])
        expect(vat(4200)).toBe(588)
        // 3.2: S-801 was written at 10٪.
        expect(vat(1500)).toBe(210)
        // Project: N-1066 counted once and «١٣٦٠» read as 1360; M-240 is over the limit with the right VAT.
        expect([vat(2050), vat(1360), vat(1200), vat(5600)]).toEqual([287, 190.4, 168, 784])
        expect(2050 + 1360 + 1200).toBe(4610)
    })

    it('checks the answers we computed in the file header', () => {
        const ahmedFolder = answer('أحمد كان هيرفعه').accept!
        for (const typed of ['1، 3، 4', '٤،١،٣', '1 و 3 و 4', '1,3,4']) expect(isAcceptedAnswer(typed, ahmedFolder), typed).toBe(true)
        expect(isAcceptedAnswer('3', ahmedFolder)).toBe(false)
        const monaFolder = answer('منى كانت هترفعه').accept!
        for (const typed of ['1، 4', '4 و 1', '١ ٤']) expect(isAcceptedAnswer(typed, monaFolder), typed).toBe(true)
        expect(isAcceptedAnswer('d-108', answer('موافقة المدير المالي').accept!)).toBe(true)
        expect(isAcceptedAnswer('بند 2', answer('من أنهي بند').accept!)).toBe(true)
        expect(isAcceptedAnswer('٤٬٦١٠', answer('الإجمالي قبل الضريبة كام').accept!)).toBe(true)
    })

    it('asks for the prediction before the learner sends the case', () => {
        for (const page of [unit3Data[4], unit3Data[7]]) {
            const kinds = page.contentBlocks.filter(block => block.track === 'accounting').map(block => block.type)
            expect(kinds.indexOf('answer'), page.title).toBeLessThan(kinds.lastIndexOf(page === unit3Data[4] ? 'code' : 'card'))
        }
    })

    it('puts no personal data the grader would block into anything the learner copies', () => {
        const copied = blocks.flatMap(block => [block.code ?? '', ...(block.copyItems ? (block.items ?? []).map(item => item.content) : [])])
        for (const text of copied) expect(findSensitiveData(text), text.slice(0, 40)).toEqual([])
    })

    it('keeps the same words for the reader on both tracks (no feminine instructions to the reader)', () => {
        const service = blocks.filter(block => block.track === 'service').flatMap(block => [block.content, block.code ?? '', block.title ?? '', block.reveal ?? ''])
        for (const text of service) expect(text).not.toMatch(/(?:^|\s)(?:سجّلي|افتحي|انسخي|راجعي|لاحظي|جرّبيها|اطلبي|ابعتي)(?:\s|$)/)
    })

    it('ends with the saved bag, a six-criterion checklist and the level reward', () => {
        const project = unit3Data[7].contentBlocks
        expect(project.some(block => block.type === 'bag')).toBe(true)
        expect(project.find(block => block.type === 'checklist')?.items).toHaveLength(6)
        expect(project.some(block => block.rewardId === 'unit3_complete')).toBe(true)
    })
})
