import { describe, expect, it, vi } from 'vitest'
import { NextRequest } from 'next/server'

const h = vi.hoisted(() => ({ auth: vi.fn(), db: vi.fn(), write: vi.fn() }))
vi.mock('@/lib/auth-middleware', () => ({ getAuthenticatedUser: h.auth }))
vi.mock('@/lib/supabase-admin', () => ({ getSupabaseAdmin: () => ({ from: h.db }) }))
vi.mock('@/lib/learning-plan', () => ({ generatePlanTasks: h.write, savePlan: h.write, getTodayPlan: h.write, getFullPlan: h.write, updateTaskStatus: h.write }))
vi.mock('@/lib/learning-preferences', () => ({ getLearningPreferences: h.write, saveLearningPreferences: h.write, validatePreferences: h.write }))

import { GET as history } from '@/app/api/payments/history/route'
import { POST as intent } from '@/app/api/payment/intent/route'
import { GET as preferences, POST as updatePreferences } from '@/app/api/learning-preferences/route'
import { GET as plan, POST as createPlan, PATCH as updatePlan } from '@/app/api/learning-plan/route'

describe('private endpoints reject a forged user-id cookie', () => {
  it.each([history, intent, preferences, updatePreferences, plan, createPlan, updatePlan])('requires a verified session (%#)', async route => {
    h.auth.mockResolvedValue(null); h.db.mockClear(); h.write.mockClear()
    const request = new NextRequest('http://localhost/api/private', { method: 'POST', body: '{}' })
    ;(request as any)._cookies.set('ebook_user_id', { value: 'victim-id' })
    const response = await route(request)
    expect(response.status).toBe(401)
    expect(h.db).not.toHaveBeenCalled()
    expect(h.write).not.toHaveBeenCalled()
  })
})
