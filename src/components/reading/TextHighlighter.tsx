'use client'

import React, { useCallback, useEffect, useRef, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useReducedMotion } from '@/hooks/useReducedMotion'

// =====================================================
// TextHighlighter — يلتقط تظليل النص ويعرض قائمة ألوان
// =====================================================

export interface HighlightSelection {
    text: string
    startOffset: number
    endOffset: number
    blockIndex: number
}

interface TextHighlighterProps {
    sectionId: string
    pageNumber: number
    isAuthed: boolean
    onHighlight: (selection: HighlightSelection, color: string) => void
    onAddNote: (selection: HighlightSelection) => void
    containerRef: React.RefObject<HTMLDivElement | null>
}

const COLORS = [
    { key: 'orange', hex: '#FF6B35', label: 'برتقالي' },
    { key: 'yellow', hex: '#FFD700', label: 'أصفر' },
    { key: 'green', hex: '#4CAF50', label: 'أخضر' },
    { key: 'blue', hex: '#2196F3', label: 'أزرق' },
    { key: 'purple', hex: '#9C27B0', label: 'بنفسجي' },
]

export default function TextHighlighter({
    sectionId,
    pageNumber,
    isAuthed,
    onHighlight,
    onAddNote,
    containerRef,
}: TextHighlighterProps) {
    const [popoverPos, setPopoverPos] = useState<{ x: number; y: number } | null>(null)
    const [popoverBelow, setPopoverBelow] = useState(false)
    const [currentSelection, setCurrentSelection] = useState<HighlightSelection | null>(null)
    const popoverRef = useRef<HTMLDivElement>(null)
    const prefersReduced = useReducedMotion()

    const getBlockIndex = useCallback((node: Node): number => {
        if (!containerRef.current) return 0
        const contentBlocks = containerRef.current.querySelectorAll('[data-block-index]')
        for (let i = 0; i < contentBlocks.length; i++) {
            if (contentBlocks[i].contains(node)) {
                return parseInt(contentBlocks[i].getAttribute('data-block-index') || '0')
            }
        }
        return 0
    }, [containerRef])

    const handleSelectionChange = useCallback(() => {
        if (!isAuthed) return

        const selection = window.getSelection()
        if (!selection || selection.isCollapsed || !selection.rangeCount) {
            // Don't dismiss immediately - user might be clicking a color
            return
        }

        const selectedText = selection.toString().trim()
        if (!selectedText || selectedText.length < 2 || selectedText.length > 1000) {
            return
        }

        // Make sure selection is within our container
        const range = selection.getRangeAt(0)
        if (!containerRef.current?.contains(range.commonAncestorContainer)) {
            return
        }

        // Calculate block index and offsets
        const blockIndex = getBlockIndex(range.startContainer)
        const blockEl = containerRef.current?.querySelector(`[data-block-index="${blockIndex}"]`)

        let startOffset = 0
        let endOffset = 0
        if (blockEl) {
            // Calculate text offset within the block
            const treeWalker = document.createTreeWalker(blockEl, NodeFilter.SHOW_TEXT)
            let offset = 0
            let foundStart = false
            let foundEnd = false

            while (treeWalker.nextNode()) {
                const textNode = treeWalker.currentNode
                if (textNode === range.startContainer) {
                    startOffset = offset + range.startOffset
                    foundStart = true
                }
                if (textNode === range.endContainer) {
                    endOffset = offset + range.endOffset
                    foundEnd = true
                    break
                }
                offset += (textNode.textContent?.length || 0)
            }

            if (!foundStart || !foundEnd) {
                startOffset = 0
                endOffset = selectedText.length
            }
        }

        // Position the popover above the selection (fixed positioning = viewport coords)
        const rect = range.getBoundingClientRect()

        // Clamp x so popover stays within viewport
        const popoverWidth = 260 // approximate popover width
        const halfWidth = popoverWidth / 2
        const rawX = rect.left + rect.width / 2
        const clampedX = Math.max(halfWidth + 8, Math.min(rawX, window.innerWidth - halfWidth - 8))

        // If selection is near top of screen, show below instead
        const spaceAbove = rect.top
        const showBelow = spaceAbove < 70

        setPopoverBelow(showBelow)
        setPopoverPos({
            x: clampedX,
            y: showBelow ? rect.bottom + 16 : rect.top - 24,
        })

        setCurrentSelection({
            text: selectedText,
            startOffset,
            endOffset,
            blockIndex,
        })
    }, [isAuthed, containerRef, getBlockIndex])

    useEffect(() => {
        // Use mouseup/touchend instead of selectionchange for better control
        const handleMouseUp = () => {
            // Small delay to ensure selection is complete
            setTimeout(handleSelectionChange, 50)
        }

        const handleTouchEnd = () => {
            // Mobile needs longer delay for selection to finalize
            setTimeout(handleSelectionChange, 300)
        }

        document.addEventListener('mouseup', handleMouseUp)
        document.addEventListener('touchend', handleTouchEnd)

        return () => {
            document.removeEventListener('mouseup', handleMouseUp)
            document.removeEventListener('touchend', handleTouchEnd)
        }
    }, [handleSelectionChange])

    // Dismiss popover on click outside
    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (popoverRef.current && !popoverRef.current.contains(e.target as Node)) {
                setPopoverPos(null)
                setCurrentSelection(null)
            }
        }

        // Use a slight delay to avoid dismissing right after selection
        const handler = (e: MouseEvent) => setTimeout(() => handleClickOutside(e), 100)
        document.addEventListener('mousedown', handler)
        return () => document.removeEventListener('mousedown', handler)
    }, [])

    const handleColorClick = (colorKey: string) => {
        if (!currentSelection) return
        onHighlight(currentSelection, colorKey)
        window.getSelection()?.removeAllRanges()
        setPopoverPos(null)
        setCurrentSelection(null)
    }

    const handleNoteClick = () => {
        if (!currentSelection) return
        onAddNote(currentSelection)
        window.getSelection()?.removeAllRanges()
        setPopoverPos(null)
        setCurrentSelection(null)
    }

    return (
        <AnimatePresence>
            {popoverPos && currentSelection && (
                <motion.div
                    ref={popoverRef}
                    className="highlight-popover"
                    style={{
                        position: 'fixed',
                        left: `${popoverPos.x}px`,
                        top: `${popoverPos.y}px`,
                        transform: popoverBelow ? 'translate(-50%, 0)' : 'translate(-50%, -100%)',
                        zIndex: 1000,
                    }}
                    initial={prefersReduced ? { opacity: 1 } : { opacity: 0, y: popoverBelow ? -8 : 8, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={prefersReduced ? { opacity: 0 } : { opacity: 0, y: popoverBelow ? -8 : 8, scale: 0.95 }}
                    transition={prefersReduced ? { duration: 0 } : { duration: 0.15 }}
                >
                    <div className="highlight-popover-content">
                        <div className="highlight-colors">
                            {COLORS.map((color) => (
                                <button
                                    key={color.key}
                                    onClick={() => handleColorClick(color.key)}
                                    className="highlight-color-btn"
                                    style={{ backgroundColor: color.hex }}
                                    aria-label={`تظليل ${color.label}`}
                                    title={color.label}
                                />
                            ))}
                        </div>
                        <div className="highlight-divider" />
                        <button
                            onClick={handleNoteClick}
                            className="highlight-note-btn"
                            aria-label="إضافة ملاحظة"
                        >
                            📝 ملاحظة
                        </button>
                    </div>
                    <div className={popoverBelow ? 'highlight-popover-arrow-up' : 'highlight-popover-arrow'} />
                </motion.div>
            )}
        </AnimatePresence>
    )
}
