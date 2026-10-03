import { describe, expect, it, vi } from 'vitest'
import { completeChapterWithProgress } from '@/components/reading/completeChapterWithProgress'
import { claimReadingReward } from '@/components/reading/claimReadingReward'

describe('chapter completion ordering', () => {
    it('waits for the last page to be saved before sending the completion marker', async () => {
        let release!: (saved: boolean) => void
        const writer = {
            updateReadingProgress: vi.fn(() => new Promise<boolean>(resolve => { release = resolve })),
            completeChapter: vi.fn().mockResolvedValue(true),
        }
        const pending = completeChapterWithProgress(writer, 23, 1)
        expect(writer.updateReadingProgress).toHaveBeenCalledWith(23)
        expect(writer.completeChapter).not.toHaveBeenCalled()
        release(true)
        expect(await pending).toBeNull()
        expect(writer.completeChapter).toHaveBeenCalledWith(1)
    })

    it('does not mark a chapter complete when page saving fails', async () => {
        const writer = { updateReadingProgress: vi.fn().mockResolvedValue(false), completeChapter: vi.fn() }
        expect(await completeChapterWithProgress(writer, 23, 1)).toContain('تعذّر حفظ الصفحة')
        expect(writer.completeChapter).not.toHaveBeenCalled()
    })

    it('reports a rejected completion marker instead of treating it as success', async () => {
        const writer = { updateReadingProgress: vi.fn().mockResolvedValue(true), completeChapter: vi.fn().mockResolvedValue(false) }
        expect(await completeChapterWithProgress(writer, 23, 1)).toContain('تعذّر تسجيل إتمام الفصل')
    })

    it('saves the intro without sending an invalid chapter-zero marker', async () => {
        const writer = { updateReadingProgress: vi.fn().mockResolvedValue(true), completeChapter: vi.fn() }
        expect(await completeChapterWithProgress(writer, 6, null)).toBeNull()
        expect(writer.completeChapter).not.toHaveBeenCalled()
    })

    it('reports transport errors so the reader can retry', async () => {
        const writer = { updateReadingProgress: vi.fn().mockRejectedValue(new Error('offline')), completeChapter: vi.fn() }
        expect(await completeChapterWithProgress(writer, 23, 1)).toContain('تحقق من اتصالك')
        expect(writer.completeChapter).not.toHaveBeenCalled()
    })
})

describe('reading rewards use confirmed server awards', () => {
    it('submits only the reward ID and waits for server confirmation', async () => {
        let release!: (response: Response) => void
        const request = vi.fn(() => new Promise<Response>(resolve => { release = resolve }))
        const pending = claimReadingReward('known-reward', request)
        expect(request).toHaveBeenCalledWith('/api/achievements/claimed', expect.objectContaining({
            method: 'POST', credentials: 'include', body: JSON.stringify({ rewardId: 'known-reward' }),
        }))
        release(new Response(JSON.stringify({ success: true }), { status: 200 }))
        expect(await pending).toEqual({ alreadyClaimed: false })
    })

    it('does not report a failed HTTP response as an award', async () => {
        const request = vi.fn().mockResolvedValue(new Response(JSON.stringify({ success: true }), { status: 403 }))
        await expect(claimReadingReward('known-reward', request)).rejects.toThrow('تعذّر تسجيل المكافأة')
    })

    it('requires an explicit successful award response', async () => {
        const request = vi.fn().mockResolvedValue(new Response(JSON.stringify({ error: 'rejected' }), { status: 200 }))
        await expect(claimReadingReward('known-reward', request)).rejects.toThrow('تعذّر تسجيل المكافأة')
    })

    it('identifies a prior award so the reader does not celebrate another grant', async () => {
        const request = vi.fn().mockResolvedValue(new Response(JSON.stringify({ success: true, alreadyClaimed: true }), { status: 200 }))
        expect(await claimReadingReward('known-reward', request)).toEqual({ alreadyClaimed: true })
    })
})
