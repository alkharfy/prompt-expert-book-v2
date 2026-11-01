export interface SectionConfig {
    id: string
    sectionNumber: number
    pageCount: number
    /** Global page numbers reserved for this section, including unused slots. */
    slotSize: number
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
        pageCount: 3,
        slotSize: 6,
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
        pageCount: 9,
        slotSize: 17,
        chapterLabel: 'المستوى ١',
        progressOffset: 6, // Intro reserves 6 global slots (3 real pages).
        freePageLimit: 0, // المستوى ١ مدفوع — المجاني = التمهيد بس (قرار صاحب المشروع 2026-10-16)
        chapterIndex: 1,
        prevSection: { path: '/read/intro', lastPage: 3 },
        nextSection: { path: '/read/section-2/1' },
        robotSize: 100,
        hasGlossary: false,
        hasRewards: true,
        useExplicitImageSize: false,
    },
    {
        id: 'section-2',
        sectionNumber: 2,
        pageCount: 9,
        slotSize: 18,
        chapterLabel: 'المستوى ٢',
        progressOffset: 23, // Reserved slots: Intro 6 + S1 17.
        freePageLimit: 0, // المستوى ٢ مدفوع (18 أكتوبر 2026: بدل الفصل 02 القديم)
        chapterIndex: 2,
        prevSection: { path: '/read/section-1', lastPage: 9 },
        nextSection: { path: '/read/section-3/1' },
        robotSize: 350,
        hasGlossary: true,
        hasRewards: true,
        useExplicitImageSize: false,
    },
    {
        id: 'section-3',
        sectionNumber: 3,
        pageCount: 8,
        slotSize: 18,
        chapterLabel: 'المستوى ٣',
        progressOffset: 41, // Reserved slots: Intro 6 + S1 17 + S2 18.
        freePageLimit: 0, // المستوى ٣ مدفوع (19 أكتوبر 2026: بدل الفصل 03 القديم)
        chapterIndex: 3,
        prevSection: { path: '/read/section-2', lastPage: 9 },
        nextSection: { path: '/read/section-4/1' },
        robotSize: 320,
        hasGlossary: true,
        hasRewards: true,
        useExplicitImageSize: false,
    },
    {
        id: 'section-4',
        sectionNumber: 4,
        pageCount: 6,
        slotSize: 18,
        chapterLabel: 'المستوى ٤',
        progressOffset: 59, // + S3: 18
        freePageLimit: 0, // المستوى ٤ مدفوع (20 أكتوبر 2026: بدل الفصل 04 القديم)
        chapterIndex: 4,
        prevSection: { path: '/read/section-3', lastPage: 8 },
        nextSection: { path: '/read/section-5/1' },
        robotSize: 320,
        hasGlossary: true,
        hasRewards: true,
        useExplicitImageSize: false,
    },
    {
        id: 'section-5',
        sectionNumber: 5,
        pageCount: 8,
        slotSize: 18,
        chapterLabel: 'المستوى ٥',
        progressOffset: 77, // + S4: 18
        freePageLimit: 0, // المستوى ٥ مدفوع (20 أكتوبر 2026: بدل الفصل 05 القديم)
        chapterIndex: 5,
        prevSection: { path: '/read/section-4', lastPage: 6 },
        nextSection: null, // آخر مستوى: الكورس خلص هنا (الفصول القديمة 6–10 اتشالت 2026-11-01)
        robotSize: 320,
        hasGlossary: true,
        hasRewards: true,
        useExplicitImageSize: false,
    },
]
