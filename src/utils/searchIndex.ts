import type { PageContent } from '@/data/bookData'

export interface SearchIndexItem {
    /** Unique key: "section-id/pageNumber" */
    id: string
    /** URL path to navigate to */
    path: string
    /** Page title */
    title: string
    /** Page description */
    description: string
    /** Section/chapter label (e.g. "الفصل 01") */
    sectionLabel: string
    /** Combined searchable text from all content blocks */
    body: string
}

interface SectionDataMapping {
    id: string
    label: string
    pathPrefix: string
    data: PageContent[]
}

/**
 * Extracts all searchable text from a page's content blocks.
 */
function extractBody(page: PageContent): string {
    const parts: string[] = []

    for (const block of page.contentBlocks) {
        if (block.title) parts.push(block.title)
        if (block.content) parts.push(block.content)
        if (block.code) parts.push(block.code)
        if (block.items) {
            for (const item of block.items) {
                if (item.title) parts.push(item.title)
                if (item.content) parts.push(item.content)
            }
        }
    }

    return parts.join(' ')
}

/**
 * Builds the full search index from all book data.
 * Lazily imported to avoid loading all data upfront.
 */
export async function buildSearchIndex(): Promise<SearchIndexItem[]> {
    const {
        introData,
        unit1Data,
        unit2Data,
        unit3Data,
        unit4Data,
        unit5Data,
        unit6Data,
        unit7Data,
        unit8Data,
        unit9Data,
        unit10Data,
        libraryData,
        glossaryData,
        appendixData,
    } = await import('@/data/bookData')

    const sections: SectionDataMapping[] = [
        { id: 'intro', label: 'المقدمة', pathPrefix: '/read/intro', data: introData },
        { id: 'section-1', label: 'الفصل 01', pathPrefix: '/read/section-1', data: unit1Data },
        { id: 'section-2', label: 'الفصل 02', pathPrefix: '/read/section-2', data: unit2Data },
        { id: 'section-3', label: 'الفصل 03', pathPrefix: '/read/section-3', data: unit3Data },
        { id: 'section-4', label: 'الفصل 04', pathPrefix: '/read/section-4', data: unit4Data },
        { id: 'section-5', label: 'الفصل 05', pathPrefix: '/read/section-5', data: unit5Data },
        { id: 'section-6', label: 'الفصل 06', pathPrefix: '/read/section-6', data: unit6Data },
        { id: 'section-7', label: 'الفصل 07', pathPrefix: '/read/section-7', data: unit7Data },
        { id: 'section-8', label: 'الفصل 08', pathPrefix: '/read/section-8', data: unit8Data },
        { id: 'section-9', label: 'الفصل 09', pathPrefix: '/read/section-9', data: unit9Data },
        { id: 'section-10', label: 'الفصل 10', pathPrefix: '/read/section-10', data: unit10Data },
        { id: 'library', label: 'مكتبة القوالب', pathPrefix: '/library', data: libraryData },
        { id: 'glossary', label: 'المصطلحات', pathPrefix: '/read/glossary', data: glossaryData },
        { id: 'appendix', label: 'الملحق', pathPrefix: '/read/appendix', data: appendixData },
    ]

    const items: SearchIndexItem[] = []

    for (const section of sections) {
        for (let i = 0; i < section.data.length; i++) {
            const page = section.data[i]
            items.push({
                id: `${section.id}/${i + 1}`,
                path: `${section.pathPrefix}/${i + 1}`,
                title: page.title,
                description: page.description,
                sectionLabel: section.label,
                body: extractBody(page),
            })
        }
    }

    return items
}
