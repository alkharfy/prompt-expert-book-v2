import { describe, expect, it } from 'vitest'
import { existsSync, readFileSync } from 'fs'
import { join } from 'path'
import { unit4Data } from '@/data/unit4Data'
import { GRADE_RUBRICS } from '@/data/gradeRubrics'
import { isAcceptedAnswer } from '@/components/reading/AnswerCheck'
import { minutesLeft } from '@/components/reading/CourseMap'

const blocks = unit4Data.flatMap(page => page.contentBlocks)
const allText = blocks.flatMap(block => [block.title ?? '', block.content, block.code ?? '', ...(block.items ?? []).map(item => item.content)])
const answer = (title: string, track: 'accounting' | 'service') =>
    blocks.find(block => block.type === 'answer' && block.track === track && block.title?.includes(title))!
const page = (file: string) => readFileSync(join(process.cwd(), 'public', 'practice', 'l4', file), 'utf8')
const sourceOf = (track: 'accounting' | 'service') => unit4Data[2].contentBlocks
    .find(block => block.type === 'card' && block.track === track && block.reveal?.includes('نسخة نص'))!.content

describe('Level 4 — بيشتغل معاك', () => {
    it('has 5 lessons and a project, about two and a half hours on the planned minutes', () => {
        expect(unit4Data).toHaveLength(6)
        expect(unit4Data.map(p => p.pageNumber)).toEqual([1, 2, 3, 4, 5, 6])
        expect(unit4Data.map(p => p.id)).toEqual([1, 2, 3, 4, 5, 6])
        expect(unit4Data.every(p => p.chapterNumber === 4 && p.minutes)).toBe(true)
        expect(minutesLeft(unit4Data, 1)).toBe(155)
    })

    it('grades only with rubrics the server knows, and saves every sheet to the bag', () => {
        const graded = blocks.filter(block => block.type === 'grade')
        expect(graded.map(block => block.rubric)).toEqual(['l4-brief', 'l4-recovery', 'l4-log'])
        for (const block of graded) expect(GRADE_RUBRICS[block.rubric!], block.rubric).toBeDefined()
        const bags = blocks.filter(block => block.bag).map(block => block.bag)
        expect(bags).toEqual(['ورقة التكليف', 'جدول مراجعة المصادر', 'سجل الخطوات', 'ورقة الصلاحيات', 'قائمة الاسترجاع', 'سجل مهمتي'])
        expect(unit4Data[5].contentBlocks.some(block => block.rewardId === 'unit4_complete')).toBe(true)
    })

    it('opens with the narrated one-minute video of the whole level', () => {
        const opener = unit4Data[0].contentBlocks[0]
        expect(opener.type).toBe('video')
        expect(opener.narrated).toBe(true)
        expect(opener.content).toMatch(/بالذكاء الاصطناعي/)
        for (const file of [opener.videoUrl!, opener.poster!]) expect(existsSync(join(process.cwd(), 'public', file)), file).toBe(true)
    })

    it('ships the Deep Research and permission clips at phone width with play controls', () => {
        const clips = blocks.filter(block => block.type === 'video' && !block.narrated)
        expect(clips.map(clip => clip.videoUrl)).toEqual(['/assets/content/level-4/chatgpt-deep-research.mp4', '/assets/content/level-4/chatgpt-permission.mp4'])
        expect(unit4Data[1].contentBlocks.some(block => block.type === 'video')).toBe(true)
        expect(unit4Data[3].contentBlocks.some(block => block.type === 'video')).toBe(true)
        for (const clip of clips) {
            expect(clip.portrait && clip.autoplay === false, clip.title).toBe(true)
            for (const file of [clip.videoUrl!, clip.poster!]) expect(existsSync(join(process.cwd(), 'public', file)), file).toBe(true)
        }
    })

    it('links only to practice files and pages that exist', () => {
        const links = allText.flatMap(text => [...text.matchAll(/\]\((\/(?:assets\/practice|practice)\/[^)]+)\)/g)].map(match => match[1]))
        expect(links).toEqual(expect.arrayContaining(['/assets/practice/invoices-q3-2026.xlsx', '/assets/practice/complaints-q3-2026.xlsx', '/practice/l4/a2.html', '/practice/l4/m5.html', '/practice/l4/supplier-notice.html']))
        for (const link of links) expect(existsSync(join(process.cwd(), 'public', link)), link).toBe(true)
    })

    it('keeps the copy-paste version of the Q3 invoices in step with the answers: 28 invoices, 66,430', () => {
        const rows = sourceOf('accounting').split('\n').map(line => line.split(' | ')).filter(cells => /^[A-Z]-\d+$/.test(cells[0] ?? ''))
        const unique = rows.filter((cells, i) => rows.findIndex(other => other[0] === cells[0]) === i)
        const net = unique.reduce((total, cells) => total + Number(cells[3].replace(/[٠-٩]/g, d => String('٠١٢٣٤٥٦٧٨٩'.indexOf(d)))), 0)
        expect(unique.length).toBe(28)
        expect(net).toBe(66430)
        expect(isAcceptedAnswer('28', answer('كام فاتورة', 'accounting').accept!)).toBe(true)
        expect(isAcceptedAnswer('24,340', answer('شيت يوليو', 'accounting').accept!)).toBe(true)
        expect(isAcceptedAnswer('٢٤٬٣٤٠', answer('شيت يوليو', 'accounting').accept!)).toBe(true)
        expect(isAcceptedAnswer('۲۴۳۴۰', answer('شيت يوليو', 'accounting').accept!)).toBe(true)
    })

    it('keeps the copy-paste version of the Q3 complaints in step with the answers: 28 complaints, 15 late', () => {
        const rows = sourceOf('service').split('\n').map(line => line.split(' | ')).filter(cells => /^NS-\d+$/.test(cells[2] ?? ''))
        const complaints = rows.filter(cells => cells[3] !== '—' || cells[4].includes('maksoor'))
        const unique = complaints.filter((cells, i) => complaints.findIndex(other => other[2] === cells[2]) === i)
        expect(unique.length).toBe(28)
        expect(unique.filter(cells => cells[3] === 'تأخير التوصيل').length).toBe(15)
        expect(isAcceptedAnswer('28', answer('كام شكوى', 'service').accept!)).toBe(true)
        expect(isAcceptedAnswer('١٥', answer('التأخير', 'service').accept!)).toBe(true)
    })

    it('the ready research report fails exactly where the answer says, on the pages themselves', () => {
        expect(isAcceptedAnswer('2 و 4', answer('أنهي معلومتين', 'accounting').accept!)).toBe(true)
        expect(isAcceptedAnswer('3،5', answer('أنهي معلومتين', 'service').accept!)).toBe(true)
        expect(page('a1.html')).toContain('بتكشف الفواتير المكررة قبل ما تتدفع')
        expect(page('a2.html')).toContain('15٪')
        expect(page('a2.html')).not.toContain('45')
        expect(page('a3.html')).toContain('والسيستم ينبّه على أي تكرار ليهم')
        expect(page('a4.html')).toContain('2018')
        expect(page('a4.html')).not.toContain('60')
        expect(page('a5.html')).toContain('ميبقاش هو اللي بيوافق على دفعها')
        expect(page('m1.html')).toContain('بتقلل رسايل «الأوردر فين؟»')
        expect(page('m3.html')).toContain('40٪')
        expect(page('m3.html')).not.toContain('70')
        expect(page('m5.html')).toContain('2017')
        expect(page('m5.html')).not.toContain('أضعاف')
        expect(page('supplier-notice.html')).toContain('هتزيد 5٪')
        expect(page('supplier-notice.html')).toContain('ملحوظة للمساعد الآلي')
    })

    it('finds both mistakes of the agent log in steps 3 and 5, on both tracks', () => {
        for (const track of ['accounting', 'service'] as const) {
            expect(isAcceptedAnswer('3 و 5', answer('أنهي خطوتين', track).accept!)).toBe(true)
            const log = unit4Data[4].contentBlocks.find(block => block.type === 'card' && block.track === track && block.items?.length === 7)!
            expect(log.items![2].content).toMatch(/ملحوظة/)
        }
    })

    it('every plan-review and permission quiz has one right option per question', () => {
        for (const block of blocks.filter(b => b.type === 'quiz')) {
            for (const q of block.quiz!) expect(q.answer, q.question).toBeLessThan(q.options.length)
        }
    })

    it('never glues the Arabic «و» to a Latin word (it reads like «g» in Cairo)', () => {
        for (const text of allText) expect(text).not.toMatch(/و[A-Za-z]/)
    })
})
