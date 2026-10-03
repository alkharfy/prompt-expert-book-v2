import { describe, expect, it } from 'vitest'
import { allExercises } from '@/data/exercisesData'
import { runningProjects } from '@/data/runningProjectData'
import { renderPromptTemplate } from '@/lib/prompt-template'
import { evaluateCriterion, hasMeaningfulFieldValue, isSubstantivePrompt, scorePrompt, type ScoringCriterion } from '@/lib/exerciseScoring'

const criteria: ScoringCriterion[] = [
    { id: 'role', name: 'role', weight: 1, check: 'contains_role', description: '' },
    { id: 'context', name: 'context', weight: 1, check: 'has_context', description: '' },
    { id: 'format', name: 'format', weight: 1, check: 'has_format', description: '' },
]
const keywordDump = 'أنت خبير. الجمهور. الهدف 1. بدون. جدول. مثال. خطوة. هذا كلام تجريبي بلا مهمة واضحة ولا معلومات عن مشروع معين ولا مخرج مفيد من أي نوع.'
const usefulPrompt = 'أنت كاتب متخصص. اكتب خطة محتوى لمتجر كتب يستهدف الجمهور المصري من طلاب الجامعة. اعرض جدولًا يضم خمسة منشورات مع الفكرة والهدف، وتجنب ادعاء نتائج مضمونة.'

describe('preliminary prompt structure checks', () => {
    it('rejects a keyword dump that previously received full credit', () => {
        expect(isSubstantivePrompt(keywordDump)).toBe(false)
        expect(scorePrompt(keywordDump, criteria, 20)).toEqual({ score: 0, pointsEarned: 0, passedCriteria: [] })
    })
    it('does not award points for empty or underspecified input', () => {
        expect(scorePrompt('', criteria, 20).pointsEarned).toBe(0)
        expect(evaluateCriterion('أنت خبير. اكتب جدولًا.', criteria[0])).toBe(false)
    })
    it('detects structure in a concrete task without claiming semantic correctness', () => {
        expect(isSubstantivePrompt(usefulPrompt)).toBe(true)
        expect(scorePrompt(usefulPrompt, criteria, 20).score).toBe(100)
    })
    it('accepts all six supplied builder examples', () => {
        const builders = Object.values(allExercises).flat().filter(exercise => exercise.type === 'prompt_builder')
        expect(builders).toHaveLength(6)
        for (const exercise of builders) {
            const values = Object.fromEntries(exercise.steps.map(step => [step.id, step.example]))
            expect(isSubstantivePrompt(renderPromptTemplate(exercise.templateFormat, values), 60), exercise.exerciseId).toBe(true)
        }
    })
    it('accepts the task phrasing used by the project reference prompts', () => {
        for (const project of runningProjects) {
            for (const phase of project.phases) expect(isSubstantivePrompt(phase.idealPrompt, 100), `${project.id}:${phase.index}`).toBe(true)
        }
    })
    it('rejects meaningless fields while permitting short output formats', () => {
        for (const value of ['', ' ', 'ا', 'aaaa', '....']) expect(hasMeaningfulFieldValue(value)).toBe(false)
        for (const value of ['JSON', 'جدول', 'كاتب محتوى']) expect(hasMeaningfulFieldValue(value)).toBe(true)
    })
})
