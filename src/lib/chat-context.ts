/**
 * RAG Context Retrieval for Book AI Chat
 * يستخدم Fuse.js للبحث في محتوى الكتاب واستخراج السياق المناسب
 * مع تطبيع النص العربي و Fallback ذكي
 */

import Fuse, { type FuseResult } from 'fuse.js'
import type { SearchIndexItem } from '@/utils/searchIndex'
import { normalizeArabic, extractKeywords, truncateAtSentence } from '@/lib/arabic-normalize'

// ===== Types =====

interface NormalizedSearchItem extends SearchIndexItem {
    normalizedTitle: string
    normalizedDescription: string
    normalizedBody: string
}

// ===== Cache =====

let cachedIndex: NormalizedSearchItem[] | null = null
let cachedFuse: Fuse<NormalizedSearchItem> | null = null

const MAX_BODY_LENGTH = 2000
const MIN_RESULTS_FOR_FALLBACK = 2
const FALLBACK_SCORE_THRESHOLD = 0.6

/**
 * Build or retrieve cached Fuse.js instance for book content search.
 * Indexes are normalized for Arabic text matching.
 */
async function getFuse(): Promise<{ fuse: Fuse<NormalizedSearchItem>; index: NormalizedSearchItem[] }> {
    if (cachedFuse && cachedIndex) return { fuse: cachedFuse, index: cachedIndex }

    const { buildSearchIndex } = await import('@/utils/searchIndex')
    const rawIndex = await buildSearchIndex()

    // Extend each item with normalized Arabic fields
    cachedIndex = rawIndex.map(item => ({
        ...item,
        normalizedTitle: normalizeArabic(item.title),
        normalizedDescription: normalizeArabic(item.description),
        normalizedBody: normalizeArabic(item.body),
    }))

    cachedFuse = new Fuse(cachedIndex, {
        keys: [
            { name: 'normalizedTitle', weight: 3 },
            { name: 'normalizedDescription', weight: 2 },
            { name: 'normalizedBody', weight: 1 },
        ],
        threshold: 0.5,
        distance: 500,
        minMatchCharLength: 2,
        includeScore: true,
    })

    return { fuse: cachedFuse, index: cachedIndex }
}

// ===== Public Types =====

export interface RetrievedContext {
    title: string
    sectionLabel: string
    path: string
    body: string
}

/**
 * Retrieve relevant book pages for a user query.
 * Uses normalized Arabic search with smart fallback.
 *
 * @param query - User's question
 * @param topK - Number of top results to return (default 5)
 */
export async function retrieveContext(
    query: string,
    topK: number = 5
): Promise<RetrievedContext[]> {
    const { fuse, index } = await getFuse()

    // Search the meaningful words only: question framing ("ما هو ...؟") dilutes the fuzzy
    // match, so a short term like "RAG" missed its own "RAG ببساطة" page.
    const searchQuery = extractKeywords(query).join(' ') || normalizeArabic(query)
    let results = fuse.search(searchQuery, { limit: topK })

    // Smart fallback: if results are too few or scores are weak
    if (results.length < MIN_RESULTS_FOR_FALLBACK || (results.length > 0 && (results[0].score ?? 1) > FALLBACK_SCORE_THRESHOLD)) {
        results = await fallbackKeywordSearch(query, fuse, topK, results)
    }

    results = ensureEachConceptCovered(query, fuse, index, topK, results)

    return results.map(r => ({
        title: r.item.title,
        sectionLabel: r.item.sectionLabel,
        path: r.item.path,
        body: truncateAtSentence(r.item.body, MAX_BODY_LENGTH),
    }))
}

/**
 * Fallback search: extract keywords from query, search individually, merge results.
 */
async function fallbackKeywordSearch(
    query: string,
    fuse: Fuse<NormalizedSearchItem>,
    topK: number,
    existingResults: FuseResult<NormalizedSearchItem>[]
): Promise<FuseResult<NormalizedSearchItem>[]> {
    const keywords = extractKeywords(query)
    if (keywords.length === 0) return existingResults

    // Track seen IDs to avoid duplicates, score by frequency
    const scoreMap = new Map<string, { result: FuseResult<NormalizedSearchItem>; count: number }>()

    // Add existing results first
    for (const r of existingResults) {
        scoreMap.set(r.item.id, { result: r, count: 2 }) // Boost original results
    }

    // Search each keyword individually
    for (const keyword of keywords) {
        const keywordResults = fuse.search(keyword, { limit: topK })
        for (const r of keywordResults) {
            const existing = scoreMap.get(r.item.id)
            if (existing) {
                existing.count++
            } else {
                scoreMap.set(r.item.id, { result: r, count: 1 })
            }
        }
    }

    // Sort by frequency (most keyword matches first), then by score
    const merged = Array.from(scoreMap.values())
        .sort((a, b) => {
            if (b.count !== a.count) return b.count - a.count
            return (a.result.score ?? 1) - (b.result.score ?? 1)
        })
        .slice(0, topK)
        .map(entry => entry.result)

    return merged
}

const STRONG_KEYWORD_SCORE = 0.2

const countOccurrences = (text: string, term: string) => text.split(term).length - 1

/**
 * The assistant is told to answer only from the retrieved pages, so a concept missing
 * from them means a "not found" reply even when the book covers it. Two gaps:
 *  - comparison questions ("الفرق بين Zero-shot و Few-shot") — the whole-query search
 *    can fill every slot with pages about one concept, so each strongly-matched keyword
 *    gets its best page;
 *  - Fuse scores by position, so a term deep inside a long page (e.g. "الهلوسة" in
 *    unit 1) never matches — a keyword absent from every retrieved page gets the page
 *    that mentions it most (plain substring count: fast, unlike ignoreLocation).
 * The weakest extras are dropped to stay within topK.
 */
function ensureEachConceptCovered(
    query: string,
    fuse: Fuse<NormalizedSearchItem>,
    index: NormalizedSearchItem[],
    topK: number,
    results: FuseResult<NormalizedSearchItem>[]
): FuseResult<NormalizedSearchItem>[] {
    const keywords = extractKeywords(query)
    const required: FuseResult<NormalizedSearchItem>[] = []
    const add = (r: FuseResult<NormalizedSearchItem>) => {
        if (!required.some(x => x.item.id === r.item.id)) required.push(r)
    }

    for (const keyword of keywords) {
        if (keywords.length >= 2) {
            const best = fuse.search(keyword, { limit: 1 })[0]
            if (best && (best.score ?? 1) <= STRONG_KEYWORD_SCORE) add(best)
        }
        const mentions = (item: NormalizedSearchItem) =>
            countOccurrences(item.normalizedTitle, keyword) * 3 + countOccurrences(item.normalizedBody, keyword)
        if ([...results, ...required].some(r => mentions(r.item) > 0)) continue
        let top: NormalizedSearchItem | null = null
        let topCount = 0
        for (const item of index) {
            const count = mentions(item)
            if (count > topCount) { top = item; topCount = count }
        }
        if (top) add({ item: top, refIndex: index.indexOf(top), score: 0 })
    }
    const missing = required.filter(r => !results.some(x => x.item.id === r.item.id))
    if (missing.length === 0) return results

    return [...results.slice(0, Math.max(0, topK - missing.length)), ...missing]
}

/**
 * Format retrieved contexts into a string for LLM injection.
 * Includes citation paths for the model to reference.
 */
export function formatContextForPrompt(contexts: RetrievedContext[]): string {
    if (contexts.length === 0) {
        return 'لم يتم العثور على صفحات مطابقة في الكتاب.'
    }

    return contexts
        .map(
            (c, i) =>
                `[صفحة ${i + 1}: ${c.sectionLabel} — ${c.title} | ${c.path}]\n${c.body}`
        )
        .join('\n\n---\n\n')
}
