import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import type { ComponentType, ReactNode } from 'react'
import SectionPage from '@/components/reading/SectionPage'
import LibraryReader from '@/components/reading/LibraryReader'
import AppendixReader from '@/components/reading/AppendixReader'
import GlossaryReader from '@/components/reading/GlossaryReader'
import { SECTION_REGISTRY, type SectionConfig } from '@/config/sections'
import { LEARNING_SECTIONS } from '@/config/learningCatalog'
import type { PageContent } from '@/types/book'

const { route, router, updateReadingProgress, completeChapter, verifySession } = vi.hoisted(() => ({
    route: { page: '1' },
    router: { push: vi.fn(), replace: vi.fn() },
    updateReadingProgress: vi.fn(),
    completeChapter: vi.fn(),
    verifySession: vi.fn(),
}))

vi.mock('next/navigation', () => ({ useParams: () => route, useRouter: () => router }))
vi.mock('@/lib/auth', () => ({ verifySession: () => true }))
vi.mock('@/lib/auth_system', () => ({
    authSystem: { updateReadingProgress, completeChapter, verifySession },
}))
vi.mock('@/lib/analytics', () => ({ trackPaywallHit: vi.fn(), trackGuestReading: vi.fn(), trackTryCopy: vi.fn() }))
vi.mock('@/context/LearningContext', () => ({ useLearning: () => ({ preferences: null, isLoading: false, refreshPreferences: vi.fn() }) }))
vi.mock('@/hooks/useReducedMotion', () => ({ useReducedMotion: () => true }))
vi.mock('@/components/reading/claimReadingReward', () => ({ claimReadingReward: vi.fn() }))
vi.mock('@/components/Navigation', () => ({ default: () => null }))
vi.mock('@/components/Robot', () => ({ default: () => null }))
vi.mock('@/components/GuestBanner', () => ({ default: () => null }))
vi.mock('@/components/reading/LockedOverlay', () => ({ default: () => null }))
vi.mock('@/components/reading/CopyButton', () => ({ default: () => null }))
vi.mock('@/components/reading/BookmarkButton', () => ({ default: () => null }))
vi.mock('@/components/reading/ScrollProgress', () => ({ default: () => null }))
vi.mock('@/components/reading/BackToTop', () => ({ default: () => null }))
vi.mock('@/components/reading/FontSizeControl', () => ({ default: () => null }))
vi.mock('@/components/gamification/StreakBanner', () => ({ default: () => null }))
vi.mock('@/components/reading/TextHighlighter', () => ({ default: () => null }))
vi.mock('@/components/reading/HighlightRenderer', () => ({ default: () => null, applyHighlights: vi.fn() }))
vi.mock('@/components/reading/NotesSidebar', () => ({ default: () => null }))
vi.mock('@/components/missions/DailyMissionsWidget', () => ({ default: () => null }))
vi.mock('@/components/reading/ChapterRecap', () => ({ default: () => null }))
vi.mock('@/components/reading/QuickRecapButton', () => ({ default: () => null }))
vi.mock('@/components/reading/SpecializationExamples', () => ({ default: () => null }))
vi.mock('@/components/reading/KnowledgeCardView', () => ({ default: () => null }))
vi.mock('@/components/reading/widgets', () => ({ InteractiveWidget: () => null }))
vi.mock('@/components/reading/GlossaryTerm', () => ({ default: () => null, GLOSSARY_PATTERNS: [] }))
vi.mock('framer-motion', async () => {
    const React = await import('react')
    const cache: Record<string, ComponentType<Record<string, unknown>>> = {}
    return {
        AnimatePresence: ({ children }: { children: ReactNode }) => children,
        motion: new Proxy({}, {
            get: (_, tag: string) => cache[tag] ||= (props: Record<string, unknown>) => {
                const domProps = { ...props }
                for (const key of ['initial', 'animate', 'exit', 'transition', 'whileHover', 'whileTap', 'layout']) delete domProps[key]
                return React.createElement(tag, domProps, props.children as ReactNode)
            },
        }),
    }
})

function makePages(sectionId: string, pageCount: number, sectionNumber = 0): PageContent[] {
    return Array.from({ length: pageCount }, (_, index) => ({
        id: index + 1,
        chapterNumber: sectionNumber,
        pageNumber: index + 1,
        title: `${sectionId} page ${index + 1}`,
        description: 'Fixture lesson',
        contentBlocks: [],
    }))
}

function renderSection(config: SectionConfig, requestedPage: number) {
    route.page = String(requestedPage)
    const pages = makePages(config.id, config.pageCount, config.sectionNumber)
    return render(<SectionPage config={config} data={pages} initialAuthed initialHasAccess />)
}

beforeEach(() => {
    vi.clearAllMocks()
    updateReadingProgress.mockResolvedValue(true)
    completeChapter.mockResolvedValue(true)
    verifySession.mockResolvedValue({ valid: true, hasPaid: true })
    vi.mocked(fetch).mockResolvedValue({ ok: true, json: async () => ({ data: [], rewards: [] }) } as Response)
})

afterEach(cleanup)

describe('SectionPage reserved-page redirects', () => {
    const requests = [
        ...SECTION_REGISTRY.map(config => ({ config, requestedPage: config.pageCount + 1 })),
        { config: SECTION_REGISTRY.find(section => section.id === 'intro')!, requestedPage: 6 },
        { config: SECTION_REGISTRY.find(section => section.id === 'section-1')!, requestedPage: 17 },
    ]

    it.each(requests)('redirects $config.id/$requestedPage to its last real page', async ({ config, requestedPage }) => {
        renderSection(config, requestedPage)

        await waitFor(() => expect(router.replace).toHaveBeenCalledWith(`/read/${config.id}/${config.pageCount}`))
        expect(router.push).not.toHaveBeenCalled()
        expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent(`${config.id} page ${config.pageCount}`)
        expect(screen.getByRole('status')).toHaveAttribute('aria-label', `الصفحة ${config.pageCount} من ${config.pageCount}`)
        expect(updateReadingProgress).toHaveBeenCalledWith(config.progressOffset + config.pageCount)
        expect(updateReadingProgress.mock.calls.every(([page]) => page === config.progressOffset + config.pageCount)).toBe(true)
    })
})

describe('supplement reader oversized-page redirects', () => {
    it.each([
        { sectionId: 'library', Reader: LibraryReader },
        { sectionId: 'appendix', Reader: AppendixReader },
        { sectionId: 'glossary', Reader: GlossaryReader },
    ])('redirects $sectionId to its unchanged last real page', async ({ sectionId, Reader }) => {
        const section = LEARNING_SECTIONS.find(item => item.id === sectionId)!
        route.page = String(section.pageCount + 1)
        render(<Reader data={makePages(sectionId, section.pageCount)} initialAuthed initialHasAccess />)

        await waitFor(() => expect(router.replace).toHaveBeenCalledWith(`${section.basePath}/${section.pageCount}`))
        expect(router.push).not.toHaveBeenCalled()
        expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent(`${sectionId} page ${section.pageCount}`)
        expect(updateReadingProgress).toHaveBeenCalledWith(section.progressOffset + section.pageCount)
        expect(updateReadingProgress.mock.calls.every(([page]) => page === section.progressOffset + section.pageCount)).toBe(true)
    })
})

describe('SectionPage completion uses the last real page', () => {
    it.each([
        { sectionId: 'intro', page: 3, globalPage: 3, chapter: null },
        { sectionId: 'section-1', page: 10, globalPage: 16, chapter: 1 },
    ])('completes $sectionId at global page $globalPage', async ({ sectionId, page, globalPage, chapter }) => {
        const config = SECTION_REGISTRY.find(section => section.id === sectionId)!
        renderSection(config, page)
        await waitFor(() => expect(updateReadingProgress).toHaveBeenCalledWith(globalPage))

        fireEvent.click(screen.getByRole('button', { name: 'الفصل التالي' }))

        await waitFor(() => expect(router.push).toHaveBeenCalledWith(config.nextSection!.path))
        expect(router.replace).not.toHaveBeenCalled()
        expect(updateReadingProgress).toHaveBeenCalledTimes(2)
        expect(updateReadingProgress).toHaveBeenLastCalledWith(globalPage)
        if (chapter === null) expect(completeChapter).not.toHaveBeenCalled()
        else expect(completeChapter).toHaveBeenCalledWith(chapter)
    })
})
