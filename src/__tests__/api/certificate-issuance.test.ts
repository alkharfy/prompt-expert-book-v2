import { beforeEach, describe, expect, it, vi } from 'vitest'
import { CERTIFICATE_COURSE_NAME } from '@/lib/reading-completion'

const h = vi.hoisted(() => ({
    user: 'u1' as string | null, allowed: true, existing: null as any, progress: null as any,
    name: 'اسم متعلم ثلاثي', existingError: null as any, progressError: null as any,
    throwRead: false, filters: [] as any[], writes: [] as any[], entitlement: vi.fn(),
}))
vi.mock('@/lib/auth-middleware', () => ({ getAuthenticatedUser: async () => h.user }))
vi.mock('@/lib/subscription', () => ({ userHasFeature: h.entitlement }))
vi.mock('@/lib/supabase-admin', () => ({ getSupabaseAdmin: () => ({ from: (table: string) => {
    const c: any = {}; let inserted = false
    c.select = () => c
    c.eq = (column: string, value: unknown) => { h.filters.push([table, column, value]); return c }
    c.maybeSingle = async () => {
        if (h.throwRead) throw new Error('private database failure')
        return { data: table === 'certificates' ? h.existing : h.progress,
            error: table === 'certificates' ? h.existingError : h.progressError }
    }
    c.insert = (value: any) => { h.writes.push(value); inserted = true; return c }
    c.single = async () => ({ data: inserted ? h.writes.at(-1) : { full_name: h.name, email: 'learner@example.com' }, error: null })
    return c
} }) }))
import { getOrCreateCertificate } from '@/actions/certificates'
import { GET as publicCertificate } from '@/app/api/certificates/[id]/route'

beforeEach(() => {
    h.user = 'u1'; h.allowed = true; h.existing = null; h.existingError = null; h.progressError = null
    h.throwRead = false; h.filters.length = 0; h.name = 'اسم متعلم ثلاثي'
    h.progress = { completed_chapters: Array.from({ length: 10 }, (_, i) => String(i + 1)) }
    h.writes.length = 0; vi.clearAllMocks(); h.entitlement.mockImplementation(async () => h.allowed)
})
describe('new certificate issuance and historical records', () => {
    it('requires authentication', async () => {
        h.user = null
        expect((await getOrCreateCertificate()).success).toBe(false)
        expect(h.entitlement).not.toHaveBeenCalled(); expect(h.writes).toHaveLength(0)
    })
    it('requires the certificate entitlement before a new issue', async () => {
        h.allowed = false
        expect((await getOrCreateCertificate()).success).toBe(false)
        expect(h.entitlement).toHaveBeenCalledWith('u1', 'certificate'); expect(h.writes).toHaveLength(0)
    })
    it.each([Array(10).fill('1'), ['0', '1', '2', '3', '4', '5', '6', '7', '8', '11', '12'],
        ['1', '2', '3', '4', '5', '6', '7', '8', '9']])('cannot substitute duplicate or bonus chapters for main chapters (%j)', async chapters => {
        h.progress.completed_chapters = chapters
        expect((await getOrCreateCertificate()).success).toBe(false)
        expect(h.writes).toHaveLength(0)
    })
    it('does not issue on an unreadable progress record', async () => {
        h.progressError = { message: 'database unavailable' }
        expect(await getOrCreateCertificate()).toMatchObject({ success: false, error: 'تعذّر التحقق من سجل القراءة' })
        expect(h.entitlement).toHaveBeenCalled(); expect(h.writes).toHaveLength(0)
    })
    it('requires the declared three-part name', async () => {
        h.name = 'اسم متعلم'
        expect((await getOrCreateCertificate()).success).toBe(false); expect(h.writes).toHaveLength(0)
    })
    it('issues only after all ten distinct main chapters and identifies the scope', async () => {
        expect(await getOrCreateCertificate()).toMatchObject({ success: true, previousRequirements: false })
        expect(h.writes[0]).toMatchObject({ course_name: CERTIFICATE_COURSE_NAME, completion_percentage: 100 })
    })
    it('preserves an old certificate without imposing new completion or renewal requirements', async () => {
        h.allowed = false; h.progress = { completed_chapters: ['1'] }
        h.existing = { certificate_id: 'CERT-OLD', user_name: 'اسم الإصدار القديم', course_name: 'PromptMaster', issued_at: '2026-03-01' }
        h.name = 'اسم الملف الجديد'
        expect(await getOrCreateCertificate()).toMatchObject({ success: true, certificateId: 'CERT-OLD',
            previousRequirements: true, userName: 'اسم الإصدار القديم', courseName: 'PromptMaster', issuedAt: '2026-03-01' })
        expect(h.entitlement).not.toHaveBeenCalled(); expect(h.writes).toHaveLength(0)
    })
    it('publicly labels a historical certificate without requiring a current subscription', async () => {
        h.existing = { certificate_id: 'CERT-OLD', course_name: 'PromptMaster', user_id: 'private-owner' }
        const res = await publicCertificate({} as Request, { params: Promise.resolve({ id: 'CERT-OLD' }) })
        expect(res.status).toBe(200)
        const { certificate } = await res.json()
        expect(certificate.previous_requirements).toBe(true)
        expect(certificate).not.toHaveProperty('user_id')
        expect(h.filters).toContainEqual(['certificates', 'is_public', true])
        expect(h.entitlement).not.toHaveBeenCalled()
    })
    it('does not disclose a server error when public verification fails', async () => {
        h.throwRead = true
        const res = await publicCertificate({} as Request, { params: Promise.resolve({ id: 'CERT-OLD' }) })
        expect(res.status).toBe(500)
        expect(await res.json()).toEqual({ error: 'تعذّر التحقق من الشهادة' })
    })
    it('returns 404 when no public certificate matches', async () => {
        const res = await publicCertificate({} as Request, { params: Promise.resolve({ id: 'missing' }) })
        expect(res.status).toBe(404)
    })
})
