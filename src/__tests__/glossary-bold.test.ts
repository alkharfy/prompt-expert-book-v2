import { describe, expect, it } from 'vitest'
import { createElement, isValidElement } from 'react'
import { formatTextWithGlossary } from '@/utils/textFormatting'

const Term = ({ displayText }: { termId: string; displayText: string }) => createElement('span', null, displayText)

describe('pages with glossary terms (Level 2) still show bold text', () => {
  it('turns **text** into bold instead of printing the stars', () => {
    const parts = formatTextWithGlossary('✅ **للأداة، وهو بيراجع:** ملخص الفواتير', [{ termId: 'ai', patterns: ['الأداة'] }], Term)
    expect(parts.some(part => typeof part === 'string' && part.includes('**'))).toBe(false)
    expect(parts.some(part => isValidElement(part) && part.type === 'strong')).toBe(true)
  })

  it('still links bare site names and marks glossary words', () => {
    const parts = formatTextWithGlossary('افتح gemini.google.com واسأل الأداة', [{ termId: 'ai', patterns: ['الأداة'] }], Term)
    expect(parts.some(part => isValidElement(part) && part.type === 'a')).toBe(true)
    expect(parts.some(part => isValidElement(part) && part.type === Term)).toBe(true)
  })
})
