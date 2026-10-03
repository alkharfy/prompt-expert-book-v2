import 'server-only'
import { introData, unit1Data, unit2Data, unit3Data, unit4Data, unit5Data, unit6Data,
    unit7Data, unit8Data, unit9Data, unit10Data } from '@/data/bookData'

const sections = [introData, unit1Data, unit2Data, unit3Data, unit4Data, unit5Data,
    unit6Data, unit7Data, unit8Data, unit9Data, unit10Data]
const rewards = new Map<string, { points: number; requiresReading: boolean }>()
sections.forEach((pages, chapter) => pages.forEach(page => page.contentBlocks.forEach(block => {
    if (block.isReward && block.rewardId && Number.isInteger(block.points) && block.points! >= 0) {
        rewards.set(block.rewardId, { points: block.points!, requiresReading: chapter > 1 })
    }
})))

/** Participation is self-reported. Amounts and IDs always come from published lesson metadata. */
export function getReadingReward(rewardId: string) { return rewards.get(rewardId) || null }
