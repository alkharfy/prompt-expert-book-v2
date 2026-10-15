import { beforeEach, describe, expect, it, vi } from 'vitest'
import { NextRequest } from 'next/server'

const h = vi.hoisted(() => ({ auth: vi.fn(), save: vi.fn(), createPlan: vi.fn() }))
vi.mock('@/lib/auth-middleware', () => ({ getAuthenticatedUser: h.auth }))
vi.mock('@/lib/learning-preferences', () => ({ saveOnboardingAnswers: h.save }))
vi.mock('@/lib/learning-plan', () => ({ createMinutesPlan: h.createPlan }))

import { POST } from '@/app/api/onboarding/route'

const request = (body: unknown) => new NextRequest('http://localhost/api/onboarding', {
  method: 'POST', body: JSON.stringify(body),
})

beforeEach(() => {
  vi.clearAllMocks()
  h.auth.mockResolvedValue('u1')
  h.save.mockResolvedValue({ ok: true })
  h.createPlan.mockResolvedValue({ ok: true, created: true, scope: 'free', totalDays: 4 })
})

describe('POST /api/onboarding', () => {
  it('requires a verified session before saving answers or creating a plan', async () => {
    h.auth.mockResolvedValue(null)
    const response = await POST(request({ status: 'completed', dailyMinutes: 20 }))
    expect(response.status).toBe(401)
    expect(h.save).not.toHaveBeenCalled()
    expect(h.createPlan).not.toHaveBeenCalled()
  })

  it.each([
    ['missing status', {}],
    ['unknown status', { status: 'done' }],
    ['unknown profession', { status: 'completed', profession: 'ceo' }],
    ['unknown AI level', { status: 'completed', aiLevel: 'expert' }],
    ['unsupported minutes', { status: 'completed', dailyMinutes: 15 }],
    ['minutes as a string', { status: 'completed', dailyMinutes: '20' }],
    ['array body', []],
  ])('rejects %s without writes', async (_label, body) => {
    const response = await POST(request(body))
    expect(response.status).toBe(400)
    expect(h.save).not.toHaveBeenCalled()
    expect(h.createPlan).not.toHaveBeenCalled()
  })

  it('rejects malformed JSON without writes', async () => {
    const malformed = new NextRequest('http://localhost/api/onboarding', { method: 'POST', body: '{' })
    // setup.ts accepts raw bodies; real NextRequest.json() rejects malformed JSON.
    vi.spyOn(malformed, 'json').mockRejectedValue(new SyntaxError('Unexpected end of JSON input'))
    const response = await POST(malformed)
    expect(response.status).toBe(400)
    expect(h.save).not.toHaveBeenCalled()
    expect(h.createPlan).not.toHaveBeenCalled()
  })

  it('saves only the answers given when onboarding is skipped', async () => {
    const response = await POST(request({ status: 'skipped', profession: 'teacher' }))
    expect(response.status).toBe(200)
    expect(h.save).toHaveBeenCalledExactlyOnceWith('u1', { profession: 'teacher' }, 'skipped')
    expect(h.createPlan).not.toHaveBeenCalled()
    expect(await response.json()).toEqual({ ok: true, plan: null })
  })

  it('saves completed answers and creates a minutes plan from the requested reading page', async () => {
    const response = await POST(request({
      profession: 'accounting', aiLevel: 'new', dailyMinutes: 20,
      status: 'completed', startPath: '/read/section-2/1',
    }))
    expect(response.status).toBe(200)
    expect(h.save).toHaveBeenCalledExactlyOnceWith('u1', {
      profession: 'accounting', aiLevel: 'new', dailyMinutes: 20,
    }, 'completed')
    expect(h.createPlan).toHaveBeenCalledExactlyOnceWith('u1', {
      dailyMinutes: 20, aiLevel: 'new', startFrom: { sectionId: 'section-2', page: 1 },
    })
    expect(await response.json()).toEqual({
      ok: true,
      plan: { created: true, existing: false, scope: 'free', totalDays: 4, failed: false },
    })
  })

  it('ignores an external start path', async () => {
    const response = await POST(request({ status: 'completed', dailyMinutes: 20, startPath: 'https://evil.com' }))
    expect(response.status).toBe(200)
    expect(h.createPlan).toHaveBeenCalledExactlyOnceWith('u1', {
      dailyMinutes: 20, aiLevel: null, startFrom: null,
    })
  })

  it('does not create a plan when completion has no daily minutes', async () => {
    const response = await POST(request({ status: 'completed', profession: 'accounting', aiLevel: 'new' }))
    expect(response.status).toBe(200)
    expect(h.save).toHaveBeenCalledExactlyOnceWith('u1', { profession: 'accounting', aiLevel: 'new' }, 'completed')
    expect(h.createPlan).not.toHaveBeenCalled()
    expect(await response.json()).toEqual({ ok: true, plan: null })
  })

  it('reports a failed save without attempting to create a plan', async () => {
    h.save.mockResolvedValue({ ok: false })
    const response = await POST(request({ status: 'completed', dailyMinutes: 20 }))
    expect(response.status).toBe(500)
    expect(await response.json()).toEqual({ ok: false, error: 'save_failed' })
    expect(h.createPlan).not.toHaveBeenCalled()
  })

  it('keeps saved answers successful while reporting plan creation failure', async () => {
    h.createPlan.mockResolvedValue({ ok: false, created: false })
    const response = await POST(request({ status: 'completed', dailyMinutes: 20 }))
    expect(response.status).toBe(200)
    expect(h.save).toHaveBeenCalledExactlyOnceWith('u1', { dailyMinutes: 20 }, 'completed')
    expect(await response.json()).toEqual({
      ok: true,
      plan: { created: false, existing: false, scope: null, totalDays: null, failed: true },
    })
  })
})
