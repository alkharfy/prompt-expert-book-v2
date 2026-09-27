import { beforeEach, describe, expect, it, vi } from 'vitest'
const h = vi.hoisted(() => ({
  queue: [] as any[], calls: [] as any[], admin: 'admin-1' as string | null,
  auth: { getUserByEmail: vi.fn(), createUser: vi.fn(), updateUser: vi.fn(), deleteUser: vi.fn() },
}))
vi.mock('@/lib/auth-middleware', () => ({ getAuthenticatedUser: async () => h.admin }))
vi.mock('@/lib/firebase_admin', () => ({ adminAuth: h.auth }))
vi.mock('@/lib/password', () => ({ hashPassword: async (p: string) => `hash:${p}` }))
vi.mock('@/lib/email', () => ({ ensureEmailPreferences: vi.fn(async () => {}) }))
vi.mock('@/lib/logger', () => ({ dbLogger: { info: vi.fn(), error: vi.fn(), warn: vi.fn() } }))
vi.mock('@/lib/supabase-admin', () => ({ getSupabaseAdmin: () => ({ from(table: string) {
  const chain: any = {}
  for (const method of ['select', 'eq', 'gt', 'lte', 'is', 'order', 'limit', 'update', 'insert']) chain[method] = (...args: any[]) => {
    h.calls.push([table, method, ...args]); return chain
  }
  chain.single = chain.maybeSingle = () => Promise.resolve(h.queue.shift() || {})
  chain.then = (resolve: any) => Promise.resolve(h.queue.shift() || {}).then(resolve)
  return chain
} }) }))
import { POST } from '@/app/api/admin/accounts/route'
import { POST as extend } from '@/app/api/admin/subscriptions/extend/route'

const body = { fullName: 'موظف تجربة', email: 'Staff@Client.com', planId: 'vip', durationDays: 90 }
const post = (b: unknown = body) => POST({ json: async () => b } as any)
const inserted = (table: string) => h.calls.find(c => c[0] === table && c[1] === 'insert')?.[2]

beforeEach(() => {
  h.calls.length = 0; h.queue.length = 0; h.admin = 'admin-1'; vi.clearAllMocks()
  h.auth.getUserByEmail.mockRejectedValue(Object.assign(new Error('not found'), { code: 'auth/user-not-found' }))
  h.auth.createUser.mockResolvedValue({ uid: 'fb-new' })
})

describe('admin free accounts', () => {
  it('refuses non-admins before touching Firebase', async () => {
    h.queue.push({ data: { is_admin: false } })
    expect((await post()).status).toBe(403)
    expect(h.auth.createUser).not.toHaveBeenCalled()
  })

  it('rejects an unsupported duration', async () => {
    h.queue.push({ data: { is_admin: true } })
    expect((await post({ ...body, durationDays: 7 })).status).toBe(400)
  })

  it('creates a full account with a one-time password and a payment-less active subscription', async () => {
    h.queue.push({ data: { is_admin: true } }, { data: null }, { data: { id: 'u-new' } }, {}, { data: { id: 'sub-1' } })
    const res = await post()
    const json = await res.json()
    expect(res.status).toBe(200)
    expect(json.account.password).toMatch(/^[A-HJ-NP-Za-km-z2-9]{12}$/)
    expect(h.auth.createUser).toHaveBeenCalledWith(expect.objectContaining({ email: 'staff@client.com', emailVerified: true, password: json.account.password }))
    expect(inserted('users')).toMatchObject({ email: 'staff@client.com', firebase_uid: 'fb-new', is_active: true, current_plan: 'vip', password_hash: `hash:${json.account.password}` })
    const sub = inserted('subscriptions')
    expect(sub).toMatchObject({ user_id: 'u-new', plan_id: 'vip', payment_id: null, status: 'active' })
    const days = (Date.parse(sub.expires_at) - Date.parse(sub.starts_at)) / 86400000
    expect(days).toBeCloseTo(90, 0)
  })

  it('grants the plan to an existing account without resetting its password', async () => {
    h.queue.push({ data: { is_admin: true } }, { data: { id: 'u1', full_name: 'Existing' } }, { data: null }, {}, { data: { id: 'sub-2' } }, {})
    const json = await (await post()).json()
    expect(json.ok).toBe(true)
    expect(json.existingAccount).toBe(true)
    expect(json.account.password).toBeNull()
    expect(h.auth.createUser).not.toHaveBeenCalled()
    expect(h.auth.updateUser).not.toHaveBeenCalled()
    expect(h.calls).toContainEqual(['users', 'update', expect.objectContaining({ current_plan: 'vip', is_active: true })])
  })

  it('does not stack a free plan on top of an active subscription', async () => {
    h.queue.push({ data: { is_admin: true } }, { data: { id: 'u1' } }, { data: { id: 's1', expires_at: new Date(Date.now() + 86400000).toISOString() } })
    expect((await post()).status).toBe(409)
    expect(inserted('subscriptions')).toBeUndefined()
  })

  it('adopts an orphaned Firebase login instead of failing on "email exists"', async () => {
    h.auth.getUserByEmail.mockResolvedValue({ uid: 'fb-old' })
    h.queue.push({ data: { is_admin: true } }, { data: null }, { data: { id: 'u-new' } }, {}, { data: { id: 'sub-1' } })
    expect((await post()).status).toBe(200)
    expect(h.auth.updateUser).toHaveBeenCalledWith('fb-old', expect.objectContaining({ emailVerified: true }))
    expect(h.auth.createUser).not.toHaveBeenCalled()
    expect(inserted('users')).toMatchObject({ firebase_uid: 'fb-old' })
  })

  it('extends a lapsed subscription from today, not from its old expiry', async () => {
    const lapsed = new Date(Date.now() - 200 * 86400000).toISOString()
    h.queue.push({ data: { is_admin: true } }, { data: { id: 's1', user_id: 'u1', plan_id: 'pro', expires_at: lapsed, status: 'cancelled' } }, {}, {})
    const json = await (await extend({ json: async () => ({ subscriptionId: 's1', days: 30 }) } as any)).json()
    expect(json.success).toBe(true)
    expect((Date.parse(json.subscription.new_expiry) - Date.now()) / 86400000).toBeCloseTo(30, 0)
    expect(h.calls).toContainEqual(['users', 'update', expect.objectContaining({ current_plan: 'pro', is_active: true })])
  })

  it('rolls back the new Firebase user when the database insert fails', async () => {
    h.queue.push({ data: { is_admin: true } }, { data: null }, { data: null, error: { message: 'boom' } })
    expect((await post()).status).toBe(500)
    expect(h.auth.deleteUser).toHaveBeenCalledWith('fb-new')
    expect(inserted('subscriptions')).toBeUndefined()
  })
})
