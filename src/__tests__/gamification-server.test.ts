import { beforeEach, describe, expect, it, vi } from 'vitest'
// The browser proxy fetches a relative /api URL — on the server that always fails,
// which silently dropped mission, note and reading points in production.
const proxyUsed = vi.hoisted(() => ({ count: 0 }))
vi.mock('@/lib/supabase_proxy', () => ({
  supabaseProxy: new Proxy({}, { get: () => { proxyUsed.count++; throw new Error('browser proxy used on the server') } }),
}))
vi.mock('@/lib/logger', () => ({ dbLogger: { info: vi.fn(), error: vi.fn(), warn: vi.fn(), debug: vi.fn() } }))
import { updateGamification, recordNoteCreation, syncReadingToGamification } from '@/lib/gamification'

function fakeDb(rows: Record<string, unknown> = {}) {
  const calls: unknown[][] = []
  const chain = (table: string): any => {
    const c: any = {}
    for (const m of ['select', 'eq', 'gte', 'lte', 'like']) c[m] = () => c
    c.maybeSingle = () => Promise.resolve({ data: rows[table] ?? null, error: null })
    c.then = (resolve: any) => Promise.resolve({ data: rows[`${table}[]`] ?? [], error: null }).then(resolve)
    c.insert = (data: unknown) => { calls.push([table, 'insert', data]); return Promise.resolve({ error: null }) }
    c.upsert = (data: unknown) => { calls.push([table, 'upsert', data]); return Promise.resolve({ error: null }) }
    return c
  }
  return {
    calls,
    rpc: vi.fn(async () => ({ data: { ok: true }, error: null })),
    from: (table: string) => chain(table),
  }
}

beforeEach(() => { proxyUsed.count = 0 })

describe('gamification on the server', () => {
  it('awards points through the provided service-role client', async () => {
    const db = fakeDb()
    await updateGamification('u1', 30, 'mission_complete', db)
    expect(db.rpc).toHaveBeenCalledWith('update_gamification_atomic', { p_user_id: 'u1', p_points_earned: 30, p_action_type: 'mission_complete' })
    expect(db.calls).toContainEqual(['points_history', 'insert', expect.objectContaining({ user_id: 'u1', points: 30 })])
    expect(proxyUsed.count).toBe(0)
  })

  it('falls back to a direct upsert on the same client when the RPC is missing', async () => {
    const db = fakeDb({ user_gamification: { total_points: 95 } })
    db.rpc.mockResolvedValueOnce({ data: null, error: { message: 'function does not exist' } } as any)
    await updateGamification('u1', 10, 'chapter_complete', db)
    expect(db.calls).toContainEqual(['user_gamification', 'upsert', expect.objectContaining({ total_points: 105, current_level: 2 })])
    expect(proxyUsed.count).toBe(0)
  })

  it('note and reading rewards never touch the browser proxy when given a client', async () => {
    const db = fakeDb({ 'user_notes[]': [{ id: 'n1', section_id: 's1' }] })
    expect((await recordNoteCreation('u1', db)).pointsAwarded).toBe(5)
    await syncReadingToGamification('u1', 2, fakeDb())
    expect(proxyUsed.count).toBe(0)
  })
})
