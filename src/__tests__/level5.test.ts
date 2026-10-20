import { describe, expect, it } from 'vitest'
import { existsSync } from 'fs'
import { join } from 'path'
import { unit5Data } from '@/data/unit5Data'
import { GRADE_RUBRICS } from '@/data/gradeRubrics'
import { isAcceptedAnswer } from '@/components/reading/AnswerCheck'
import { minutesLeft } from '@/components/reading/CourseMap'
import { COURSE_LEVELS } from '@/data/courseOutline'

const blocks = unit5Data.flatMap(page => page.contentBlocks)
const allText = blocks.flatMap(block => [block.title ?? '', block.content, block.code ?? '', ...(block.items ?? []).map(item => item.content)])
const answer = (title: string, track?: 'accounting' | 'service') =>
    blocks.find(block => block.type === 'answer' && block.track === track && block.title?.includes(title))!

describe('Level 5 — نظام شغلك', () => {
    it('has 7 lessons and a project, about three hours on the planned minutes', () => {
        expect(unit5Data).toHaveLength(8)
        expect(unit5Data.map(p => p.pageNumber)).toEqual([1, 2, 3, 4, 5, 6, 7, 8])
        expect(unit5Data.map(p => p.id)).toEqual([1, 2, 3, 4, 5, 6, 7, 8])
        expect(unit5Data.every(p => p.chapterNumber === 5 && p.minutes)).toBe(true)
        expect(minutesLeft(unit5Data, 1)).toBe(185)
    })

    it('matches the course outline lesson by lesson', () => {
        const level = COURSE_LEVELS.find(l => l.id === 'l5')!
        expect(level.sectionId).toBe('section-5')
        expect(level.lessons).toEqual(unit5Data.map(p => p.title))
    })

    it('grades only with rubrics the server knows, and saves every sheet to the bag', () => {
        const graded = blocks.filter(block => block.type === 'grade')
        expect(graded.map(block => block.rubric)).toEqual(['l5-skill', 'l5-rules', 'l5-report'])
        for (const block of graded) expect(GRADE_RUBRICS[block.rubric!], block.rubric).toBeDefined()
        const bags = blocks.filter(block => block.bag).map(block => block.bag)
        expect(bags).toEqual(['أول سطر قياس', 'قرار الاشتراك', 'أول أتمتة ليك', 'مهارة شغلانتك', 'الكونكتر وصلاحياته', 'قواعد الفريق', 'شنطة التسليم', 'تقرير الـ 3 أيام'])
        expect(unit5Data[7].contentBlocks.some(block => block.rewardId === 'unit5_complete')).toBe(true)
    })

    it('the time sums add up the way the lesson and the answers say', () => {
        // Ahmed: 150 − (10 + 5 + 45) − 20 = 70 · Mona: 80 − (5 + 10 + 25) − 15 = 25
        expect(150 - (10 + 5 + 45) - 20).toBe(70)
        expect(80 - (5 + 10 + 25) - 15).toBe(25)
        expect(isAcceptedAnswer('٧٠', answer('أحمد وفّر', 'accounting').accept!)).toBe(true)
        expect(isAcceptedAnswer('25 دقيقة', answer('منى وفّرت', 'service').accept!)).toBe(true)
        expect(isAcceptedAnswer('44', answer('الساعة اللي اتوفرت').accept!)).toBe(true)
        expect(220 / 5).toBe(44)
        // The worked reports in the project: 150 − 81 − 10 = 59 and 80 − 64 − 5 = 11.
        const report = (track: 'accounting' | 'service') => unit5Data[7].contentBlocks.find(b => b.track === track && b.reveal?.includes('مثال'))!.content
        expect(report('accounting')).toContain('150 − 81 − 10 = 59')
        expect(37 + 23 + 21).toBe(81)
        expect(report('service')).toContain('80 − 64 − 5 = 11')
        expect(30 + 18 + 16).toBe(64)
    })

    it('the skill and connector answers come from the Level 3 reference files', () => {
        expect(isAcceptedAnswer('588', answer('D-112', 'accounting').accept!)).toBe(true)
        expect(4200 * 0.14).toBeCloseTo(588)
        expect(isAcceptedAnswer('بند 4', answer('أنهي بند', 'service').accept!)).toBe(true)
        expect(isAcceptedAnswer('5,000', answer('حد الموافقة', 'accounting').accept!)).toBe(true)
        expect(isAcceptedAnswer('١٤', answer('الاستبدال المجاني', 'service').accept!)).toBe(true)
        const skills = blocks.filter(b => b.type === 'code' && b.title?.includes('مهارة'))
        expect(skills.map(b => b.track)).toEqual(['accounting', 'service'])
        expect(skills[0].code).toContain('أي فاتورة فوق 5,000 جنيه قبل الضريبة')
        expect(skills[1].code).toContain('الاستبدال مجاني خلال 14 يوم من الاستلام')
        for (const skill of skills) expect(skill.code).toMatch(/^الاسم: .+\n\nالوصف: استخدمها لما/)
    })

    it('links only to practice files that exist, and to the workshops', () => {
        const links = allText.flatMap(text => [...text.matchAll(/\]\((\/[^)]+)\)/g)].map(match => match[1]))
        expect(links).toEqual(expect.arrayContaining(['/assets/practice/time-measure.xlsx', '/assets/practice/approved-suppliers.pdf', '/assets/practice/delivery-exchange-policy.pdf', '/workshops']))
        for (const link of links.filter(l => l.startsWith('/assets/'))) expect(existsSync(join(process.cwd(), 'public', link)), link).toBe(true)
    })

    it('dates every box of tool steps, since the tools change monthly', () => {
        const toolBoxes = blocks.filter(b => b.title?.startsWith('🧰'))
        expect(toolBoxes.length).toBe(4)
        for (const box of toolBoxes) expect(box.title, box.title).toMatch(/آخر مراجعة: 20 أكتوبر 2026/)
    })

    it('every quiz has one right option per question', () => {
        for (const block of blocks.filter(b => b.type === 'quiz')) {
            for (const q of block.quiz!) expect(q.answer, q.question).toBeLessThan(q.options.length)
        }
    })

    it('never glues the Arabic «و» to a Latin word (it reads like «g» in Cairo)', () => {
        for (const text of allText) expect(text).not.toMatch(/و[A-Za-z]/)
    })
})
