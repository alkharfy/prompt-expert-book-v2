/**
 * Arabic Text Normalization for RAG Search
 * تطبيع النص العربي لتحسين نتائج البحث
 */

/**
 * Normalize Arabic text for search matching.
 * Removes diacritics, normalizes hamzas, taa marbouta, kashida, alef maqsoura.
 */
export function normalizeArabic(text: string): string {
    return text
        // 1. إزالة التشكيل (فتحة، ضمة، كسرة، سكون، شدة، تنوين)
        .replace(/[\u0617-\u061A\u064B-\u0652\u0656-\u065F\u0670]/g, '')
        // 2. تطبيع الهمزات → ا
        .replace(/[إأآٱ]/g, 'ا')
        // 3. تطبيع التاء المربوطة → ه
        .replace(/ة/g, 'ه')
        // 4. إزالة الكشيدة/التطويل
        .replace(/ـ/g, '')
        // 5. تطبيع الألف المقصورة → ي
        .replace(/ى/g, 'ي')
        // 6. تنظيف المسافات الزائدة
        .replace(/\s+/g, ' ')
        .trim()
}

/**
 * Arabic stop words to filter out during keyword extraction.
 * All entries are pre-normalized (no hamza variants, taa marbouta → ه, alef maqsoura → ي)
 */
const ARABIC_STOP_WORDS = new Set([
    'ما', 'هو', 'هي', 'في', 'من', 'علي', 'الي', 'عن',
    'ان', 'كيف', 'هل', 'لماذا', 'متي', 'اين', 'الذي',
    'التي', 'هذا', 'هذه', 'ذلك', 'تلك', 'او', 'ثم',
    'لا', 'لم', 'لن', 'قد', 'كان', 'يكون', 'بين', 'مع',
    'بعد', 'قبل', 'حتي', 'عند', 'كل', 'بعض', 'لي', 'لك',
    'ال', 'انا', 'نحن', 'هم', 'هن', 'انت', 'انتم',
    'ايش', 'شو', 'يعني', 'فيه', 'فيها', 'منه', 'منها',
    // Question framing words: they match unrelated "X مقابل Y" pages, not the topic.
    'الفرق', 'فرق', 'ايه', 'ازاي', 'اشرح', 'اشرحلي',
])

/**
 * Extract meaningful keywords from an Arabic query.
 * Removes punctuation, stop words and short words, normalizes text.
 */
export function extractKeywords(query: string): string[] {
    const normalized = normalizeArabic(query)
    return normalized
        .split(/\s+/)
        // "Few-shot؟" must match "Few-shot" — keep inner hyphens, drop edge punctuation.
        .map(w => w.replace(/^[؟?!.,،:;"'«»()]+|[؟?!.,،:;"'«»()]+$/g, ''))
        .filter(w => w.length > 2 && !ARABIC_STOP_WORDS.has(w))
}

/**
 * Truncate text at a sentence boundary instead of mid-word.
 * Falls back to last space if no sentence boundary is found.
 */
export function truncateAtSentence(text: string, maxLength: number): string {
    if (text.length <= maxLength) return text

    const truncated = text.slice(0, maxLength)
    // Look for last sentence-ending punctuation before maxLength
    const sentenceEnd = Math.max(
        truncated.lastIndexOf('.'),
        truncated.lastIndexOf('؟'),
        truncated.lastIndexOf('!'),
        truncated.lastIndexOf('،'),
        truncated.lastIndexOf('\n'),
    )

    // Use sentence boundary if it's after 60% of maxLength (avoid too-short results)
    if (sentenceEnd > maxLength * 0.6) {
        return text.slice(0, sentenceEnd + 1).trimEnd() + ' \u2026'
    }

    // Fallback: cut at last space
    const lastSpace = truncated.lastIndexOf(' ')
    return text.slice(0, lastSpace > 0 ? lastSpace : maxLength).trimEnd() + ' \u2026'
}
