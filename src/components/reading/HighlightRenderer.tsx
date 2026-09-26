'use client'

import React, { useCallback, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useReducedMotion } from '@/hooks/useReducedMotion'

// =====================================================
// HighlightRenderer — يعيد رسم التظليلات المحفوظة + tooltip
// =====================================================

export interface NoteData {
    id: string
    user_id: string
    section_id: string
    page_number: number
    highlighted_text: string | null
    text_start_offset: number | null
    text_end_offset: number | null
    content_block_index: number | null
    note_text: string | null
    highlight_color: 'orange' | 'yellow' | 'green' | 'blue' | 'purple'
    created_at: string
    updated_at: string
}

interface HighlightRendererProps {
    notes: NoteData[]
    onNoteClick: (note: NoteData) => void
    onEditNote: (note: NoteData) => void
    onDeleteNote: (noteId: string) => void
}

const COLOR_MAP: Record<string, string> = {
    orange: 'rgba(255, 107, 53, 0.55)',
    yellow: 'rgba(255, 215, 0, 0.5)',
    green: 'rgba(76, 175, 80, 0.55)',
    blue: 'rgba(33, 150, 243, 0.55)',
    purple: 'rgba(156, 39, 176, 0.55)',
}

const COLOR_BORDER_MAP: Record<string, string> = {
    orange: 'rgba(255, 107, 53, 0.85)',
    yellow: 'rgba(255, 215, 0, 0.85)',
    green: 'rgba(76, 175, 80, 0.85)',
    blue: 'rgba(33, 150, 243, 0.85)',
    purple: 'rgba(156, 39, 176, 0.85)',
}

export default function HighlightRenderer({
    notes,
    onNoteClick,
    onEditNote,
    onDeleteNote,
}: HighlightRendererProps) {
    const [activeTooltip, setActiveTooltip] = useState<string | null>(null)
    const [tooltipPos, setTooltipPos] = useState<{ x: number; y: number }>({ x: 0, y: 0 })
    const prefersReduced = useReducedMotion()

    const handleHighlightClick = useCallback((e: React.MouseEvent, note: NoteData) => {
        e.stopPropagation()
        const rect = (e.currentTarget as HTMLElement).getBoundingClientRect()
        const scrollTop = window.scrollY || document.documentElement.scrollTop

        setTooltipPos({
            x: rect.left + rect.width / 2,
            y: rect.bottom + scrollTop + 8,
        })
        setActiveTooltip(activeTooltip === note.id ? null : note.id)
        onNoteClick(note)
    }, [activeTooltip, onNoteClick])

    // Close tooltip on outside click
    React.useEffect(() => {
        const handleClick = () => setActiveTooltip(null)
        if (activeTooltip) {
            document.addEventListener('click', handleClick)
            return () => document.removeEventListener('click', handleClick)
        }
    }, [activeTooltip])

    const activeNote = notes.find(n => n.id === activeTooltip)

    return (
        <>
            {/* Tooltip for active highlight */}
            <AnimatePresence>
                {activeTooltip && activeNote && (
                    <motion.div
                        className="highlight-tooltip"
                        style={{
                            position: 'absolute',
                            left: `${tooltipPos.x}px`,
                            top: `${tooltipPos.y}px`,
                            transform: 'translateX(-50%)',
                            zIndex: 1001,
                        }}
                        initial={prefersReduced ? { opacity: 1 } : { opacity: 0, y: -4 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={prefersReduced ? { opacity: 0 } : { opacity: 0, y: -4 }}
                        transition={prefersReduced ? { duration: 0 } : { duration: 0.15 }}
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="highlight-tooltip-content">
                            {activeNote.note_text && (
                                <p className="highlight-tooltip-note">{activeNote.note_text}</p>
                            )}
                            {!activeNote.note_text && (
                                <p className="highlight-tooltip-empty">لا توجد ملاحظة</p>
                            )}
                            <div className="highlight-tooltip-actions">
                                <button
                                    onClick={() => onEditNote(activeNote)}
                                    className="highlight-tooltip-btn highlight-tooltip-edit"
                                >
                                    ✏️ تعديل
                                </button>
                                <button
                                    onClick={() => {
                                        onDeleteNote(activeNote.id)
                                        setActiveTooltip(null)
                                    }}
                                    className="highlight-tooltip-btn highlight-tooltip-delete"
                                >
                                    🗑️ حذف
                                </button>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </>
    )
}

/**
 * Helper: يحوّل النص العادي لنص مع تظليلات مطبقة
 * يُستخدم داخل content blocks لإعادة رسم التظليلات
 */
export function applyHighlights(
    text: string,
    blockIndex: number,
    notes: NoteData[],
    onHighlightClick: (e: React.MouseEvent, note: NoteData) => void
): React.ReactNode {
    // Filter notes for this block
    const blockNotes = notes.filter(
        n => n.content_block_index === blockIndex &&
            n.highlighted_text &&
            n.text_start_offset !== null &&
            n.text_end_offset !== null
    ).sort((a, b) => (a.text_start_offset || 0) - (b.text_start_offset || 0))

    if (blockNotes.length === 0) return text

    const segments: React.ReactNode[] = []
    let lastEnd = 0

    for (const note of blockNotes) {
        const start = note.text_start_offset!
        const end = note.text_end_offset!

        // Skip overlapping highlights
        if (start < lastEnd) continue

        // Add non-highlighted text before this highlight
        if (start > lastEnd) {
            segments.push(text.slice(lastEnd, start))
        }

        // Add highlighted text
        segments.push(
            <mark
                key={note.id}
                data-note-id={note.id}
                className="text-highlight"
                style={{
                    backgroundColor: COLOR_MAP[note.highlight_color] || COLOR_MAP.orange,
                    borderBottom: `2px solid ${COLOR_BORDER_MAP[note.highlight_color] || COLOR_BORDER_MAP.orange}`,
                    cursor: 'pointer',
                    padding: '1px 2px',
                    borderRadius: '3px',
                    transition: 'background-color 0.2s',
                }}
                onClick={(e) => onHighlightClick(e, note)}
                title={note.note_text || 'انقر لعرض الخيارات'}
            >
                {text.slice(start, end)}
                {note.note_text && (
                    <span className="highlight-note-indicator" aria-hidden="true">💬</span>
                )}
            </mark>
        )

        lastEnd = end
    }

    // Add remaining text
    if (lastEnd < text.length) {
        segments.push(text.slice(lastEnd))
    }

    return <>{segments}</>
}
