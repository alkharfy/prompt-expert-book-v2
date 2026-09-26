import type { PageContent } from '@/data/bookData'

/** Average Arabic reading speed in words per minute */
const ARABIC_WPM = 180

/**
 * Count words in Arabic/mixed text.
 * Splits on whitespace and filters out empty strings.
 */
function countWords(text: string): number {
    return text.split(/\s+/).filter(Boolean).length
}

/**
 * Estimates reading time for a single page's content blocks.
 * Returns the estimated minutes (minimum 1).
 */
export function estimateReadingTime(page: PageContent): number {
    let totalWords = 0

    totalWords += countWords(page.title)
    totalWords += countWords(page.description)

    for (const block of page.contentBlocks) {
        if (block.title) totalWords += countWords(block.title)
        if (block.content) totalWords += countWords(block.content)
        if (block.code) totalWords += countWords(block.code)
        if (block.items) {
            for (const item of block.items) {
                totalWords += countWords(item.title)
                totalWords += countWords(item.content)
            }
        }
    }

    const minutes = Math.ceil(totalWords / ARABIC_WPM)
    return Math.max(1, minutes)
}
