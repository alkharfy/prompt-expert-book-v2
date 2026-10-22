import 'server-only'
import { introData, unit2Data, unit3Data, unit4Data, unit5Data } from '@/data/bookData'

/**
 * The ready-made prompts shown on the page of each graded exercise, by rubric id. A learner who pastes
 * one of these back gets «اكتب طلبك إنت» instead of a grade (src/lib/grader.ts, copiedFromSample).
 */
const samples = new Map<string, string[]>()
for (const pages of [introData, unit2Data, unit3Data, unit4Data, unit5Data]) {
    for (const page of pages) {
        const codes = page.contentBlocks.filter(block => block.type === 'code' && block.code).map(block => block.code!)
        for (const block of page.contentBlocks) {
            if (block.type !== 'grade') continue
            // A guided project grades each step on its own rubric.
            for (const id of [block.rubric, ...(block.steps || []).map(step => step.rubric)]) {
                if (id) samples.set(id, [...(samples.get(id) || []), ...codes])
            }
        }
    }
}

export function lessonSamples(rubricId: string): string[] {
    return samples.get(rubricId) || []
}
