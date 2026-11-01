import { beforeEach, describe, expect, it, vi } from 'vitest'
const h = vi.hoisted(() => ({
  user: 'u1' as string | null, row: null as any, failTables: [] as string[], calls: [] as any[],
  auth: { deleteUser: vi.fn() }, cookies: [] as any[],
}))
// The shared next/server mock has no cookies; the route clears the login cookies on success.
vi.mock('next/server', () => ({ NextResponse: { json: (body: unknown, init?: { status?: number }) => ({
  status: init?.status ?? 200,
  json: async () => body,
  cookies: { set: (...args: any[]) => h.cookies.push(args) },
}) } }))
vi.mock('@/lib/auth-middleware', () => ({ getAuthenticatedUser: async () => h.user }))
vi.mock('@/lib/firebase_admin', () => ({ adminAuth: h.auth }))
vi.mock('@/lib/logger', () => ({ authLogger: { info: vi.fn(), error: vi.fn(), warn: vi.fn() } }))
vi.mock('@/lib/supabase-admin', () => ({ getSupabaseAdmin: () => ({ from(table: string) {
  const chain: any = {}
  for (const method of ['select', 'eq', 'delete', 'update']) chain[method] = (...args: any[]) => {
    h.calls.push([table, method, ...args]); return chain
  }
  chain.maybeSingle = () => Promise.resolve({ data: h.row, error: null })
  chain.then = (resolve: any) => Promise.resolve({ error: h.failTables.includes(table) ? { message: 'x' } : null }).then(resolve)
  return chain
} }) }))
import { DELETE } from '@/app/api/user/account/route'

const del = (confirm: unknown = 'احذف') => DELETE({ json: async () => ({ confirm }) } as any)
const did = (table: string, method: string) => h.calls.some(c => c[0] === table && c[1] === method)

beforeEach(() => {
  h.user = 'u1'; h.calls.length = 0; h.cookies.length = 0; h.failTables = []; vi.clearAllMocks()
  h.row = { id: 'u1', email: 'Mona@Example.com', firebase_uid: 'fb-1', is_admin: false }
})

describe('DELETE /api/user/account', () => {
  it('needs a signed-in reader', async () => {
    h.user = null
    expect((await del()).status).toBe(401)
    expect(h.calls).toHaveLength(0)
  })

  it('does nothing without the typed confirm word', async () => {
    expect((await del('delete')).status).toBe(400)
    expect(h.calls).toHaveLength(0)
  })

  it('refuses an admin account', async () => {
    h.row = { ...h.row, is_admin: true }
    expect((await del()).status).toBe(403)
    expect(did('users', 'update')).toBe(false)
    expect(h.auth.deleteUser).not.toHaveBeenCalled()
  })

  it('removes the learner data, anonymises the row, deletes the Firebase login and clears the cookies', async () => {
    const res = await del(' احذف ')
    expect(res.status).toBe(200)
    for (const table of ['sessions', 'reading_progress', 'user_notes', 'chat_messages', 'certificates', 'user_learning_preferences']) {
      expect(h.calls).toContainEqual([table, 'eq', 'user_id', 'u1'])
      expect(did(table, 'delete')).toBe(true)
    }
    // Payments stay for the books, tied to the anonymised row.
    expect(did('payments', 'delete')).toBe(false)
    expect(did('subscriptions', 'delete')).toBe(false)
    expect(h.calls).toContainEqual(['lead_magnet_subscribers', 'eq', 'email', 'mona@example.com'])
    const update = h.calls.find(c => c[0] === 'users' && c[1] === 'update')?.[2]
    expect(update).toMatchObject({ email: 'deleted-u1@deleted.invalid', full_name: 'حساب محذوف', phone_number: null, firebase_uid: null, password_hash: '' })
    expect(h.auth.deleteUser).toHaveBeenCalledWith('fb-1')
    expect(h.cookies.map(c => [c[0], c[1], c[2].maxAge])).toEqual([
      ['ebook_session_token', '', 0], ['ebook_user_id', '', 0], ['ebook_device_id', '', 0],
    ])
  })

  it('still finishes when one table is missing, as long as the row is anonymised', async () => {
    h.failTables = ['user_badges']
    expect((await del()).status).toBe(200)
  })

  it('reports a failure when the row itself cannot be anonymised', async () => {
    h.failTables = ['users']
    expect((await del()).status).toBe(500)
    expect(h.auth.deleteUser).not.toHaveBeenCalled()
  })
})
