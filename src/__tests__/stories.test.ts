import { describe, expect, it } from 'vitest'
import { existsSync } from 'fs'
import { join } from 'path'
import { introData } from '@/data/introData'
import { unit1Data } from '@/data/unit1Data'
import { unit2Data } from '@/data/unit2Data'
import { unit3Data } from '@/data/unit3Data'
import { unit4Data } from '@/data/unit4Data'
import { unit5Data } from '@/data/unit5Data'

const storiesOf = (pages: typeof introData) =>
  pages.flatMap(page => page.contentBlocks.filter(block => block.type === 'story').map(block => ({ page: page.pageNumber, block })))
const all = [introData, unit1Data, unit2Data, unit3Data, unit4Data, unit5Data].flatMap(storiesOf)

describe('«اتفرج عليه وهو بيعملها» stories', () => {
  it('gives every intro page a story', () => {
    expect([...new Set(storiesOf(introData).map(s => s.page))]).toEqual([1, 2, 3])
  })

  it('ships every frame, with a caption and a ring that stays inside the picture', () => {
    expect(all.length).toBeGreaterThan(20)
    for (const { block } of all) {
      expect(block.frames!.length, block.title).toBeGreaterThan(1)
      for (const frame of block.frames!) {
        expect(existsSync(join(process.cwd(), 'public', frame.src)), frame.src).toBe(true)
        expect(frame.caption.length).toBeGreaterThan(10)
        if (!frame.box) continue
        const { x, y, w, h } = frame.box
        expect(Math.min(x, y, w, h), frame.src).toBeGreaterThanOrEqual(0)
        expect(x + w, frame.src).toBeLessThanOrEqual(101)
        expect(y + h, frame.src).toBeLessThanOrEqual(101)
      }
    }
  })

  it('keeps Ahmed\'s and Mona\'s stories on their own tracks', () => {
    for (const { block } of all) {
      if (block.title!.includes('أحمد') && block.track) expect(block.track, block.title).toBe('accounting')
      if (block.title!.includes('منى')) expect(block.track ?? 'service', block.title).toBe('service')
    }
  })
})
