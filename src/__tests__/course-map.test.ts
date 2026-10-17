import { describe, expect, it } from 'vitest'
import { existsSync } from 'fs'
import { join } from 'path'
import { formatMinutes, minutesLeft, stationFor } from '@/components/reading/CourseMap'
import { unit1Data } from '@/data/unit1Data'
import { introData } from '@/data/introData'

describe('«إنت هنا» course map', () => {
  it('puts the intro, Level 1 and the rest of the book on their own stops', () => {
    expect(stationFor('intro')).toBe('intro')
    expect(stationFor('section-1')).toBe('level-1')
    for (const id of ['section-2', 'section-6', 'section-10']) expect(stationFor(id)).toBe('book')
  })

  it('counts Level 1 time from the planned lesson minutes, including the current page', () => {
    expect(unit1Data.every(page => page.minutes)).toBe(true)
    expect(minutesLeft(unit1Data, 1)).toBe(133)
    expect(minutesLeft(unit1Data, 7)).toBe(20)
  })

  it('keeps the planned minutes on locked pages, whose content is stripped', () => {
    const locked = unit1Data.map(page => ({ ...page, contentBlocks: [] }))
    expect(minutesLeft(locked, 2)).toBe(123)
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

describe('«هتتعلم إيه» video', () => {
  it('opens the last free page with the narrated Level 1 video, and its files exist', () => {
    const page = introData[introData.length - 1]
    const video = page.contentBlocks[0]
    expect(video).toMatchObject({ type: 'video', narrated: true })
    for (const file of [video.videoUrl!, video.poster!]) {
      expect(existsSync(join(process.cwd(), 'public', file))).toBe(true)
    }
  })
})
