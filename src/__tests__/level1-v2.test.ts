import { describe, expect, it } from 'vitest'
import { existsSync } from 'fs'
import { join } from 'path'
import { isValidElement } from 'react'
import { unit1Data } from '@/data/unit1Data'
import { formatInlineMarkdown } from '@/utils/textFormatting'
import { checklistMessage } from '@/components/reading/ChecklistBlock'

const allText = unit1Data.flatMap(page => page.contentBlocks.flatMap(block => [
  block.content, block.code ?? '', block.answer ?? '', ...(block.items ?? []).map(item => item.content),
]))

describe('Level 1 v2', () => {
  it('turns **bold** and [text](url) into elements, and practice files download', () => {
    const parts = formatInlineMarkdown('نزّل [الملف](/assets/practice/عقد-مورد.pdf) وبص على **البند 6**.')
    const link = parts.find(part => isValidElement(part) && part.type === 'a')
    const bold = parts.find(part => isValidElement(part) && part.type === 'strong')
    expect(link && isValidElement(link) && (link.props as { download?: string }).download).toBe('')
    expect(bold && isValidElement(bold) && (bold.props as { children: string }).children).toBe('البند 6')
    expect(parts.some(part => typeof part === 'string' && part.includes('**'))).toBe(false)
  })

  it('links only to practice files that exist', () => {
    const links = allText.flatMap(text => [...text.matchAll(/\]\((\/assets\/practice\/[^)]+)\)/g)].map(match => match[1]))
    const fileLinks = allText.flatMap(text => [...text.matchAll(/\$\{FILES\}([^)\s]+)/g)].map(match => match[1]))
    expect(links.length).toBeGreaterThan(5)
    expect(fileLinks).toHaveLength(0)
    for (const link of links) expect(existsSync(join(process.cwd(), 'public', link)), link).toBe(true)
  })

  it('ends with a six-criterion project checklist and the level reward', () => {
    const project = unit1Data[unit1Data.length - 1].contentBlocks
    const checklist = project.find(block => block.type === 'checklist')
    expect(checklist?.items).toHaveLength(6)
    expect(project.some(block => block.rewardId === 'unit1_complete')).toBe(true)
  })

  it('reports checklist progress in plain Egyptian Arabic', () => {
    expect(checklistMessage(6, 6)).toContain('6 من 6')
    expect(checklistMessage(4, 6)).toContain('فاضل 2')
    expect(checklistMessage(1, 6)).toContain('فاضل 5')
  })
})
