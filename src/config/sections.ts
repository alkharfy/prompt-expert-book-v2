export interface SectionConfig {
    id: string
    sectionNumber: number
    pageCount: number
    chapterLabel: string
    progressOffset: number
    freePageLimit: number
    chapterIndex: number
    prevSection: { path: string; lastPage: number } | null
    nextSection: { path: string } | null
    robotSize: number
    hasGlossary: boolean
    hasRewards: boolean
    useExplicitImageSize: boolean
}

export const SECTION_REGISTRY: SectionConfig[] = [
    {
        id: 'intro',
        sectionNumber: 0,
        pageCount: 6,
        chapterLabel: 'المقدمة',
        progressOffset: 0,
        freePageLimit: 0, // Always free (no lock)
        chapterIndex: 0,
        prevSection: null,
        nextSection: { path: '/read/section-1/1' },
        robotSize: 100,
        hasGlossary: false,
        hasRewards: true,
        useExplicitImageSize: false,
    },
    {
        id: 'section-1',
        sectionNumber: 1,
        pageCount: 17,
        chapterLabel: 'الفصل 01',
        progressOffset: 6, // Intro: 6
        freePageLimit: 17, // الفصل كامل مجاني — 17 صفحة
        chapterIndex: 1,
        prevSection: { path: '/read/intro', lastPage: 6 },
        nextSection: { path: '/read/section-2/1' },
        robotSize: 100,
        hasGlossary: false,
        hasRewards: true,
        useExplicitImageSize: false,
    },
    {
        id: 'section-2',
        sectionNumber: 2,
        pageCount: 18,
        chapterLabel: 'الفصل 02',
        progressOffset: 23, // Intro: 6 + S1: 17
        freePageLimit: 0, // مقفول — المعاينة المجانية = المقدمة + الفصل 1 فقط (قرار 2026-06)
        chapterIndex: 2,
        prevSection: { path: '/read/section-1', lastPage: 17 },
        nextSection: { path: '/read/section-3/1' },
        robotSize: 350,
        hasGlossary: true,
        hasRewards: true,
        useExplicitImageSize: false,
    },
    {
        id: 'section-3',
        sectionNumber: 3,
        pageCount: 18,
        chapterLabel: 'الفصل 03',
        progressOffset: 41, // Intro: 6 + S1: 17 + S2: 18
        freePageLimit: 0, // مقفول — المعاينة المجانية = المقدمة + الفصل 1 فقط (قرار 2026-06)
        chapterIndex: 3,
        prevSection: { path: '/read/section-2', lastPage: 18 },
        nextSection: { path: '/read/section-4/1' },
        robotSize: 320,
        hasGlossary: true,
        hasRewards: true,
        useExplicitImageSize: false,
    },
    {
        id: 'section-4',
        sectionNumber: 4,
        pageCount: 18,
        chapterLabel: 'الفصل 04',
        progressOffset: 59, // + S3: 18
        freePageLimit: 0, // مقفول — المعاينة المجانية = المقدمة + الفصل 1 فقط (قرار 2026-06)
        chapterIndex: 4,
        prevSection: { path: '/read/section-3', lastPage: 18 },
        nextSection: { path: '/read/section-5/1' },
        robotSize: 320,
        hasGlossary: false,
        hasRewards: true,
        useExplicitImageSize: false,
    },
    {
        id: 'section-5',
        sectionNumber: 5,
        pageCount: 18,
        chapterLabel: 'الفصل 05',
        progressOffset: 77, // + S4: 18
        freePageLimit: 0, // مقفول — المعاينة المجانية = المقدمة + الفصل 1 فقط (قرار 2026-06)
        chapterIndex: 5,
        prevSection: { path: '/read/section-4', lastPage: 18 },
        nextSection: { path: '/read/section-6/1' },
        robotSize: 320,
        hasGlossary: false,
        hasRewards: true,
        useExplicitImageSize: false,
    },
    {
        id: 'section-6',
        sectionNumber: 6,
        pageCount: 20,
        chapterLabel: 'الفصل 06',
        progressOffset: 95, // + S5: 18
        freePageLimit: 0, // مقفول — المعاينة المجانية = المقدمة + الفصل 1 فقط (قرار 2026-06)
        chapterIndex: 6,
        prevSection: { path: '/read/section-5', lastPage: 18 },
        nextSection: { path: '/read/section-7/1' },
        robotSize: 320,
        hasGlossary: false,
        hasRewards: true,
        useExplicitImageSize: true,
    },
    {
        id: 'section-7',
        sectionNumber: 7,
        pageCount: 18,
        chapterLabel: 'الفصل 07',
        progressOffset: 115, // + S6: 20
        freePageLimit: 0, // مقفول — المعاينة المجانية = المقدمة + الفصل 1 فقط (قرار 2026-06)
        chapterIndex: 7,
        prevSection: { path: '/read/section-6', lastPage: 20 },
        nextSection: { path: '/read/section-8/1' },
        robotSize: 320,
        hasGlossary: false,
        hasRewards: true,
        useExplicitImageSize: true,
    },
    {
        id: 'section-8',
        sectionNumber: 8,
        pageCount: 16,
        chapterLabel: 'الفصل 08',
        progressOffset: 133, // + S7: 18
        freePageLimit: 0, // مقفول — المعاينة المجانية = المقدمة + الفصل 1 فقط (قرار 2026-06)
        chapterIndex: 8,
        prevSection: { path: '/read/section-7', lastPage: 18 },
        nextSection: { path: '/read/section-9/1' },
        robotSize: 320,
        hasGlossary: false,
        hasRewards: true,
        useExplicitImageSize: false,
    },
    {
        id: 'section-9',
        sectionNumber: 9,
        pageCount: 16,
        chapterLabel: 'الفصل 09',
        progressOffset: 149, // + S8: 16
        freePageLimit: 0, // مقفول — المعاينة المجانية = المقدمة + الفصل 1 فقط (قرار 2026-06)
        chapterIndex: 9,
        prevSection: { path: '/read/section-8', lastPage: 16 },
        nextSection: { path: '/read/section-10/1' },
        robotSize: 320,
        hasGlossary: false,
        hasRewards: true,
        useExplicitImageSize: false,
    },
    {
        id: 'section-10',
        sectionNumber: 10,
        pageCount: 17,
        chapterLabel: 'الفصل 10',
        progressOffset: 165, // + S9: 16
        freePageLimit: 0, // مقفول — المعاينة المجانية = المقدمة + الفصل 1 فقط (قرار 2026-06)
        chapterIndex: 10,
        prevSection: { path: '/read/section-9', lastPage: 16 },
        nextSection: { path: '/library/1' },
        robotSize: 320,
        hasGlossary: false,
        hasRewards: true,
        useExplicitImageSize: false,
    },
]
