// Tests for GET /api/resources route
import { describe, it, expect, vi, beforeEach } from 'vitest'
const { authSpy } = vi.hoisted(() => ({ authSpy: vi.fn() }))
vi.mock('@/lib/auth-middleware', () => ({ getAuthenticatedUser: authSpy }))

// Queue-based thenable mock for Supabase fluent chain
const { mockFrom, pushResult, calls } = vi.hoisted(() => {
  const resultQueue: any[] = []
  const allCalls: { method: string; args: any[] }[] = []

  const createChain = (): any => {
    const chain: any = {}
    const methods = ['select', 'eq', 'contains', 'or', 'order', 'insert', 'limit', 'upsert', 'delete', 'maybeSingle']
    methods.forEach(m => {
      chain[m] = (...args: any[]) => {
        allCalls.push({ method: m, args })
        return chain
      }
    })
    // Make chain thenable — Supabase resolves on await
    chain.then = (resolve: any, reject?: any) => {
      const result = resultQueue.shift() || { data: [], error: null }
      return Promise.resolve(result).then(resolve, reject)
    }
    return chain
  }

  const mockFrom = vi.fn((...args: any[]) => {
    allCalls.push({ method: 'from', args })
    return createChain()
  })

  return {
    mockFrom,
    pushResult: (r: any) => resultQueue.push(r),
    calls: {
      get: () => [...allCalls],
      reset: () => { allCalls.length = 0; resultQueue.length = 0 },
      findAll: (method: string) => allCalls.filter(c => c.method === method),
    },
  }
})

vi.mock('@supabase/supabase-js', () => ({
  createClient: () => ({
    from: mockFrom,
  }),
}))

// Mock the seed data
vi.mock('@/data/learningResources', () => ({
  LEARNING_RESOURCES: [
    { title_ar: 'Test Resource', title_en: 'Test', description_ar: 'Desc', url: 'https://test.com', category: 'tool', specialization: ['general'], level: 'beginner', is_free: true, language: 'both', freshness_status: 'fresh', is_model_specific: false },
  ],
  AI_CHANGELOG_SEEDS: [
    { title_ar: 'Test Update', content_ar: 'Content', category: 'update', importance: 'normal', published_at: '2026-03-20' },
  ],
}))

import { GET, POST } from '@/app/api/resources/route'

function createMockRequest(url: string, options?: { method?: string; cookies?: Record<string, string>; body?: unknown }) {
  authSpy.mockResolvedValue(options?.cookies?.ebook_session_token === 'valid-session' ? options.cookies.ebook_user_id : null)
  const req = {
    url,
    method: options?.method || 'GET',
    cookies: {
      get: (name: string) => {
        const cookies = options?.cookies || {}
        return cookies[name] ? { value: cookies[name] } : undefined
      },
    },
    json: async () => options?.body,
  }
  return req as any
}

describe('GET /api/resources', () => {
  beforeEach(() => {
    calls.reset()
    vi.clearAllMocks()
  })

  it('should fetch all active resources', async () => {
    pushResult({ data: [{ id: '1', title_ar: 'ChatGPT' }, { id: '2', title_ar: 'Claude' }], error: null })

    const req = createMockRequest('http://localhost/api/resources')
    const res = await GET(req)
    const data = await res.json()

    expect(calls.findAll('from')[0].args[0]).toBe('learning_resources')
    expect(calls.findAll('select')[0].args[0]).toBe('*')
    expect(calls.findAll('eq').some(c => c.args[0] === 'is_active' && c.args[1] === true)).toBe(true)
    expect(data.resources).toHaveLength(2)
    expect(data.total).toBe(2)
  })

  it('should filter by category', async () => {
    pushResult({ data: [{ id: '1', title_ar: 'Course', category: 'course' }], error: null })

    const req = createMockRequest('http://localhost/api/resources?category=course')
    const res = await GET(req)
    const data = await res.json()

    expect(calls.findAll('eq').some(c => c.args[0] === 'category' && c.args[1] === 'course')).toBe(true)
    expect(data.resources).toHaveLength(1)
  })

  it('should filter by specialization using contains', async () => {
    pushResult({ data: [], error: null })

    const req = createMockRequest('http://localhost/api/resources?specialization=programming')
    await GET(req)

    const containsCalls = calls.findAll('contains')
    expect(containsCalls.length).toBe(1)
    expect(containsCalls[0].args).toEqual(['specialization', ['programming']])
  })

  it('should filter by level', async () => {
    pushResult({ data: [], error: null })

    const req = createMockRequest('http://localhost/api/resources?level=advanced')
    await GET(req)

    expect(calls.findAll('eq').some(c => c.args[0] === 'level' && c.args[1] === 'advanced')).toBe(true)
  })

  it('should filter by search query using or/ilike', async () => {
    pushResult({ data: [], error: null })

    const req = createMockRequest('http://localhost/api/resources?search=ChatGPT')
    await GET(req)

    const orCalls = calls.findAll('or')
    expect(orCalls.length).toBe(1)
    expect(orCalls[0].args[0]).toContain('title_ar.ilike.%ChatGPT%')
    expect(orCalls[0].args[0]).toContain('description_ar.ilike.%ChatGPT%')
    expect(orCalls[0].args[0]).toContain('title_en.ilike.%ChatGPT%')
  })

  it('should not filter when category=all', async () => {
    pushResult({ data: [], error: null })

    const req = createMockRequest('http://localhost/api/resources?category=all')
    await GET(req)

    const categoryCalls = calls.findAll('eq').filter(c => c.args[0] === 'category')
    expect(categoryCalls).toHaveLength(0)
  })

  it('should include is_saved flag for logged-in users', async () => {
    // Resources query result
    pushResult({ data: [{ id: 'res-1', title_ar: 'Saved One' }, { id: 'res-2', title_ar: 'Not Saved' }], error: null })
    // Saved resources query result
    pushResult({ data: [{ resource_id: 'res-1' }], error: null })

    const req = createMockRequest('http://localhost/api/resources', {
      cookies: { ebook_user_id: 'user-123', ebook_session_token: 'valid-session' },
    })
    const res = await GET(req)
    const data = await res.json()

    expect(data.resources[0].is_saved).toBe(true)
    expect(data.resources[1].is_saved).toBe(false)
  })

  it('should filter to saved-only when saved=true', async () => {
    pushResult({ data: [{ id: 'res-1', title_ar: 'Saved One' }, { id: 'res-2', title_ar: 'Not Saved' }], error: null })
    pushResult({ data: [{ resource_id: 'res-1' }], error: null })

    const req = createMockRequest('http://localhost/api/resources?saved=true', {
      cookies: { ebook_user_id: 'user-123', ebook_session_token: 'valid-session' },
    })
    const res = await GET(req)
    const data = await res.json()

    expect(data.resources).toHaveLength(1)
    expect(data.resources[0].title_ar).toBe('Saved One')
  })

  it('should return 500 on database error', async () => {
    pushResult({ data: null, error: { message: 'DB Error' } })

    const req = createMockRequest('http://localhost/api/resources')
    const res = await GET(req)
    const data = await res.json()

    expect(res.status).toBe(500)
    expect(data.error).toBe('DB Error')
  })
})

describe('POST /api/resources (seed)', () => {
  beforeEach(() => {
    calls.reset()
    vi.clearAllMocks()
  })

  it('should require authentication', async () => {
    const req = createMockRequest('http://localhost/api/resources', {
      method: 'POST',
      body: { action: 'seed' },
    })
    const res = await POST(req)
    const data = await res.json()

    expect(res.status).toBe(401)
    expect(data.error).toBe('Unauthorized')
  })

  it('rejects an authenticated non-admin before any seed write', async () => {
    pushResult({ data: { is_admin: false }, error: null })
    const req = createMockRequest('http://localhost/api/resources', {
      method: 'POST', cookies: { ebook_user_id: 'user-123', ebook_session_token: 'valid-session' }, body: { action: 'seed' },
    })
    expect((await POST(req)).status).toBe(403)
    expect(calls.findAll('insert')).toHaveLength(0)
  })

  it('should not seed if resources already exist', async () => {
    pushResult({ data: { is_admin: true }, error: null })
    pushResult({ data: [{ id: 'existing' }], error: null })

    const req = createMockRequest('http://localhost/api/resources', {
      method: 'POST',
      cookies: { ebook_user_id: 'user-123', ebook_session_token: 'valid-session' },
      body: { action: 'seed' },
    })
    const res = await POST(req)
    const data = await res.json()

    expect(data.seeded).toBe(false)
    expect(data.message).toContain('موجودة')
  })

  it('should seed resources when table is empty', async () => {
    pushResult({ data: { is_admin: true }, error: null })
    pushResult({ data: [], error: null })  // check existing
    pushResult({ error: null })            // insert resources
    pushResult({ error: null })            // insert changelog

    const req = createMockRequest('http://localhost/api/resources', {
      method: 'POST',
      cookies: { ebook_user_id: 'user-123', ebook_session_token: 'valid-session' },
      body: { action: 'seed' },
    })
    const res = await POST(req)
    const data = await res.json()

    expect(data.seeded).toBe(true)
    const insertCalls = calls.findAll('insert')
    expect(insertCalls).toHaveLength(2)
  })

  it('should return error for invalid action', async () => {
    pushResult({ data: { is_admin: true }, error: null })
    const req = createMockRequest('http://localhost/api/resources', {
      method: 'POST',
      cookies: { ebook_user_id: 'user-123', ebook_session_token: 'valid-session' },
      body: { action: 'invalid_action' },
    })
    const res = await POST(req)
    const data = await res.json()

    expect(res.status).toBe(400)
    expect(data.error).toBe('Invalid action')
  })
})
