'use client'

import React, { useCallback, useEffect, useRef, useState } from 'react'
import { motion } from 'framer-motion'
import Image from 'next/image'
import Link from 'next/link'
import { useParams, useRouter } from 'next/navigation'
import Navigation from '@/components/Navigation'
import Robot from '@/components/Robot'
import { authSystem } from '@/lib/auth_system'
import { verifySession } from '@/lib/auth'
import LockedOverlay from '@/components/reading/LockedOverlay'
import GuestBanner from '@/components/GuestBanner'
import ReadingPagination from '@/components/reading/ReadingPagination'
import { trackPaywallHit, trackGuestReading } from '@/lib/analytics'
import CopyButton from '@/components/reading/CopyButton'
import BookmarkButton from '@/components/reading/BookmarkButton'
import ScrollProgress from '@/components/reading/ScrollProgress'
import BackToTop from '@/components/reading/BackToTop'
import FontSizeControl from '@/components/reading/FontSizeControl'
import type { FontSize } from '@/components/reading/FontSizeControl'
import { updateGamification } from '@/lib/gamification'
import StreakBanner from '@/components/gamification/StreakBanner'
import TextHighlighter from '@/components/reading/TextHighlighter'
import type { HighlightSelection } from '@/components/reading/TextHighlighter'
import HighlightRenderer, { applyHighlights } from '@/components/reading/HighlightRenderer'
import type { NoteData } from '@/components/reading/HighlightRenderer'
import NotesSidebar from '@/components/reading/NotesSidebar'
import DailyMissionsWidget from '@/components/missions/DailyMissionsWidget'
import ChapterRecap from '@/components/reading/ChapterRecap'
import QuickRecapButton from '@/components/reading/QuickRecapButton'
import SpecializationExamples from '@/components/reading/SpecializationExamples'
import '@/styles/notes.css'
import '@/styles/recaps.css'
import type { SectionConfig } from '@/config/sections'
import type { PageContent } from '@/data/bookData'

// Running Project banner mapping: sectionNumber → phase info
const RUNNING_PROJECT_PHASES: Record<number, { phase: number; label: string }> = {
    2: { phase: 1, label: 'المرحلة 1: فهم المشروع وتحديد النطاق' },
    3: { phase: 2, label: 'المرحلة 2: كتابة وثيقة متطلبات المنتج (PRD)' },
    4: { phase: 3, label: 'المرحلة 3: تصميم تدفقات المستخدم' },
    5: { phase: 4, label: 'المرحلة 4: هيكل الصفحات والـ Wireframe' },
    6: { phase: 5, label: 'المرحلة 5: كتابة نصوص الواجهة (Microcopy)' },
    8: { phase: 6, label: 'المرحلة 6: اختبار الجودة وحالات الحافة' },
    10: { phase: 7, label: 'المرحلة 7: تحويل المشروع لـ AI Agent' },
}
import {
    formatDialogue,
    formatEnhancedText,
    formatBoldMarkdown,
    formatTextWithGlossary,
} from '@/utils/textFormatting'
import { estimateReadingTime } from '@/utils/readingTime'
import { useReducedMotion } from '@/hooks/useReducedMotion'
import KnowledgeCardView from '@/components/reading/KnowledgeCardView'
import { InteractiveWidget } from '@/components/reading/widgets'

// Lazy imports for glossary (only used in sections 2-3)
let GlossaryTerm: React.ComponentType<{ termId: string; displayText: string }> | null = null
let GLOSSARY_PATTERNS: { termId: string; patterns: string[] }[] = []

interface SectionExtras {
    recap: React.ComponentProps<typeof ChapterRecap>['recap'] | null
    prevRecap: React.ComponentProps<typeof QuickRecapButton>['recap'] | null
    hasSpec: boolean
}

interface SectionPageProps {
    config: SectionConfig
    data: PageContent[]
    /** Server-resolved entitlement (from getServerAccess) — fail-closed defaults. */
    initialHasAccess?: boolean
    initialAuthed?: boolean
    /** Server-computed recaps + spec availability (gated) — keeps that premium data off the client bundle. */
    extras?: SectionExtras
}

export default function SectionPage({ config, data, initialHasAccess = false, initialAuthed = false, extras }: SectionPageProps) {
    const params = useParams()
    const router = useRouter()
    const pageNum = parseInt(params.page as string) || 1

    const [isAuthed, setIsAuthed] = useState(initialAuthed)
    const [hasPaid, setHasPaid] = useState(initialHasAccess) // server-resolved; fail-closed (no optimistic unlock)
    const [isLockOverlayOpen, setIsLockOverlayOpen] = useState(false)
    const [isDirectAccess, setIsDirectAccess] = useState(false)
    const [claimedRewards, setClaimedRewards] = useState<string[]>([])
    const [showRewardCelebration, setShowRewardCelebration] = useState<string | null>(null)
    const [glossaryLoaded, setGlossaryLoaded] = useState(!config.hasGlossary)
    const [readingFontSize, setReadingFontSize] = useState<FontSize>('medium')

    // Notes & Highlights state
    const [pageNotes, setPageNotes] = useState<NoteData[]>([])
    const [isSidebarOpen, setIsSidebarOpen] = useState(false)
    const [noteInputVisible, setNoteInputVisible] = useState(false)
    const [noteInputText, setNoteInputText] = useState('')
    const [noteInputSelection, setNoteInputSelection] = useState<HighlightSelection | null>(null)
    const [noteInputPos, setNoteInputPos] = useState<{ x: number; y: number }>({ x: 0, y: 0 })
    const [noteSaving, setNoteSaving] = useState(false)
    // Inline edit modal state — replaces window.prompt()
    const [editingNote, setEditingNote] = useState<{ id: string; text: string } | null>(null)
    const [editingNoteSaving, setEditingNoteSaving] = useState(false)
    const contentContainerRef = useRef<HTMLDivElement>(null)
    const highlightsAppliedRef = useRef<string>('')

    const titleRef = useRef<HTMLHeadingElement>(null)
    const prefersReduced = useReducedMotion()

    // Mobile Knowledge Cards mode
    const [isMobile, setIsMobile] = useState(false)
    const [isCardMode, setIsCardMode] = useState(false)

    useEffect(() => {
        const check = () => {
            const mobile = window.innerWidth < 768
            setIsMobile(mobile)
            setIsCardMode(mobile)
        }
        check()
        window.addEventListener('resize', check)
        return () => window.removeEventListener('resize', check)
    }, [])

    const currentPage = data[pageNum - 1]
    const totalPages = data.length
    const isFirstPage = pageNum === 1
    const isLastPage = pageNum === totalPages

    // Lock logic — requires both authentication AND payment for non-free pages
    const isIntro = config.id === 'intro'
    const hasFreePages = config.freePageLimit > 0
    const needsAccess = !isAuthed || !hasPaid // not logged in OR not paid
    const isCurrentPageLocked = isIntro
        ? false
        : hasFreePages
            ? pageNum > config.freePageLimit && needsAccess
            : needsAccess
    const isNextPageLocked = hasFreePages && pageNum === config.freePageLimit && needsAccess

    // Load glossary components dynamically for sections that need them
    useEffect(() => {
        if (config.hasGlossary && !GlossaryTerm) {
            import('@/components/reading/GlossaryTerm').then((mod) => {
                GlossaryTerm = mod.default
                GLOSSARY_PATTERNS = mod.GLOSSARY_PATTERNS
                setGlossaryLoaded(true)
            })
        }
    }, [config.hasGlossary])

    useEffect(() => {
        const authed = verifySession()
        setIsAuthed(authed)

        // Track guest reading (unauthenticated user on free content)
        if (!authed && !isCurrentPageLocked) {
            trackGuestReading(config.id, pageNum)
        }

        // Show lock overlay for non-authenticated users on locked sections
        if (!isIntro && !hasFreePages && !authed) {
            setIsLockOverlayOpen(true)
        }

        // Direct access to locked page (unauthenticated)
        if (hasFreePages && pageNum > config.freePageLimit && !authed) {
            setIsLockOverlayOpen(true)
            setIsDirectAccess(true)
        }

        if (authed) {
            // Async payment/session check — determine if user has paid
            authSystem.verifySession().then((result) => {
                if (result.valid) {
                    const paid = result.hasPaid ?? false
                    setHasPaid(paid)

                    // If unpaid and on a non-free page, show lock overlay
                    if (!paid && !isIntro) {
                        const isOnNonFreePage = hasFreePages
                            ? pageNum > config.freePageLimit
                            : true
                        if (isOnNonFreePage) {
                            setIsLockOverlayOpen(true)
                            setIsDirectAccess(true)
                        }
                    }
                } else {
                    // Session invalid — treat as not authenticated
                    setIsAuthed(false)
                    setHasPaid(false)
                    if (!isIntro) {
                        setIsLockOverlayOpen(true)
                    }
                }
            }).catch(() => {
                // On error, keep the server-resolved value (fail-closed for guests;
                // preserves access for an already-verified paying user).
            })

            // Save progress
            const globalPage = isIntro ? pageNum : config.progressOffset + pageNum
            authSystem.updateReadingProgress(globalPage).catch((err) => {
                console.error('Failed to save progress:', err)
            })

            // Update daily mission progress (read_page)
            fetch('/api/missions/progress', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action_type: 'read_page' }),
            }).then(() => {
                window.dispatchEvent(new Event('mission-progress-updated'))
            }).catch(() => { /* silent */ })

            // Load claimed rewards من الخادم
            if (config.hasRewards) {
                fetch('/api/achievements/claimed')
                    .then(res => res.ok ? res.json() : null)
                    .then(data => {
                        if (data?.rewards) {
                            setClaimedRewards(data.rewards)
                        }
                    })
                    .catch(() => {
                        // fallback: قراءة من localStorage
                        const savedRewards = localStorage.getItem('claimed_rewards')
                        if (savedRewards) {
                            setClaimedRewards(JSON.parse(savedRewards))
                        }
                    })
            }

            // Fetch notes for this page
            fetchPageNotes()
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps -- config props are stable for the component's lifetime
    }, [pageNum])

    // Fetch notes for the current section+page
    const fetchPageNotes = useCallback(async () => {
        try {
            const res = await fetch(`/api/notes?section_id=${config.id}&page_number=${pageNum}`)
            if (res.ok) {
                const json = await res.json()
                setPageNotes(json.data || [])
            }
        } catch {
            // Silent — notes are non-critical
        }
    }, [config.id, pageNum])

    // Handle highlight color selection (save immediately)
    const handleHighlight = useCallback(async (selection: HighlightSelection, color: string) => {
        if (!isAuthed) return
        try {
            const res = await fetch('/api/notes', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    section_id: config.id,
                    page_number: pageNum,
                    highlighted_text: selection.text,
                    text_start_offset: selection.startOffset,
                    text_end_offset: selection.endOffset,
                    content_block_index: selection.blockIndex,
                    highlight_color: color,
                }),
            })
            if (res.ok) {
                await fetchPageNotes()
            }
        } catch {
            // Silent
        }
    }, [isAuthed, config.id, pageNum, fetchPageNotes])

    // Handle "add note" from popover
    const handleAddNotePopover = useCallback((selection: HighlightSelection) => {
        const rect = window.getSelection()?.getRangeAt(0)?.getBoundingClientRect()
        setNoteInputSelection(selection)
        setNoteInputText('')
        setNoteInputPos({
            x: rect ? rect.left + rect.width / 2 : 200,
            y: rect ? rect.bottom + 12 : 200,
        })
        setNoteInputVisible(true)
    }, [])

    // Save note with text
    const handleSaveInlineNote = useCallback(async () => {
        if (!noteInputSelection || !isAuthed) return
        setNoteSaving(true)
        try {
            const res = await fetch('/api/notes', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    section_id: config.id,
                    page_number: pageNum,
                    highlighted_text: noteInputSelection.text,
                    text_start_offset: noteInputSelection.startOffset,
                    text_end_offset: noteInputSelection.endOffset,
                    content_block_index: noteInputSelection.blockIndex,
                    note_text: noteInputText || null,
                    highlight_color: 'orange',
                }),
            })
            if (res.ok) {
                setNoteInputVisible(false)
                setNoteInputSelection(null)
                setNoteInputText('')
                await fetchPageNotes()
            }
        } catch { /* silent */ }
        setNoteSaving(false)
    }, [noteInputSelection, noteInputText, isAuthed, config.id, pageNum, fetchPageNotes])

    // Edit note — opens inline modal (replaces window.prompt for proper UX + accessibility)
    const handleEditNote = useCallback((note: NoteData) => {
        setEditingNote({ id: note.id, text: note.note_text || '' })
    }, [])

    const handleSaveEditedNote = useCallback(async () => {
        if (!editingNote) return
        setEditingNoteSaving(true)
        try {
            await fetch(`/api/notes/${editingNote.id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ note_text: editingNote.text.trim() || null }),
            })
            await fetchPageNotes()
            setEditingNote(null)
        } catch { /* silent */ }
        setEditingNoteSaving(false)
    }, [editingNote, fetchPageNotes])

    // Delete note
    const handleDeleteNote = useCallback((noteId: string) => {
        fetch(`/api/notes/${noteId}`, { method: 'DELETE' })
            .then(() => fetchPageNotes())
            .catch(() => {})
    }, [fetchPageNotes])

    const handleNext = useCallback(async () => {
        if (isNextPageLocked) {
            setIsLockOverlayOpen(true)
            setIsDirectAccess(false)
            return
        }
        if (!isIntro && !hasFreePages && needsAccess) {
            setIsLockOverlayOpen(true)
            return
        }

        if (!isLastPage) {
            router.push(`/read/${config.id}/${pageNum + 1}`)
        } else {
            if (isAuthed) {
                await authSystem.completeChapter(config.chapterIndex)
            }
            if (config.nextSection) {
                router.push(config.nextSection.path)
            } else {
                router.push('/toc')
            }
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [pageNum, isNextPageLocked, isLastPage, isAuthed, hasPaid])

    const handlePrev = useCallback(() => {
        if (!isFirstPage) {
            router.push(`/read/${config.id}/${pageNum - 1}`)
        } else if (config.prevSection) {
            router.push(`${config.prevSection.path}/${config.prevSection.lastPage}`)
        } else {
            router.push('/toc')
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [pageNum, isFirstPage])

    // Focus title on page change for screen readers
    useEffect(() => {
        if (titleRef.current) {
            titleRef.current.focus({ preventScroll: false })
        }
    }, [pageNum])

    // Keyboard navigation: ArrowLeft = next (RTL), ArrowRight = prev (RTL)
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            // Don't intercept when user is typing in an input/textarea
            const tag = (e.target as HTMLElement).tagName
            if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return

            if (e.key === 'ArrowLeft') {
                e.preventDefault()
                handleNext()
            } else if (e.key === 'ArrowRight') {
                e.preventDefault()
                handlePrev()
            }
        }
        window.addEventListener('keydown', handleKeyDown)
        return () => window.removeEventListener('keydown', handleKeyDown)
    }, [handleNext, handlePrev])

    // ===== DOM-based highlight rendering =====
    // Apply <mark> elements to actual rendered text nodes based on saved notes
    useEffect(() => {
        if (!currentPage || !contentContainerRef.current) return
        const container = contentContainerRef.current

        // Build a fingerprint to avoid redundant DOM manipulation
        const fingerprint = pageNotes.map(n => n.id + n.highlight_color).join(',')
        if (highlightsAppliedRef.current === fingerprint) return
        highlightsAppliedRef.current = fingerprint

        // 1. Remove old <mark> highlights (un-wrap them)
        container.querySelectorAll('mark.text-highlight').forEach(mark => {
            const parent = mark.parentNode
            if (!parent) return
            while (mark.firstChild) parent.insertBefore(mark.firstChild, mark)
            parent.removeChild(mark)
            parent.normalize() // merge adjacent text nodes back
        })

        // 2. Apply new highlights
        const COLOR_BG: Record<string, string> = {
            orange: 'rgba(255, 107, 53, 0.55)',
            yellow: 'rgba(255, 215, 0, 0.5)',
            green: 'rgba(76, 175, 80, 0.55)',
            blue: 'rgba(33, 150, 243, 0.55)',
            purple: 'rgba(156, 39, 176, 0.55)',
        }
        const COLOR_BORDER: Record<string, string> = {
            orange: 'rgba(255, 107, 53, 0.85)',
            yellow: 'rgba(255, 215, 0, 0.85)',
            green: 'rgba(76, 175, 80, 0.85)',
            blue: 'rgba(33, 150, 243, 0.85)',
            purple: 'rgba(156, 39, 176, 0.85)',
        }

        for (const note of pageNotes) {
            if (
                note.content_block_index === null ||
                note.text_start_offset === null ||
                note.text_end_offset === null ||
                !note.highlighted_text
            ) continue

            const blockEl = container.querySelector(`[data-block-index="${note.content_block_index}"]`)
            if (!blockEl) continue

            // Walk text nodes within the block to find the offset range
            const walker = document.createTreeWalker(blockEl, NodeFilter.SHOW_TEXT)
            let offset = 0
            let startNode: Text | null = null
            let startLocal = 0
            let endNode: Text | null = null
            let endLocal = 0

            while (walker.nextNode()) {
                const textNode = walker.currentNode as Text
                const len = textNode.length

                if (!startNode && offset + len > note.text_start_offset) {
                    startNode = textNode
                    startLocal = note.text_start_offset - offset
                }
                if (!endNode && offset + len >= note.text_end_offset) {
                    endNode = textNode
                    endLocal = note.text_end_offset - offset
                    break
                }
                offset += len
            }

            if (!startNode || !endNode) continue

            try {
                const range = document.createRange()
                range.setStart(startNode, startLocal)
                range.setEnd(endNode, endLocal)

                const mark = document.createElement('mark')
                mark.className = 'text-highlight'
                mark.dataset.noteId = note.id
                mark.style.backgroundColor = COLOR_BG[note.highlight_color] || COLOR_BG.orange
                mark.style.borderBottom = `2px solid ${COLOR_BORDER[note.highlight_color] || COLOR_BORDER.orange}`
                mark.style.cursor = 'pointer'
                mark.style.padding = '1px 2px'
                mark.style.borderRadius = '3px'
                mark.title = note.note_text || 'انقر لعرض الخيارات'

                range.surroundContents(mark)

                if (note.note_text) {
                    const indicator = document.createElement('span')
                    indicator.className = 'highlight-note-indicator'
                    indicator.setAttribute('aria-hidden', 'true')
                    indicator.textContent = ' 💬'
                    mark.appendChild(indicator)
                }
            } catch {
                // surroundContents can fail if range crosses element boundaries
                // fallback: just skip this highlight
            }
        }
    }, [currentPage, pageNotes])

    if (!currentPage) {
        if (typeof window !== 'undefined') router.push('/toc')
        return null
    }

    const handleClaimReward = async (rewardId: string, points: number) => {
        if (!isAuthed) {
            setIsLockOverlayOpen(true)
            return
        }
        if (claimedRewards.includes(rewardId)) return

        try {
            const userId = authSystem.getCurrentUserId()
            if (userId) {
                await updateGamification(userId, points, 'mission_complete')
                const newClaimed = [...claimedRewards, rewardId]
                setClaimedRewards(newClaimed)
                // حفظ في الخادم (المصدر الرئيسي) مع localStorage كـ cache
                fetch('/api/achievements/claimed', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ rewardId }),
                }).catch(() => {
                    // fallback: حفظ في localStorage إذا فشل الاتصال
                    localStorage.setItem('claimed_rewards', JSON.stringify(newClaimed))
                })
                setShowRewardCelebration(rewardId)
                setTimeout(() => setShowRewardCelebration(null), 3000)
            }
        } catch (err) {
            console.error('Failed to claim reward:', err)
        }
    }

    const formatText = (text: string) => {
        if (config.hasGlossary && glossaryLoaded && GlossaryTerm) {
            return formatTextWithGlossary(text, GLOSSARY_PATTERNS, GlossaryTerm)
        }
        return formatDialogue(text)
    }

    const hasPageImage = currentPage.image || currentPage.contentBlocks.some((b) => b.type === 'image')

    return (
        <React.Fragment>
            <Navigation />
            <ScrollProgress />

            <LockedOverlay
                isOpen={isLockOverlayOpen}
                onClose={() => setIsLockOverlayOpen(false)}
                nextPath={`/read/${config.id}/${isDirectAccess ? pageNum : pageNum + 1}`}
                isDirectAccess={isDirectAccess}
            />

            <main id="main-content" style={{ minHeight: '100vh', position: 'relative', overflow: 'hidden', paddingTop: '0' }}>
                <div className="container" style={{ paddingBottom: '40px', maxWidth: '1400px' }}>
                    {/* Reading Actions Bar */}
                    <div className="reading-actions-bar">
                        <FontSizeControl onChange={setReadingFontSize} />
                        {isAuthed && <StreakBanner variant="small" showDetails={false} />}
                        <BookmarkButton
                            pageId={`${config.id}-${pageNum}`}
                            pageTitle={`${config.chapterLabel}: ${currentPage.title}`}
                        />
                    </div>

                    {/* Quick Recap Button — shows on first page of non-first chapters */}
                    {isFirstPage && config.sectionNumber > 1 && extras?.prevRecap && (
                        <QuickRecapButton recap={extras.prevRecap} />
                    )}

                    {/* Notes sidebar toggle button */}
                    {isAuthed && (
                        <button
                            className="notes-toggle-btn"
                            onClick={() => setIsSidebarOpen(true)}
                            title="ملاحظاتي"
                            aria-label={`ملاحظات هذه الصفحة (${pageNotes.length})`}
                        >
                            📝
                            {pageNotes.length > 0 && (
                                <span className="notes-toggle-count">{pageNotes.length}</span>
                            )}
                        </button>
                    )}

                    {/* Header */}
                    <motion.div
                        style={{ textAlign: 'center', marginBottom: '48px' }}
                        initial={prefersReduced ? false : { opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={prefersReduced ? { duration: 0 } : { duration: 0.8 }}
                    >
                        <div style={{ marginBottom: '8px' }}>
                            <span style={{
                                color: '#FF6B35',
                                fontWeight: 'bold',
                                fontSize: '1.1rem',
                                opacity: 0.9,
                                display: 'block',
                                marginBottom: '4px',
                            }}>
                                {config.chapterLabel}
                            </span>
                        </div>
                        <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '24px',
                            marginBottom: '16px',
                            flexWrap: 'wrap',
                        }}>
                            <h1 ref={titleRef} tabIndex={-1} className="chapter-title" style={{ fontSize: '3.5rem', margin: 0, fontWeight: '800', lineHeight: 1.2, outline: 'none' }}>
                                {currentPage.title}
                            </h1>
                            {!hasPageImage && <Robot size={config.robotSize} />}
                        </div>
                        <p style={{ fontSize: '1.4rem', color: '#b0b0b0', maxWidth: '800px', margin: '0 auto', fontWeight: '500' }}>
                            {currentPage.description}
                        </p>
                        <div className="reading-time-badge" aria-label={`وقت القراءة المقدّر: ${estimateReadingTime(currentPage)} دقيقة`}>
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                                <circle cx="12" cy="12" r="10" />
                                <polyline points="12 6 12 12 16 14" />
                            </svg>
                            <span>{estimateReadingTime(currentPage)} دقيقة قراءة</span>
                        </div>
                    </motion.div>

                    {/* Main Page Image (From New Property) */}
                    {currentPage.image && (
                        <motion.div
                            initial={prefersReduced ? false : { opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={prefersReduced ? { duration: 0 } : { duration: 0.8, delay: 0.2 }}
                            style={{ maxWidth: '850px', margin: '0 auto 48px auto', width: '100%', textAlign: 'center' }}
                        >
                            <div style={{
                                borderRadius: '24px',
                                overflow: 'hidden',
                                border: '1px solid rgba(255, 107, 53, 0.25)',
                                boxShadow: '0 25px 60px rgba(0,0,0,0.7)',
                                aspectRatio: '16/9',
                                position: 'relative',
                                background: 'rgba(0,0,0,0.3)',
                            }}>
                                <Image
                                    src={encodeURI(currentPage.image.src)}
                                    alt={currentPage.image.alt}
                                    fill
                                    priority={pageNum <= 2}
                                    style={{ objectFit: 'cover' }}
                                    sizes="(max-width: 768px) 100vw, 850px"
                                />
                            </div>
                            {currentPage.image.caption && (
                                <p style={{ marginTop: '12px', fontSize: '0.9rem', color: '#888' }}>
                                    {currentPage.image.caption}
                                </p>
                            )}
                        </motion.div>
                    )}

                    {/* Content Block Illustration (Existing Logic) */}
                    {!currentPage.image && currentPage.contentBlocks.find((b) => b.type === 'image') && (
                        <motion.div
                            initial={prefersReduced ? false : { opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={prefersReduced ? { duration: 0 } : { duration: 0.8, delay: 0.2 }}
                            style={{ maxWidth: '850px', margin: '0 auto 48px auto', width: '100%', textAlign: 'center' }}
                        >
                            <div style={{
                                borderRadius: '24px',
                                overflow: 'hidden',
                                border: '1px solid rgba(255, 107, 53, 0.25)',
                                boxShadow: '0 25px 60px rgba(0,0,0,0.7)',
                                aspectRatio: config.useExplicitImageSize ? undefined : '16/9',
                                position: 'relative',
                                background: 'rgba(0,0,0,0.3)',
                            }}>
                                {config.useExplicitImageSize ? (
                                    <Image
                                        src={currentPage.contentBlocks.find((b) => b.type === 'image')?.imageUrl || ''}
                                        alt={currentPage.title}
                                        width={1200}
                                        height={800}
                                        style={{ width: '100%', height: 'auto', objectFit: 'cover' }}
                                    />
                                ) : (
                                    <Image
                                        src={currentPage.contentBlocks.find((b) => b.type === 'image')?.imageUrl || ''}
                                        alt={currentPage.title}
                                        fill
                                        style={{ objectFit: 'cover' }}
                                    />
                                )}
                            </div>
                        </motion.div>
                    )}

                    <div className={`reading-font-${readingFontSize}`} style={{ maxWidth: '900px', margin: '0 auto', position: 'relative' }}>
                        {/* TextHighlighter — captures selections */}
                        {isAuthed && !isCurrentPageLocked && (
                            <TextHighlighter
                                sectionId={config.id}
                                pageNumber={pageNum}
                                isAuthed={isAuthed}
                                onHighlight={handleHighlight}
                                onAddNote={handleAddNotePopover}
                                containerRef={contentContainerRef}
                            />
                        )}

                        {/* HighlightRenderer — renders saved highlights tooltips */}
                        {isAuthed && pageNotes.length > 0 && (
                            <HighlightRenderer
                                notes={pageNotes}
                                onNoteClick={() => {}}
                                onEditNote={handleEditNote}
                                onDeleteNote={handleDeleteNote}
                            />
                        )}

                        {/* Edit Note Modal — replaces window.prompt() for proper UX */}
                        {editingNote && (
                            <div
                                role="dialog"
                                aria-modal="true"
                                aria-labelledby="edit-note-title"
                                onClick={(e) => {
                                    if (e.target === e.currentTarget && !editingNoteSaving) setEditingNote(null)
                                }}
                                style={{
                                    position: 'fixed',
                                    inset: 0,
                                    background: 'rgba(0,0,0,0.7)',
                                    backdropFilter: 'blur(4px)',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    zIndex: 9999,
                                    padding: '20px',
                                }}
                            >
                                <div
                                    style={{
                                        background: 'linear-gradient(165deg, rgba(20,14,10,0.98), rgba(12,10,22,0.99))',
                                        border: '1px solid rgba(255,107,53,0.3)',
                                        borderRadius: '16px',
                                        padding: '24px',
                                        maxWidth: '520px',
                                        width: '100%',
                                        boxShadow: '0 20px 60px rgba(0,0,0,0.5)',
                                    }}
                                >
                                    <h3
                                        id="edit-note-title"
                                        style={{ color: '#fff', fontSize: '1.15rem', fontWeight: 700, margin: '0 0 16px' }}
                                    >
                                        تعديل الملاحظة
                                    </h3>
                                    <textarea
                                        value={editingNote.text}
                                        onChange={(e) => setEditingNote({ ...editingNote, text: e.target.value })}
                                        placeholder="اكتب ملاحظتك هنا..."
                                        rows={5}
                                        maxLength={2000}
                                        autoFocus
                                        dir="rtl"
                                        disabled={editingNoteSaving}
                                        onKeyDown={(e) => {
                                            if (e.key === 'Escape' && !editingNoteSaving) setEditingNote(null)
                                            if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) handleSaveEditedNote()
                                        }}
                                        style={{
                                            width: '100%',
                                            background: 'rgba(255,255,255,0.04)',
                                            border: '1px solid rgba(255,255,255,0.1)',
                                            borderRadius: '10px',
                                            padding: '12px 14px',
                                            color: '#fff',
                                            fontSize: '0.95rem',
                                            lineHeight: 1.7,
                                            resize: 'vertical',
                                            fontFamily: 'inherit',
                                            outline: 'none',
                                            marginBottom: '16px',
                                        }}
                                    />
                                    <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                                        <button
                                            onClick={() => setEditingNote(null)}
                                            disabled={editingNoteSaving}
                                            style={{
                                                background: 'rgba(255,255,255,0.06)',
                                                border: '1px solid rgba(255,255,255,0.12)',
                                                color: 'rgba(255,255,255,0.75)',
                                                padding: '10px 22px',
                                                borderRadius: '10px',
                                                fontSize: '0.9rem',
                                                fontWeight: 600,
                                                cursor: editingNoteSaving ? 'not-allowed' : 'pointer',
                                                fontFamily: 'inherit',
                                            }}
                                        >
                                            إلغاء
                                        </button>
                                        <button
                                            onClick={handleSaveEditedNote}
                                            disabled={editingNoteSaving}
                                            style={{
                                                background: 'linear-gradient(135deg, #FF6B35, #FF8C42)',
                                                border: 'none',
                                                color: '#fff',
                                                padding: '10px 26px',
                                                borderRadius: '10px',
                                                fontSize: '0.9rem',
                                                fontWeight: 700,
                                                cursor: editingNoteSaving ? 'wait' : 'pointer',
                                                fontFamily: 'inherit',
                                                opacity: editingNoteSaving ? 0.7 : 1,
                                            }}
                                        >
                                            {editingNoteSaving ? 'جاري الحفظ...' : 'حفظ التعديل'}
                                        </button>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Inline note input */}
                        {noteInputVisible && (
                            <div
                                className="notes-inline-input"
                                style={{
                                    left: `${noteInputPos.x}px`,
                                    top: `${noteInputPos.y}px`,
                                    transform: 'translateX(-50%)',
                                }}
                            >
                                <textarea
                                    className="notes-inline-textarea"
                                    value={noteInputText}
                                    onChange={(e) => setNoteInputText(e.target.value)}
                                    placeholder="اكتب ملاحظتك هنا..."
                                    rows={3}
                                    maxLength={2000}
                                    autoFocus
                                    dir="rtl"
                                />
                                <div className="notes-inline-actions">
                                    <button
                                        className="notes-inline-save"
                                        onClick={handleSaveInlineNote}
                                        disabled={noteSaving}
                                    >
                                        {noteSaving ? 'جاري الحفظ...' : 'حفظ'}
                                    </button>
                                    <button
                                        className="notes-inline-cancel"
                                        onClick={() => {
                                            setNoteInputVisible(false)
                                            setNoteInputSelection(null)
                                        }}
                                    >
                                        إلغاء
                                    </button>
                                </div>
                            </div>
                        )}

                        <motion.div
                            ref={contentContainerRef}
                            initial={prefersReduced ? false : { opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={prefersReduced ? { duration: 0 } : { duration: 0.8, delay: 0.4 }}
                            key={pageNum}
                            style={{
                                display: 'flex',
                                flexDirection: 'column',
                                gap: '32px',
                                filter: isCurrentPageLocked ? 'blur(8px)' : 'none',
                                pointerEvents: isCurrentPageLocked ? 'none' : 'auto',
                                opacity: isCurrentPageLocked ? 0.3 : 1,
                            }}
                        >
                            {/* Mobile Card Mode Toggle */}
                            {isMobile && !isCurrentPageLocked && currentPage.contentBlocks.length > 2 && (
                                <div style={{ display: 'flex', justifyContent: 'center' }}>
                                    <button
                                        onClick={() => setIsCardMode(!isCardMode)}
                                        style={{
                                            background: isCardMode ? 'rgba(255,107,53,0.15)' : 'rgba(255,255,255,0.05)',
                                            border: `1px solid ${isCardMode ? 'rgba(255,107,53,0.4)' : 'rgba(255,255,255,0.1)'}`,
                                            color: isCardMode ? '#FF6B35' : '#999',
                                            padding: '6px 16px',
                                            borderRadius: '20px',
                                            fontSize: '0.78rem',
                                            cursor: 'pointer',
                                            fontFamily: 'inherit',
                                        }}
                                    >
                                        {isCardMode ? '📖 عرض عادي' : '🃏 عرض البطاقات'}
                                    </button>
                                </div>
                            )}

                            {/* Knowledge Card View (mobile only) */}
                            {isMobile && isCardMode && !isCurrentPageLocked && currentPage.contentBlocks.length > 2 ? (
                                <KnowledgeCardView
                                    blocks={currentPage.contentBlocks.filter(
                                        (block, idx) => !(block.type === 'image' && idx === currentPage.contentBlocks.findIndex((b) => b.type === 'image'))
                                    )}
                                    formatText={formatText}
                                    onExit={() => setIsCardMode(false)}
                                />
                            ) : (
                            /* Normal scroll view */
                            currentPage.contentBlocks
                                .filter((block, idx) => !(block.type === 'image' && idx === currentPage.contentBlocks.findIndex((b) => b.type === 'image')))
                                .map((block, index) => (
                                    <div key={index} data-block-index={index}>
                                        {/* Text Block */}
                                        {block.type === 'text' && (
                                            <div style={{
                                                padding: '16px 24px',
                                                background: 'rgba(255, 255, 255, 0.02)',
                                                borderRadius: '12px',
                                                borderRight: '4px solid #FF6B35',
                                            }}>
                                                {block.title && <h4 style={{ color: '#FF6B35', marginBottom: '8px' }}>{block.title}</h4>}
                                                <p style={{
                                                    fontSize: '1.1rem',
                                                    lineHeight: '1.8',
                                                    color: '#d0d0d0',
                                                    margin: 0,
                                                    whiteSpace: 'pre-line',
                                                }}>
                                                    {formatText(block.content)}
                                                </p>
                                            </div>
                                        )}

                                        {/* Image Block */}
                                        {block.type === 'image' && (
                                            <motion.div
                                                initial={prefersReduced ? false : { opacity: 0, scale: 0.95 }}
                                                whileInView={{ opacity: 1, scale: 1 }}
                                                viewport={{ once: true }}
                                                style={{
                                                    borderRadius: '16px',
                                                    overflow: 'hidden',
                                                    border: '1px solid rgba(255, 107, 53, 0.2)',
                                                    boxShadow: '0 10px 30px rgba(0,0,0,0.5)',
                                                    margin: '10px 0',
                                                }}
                                            >
                                                <div style={{ position: 'relative', width: '100%', aspectRatio: config.useExplicitImageSize ? undefined : '16/9' }}>
                                                    {config.useExplicitImageSize ? (
                                                        <Image
                                                            src={block.imageUrl || ''}
                                                            alt={block.title || 'Lesson Image'}
                                                            width={1200}
                                                            height={800}
                                                            style={{ width: '100%', height: 'auto', objectFit: 'cover' }}
                                                        />
                                                    ) : (
                                                        <Image
                                                            src={block.imageUrl || ''}
                                                            alt={block.title || 'Lesson Image'}
                                                            fill
                                                            style={{ objectFit: 'cover' }}
                                                        />
                                                    )}
                                                </div>
                                                {block.title && (
                                                    <div style={{
                                                        padding: '12px',
                                                        background: 'rgba(0,0,0,0.6)',
                                                        color: '#fff',
                                                        fontSize: '0.9rem',
                                                        textAlign: 'center',
                                                        borderTop: '1px solid rgba(255, 107, 53, 0.1)',
                                                    }}>
                                                        {formatEnhancedText(block.title)}
                                                    </div>
                                                )}
                                            </motion.div>
                                        )}

                                        {/* Video Block (pre-rendered motion-graphics clip, e.g. Remotion mp4) */}
                                        {block.type === 'video' && block.videoUrl && (
                                            <motion.div
                                                initial={prefersReduced ? false : { opacity: 0, scale: 0.95 }}
                                                whileInView={{ opacity: 1, scale: 1 }}
                                                viewport={{ once: true }}
                                                style={{
                                                    borderRadius: '16px',
                                                    overflow: 'hidden',
                                                    border: '1px solid rgba(255, 107, 53, 0.2)',
                                                    boxShadow: '0 10px 30px rgba(0,0,0,0.5)',
                                                    margin: '10px 0',
                                                    background: '#050505',
                                                }}
                                            >
                                                <video
                                                    src={block.videoUrl}
                                                    poster={block.poster}
                                                    autoPlay={block.autoplay !== false && !prefersReduced}
                                                    loop={block.loop !== false}
                                                    muted
                                                    playsInline
                                                    controls={prefersReduced || block.autoplay === false}
                                                    preload="metadata"
                                                    style={{ width: '100%', height: 'auto', display: 'block' }}
                                                />
                                                {block.title && (
                                                    <div style={{
                                                        padding: '12px',
                                                        background: 'rgba(0,0,0,0.6)',
                                                        color: '#fff',
                                                        fontSize: '0.9rem',
                                                        textAlign: 'center',
                                                        borderTop: '1px solid rgba(255, 107, 53, 0.1)',
                                                    }}>
                                                        {formatEnhancedText(block.title)}
                                                    </div>
                                                )}
                                            </motion.div>
                                        )}

                                        {/* Interactive Block (in-page React animation widget) */}
                                        {block.type === 'interactive' && (
                                            <InteractiveWidget widget={block.widget} />
                                        )}

                                        {/* Card Block */}
                                        {block.type === 'card' && (
                                            <motion.div
                                                className="card card-glow responsive-card"
                                                style={{
                                                    background: block.isReward
                                                        ? 'linear-gradient(135deg, rgba(255, 107, 53, 0.08), rgba(255, 184, 0, 0.05))'
                                                        : 'rgba(255, 107, 53, 0.04)',
                                                    border: '1px solid rgba(255, 107, 53, 0.15)',
                                                    borderRadius: '16px',
                                                }}
                                                whileHover={prefersReduced ? {} : { y: -5, background: 'rgba(255, 107, 53, 0.06)' }}
                                            >
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '12px' }}>
                                                    <div style={{
                                                        width: '28px',
                                                        height: '28px',
                                                        borderRadius: '50%',
                                                        background: '#FF6B35',
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        justifyContent: 'center',
                                                        fontSize: '0.9rem',
                                                        fontWeight: 'bold',
                                                        color: '#fff',
                                                    }}>
                                                        {block.isReward ? '\u{1F3C6}' : '\u2726'}
                                                    </div>
                                                    <h3 style={{ fontSize: '1.3rem', margin: 0, color: '#FFB800' }}>
                                                        {block.title}
                                                    </h3>
                                                </div>

                                                {block.content && (
                                                    <div style={{
                                                        fontSize: '1.1rem',
                                                        color: '#fff',
                                                        margin: 0,
                                                        lineHeight: '1.8',
                                                        textAlign: block.isReward ? 'center' : 'right',
                                                        marginBottom: (block.items || block.isReward) ? '24px' : '0',
                                                    }}>
                                                        {block.isReward ? (
                                                            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', alignItems: 'center' }}>
                                                                {block.content.split('\n\n').map((paragraph: string, pIdx: number) => (
                                                                    <div key={pIdx} style={{
                                                                        background: pIdx === 0 ? 'rgba(255, 255, 255, 0.03)' : 'transparent',
                                                                        padding: pIdx === 0 ? '12px 20px' : '0',
                                                                        borderRadius: '12px',
                                                                        width: '100%',
                                                                    }}>
                                                                        {paragraph.split('\n').map((line: string, lIdx: number) => {
                                                                            const isPoints = line.includes('\u0646\u0642\u0627\u0637') || line.includes('\u0646\u0642\u0637\u0629')
                                                                            const isBadge = line.includes('\u0634\u0627\u0631\u0629')

                                                                            return (
                                                                                <div key={lIdx} style={{
                                                                                    display: 'flex',
                                                                                    alignItems: 'center',
                                                                                    justifyContent: 'center',
                                                                                    gap: '8px',
                                                                                    marginBottom: '4px',
                                                                                    color: isPoints ? '#FFB800' : (isBadge ? '#4CAF50' : '#fff'),
                                                                                    fontWeight: (isPoints || isBadge) ? 'bold' : 'normal',
                                                                                }}>
                                                                                    {isPoints && <span>{'\u2B50'}</span>}
                                                                                    {isBadge && <span>{'\u{1F3C5}'}</span>}
                                                                                    <span>{formatBoldMarkdown(line)}</span>
                                                                                </div>
                                                                            )
                                                                        })}
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        ) : (
                                                            <p style={{ whiteSpace: 'pre-line', margin: 0 }}>
                                                                {formatText(block.content)}
                                                            </p>
                                                        )}
                                                    </div>
                                                )}

                                                {/* Reward Claim Button */}
                                                {block.isReward && block.rewardId && config.hasRewards && (
                                                    <div style={{ marginTop: '16px', display: 'flex', justifyContent: 'center' }}>
                                                        {claimedRewards.includes(block.rewardId) ? (
                                                            <div style={{
                                                                display: 'flex',
                                                                alignItems: 'center',
                                                                gap: '8px',
                                                                color: '#4CAF50',
                                                                fontWeight: 'bold',
                                                                padding: '10px 20px',
                                                                background: 'rgba(76, 175, 80, 0.1)',
                                                                borderRadius: '12px',
                                                            }}>
                                                                <span style={{ fontSize: '1.2rem' }}>{'\u2713'}</span>
                                                                {'\u062a\u0645 \u0627\u0644\u062d\u0635\u0648\u0644 \u0639\u0644\u0649 \u0627\u0644\u0646\u0642\u0627\u0637'}
                                                            </div>
                                                        ) : (
                                                            <motion.button
                                                                whileHover={{ scale: 1.05 }}
                                                                whileTap={{ scale: 0.95 }}
                                                                onClick={() => handleClaimReward(block.rewardId!, block.points || 0)}
                                                                style={{
                                                                    background: '#FF6B35',
                                                                    color: '#fff',
                                                                    border: 'none',
                                                                    padding: '12px 24px',
                                                                    borderRadius: '12px',
                                                                    fontWeight: 'bold',
                                                                    cursor: 'pointer',
                                                                    fontSize: '1rem',
                                                                    boxShadow: '0 4px 15px rgba(255, 107, 53, 0.3)',
                                                                }}
                                                            >
                                                                {'\u0647\u0644 \u0623\u0643\u0645\u0644\u062a \u0627\u0644\u0645\u0647\u0645\u0629\u061f \u0627\u062d\u0635\u0644 \u0639\u0644\u0649 '}{block.points}{' \u0646\u0642\u0627\u0637'}
                                                            </motion.button>
                                                        )}

                                                        {showRewardCelebration === block.rewardId && (
                                                            <div style={{
                                                                position: 'absolute',
                                                                top: '0',
                                                                left: '0',
                                                                width: '100%',
                                                                height: '100%',
                                                                pointerEvents: 'none',
                                                                zIndex: 999,
                                                                display: 'flex',
                                                                alignItems: 'center',
                                                                justifyContent: 'center',
                                                            }}>
                                                                <div style={{ position: 'relative', width: '1px', height: '1px' }}>
                                                                    {[...Array(16)].map((_, i) => {
                                                                        const angle = (i / 16) * Math.PI * 2
                                                                        const distance = 120 + Math.random() * 180
                                                                        const icons = ['\u{1F389}', '\u2728', '\u2B50', '\u{1F48E}', '\u{1F525}', '\u{1F48E}', '\u2728', '\u{1F38A}']
                                                                        const icon = icons[i % icons.length]

                                                                        return (
                                                                            <motion.div
                                                                                key={i}
                                                                                initial={{ x: 0, y: 0, opacity: 1, scale: 0 }}
                                                                                animate={{
                                                                                    x: Math.cos(angle) * distance,
                                                                                    y: Math.sin(angle) * distance,
                                                                                    opacity: 0,
                                                                                    scale: 1.2,
                                                                                    rotate: 720,
                                                                                }}
                                                                                transition={{
                                                                                    duration: 2,
                                                                                    ease: 'easeOut',
                                                                                    delay: (i % 4) * 0.05,
                                                                                }}
                                                                                style={{
                                                                                    position: 'absolute',
                                                                                    fontSize: '1.8rem',
                                                                                    filter: 'drop-shadow(0 0 10px rgba(255,255,255,0.4))',
                                                                                }}
                                                                            >
                                                                                {icon}
                                                                            </motion.div>
                                                                        )
                                                                    })}
                                                                    <motion.div
                                                                        initial={{ opacity: 0, y: 20, scale: 0.5 }}
                                                                        animate={{ opacity: 1, y: -80, scale: 1 }}
                                                                        transition={{ type: 'spring', stiffness: 200, damping: 15 }}
                                                                        style={{
                                                                            position: 'absolute',
                                                                            left: '50%',
                                                                            transform: 'translateX(-50%)',
                                                                            whiteSpace: 'nowrap',
                                                                            color: '#FFB800',
                                                                            fontWeight: 'bold',
                                                                            fontSize: '1.8rem',
                                                                            textShadow: '0 0 20px rgba(0,0,0,0.8), 0 0 10px rgba(255,184,0,0.5)',
                                                                            zIndex: 1000,
                                                                            background: 'rgba(0,0,0,0.4)',
                                                                            padding: '8px 24px',
                                                                            borderRadius: '20px',
                                                                            backdropFilter: 'blur(4px)',
                                                                            border: '1px solid rgba(255,184,0,0.3)',
                                                                        }}
                                                                    >
                                                                        {'\u062c\u0627\u0647\u0632 \u0644\u0644\u062a\u062d\u062f\u064a \u0627\u0644\u062a\u0627\u0644\u064a!'}
                                                                    </motion.div>
                                                                </div>
                                                            </div>
                                                        )}
                                                    </div>
                                                )}

                                                {/* Card Items (Accordion) */}
                                                {block.items && (
                                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                                        {block.items.map((item, idx) => (
                                                            <details
                                                                key={idx}
                                                                style={{
                                                                    background: 'rgba(255, 255, 255, 0.03)',
                                                                    borderRadius: '8px',
                                                                    overflow: 'hidden',
                                                                    border: '1px solid rgba(255, 255, 255, 0.05)',
                                                                }}
                                                            >
                                                                <summary style={{
                                                                    padding: '12px 16px',
                                                                    cursor: 'pointer',
                                                                    fontWeight: 'bold',
                                                                    color: '#e0e0e0',
                                                                    fontSize: '0.95rem',
                                                                    userSelect: 'none',
                                                                    outline: 'none',
                                                                }}>
                                                                    {item.title}
                                                                </summary>
                                                                <div style={{
                                                                    padding: '0 16px 16px 16px',
                                                                    fontSize: '0.9rem',
                                                                    color: '#b0b0b0',
                                                                    lineHeight: '1.5',
                                                                }}>
                                                                    {item.content}
                                                                </div>
                                                            </details>
                                                        ))}
                                                    </div>
                                                )}
                                            </motion.div>
                                        )}

                                        {/* Code Block */}
                                        {block.type === 'code' && (
                                            <div className="code-block-wrapper" role="region" aria-label={block.title || 'مثال كود'} style={{ marginTop: '10px' }}>
                                                {block.title && <h3 style={{ color: '#FF6B35', marginBottom: '12px', fontSize: '1.4rem' }}>{block.title}</h3>}
                                                <div className="code-block" style={{ margin: 0, padding: '24px', paddingTop: '50px', position: 'relative' }}>
                                                    <CopyButton text={block.code || ''} />
                                                    <pre style={{ margin: 0, whiteSpace: 'pre-wrap' }}><code style={{ color: '#FFB800' }}>{block.code}</code></pre>
                                                    {block.content && (
                                                        <div style={{
                                                            marginTop: '16px',
                                                            paddingTop: '16px',
                                                            borderTop: '1px solid rgba(255,107,53,0.2)',
                                                            fontSize: '0.9rem',
                                                            color: '#888',
                                                            whiteSpace: 'pre-line',
                                                        }}>
                                                            {block.content}
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                ))
                            )}
                        </motion.div>
                    </div>

                    {/* Specialization Examples — shows after content on relevant sections */}
                    {isLastPage && !isCurrentPageLocked && extras?.hasSpec && (
                        <SpecializationExamples sectionId={config.id} />
                    )}

                    {/* Running Project Banner - shows on last page of relevant sections */}
                    {isLastPage && RUNNING_PROJECT_PHASES[config.sectionNumber] && (
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.3 }}
                            className="running-project-chapter-banner"
                        >
                            <div className="rpcb-icon">🚀</div>
                            <div className="rpcb-content">
                                <div className="rpcb-title">المشروع الممتد</div>
                                <div className="rpcb-desc">
                                    أكملت هذا الفصل! عندك مرحلة مرتبطة في المشروع الممتد:
                                    <strong> {RUNNING_PROJECT_PHASES[config.sectionNumber].label}</strong>
                                </div>
                                <Link href="/running-project" className="rpcb-btn">
                                    انتقل للمشروع الممتد ←
                                </Link>
                            </div>
                        </motion.div>
                    )}

                    {/* Chapter Recap — shows on last page of each section */}
                    {isLastPage && config.sectionNumber >= 1 && extras?.recap && (
                        <ChapterRecap
                            recap={extras.recap}
                            nextSectionPath={config.nextSection?.path || null}
                        />
                    )}

                    {/* Navigation Buttons & Progress Dots */}
                    <ReadingPagination
                        currentIndex={pageNum - 1}
                        total={totalPages}
                        onPrev={handlePrev}
                        onNext={handleNext}
                        isFirst={isFirstPage}
                        isLast={isLastPage}
                        isNextLocked={isNextPageLocked}
                        onLockedClick={() => {
                            setIsLockOverlayOpen(true)
                            setIsDirectAccess(false)
                        }}
                    />

                    <div style={{ textAlign: 'center', marginTop: '40px' }}>
                        <Link href="/toc" style={{ color: '#b0b0b0', textDecoration: 'none', fontSize: '0.9rem' }}>
                            العودة إلى الفهرس
                        </Link>
                    </div>
                </div>
            </main>
            <BackToTop />

            {/* Notes Sidebar */}
            {isAuthed && (
                <NotesSidebar
                    notes={pageNotes}
                    isOpen={isSidebarOpen}
                    onClose={() => setIsSidebarOpen(false)}
                    onEditNote={handleEditNote}
                    onDeleteNote={handleDeleteNote}
                    sectionLabel={`${config.chapterLabel} — صفحة ${pageNum}`}
                />
            )}

            {/* Daily Missions Widget */}
            {isAuthed && <DailyMissionsWidget />}

            {/* Guest Banner — shows for unauthenticated readers on free pages */}
            {!isAuthed && !isCurrentPageLocked && <GuestBanner />}
        </React.Fragment>
    )
}
