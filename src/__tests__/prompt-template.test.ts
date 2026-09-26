import { describe, expect, it } from 'vitest'
import { renderPromptTemplate } from '@/lib/prompt-template'
import { allExercises } from '@/data/exercisesData'

describe('prompt builder regression', () => {
  it('substitutes every field in all existing builder exercises', () => {
    const builders = Object.values(allExercises).flat().filter(e => e.type === 'prompt_builder')
    expect(builders).toHaveLength(6)
    for (const exercise of builders) {
      const values = Object.fromEntries(exercise.steps.map(step => [step.id, `إجابة ${step.id}`]))
      const output = renderPromptTemplate(exercise.templateFormat, values)
      for (const step of exercise.steps) {
        expect(output).toContain(values[step.id])
        expect(output).not.toContain(`[${step.id}]`)
      }
    }
  })
  it('supports both placeholder formats, repetitions and literal replacement text', () => {
    expect(renderPromptTemplate('[goal] {{goal}} [unknown]', { goal: '$& [goal] {{goal}}' }))
      .toBe('$& [goal] {{goal}} $& [goal] {{goal}} [unknown]')
  })
  it('does not substitute inherited object properties', () => {
    expect(renderPromptTemplate('[toString]', {})).toBe('[toString]')
  })
})
