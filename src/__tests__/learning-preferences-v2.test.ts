import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const h = vi.hoisted(() => ({
  from: vi.fn(), select: vi.fn(), eq: vi.fn(), single: vi.fn(), maybeSingle: vi.fn(),
  insert: vi.fn(), update: vi.fn(), updateEq: vi.fn(),
}))
vi.mock('server-only', () => ({}))
vi.mock('@/lib/supabase-admin', () => ({ getSupabaseAdmin: () => ({ from: h.from }) }))

import { getLearningPreferences, saveOnboardingAnswers, validatePreferences } from '@/lib/learning-preferences'

const legacyRow = {
  user_id: 'u1', learning_goal: 'curiosity', specialization: 'general', learning_path: 'comprehensive',
  learning_duration: 'flexible', plan_start_date: '2026-10-01', is_active: true,
}

beforeEach(() => {
  vi.clearAllMocks()
  vi.useFakeTimers({ toFake: ['Date'] })
  vi.setSystemTime(new Date('2026-10-20T12:34:56.000Z'))
  const query = { select: h.select, eq: h.eq, single: h.single, maybeSingle: h.maybeSingle, insert: h.insert, update: h.update }
  h.from.mockReturnValue(query)
  h.select.mockReturnValue(query)
  h.eq.mockReturnValue(query)
  h.single.mockResolvedValue({ data: legacyRow, error: null })
  h.maybeSingle.mockResolvedValue({ data: null, error: null })
  h.insert.mockResolvedValue({ error: null })
  h.update.mockReturnValue({ eq: h.updateEq })
  h.updateEq.mockResolvedValue({ error: null })
})
afterEach(() => vi.useRealTimers())

describe('getLearningPreferences onboarding v2 compatibility', () => {
  it('preserves a legacy goal and leaves unanswered v2 fields null', async () => {
    expect(await getLearningPreferences('u1')).toEqual({
      userId: 'u1', learningGoal: 'curiosity', specialization: 'general', learningPath: 'comprehensive',
      learningDuration: 'flexible', planStartDate: '2026-10-01', isActive: true,
      profession: null, aiLevel: null, dailyMinutes: null, onboardingStatus: null,
    })
    expect(h.from).toHaveBeenCalledExactlyOnceWith('user_learning_preferences')
    expect(h.select).toHaveBeenCalledExactlyOnceWith('*')
    expect(h.eq).toHaveBeenCalledExactlyOnceWith('user_id', 'u1')
    expect(h.single).toHaveBeenCalledOnce()
  })

  it('maps the v2 database columns and a nullable legacy goal', async () => {
    h.single.mockResolvedValue({ data: {
      ...legacyRow, learning_goal: null, profession: 'teacher', ai_level: 'some', daily_minutes: 20, onboarding_status: 'completed',
    }, error: null })
    expect(await getLearningPreferences('u1')).toEqual({
      userId: 'u1', learningGoal: null, specialization: 'general', learningPath: 'comprehensive',
      learningDuration: 'flexible', planStartDate: '2026-10-01', isActive: true,
      profession: 'teacher', aiLevel: 'some', dailyMinutes: 20, onboardingStatus: 'completed',
    })
  })

  it('treats unknown v2 values as unanswered', async () => {
    h.single.mockResolvedValue({ data: {
      ...legacyRow, profession: 'ceo', ai_level: 'expert', daily_minutes: 15, onboarding_status: 'weird',
    }, error: null })
    expect(await getLearningPreferences('u1')).toMatchObject({
      profession: null, aiLevel: null, dailyMinutes: null, onboardingStatus: null,
    })
  })
})

describe('saveOnboardingAnswers', () => {
  it('inserts a new v2 row with compatible legacy defaults and the selected minutes', async () => {
    expect(await saveOnboardingAnswers('u1', {
      profession: 'programmer', aiLevel: 'new', dailyMinutes: 20,
    }, 'completed')).toEqual({ ok: true })
    expect(h.select).toHaveBeenCalledExactlyOnceWith('user_id')
    expect(h.eq).toHaveBeenCalledExactlyOnceWith('user_id', 'u1')
    expect(h.maybeSingle).toHaveBeenCalledOnce()
    expect(h.from.mock.calls).toEqual([['user_learning_preferences'], ['user_learning_preferences']])
    expect(h.insert).toHaveBeenCalledExactlyOnceWith({
      user_id: 'u1', learning_goal: null, specialization: 'programming', learning_path: 'comprehensive',
      learning_duration: '2months', is_active: true, profession: 'programmer', ai_level: 'new', daily_minutes: 20,
      onboarding_status: 'completed', onboarding_version: 2,
      onboarded_at: '2026-10-20T12:34:56.000Z', plan_start_date: '2026-10-20',
    })
    expect(h.update).not.toHaveBeenCalled()
  })

  it('updates an existing row with only the answers supplied and shared plan fields', async () => {
    h.maybeSingle.mockResolvedValue({ data: { user_id: 'u1' }, error: null })
    expect(await saveOnboardingAnswers('u1', { aiLevel: 'some', dailyMinutes: 30 })).toEqual({ ok: true })
    expect(h.update).toHaveBeenCalledExactlyOnceWith({
      learning_path: 'comprehensive', is_active: true, ai_level: 'some', daily_minutes: 30,
      learning_duration: '1month', plan_start_date: '2026-10-20',
    })
    expect(h.updateEq).toHaveBeenCalledExactlyOnceWith('user_id', 'u1')
    expect(h.insert).not.toHaveBeenCalled()
  })

  it('keeps unanswered minutes and AI level out of a partial skip update', async () => {
    h.maybeSingle.mockResolvedValue({ data: { user_id: 'u1' }, error: null })
    expect(await saveOnboardingAnswers('u1', { profession: 'teacher' }, 'skipped')).toEqual({ ok: true })
    expect(h.update).toHaveBeenCalledExactlyOnceWith({
      learning_path: 'comprehensive', is_active: true, profession: 'teacher', specialization: 'general',
      onboarding_status: 'skipped', onboarding_version: 2, onboarded_at: '2026-10-20T12:34:56.000Z',
    })
    const row = h.update.mock.calls[0][0]
    for (const field of ['daily_minutes', 'learning_duration', 'ai_level', 'plan_start_date']) {
      expect(row).not.toHaveProperty(field)
    }
    expect(h.updateEq).toHaveBeenCalledExactlyOnceWith('user_id', 'u1')
    expect(h.insert).not.toHaveBeenCalled()
  })

  it('reports an existing-row read error without inserting or updating', async () => {
    h.maybeSingle.mockResolvedValue({ data: null, error: { message: 'database unavailable' } })
    expect(await saveOnboardingAnswers('u1', { profession: 'teacher' }, 'skipped')).toEqual({
      ok: false, error: 'database unavailable',
    })
    expect(h.insert).not.toHaveBeenCalled()
    expect(h.update).not.toHaveBeenCalled()
  })
})

describe('legacy validatePreferences', () => {
  const preferences = {
    learningGoal: 'curiosity', specialization: 'general', learningPath: 'comprehensive', learningDuration: 'flexible',
  }

  it('continues accepting the legacy preference values', () => {
    expect(validatePreferences(preferences)).toBeNull()
  })

  it('rejects a profession used as a legacy specialization', () => {
    expect(validatePreferences({ ...preferences, specialization: 'teacher' })).toBe('specialization غير صالح')
  })
})
