// Tests for GET /api/ai-updates route
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

import { GET } from '@/app/api/ai-updates/route'

describe('GET /api/ai-updates', () => {
  beforeEach(() => {
    calls.reset()
    vi.clearAllMocks()
  })

  it('should fetch active changelog entries', async () => {
    const mockUpdates = [
      { id: '1', title_ar: 'Claude 4', category: 'new_model', importance: 'high', published_at: '2026-03-20' },
      { id: '2', title_ar: 'GPT-4o update', category: 'update', importance: 'normal', published_at: '2026-03-18' },
    ]
    pushResult({ data: mockUpdates, error: null })

    const res = await GET()
    const data = await res.json()

    expect(calls.findAll('from')[0].args[0]).toBe('ai_changelog')
    expect(calls.findAll('select')[0].args[0]).toBe('*')
    expect(calls.findAll('eq').some(c => c.args[0] === 'is_active' && c.args[1] === true)).toBe(true)
    expect(calls.findAll('order')[0].args).toEqual(['published_at', { ascending: false }])
    expect(calls.findAll('limit')[0].args[0]).toBe(20)
    expect(data.updates).toHaveLength(2)
    expect(data.updates[0].title_ar).toBe('Claude 4')
  })

  it('should return empty array when no updates', async () => {
    pushResult({ data: [], error: null })

    const res = await GET()
    const data = await res.json()

    expect(data.updates).toEqual([])
  })

  it('should handle null data gracefully', async () => {
    pushResult({ data: null, error: null })

    const res = await GET()
    const data = await res.json()

    expect(data.updates).toEqual([])
  })

  it('should return 500 on database error', async () => {
    pushResult({ data: null, error: { message: 'Connection refused' } })

    const res = await GET()
    const data = await res.json()

    expect(res.status).toBe(500)
    expect(data.error).toBe('Connection refused')
  })
})
