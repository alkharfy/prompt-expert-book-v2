// Onboarding v2 — pure, client-safe logic shared by the onboarding screens,
// the onboarding API and the learning-plan route. No DB, no premium content.

import { LEARNING_SECTIONS, getLearningReadingUrl } from '@/config/learningCatalog'
import { LEARNING_PATHS } from '@/data/learningPaths'
import type {
  AiLevelId,
  DailyMinutes,
  LearningDurationId,
  ProfessionId,
  SpecializationId,
} from '@/types/learning'

export const PROFESSION_IDS: readonly ProfessionId[] = [
  'accounting',
  'hr_admin',
  'teacher',
  'marketing_business',
  'sales_service',
  'student_jobseeker',
  'programmer',
  'other',
]
export const AI_LEVEL_IDS: readonly AiLevelId[] = ['new', 'some', 'daily']
export const DAILY_MINUTES_OPTIONS: readonly DailyMinutes[] = [10, 20, 30]

/** Same reading estimate the plan engine uses for every page. */
export const MINUTES_PER_PAGE = 5

/** Bumped when the questions change, so before/after cohorts can be told apart. */
export const ONBOARDING_VERSION = 2

export const isProfessionId = (value: unknown): value is ProfessionId =>
  typeof value === 'string' && (PROFESSION_IDS as readonly string[]).includes(value)
export const isAiLevelId = (value: unknown): value is AiLevelId =>
  typeof value === 'string' && (AI_LEVEL_IDS as readonly string[]).includes(value)
export const isDailyMinutes = (value: unknown): value is DailyMinutes =>
  typeof value === 'number' && (DAILY_MINUTES_OPTIONS as readonly number[]).includes(value)

/**
 * Professions map onto the older content tracks so tools templates, exercise
 * ordering and subscriber examples keep working. Only these two have tracks.
 */
export const PROFESSION_SPECIALIZATION: Record<ProfessionId, SpecializationId> = {
  accounting: 'general',
  hr_admin: 'general',
  teacher: 'general',
  marketing_business: 'marketing',
  sales_service: 'general',
  student_jobseeker: 'general',
  programmer: 'programming',
  other: 'general',
}

/** Legacy NOT NULL column value; the v2 plan is sized from minutes, not this. */
export function durationBucketForMinutes(minutes: DailyMinutes | null): LearningDurationId {
  if (minutes === 30) return '1month'
  if (minutes === 10 || minutes === 20) return '2months'
  return 'flexible'
}

// ── Reading positions ─────────────────────────────────────────

export interface ReadingPosition {
  sectionId: string
  page: number
}

export type PlanScopeId = 'free' | 'comprehensive'

/** Only the intro is free since 2026-10-16; Level 1 (section-1) is paid (sections.ts freePageLimit). */
export const FREE_SCOPE_SECTIONS: readonly string[] = ['intro']

export function getScopeSections(scope: PlanScopeId): readonly string[] {
  return scope === 'free' ? FREE_SCOPE_SECTIONS : LEARNING_PATHS.comprehensive.sections
}

/** Daily users skip the intro demo and land on p3 «هتتعلم إيه» (level map, last free page). */
export function getLevelStart(level: AiLevelId | null | undefined): ReadingPosition {
  return level === 'daily' ? { sectionId: 'intro', page: 3 } : { sectionId: 'intro', page: 1 }
}

export function readingUrl(position: ReadingPosition): string {
  return getLearningReadingUrl(position.sectionId, position.page)
}

/** `/read/<section>/<page>` → position, clamped to real pages. Anything else → null. */
export function parseReadingPath(path: string | null | undefined): ReadingPosition | null {
  if (typeof path !== 'string') return null
  const match = /^\/read\/([a-z0-9-]+)\/(\d{1,3})\/?$/.exec(path.split(/[?#]/)[0])
  if (!match) return null
  const section = LEARNING_SECTIONS.find(item => item.id === match[1] && item.basePath === `/read/${match[1]}`)
  if (!section) return null
  const page = Number(match[2])
  if (page < 1) return null
  return { sectionId: section.id, page: Math.min(page, section.pageCount) }
}

function sectionOrder(sectionId: string): number {
  return LEARNING_SECTIONS.findIndex(section => section.id === sectionId)
}

/** Negative when `a` comes before `b` in the book. */
export function compareReadingPositions(a: ReadingPosition, b: ReadingPosition): number {
  return sectionOrder(a.sectionId) - sectionOrder(b.sectionId) || a.page - b.page
}

export function laterPosition(a: ReadingPosition, b: ReadingPosition | null | undefined): ReadingPosition {
  return b && compareReadingPositions(b, a) > 0 ? b : a
}

/** Real pages of `scope` at or after `start`. */
export function countPagesFrom(scope: PlanScopeId, start: ReadingPosition): number {
  let pages = 0
  for (const sectionId of getScopeSections(scope)) {
    const section = LEARNING_SECTIONS.find(item => item.id === sectionId)
    if (!section) continue
    for (let page = 1; page <= section.pageCount; page++) {
      if (compareReadingPositions({ sectionId, page }, start) >= 0) pages++
    }
  }
  return pages
}

export function planDaysFor(pages: number, minutes: DailyMinutes): number {
  return pages > 0 ? Math.ceil((pages * MINUTES_PER_PAGE) / minutes) : 0
}

export interface PlanEstimate {
  pagesPerDay: number
  freePages: number
  freeDays: number
  fullPages: number
  fullDays: number
}

export function estimatePlan(minutes: DailyMinutes, start: ReadingPosition): PlanEstimate {
  const freePages = countPagesFrom('free', start)
  const fullPages = countPagesFrom('comprehensive', start)
  return {
    pagesPerDay: Math.max(1, Math.floor(minutes / MINUTES_PER_PAGE)),
    freePages,
    freeDays: planDaysFor(freePages, minutes),
    fullPages,
    fullDays: planDaysFor(fullPages, minutes),
  }
}

// ── Where "start reading" goes ────────────────────────────────

const SAFE_DESTINATION_PREFIXES = ['/read/', '/library/', '/toc', '/exercises', '/tools', '/my-plan', '/profile', '/bookmarks']

/** Internal, allow-listed path or null (never an open redirect). */
export function getSafeDestination(path: string | null | undefined): string | null {
  if (typeof path !== 'string') return null
  const trimmed = path.trim()
  if (!trimmed.startsWith('/') || trimmed.startsWith('//') || trimmed.includes('://') || trimmed.includes('\\')) return null
  return SAFE_DESTINATION_PREFIXES.some(prefix => trimmed.startsWith(prefix)) ? trimmed : null
}

export type DestinationSource = 'next' | 'guest' | 'level'

export interface StartDestination {
  href: string
  source: DestinationSource
  /** Reading position the plan should start from. */
  planStart: ReadingPosition
}

/**
 * Explicit `next` (the page that sent them to sign up) wins; then the last free
 * page they read as a guest, if it is past their level's start; then the start
 * for their level.
 */
export function resolveStartDestination(input: {
  next?: string | null
  guestLastPath?: string | null
  level?: AiLevelId | null
}): StartDestination {
  const levelStart = getLevelStart(input.level)
  const next = getSafeDestination(input.next)
  if (next && next !== '/toc') {
    const nextPosition = parseReadingPath(next)
    return { href: next, source: 'next', planStart: laterPosition(levelStart, nextPosition) }
  }
  const guestPosition = parseReadingPath(input.guestLastPath)
  if (guestPosition && compareReadingPositions(guestPosition, levelStart) > 0) {
    return { href: readingUrl(guestPosition), source: 'guest', planStart: guestPosition }
  }
  return { href: readingUrl(levelStart), source: 'level', planStart: levelStart }
}

/** Last free page a guest opened, so signing up does not send them back to page 1. */
export const GUEST_LAST_PAGE_KEY = 'pm_guest_last_page'
