import { describe, expect, it } from 'vitest'
import { existsSync } from 'fs'
import { join } from 'path'
import { formatMinutes, minutesLeft, stationFor, stationState } from '@/components/reading/CourseMap'
import { unit1Data } from '@/data/unit1Data'
import { introData } from '@/data/introData'

describe('«إنت هنا» course map', () => {
  it('puts the intro, Level 1, Level 2 and the rest of the book on their own stops', () => {
    expect(stationFor('intro')).toBe('intro')
    expect(stationFor('section-1')).toBe('level-1')
    expect(stationFor('section-2')).toBe('level-2')
    expect(stationFor('section-3')).toBe('level-3')
    expect(stationFor('section-4')).toBe('level-4')
    for (const id of ['section-5', 'section-6', 'section-10']) expect(stationFor(id)).toBe('book')
  })

  it('ticks only the stops the reader finished, not every stop behind them', () => {
    // On Level 2 (index 2) after finishing only the intro (the intro itself is never recorded)
    expect(stationState(0, 2, [])).toBe('done')
    expect(stationState(1, 2, [0])).toBe('skipped')
    expect(stationState(2, 2, [0])).toBe('here')
    expect(stationState(3, 2, [0])).toBe('ahead')
    expect(stationState(1, 2, [0, 1])).toBe('done')
    expect(stationState(1, 3, [2])).toBe('skipped')
  })

  it('counts Level 1 time from the planned lesson minutes, including the current page', () => {
    expect(unit1Data.every(page => page.minutes)).toBe(true)
    expect(minutesLeft(unit1Data, 1)).toBe(180)
    expect(minutesLeft(unit1Data, 9)).toBe(40)
  })

  it('keeps the planned minutes on locked pages, whose content is stripped', () => {
    const locked = unit1Data.map(page => ({ ...page, contentBlocks: [] }))
    expect(minutesLeft(locked, 2)).toBe(170)
  })

  it('says time the Egyptian way', () => {
    expect(formatMinutes(1)).toBe('1 دقيقة')
    expect(formatMinutes(8)).toBe('8 دقايق')
    expect(formatMinutes(20)).toBe('20 دقيقة')
    expect(formatMinutes(60)).toBe('ساعة')
    expect(formatMinutes(88)).toBe('ساعة و30 دقيقة')
    expect(formatMinutes(125)).toBe('ساعتين و5 دقيقة')
  })
})

describe('last free page', () => {
  it('lets the reader try the confidence check before any video, and every video file exists', () => {
    const blocks = introData[introData.length - 1].contentBlocks
    const check = blocks.findIndex(block => block.type === 'confidence')
    expect(check).toBeGreaterThan(-1)
    blocks.forEach((block, index) => {
      if (block.type !== 'video') return
      expect(index).toBeGreaterThan(check)
      for (const file of [block.videoUrl!, block.poster!]) {
        expect(existsSync(join(process.cwd(), 'public', file))).toBe(true)
      }
    })
  })
})
