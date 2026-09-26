'use client'

import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useReducedMotion } from '@/hooks/useReducedMotion'
import type { NoteData } from './HighlightRenderer'

// =====================================================
// NotesSidebar — شريط جانبي يعرض ملاحظات الصفحة الحالية
// =====================================================

interface NotesSidebarProps {
    notes: NoteData[]
    isOpen: boolean
    onClose: () => void
    onEditNote: (note: NoteData) => void
    onDeleteNote: (noteId: string) => void
    sectionLabel?: string
}

const COLOR_DOT_MAP: Record<string, string> = {
    orange: '#FF6B35',
    yellow: '#FFD700',
    green: '#4CAF50',
    blue: '#2196F3',
    purple: '#9C27B0',
}

export default function NotesSidebar({
    notes,
    isOpen,
    onClose,
    onEditNote,
    onDeleteNote,
    sectionLabel,
}: NotesSidebarProps) {
    const prefersReduced = useReducedMotion()
    const [confirmDelete, setConfirmDelete] = useState<string | null>(null)

    const handleDelete = (noteId: string) => {
        if (confirmDelete === noteId) {
            onDeleteNote(noteId)
            setConfirmDelete(null)
        } else {
            setConfirmDelete(noteId)
            // Auto-reset confirmation after 3 seconds
            setTimeout(() => setConfirmDelete(null), 3000)
        }
    }

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    {/* Backdrop */}
                    <motion.div
                        className="notes-sidebar-backdrop"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                    />

                    {/* Sidebar */}
                    <motion.aside
                        className="notes-sidebar"
                        initial={prefersReduced ? { opacity: 0 } : { x: '100%', opacity: 0 }}
                        animate={prefersReduced ? { opacity: 1 } : { x: 0, opacity: 1 }}
                        exit={prefersReduced ? { opacity: 0 } : { x: '100%', opacity: 0 }}
                        transition={prefersReduced ? { duration: 0 } : { type: 'spring', damping: 25, stiffness: 300 }}
                        dir="rtl"
                    >
                        {/* Header */}
                        <div className="notes-sidebar-header">
                            <div className="notes-sidebar-title">
                                <span className="notes-sidebar-icon">📝</span>
                                <h3>ملاحظاتي ({notes.length})</h3>
                            </div>
                            <button
                                onClick={onClose}
                                className="notes-sidebar-close"
                                aria-label="إغلاق الملاحظات"
                            >
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                    <line x1="18" y1="6" x2="6" y2="18" />
                                    <line x1="6" y1="6" x2="18" y2="18" />
                                </svg>
                            </button>
                        </div>

                        {sectionLabel && (
                            <div className="notes-sidebar-section-label">
                                {sectionLabel}
                            </div>
                        )}

                        {/* Notes List */}
                        <div className="notes-sidebar-list">
                            {notes.length === 0 ? (
                                <div className="notes-sidebar-empty">
                                    <span className="notes-sidebar-empty-icon">📖</span>
                                    <p>لا توجد ملاحظات في هذه الصفحة</p>
                                    <p className="notes-sidebar-empty-hint">
                                        ظلّل أي نص لإضافة ملاحظة
                                    </p>
                                </div>
                            ) : (
                                notes.map((note, index) => (
                                    <motion.div
                                        key={note.id}
                                        className="notes-sidebar-card"
                                        initial={prefersReduced ? false : { opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={prefersReduced ? { duration: 0 } : { delay: index * 0.05 }}
                                    >
                                        {/* Color indicator + highlighted text */}
                                        {note.highlighted_text && (
                                            <div className="notes-sidebar-highlight">
                                                <span
                                                    className="notes-sidebar-color-dot"
                                                    style={{ backgroundColor: COLOR_DOT_MAP[note.highlight_color] || COLOR_DOT_MAP.orange }}
                                                />
                                                <span className="notes-sidebar-highlight-text">
                                                    &ldquo;{note.highlighted_text.length > 80
                                                        ? note.highlighted_text.slice(0, 80) + '...'
                                                        : note.highlighted_text
                                                    }&rdquo;
                                                </span>
                                            </div>
                                        )}

                                        {/* Note text */}
                                        {note.note_text ? (
                                            <p className="notes-sidebar-note-text">
                                                {note.note_text}
                                            </p>
                                        ) : (
                                            <p className="notes-sidebar-no-note">بدون ملاحظة</p>
                                        )}

                                        {/* Actions */}
                                        <div className="notes-sidebar-card-actions">
                                            <button
                                                onClick={() => onEditNote(note)}
                                                className="notes-sidebar-action-btn notes-sidebar-edit"
                                            >
                                                ✏️ تعديل
                                            </button>
                                            <button
                                                onClick={() => handleDelete(note.id)}
                                                className={`notes-sidebar-action-btn notes-sidebar-delete ${confirmDelete === note.id ? 'confirm' : ''}`}
                                            >
                                                {confirmDelete === note.id ? '⚠️ تأكيد الحذف' : '🗑️ حذف'}
                                            </button>
                                        </div>

                                        {/* Timestamp */}
                                        <div className="notes-sidebar-timestamp">
                                            {new Date(note.created_at).toLocaleDateString('ar-EG', {
                                                day: 'numeric',
                                                month: 'short',
                                                hour: '2-digit',
                                                minute: '2-digit',
                                            })}
                                        </div>
                                    </motion.div>
                                ))
                            )}
                        </div>
                    </motion.aside>
                </>
            )}
        </AnimatePresence>
    )
}
