import { describe, expect, it } from 'vitest'
import { existsSync } from 'fs'
import { join } from 'path'
import { unit2Data } from '@/data/unit2Data'
import { introData } from '@/data/introData'
import { GRADE_RUBRICS } from '@/data/gradeRubrics'
import { isAcceptedAnswer } from '@/components/reading/AnswerCheck'
import { minutesLeft } from '@/components/reading/CourseMap'

const blocks = unit2Data.flatMap(page => page.contentBlocks)
const allText = blocks.flatMap(block => [block.content, block.code ?? '', ...(block.items ?? []).map(item => item.content)])
const answer = (title: string) => blocks.find(block => block.type === 'answer' && block.title?.includes(title))!

describe('Level 2 — بتطلب زي المحترف', () => {
    it('has 8 lessons and a project, about 3 hours on the planned minutes', () => {
        expect(unit2Data).toHaveLength(9)
        expect(unit2Data.map(page => page.pageNumber)).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9])
        expect(unit2Data.every(page => page.chapterNumber === 2 && page.minutes)).toBe(true)
        expect(minutesLeft(unit2Data, 1)).toBe(180)
    })

    it('grades only with rubrics the server knows, and the intro has the free demo', () => {
        const graded = blocks.filter(block => block.type === 'grade')
        expect(graded.length).toBeGreaterThanOrEqual(8)
        for (const block of graded) expect(GRADE_RUBRICS[block.rubric!], block.rubric).toBeDefined()
        expect(graded.some(block => block.rubric === 'l2-bag' && block.bag)).toBe(true)
        const demo = introData.flatMap(page => page.contentBlocks).find(block => block.type === 'grade')
        expect(demo?.rubric).toBe('intro-demo')
    })

    it('links only to practice files that exist', () => {
        const links = allText.flatMap(text => [...text.matchAll(/\]\((\/assets\/practice\/[^)]+)\)/g)].map(match => match[1]))
        expect(links).toEqual(expect.arrayContaining(['/assets/practice/receipts-oct-2026.jpg', '/assets/practice/order-invoice-photo.jpg']))
        for (const link of links) expect(existsSync(join(process.cwd(), 'public', link)), link).toBe(true)
    })

    it('checks the answers we computed in the file header', () => {
        expect(isAcceptedAnswer('6178.8', answer('سريع للشحن').accept!)).toBe(true)
        expect(isAcceptedAnswer('٦١٧٨٫٨', answer('سريع للشحن').accept!)).toBe(true)
        expect(isAcceptedAnswer('٣', answer('حالتها «مستني رد»').accept!)).toBe(true)
        expect(isAcceptedAnswer('405', answer('الإيصالين').accept!)).toBe(true)
        expect(isAcceptedAnswer('ns-5530', answer('رقم الطلب اللي في الفاتورة').accept!)).toBe(true)
        expect(isAcceptedAnswer('يوم الاربعاء', answer('التقرير لازم يخلص').accept!)).toBe(true)
        expect(isAcceptedAnswer('4', answer('كام عملية مختلفة').accept!)).toBe(true)
        expect(isAcceptedAnswer('اربعه', answer('كام عملية مختلفة').accept!)).toBe(true)
        expect(isAcceptedAnswer('١٥', answer('بعد التنضيف').accept!)).toBe(true)
        expect(isAcceptedAnswer('NS-5559', answer('ليها نوعين').accept!)).toBe(true)
    })

    it('reconciles the bank exercise: the two balances meet after the four differences', () => {
        const bank = 50000 - 4250 + 3420 - 1900 - 1350 - 75 + 8000
        const books = 50000 - 4250 + 3240 - 1900 - 1350 - 2375 + 8000 + 12000
        expect(bank).toBe(53845)
        expect(books).toBe(63365)
        expect(books + 180 - 75).toBe(bank + 12000 - 2375)
    })

    it('keeps the same words for the reader on both tracks (no feminine instructions to the reader)', () => {
        const service = blocks.filter(block => block.track === 'service').flatMap(block => [block.content, block.code ?? '', block.title ?? '', block.reveal ?? ''])
        for (const text of service) expect(text).not.toMatch(/(?:^|\s)(?:سجّلي|افتحي|انسخي|راجعي|لاحظي|جرّبيها|اطلبي)(?:\s|$)/)
    })

    it('ends with the saved bag, a six-criterion checklist and the level reward', () => {
        const project = unit2Data[8].contentBlocks
        expect(project.some(block => block.type === 'bag')).toBe(true)
        expect(project.find(block => block.type === 'checklist')?.items).toHaveLength(6)
        expect(project.some(block => block.rewardId === 'unit2_complete')).toBe(true)
    })
})
