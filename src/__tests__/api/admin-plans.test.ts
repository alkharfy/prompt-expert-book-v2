import { beforeEach, describe, expect, it, vi } from 'vitest'
const h = vi.hoisted(() => ({ queue: [] as any[], calls: [] as any[], admin: 'admin-1' as string | null }))
vi.mock('@/lib/auth-middleware', () => ({ getAuthenticatedUser: async () => h.admin }))
vi.mock('@/lib/logger', () => ({ dbLogger: { info: vi.fn(), error: vi.fn(), warn: vi.fn() } }))
vi.mock('@/lib/supabase-admin', () => ({ getSupabaseAdmin: () => ({ from(table: string) {
  const chain: any = {}
  for (const method of ['select', 'eq', 'order']) chain[method] = (...args: any[]) => {
    h.calls.push([table, method, ...args]); return chain
  }
  chain.single = () => Promise.resolve(h.queue.shift() || {})
  chain.then = (resolve: any) => Promise.resolve(h.queue.shift() || {}).then(resolve)
  return chain
} }) }))
import { GET } from '@/app/api/admin/plans/route'

const get = (search = '') => GET({ nextUrl: new URL(`https://prompt-mr.com/api/admin/plans${search}`) } as any)
const planCalls = () => h.calls.filter(c => c[0] === 'plans')

beforeEach(() => { h.calls.length = 0; h.queue.length = 0; h.admin = 'admin-1' })

describe('plans listing', () => {
  it('shows the public only active plans, without the status column', async () => {
    h.queue.push({ data: [{ id: 'basic' }] })
    expect((await get()).status).toBe(200)
    expect(planCalls()).toContainEqual(['plans', 'eq', 'is_active', true])
    expect(planCalls().find(c => c[1] === 'select')?.[2]).not.toContain('is_active')
  })

  it('gives an admin every plan with its real status, so a disabled plan can be re-enabled', async () => {
    h.queue.push({ data: { is_admin: true } }, { data: [{ id: 'basic', is_active: false }] })
    const res = await get('?all=1')
    expect(res.status).toBe(200)
    expect((await res.json()).plans).toEqual([{ id: 'basic', is_active: false }])
    expect(planCalls().find(c => c[1] === 'select')?.[2]).toContain('is_active')
    expect(planCalls().some(c => c[1] === 'eq')).toBe(false)
  })

  it('refuses the full listing to non-admins', async () => {
    h.queue.push({ data: { is_admin: false } })
    expect((await get('?all=1')).status).toBe(403)
    expect(planCalls()).toHaveLength(0)
  })
})
