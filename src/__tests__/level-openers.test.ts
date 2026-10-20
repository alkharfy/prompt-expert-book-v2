import { describe, expect, it } from 'vitest'
import { existsSync, statSync } from 'fs'
import { join } from 'path'
import { unit1Data } from '@/data/unit1Data'
import { unit2Data } from '@/data/unit2Data'
import { unit3Data } from '@/data/unit3Data'
import { unit4Data } from '@/data/unit4Data'
import { unit5Data } from '@/data/unit5Data'

// The narrated one-minute opener at the top of each level (Remotion in D:\pm-videos, the owner's ElevenLabs voice).
const LEVELS = { 1: unit1Data, 2: unit2Data, 3: unit3Data, 4: unit4Data, 5: unit5Data }

describe('level openers', () => {
    for (const [level, pages] of Object.entries(LEVELS)) {
        it(`Level ${level} opens with its narrated video, says the voice is AI-made, and ships small files`, () => {
            const opener = pages[0].contentBlocks[0]
            expect(opener.type).toBe('video')
            expect(opener.narrated).toBe(true)
            expect(opener.videoUrl).toBe(`/assets/content/level-${level}/level-intro.mp4`)
            expect(opener.content).toMatch(/بالذكاء الاصطناعي/)
            for (const file of [opener.videoUrl!, opener.poster!]) expect(existsSync(join(process.cwd(), 'public', file)), file).toBe(true)
            expect(statSync(join(process.cwd(), 'public', opener.videoUrl!)).size).toBeLessThan(3_000_000)
            expect(pages.flatMap(page => page.contentBlocks).filter(block => block.narrated)).toHaveLength(1)
        })
    }
})
