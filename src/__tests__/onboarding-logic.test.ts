import { describe, expect, it } from 'vitest'
import { LEARNING_PATHS } from '@/data/learningPaths'
import {
  AI_LEVEL_IDS,
  DAILY_MINUTES_OPTIONS,
  PROFESSION_IDS,
  PROFESSION_SPECIALIZATION,
  countPagesFrom,
  durationBucketForMinutes,
  estimatePlan,
  getLevelStart,
  getSafeDestination,
  isAiLevelId,
  isDailyMinutes,
  isProfessionId,
  parseReadingPath,
  resolveStartDestination,
} from '@/lib/onboarding'

const introStart = { sectionId: 'intro', page: 1 }
const dailyStart = { sectionId: 'intro', page: 3 }

describe('onboarding reading estimates', () => {
  it.each([
    [introStart, 3],
    [dailyStart, 1],
    [{ sectionId: 'section-2', page: 1 }, 0],
  ] as const)('counts free pages from %j', (start, pages) => {
    expect(countPagesFrom('free', start)).toBe(pages)
  })

  it.each([
    { minutes: 10, pagesPerDay: 2, freeDays: 2, dailyFreeDays: 1 },
    { minutes: 20, pagesPerDay: 4, freeDays: 1, dailyFreeDays: 1 },
    { minutes: 30, pagesPerDay: 6, freeDays: 1, dailyFreeDays: 1 },
  ] as const)('estimates a $minutes-minute plan from the selected start', ({ minutes, pagesPerDay, freeDays, dailyFreeDays }) => {
    const estimate = estimatePlan(minutes, introStart)
    expect(estimate).toEqual({
      pagesPerDay,
      freePages: 3,
      freeDays,
      fullPages: LEARNING_PATHS.comprehensive.totalPages,
      fullDays: Math.ceil(LEARNING_PATHS.comprehensive.totalPages * 5 / minutes),
    })
    const fromDailyStart = estimatePlan(minutes, dailyStart)
    expect(fromDailyStart.freeDays).toBe(dailyFreeDays)
    expect(fromDailyStart.fullDays).toBe(Math.ceil(fromDailyStart.fullPages * 5 / minutes))
  })

  it.each([null, 'new', 'some'] as const)('starts level %s at intro page 1', level => {
    expect(getLevelStart(level)).toEqual(introStart)
  })

  it('starts daily AI users at intro page 3', () => {
    expect(getLevelStart('daily')).toEqual(dailyStart)
  })
})

describe('onboarding destinations', () => {
  it.each([
    ['/read/section-1/5', { sectionId: 'section-1', page: 5 }],
    ['/read/intro/6', { sectionId: 'intro', page: 3 }],
    ['/read/intro/2?x=1', { sectionId: 'intro', page: 2 }],
    ['/read/intro/2#example', { sectionId: 'intro', page: 2 }],
    ['/read/intro/2?x=1#example', { sectionId: 'intro', page: 2 }],
  ] as const)('parses %s without query or hash and clamps to real pages', (path, position) => {
    expect(parseReadingPath(path)).toEqual(position)
  })

  it.each(['/read/unknown/1', '/tools', 'https://evil.com/read/intro/1', '/read/intro/0', '/library/1', null])('rejects reading path %s', path => {
    expect(parseReadingPath(path)).toBeNull()
  })

  it.each(['/read/section-2/1', '/tools', '/my-plan'])('keeps safe destination %s', path => {
    expect(getSafeDestination(path)).toBe(path)
  })

  it.each(['https://x', '//x', '/admin', '/payment?plan=pro', '/\\evil', null])('rejects unsafe destination %s', path => {
    expect(getSafeDestination(path)).toBeNull()
  })

  it.each([null, '/read/intro/2', '/read/section-1/4', '/read/section-3/1'])('gives an explicit reading next priority over guest position %s', guestLastPath => {
    expect(resolveStartDestination({ next: '/read/section-2/1', guestLastPath, level: 'daily' })).toEqual({
      href: '/read/section-2/1', source: 'next', planStart: { sectionId: 'section-2', page: 1 },
    })
  })

  it.each(['new', 'daily'] as const)('uses the level %s plan start for a tools destination', level => {
    expect(resolveStartDestination({ next: '/tools', guestLastPath: '/read/section-1/4', level })).toEqual({
      href: '/tools', source: 'next', planStart: getLevelStart(level),
    })
  })

  it('ignores a table of contents next and falls through to the guest position', () => {
    expect(resolveStartDestination({ next: '/toc', guestLastPath: '/read/section-1/4', level: 'new' })).toEqual({
      href: '/read/section-1/4', source: 'guest', planStart: { sectionId: 'section-1', page: 4 },
    })
  })

  it('resumes a guest position after a new reader’s start', () => {
    expect(resolveStartDestination({ guestLastPath: '/read/section-1/4', level: 'new' })).toEqual({
      href: '/read/section-1/4', source: 'guest', planStart: { sectionId: 'section-1', page: 4 },
    })
  })

  it('ignores a guest position before the daily reader’s start', () => {
    expect(resolveStartDestination({ guestLastPath: '/read/intro/2', level: 'daily' })).toEqual({
      href: '/read/intro/3', source: 'level', planStart: dailyStart,
    })
  })

  it('defaults to intro page 1 when no destination or level is given', () => {
    expect(resolveStartDestination({})).toEqual({ href: '/read/intro/1', source: 'level', planStart: introStart })
  })
})

describe('onboarding answer compatibility', () => {
  it('maps every profession to its existing specialization', () => {
    expect(Object.keys(PROFESSION_SPECIALIZATION).sort()).toEqual([...PROFESSION_IDS].sort())
    for (const profession of PROFESSION_IDS) {
      expect(PROFESSION_SPECIALIZATION[profession]).toBe(profession === 'programmer'
        ? 'programming' : profession === 'marketing_business' ? 'marketing' : 'general')
    }
  })

  it.each([
    [10, '2months'], [20, '2months'], [30, '1month'], [null, 'flexible'],
  ] as const)('maps %s minutes to legacy duration %s', (minutes, duration) => {
    expect(durationBucketForMinutes(minutes)).toBe(duration)
  })

  it('accepts every supported profession, AI level, and numeric minute option', () => {
    for (const profession of PROFESSION_IDS) expect(isProfessionId(profession)).toBe(true)
    for (const level of AI_LEVEL_IDS) expect(isAiLevelId(level)).toBe(true)
    for (const minutes of DAILY_MINUTES_OPTIONS) expect(isDailyMinutes(minutes)).toBe(true)
  })

  it.each(['ceo', '', null, undefined, 20])('rejects unsupported profession %s', value => {
    expect(isProfessionId(value)).toBe(false)
  })

  it.each(['expert', '', null, undefined, 20])('rejects unsupported AI level %s', value => {
    expect(isAiLevelId(value)).toBe(false)
  })

  it.each([15, '20', '', null, undefined])('rejects unsupported daily minutes %s', value => {
    expect(isDailyMinutes(value)).toBe(false)
  })
})
