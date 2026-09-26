// Tests for POST/DELETE /api/resources/[id]/save
import { describe, it, expect, vi, beforeEach } from 'vitest'

// Queue-based thenable mock for Supabase fluent chain
const { mockFrom, pushResult, calls } = vi.hoisted(() => {
  const resultQueue: any[] = []
  const allCalls: { method: string; args: any[] }[] = []

  const createChain = (): any => {
    const chain: any = {}
    const methods = ['select', 'eq', 'contains', 'or', 'order', 'insert', 'limit', 'upsert', 'delete']
    methods.forEach(m => {
      chain[m] = (...args: any[]) => {
        allCalls.push({ method: m, args })
        return chain
      }
    })
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

import { POST, DELETE } from '@/app/api/resources/[id]/save/route'

function createMockRequest(options?: { cookies?: Record<string, string> }) {
  return {
    cookies: {
      get: (name: string) => {
        const cookies = options?.cookies || {}
        return cookies[name] ? { value: cookies[name] } : undefined
      },
    },
  } as any
}

function createMockParams(id: string) {
  return { params: Promise.resolve({ id }) }
}

describe('POST /api/resources/[id]/save', () => {
  beforeEach(() => {
    calls.reset()
    vi.clearAllMocks()
  })

  it('should require authentication', async () => {
    const req = createMockRequest()
    const res = await POST(req, createMockParams('res-1'))
    const data = await res.json()

    expect(res.status).toBe(401)
    expect(data.error).toBe('Unauthorized')
  })

  it('should upsert save for authenticated user', async () => {
    pushResult({ error: null })

    const req = createMockRequest({ cookies: { ebook_user_id: 'user-123' } })
    const res = await POST(req, createMockParams('res-abc'))
    const data = await res.json()

    expect(calls.findAll('from')[0].args[0]).toBe('user_saved_resources')
    const upsertCalls = calls.findAll('upsert')
    expect(upsertCalls.length).toBe(1)
    expect(upsertCalls[0].args[0]).toEqual({ user_id: 'user-123', resource_id: 'res-abc' })
    expect(upsertCalls[0].args[1]).toEqual({ onConflict: 'user_id,resource_id' })
    expect(data.ok).toBe(true)
    expect(data.saved).toBe(true)
  })

  it('should return 500 on database error', async () => {
    pushResult({ error: { message: 'Constraint violation' } })

    const req = createMockRequest({ cookies: { ebook_user_id: 'user-123' } })
    const res = await POST(req, createMockParams('bad-id'))
    const data = await res.json()

    expect(res.status).toBe(500)
    expect(data.error).toBe('Constraint violation')
  })
})

describe('DELETE /api/resources/[id]/save', () => {
  beforeEach(() => {
    calls.reset()
    vi.clearAllMocks()
  })

  it('should require authentication', async () => {
    const req = createMockRequest()
    const res = await DELETE(req, createMockParams('res-1'))
    const data = await res.json()

    expect(res.status).toBe(401)
    expect(data.error).toBe('Unauthorized')
  })

  it('should delete save for authenticated user', async () => {
    pushResult({ error: null })

    const req = createMockRequest({ cookies: { ebook_user_id: 'user-123' } })
    const res = await DELETE(req, createMockParams('res-abc'))
    const data = await res.json()

    expect(calls.findAll('from')[0].args[0]).toBe('user_saved_resources')
    expect(calls.findAll('delete').length).toBe(1)
    expect(data.ok).toBe(true)
    expect(data.saved).toBe(false)
  })

  it('should return 500 on database error', async () => {
    pushResult({ error: { message: 'Delete failed' } })

    const req = createMockRequest({ cookies: { ebook_user_id: 'user-123' } })
    const res = await DELETE(req, createMockParams('bad-id'))
    const data = await res.json()

    expect(res.status).toBe(500)
    expect(data.error).toBe('Delete failed')
  })
})
