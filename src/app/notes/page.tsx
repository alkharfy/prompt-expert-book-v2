'use client'

import React, { useCallback, useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import Link from 'next/link'
import Navigation from '@/components/Navigation'
import { verifySession } from '@/lib/auth'
import { useReducedMotion } from '@/hooks/useReducedMotion'
import type { NoteData } from '@/components/reading/HighlightRenderer'
import '@/styles/notes.css'

// =====================================================
// صفحة الملاحظات — /notes — عرض كل ملاحظات المستخدم
// =====================================================

type SortOption = 'date_desc' | 'date_asc' | 'section'
type FilterColor = 'all' | 'orange' | 'yellow' | 'green' | 'blue' | 'purple'

const COLOR_NAMES: Record<string, string> = {
    all: 'الكل',
    orange: 'برتقالي',
    yellow: 'أصفر',
    green: 'أخضر',
    blue: 'أزرق',
    purple: 'بنفسجي',
}

const COLOR_HEX: Record<string, string> = {
    orange: '#FF6B35',
    yellow: '#FFD700',
    green: '#4CAF50',
    blue: '#2196F3',
    purple: '#9C27B0',
}

const SECTION_NAMES: Record<string, string> = {
    'intro': 'المقدمة',
    'section-1': 'الفصل 1: أساسيات البرومبت',
    'section-2': 'الفصل 2: من الفكرة للمواصفات',
    'section-3': 'الفصل 3: تصميم التجربة',
    'section-4': 'الفصل 4: كتابة المحتوى',
    'section-5': 'الفصل 5: الجودة والتحسين',
    'section-6': 'الفصل 6: الأدوات',
    'appendix': 'الملحق',
    'glossary': 'المعجم',
}

export default function NotesPage() {
    const [isAuthed, setIsAuthed] = useState(false)
    const [notes, setNotes] = useState<NoteData[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    // Filters & Search
    const [sortBy, setSortBy] = useState<SortOption>('date_desc')
    const [filterColor, setFilterColor] = useState<FilterColor>('all')
    const [filterSection, setFilterSection] = useState<string>('all')
    const [filterHasNote, setFilterHasNote] = useState<boolean>(false)
    const [searchQuery, setSearchQuery] = useState('')

    // Edit modal
    const [editingNote, setEditingNote] = useState<NoteData | null>(null)
    const [editText, setEditText] = useState('')
    const [saving, setSaving] = useState(false)

    const prefersReduced = useReducedMotion()

    // Auth check
    useEffect(() => {
        const authed = verifySession()
        setIsAuthed(authed)
    }, [])

    // Fetch all notes
    const fetchNotes = useCallback(async () => {
        setLoading(true)
        setError(null)
        try {
            const res = await fetch('/api/notes')
            if (!res.ok) {
                throw new Error('فشل في جلب الملاحظات')
            }
            const json = await res.json()
            setNotes(json.data || [])
        } catch (err) {
            setError('تعذر تحميل الملاحظات')
        } finally {
            setLoading(false)
        }
    }, [])

    useEffect(() => {
        if (isAuthed) {
            fetchNotes()
        } else {
            setLoading(false)
        }
    }, [isAuthed, fetchNotes])

    // Edit note
    const handleEditNote = (note: NoteData) => {
        setEditingNote(note)
        setEditText(note.note_text || '')
    }

    const handleSaveEdit = async () => {
        if (!editingNote) return
        setSaving(true)
        try {
            const res = await fetch(`/api/notes/${editingNote.id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ note_text: editText || null }),
            })
            if (res.ok) {
                const json = await res.json()
                setNotes(prev => prev.map(n => n.id === editingNote.id ? json.data : n))
                setEditingNote(null)
            }
        } catch {
            // silent
        } finally {
            setSaving(false)
        }
    }

    // Delete note
    const handleDeleteNote = async (noteId: string) => {
        try {
            const res = await fetch(`/api/notes/${noteId}`, { method: 'DELETE' })
            if (res.ok) {
                setNotes(prev => prev.filter(n => n.id !== noteId))
            }
        } catch {
            // silent
        }
    }

    // Export notes as text
    const handleExport = () => {
        const text = filteredNotes.map(n => {
            const section = SECTION_NAMES[n.section_id] || n.section_id
            const lines = [
                `📍 ${section} — صفحة ${n.page_number}`,
                n.highlighted_text ? `📌 "${n.highlighted_text}"` : '',
                n.note_text ? `📝 ${n.note_text}` : '',
                `🕐 ${new Date(n.created_at).toLocaleDateString('ar-EG')}`,
                '---',
            ]
            return lines.filter(Boolean).join('\n')
        }).join('\n\n')

        const blob = new Blob([text], { type: 'text/plain;charset=utf-8' })
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = 'ملاحظاتي.txt'
        a.click()
        URL.revokeObjectURL(url)
    }

    // ============= Filtering & Sorting =============
    const uniqueSections = [...new Set(notes.map(n => n.section_id))]

    let filteredNotes = [...notes]

    // Color filter
    if (filterColor !== 'all') {
        filteredNotes = filteredNotes.filter(n => n.highlight_color === filterColor)
    }

    // Section filter
    if (filterSection !== 'all') {
        filteredNotes = filteredNotes.filter(n => n.section_id === filterSection)
    }

    // Has note filter
    if (filterHasNote) {
        filteredNotes = filteredNotes.filter(n => n.note_text)
    }

    // Search
    if (searchQuery.trim()) {
        const q = searchQuery.trim().toLowerCase()
        filteredNotes = filteredNotes.filter(n =>
            (n.note_text && n.note_text.toLowerCase().includes(q)) ||
            (n.highlighted_text && n.highlighted_text.toLowerCase().includes(q))
        )
    }

    // Sort
    filteredNotes.sort((a, b) => {
        switch (sortBy) {
            case 'date_desc':
                return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
            case 'date_asc':
                return new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
            case 'section':
                return a.section_id.localeCompare(b.section_id) || a.page_number - b.page_number
            default:
                return 0
        }
    })

    // Stats
    const totalNotes = notes.length
    const totalSections = uniqueSections.length

    return (
        <>
            <Navigation />
            <main id="main-content" className="notes-page">
                <div className="container" style={{ maxWidth: '1000px', padding: '2rem 1rem' }}>
                    {/* Header */}
                    <motion.div
                        className="notes-page-header"
                        initial={prefersReduced ? false : { opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={prefersReduced ? { duration: 0 } : { duration: 0.6 }}
                    >
                        <h1 className="notes-page-title">📝 ملاحظاتي</h1>
                        <p className="notes-page-subtitle">
                            {totalNotes > 0
                                ? `عندك ${totalNotes} ملاحظة في ${totalSections} ${totalSections === 1 ? 'فصل' : 'فصول'}`
                                : 'لا توجد ملاحظات بعد — ظلّل أي نص أثناء القراءة لإضافة ملاحظة!'
                            }
                        </p>
                    </motion.div>

                    {/* Auth check */}
                    {!isAuthed && !loading && (
                        <div className="notes-page-auth">
                            <p>يجب تسجيل الدخول لعرض ملاحظاتك</p>
                            <Link href="/login" className="notes-page-login-btn">
                                تسجيل الدخول
                            </Link>
                        </div>
                    )}

                    {/* Loading */}
                    {loading && (
                        <div className="notes-page-loading">
                            <div className="notes-page-spinner" />
                            <p>جاري تحميل الملاحظات...</p>
                        </div>
                    )}

                    {/* Error */}
                    {error && (
                        <div className="notes-page-error">
                            <p>{error}</p>
                            <button onClick={fetchNotes}>إعادة المحاولة</button>
                        </div>
                    )}

                    {/* Content */}
                    {isAuthed && !loading && !error && (
                        <>
                            {/* Toolbar */}
                            {totalNotes > 0 && (
                                <motion.div
                                    className="notes-toolbar"
                                    initial={prefersReduced ? false : { opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={prefersReduced ? { duration: 0 } : { delay: 0.2 }}
                                >
                                    {/* Search */}
                                    <div className="notes-search-wrapper">
                                        <svg className="notes-search-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                                            <circle cx="11" cy="11" r="8" />
                                            <path d="M21 21l-4.35-4.35" />
                                        </svg>
                                        <input
                                            type="text"
                                            placeholder="ابحث في الملاحظات..."
                                            value={searchQuery}
                                            onChange={(e) => setSearchQuery(e.target.value)}
                                            className="notes-search-input"
                                        />
                                    </div>

                                    {/* Filters row */}
                                    <div className="notes-filters">
                                        {/* Color filter */}
                                        <select
                                            value={filterColor}
                                            onChange={(e) => setFilterColor(e.target.value as FilterColor)}
                                            className="notes-filter-select"
                                        >
                                            {Object.entries(COLOR_NAMES).map(([key, name]) => (
                                                <option key={key} value={key}>{name}</option>
                                            ))}
                                        </select>

                                        {/* Section filter */}
                                        <select
                                            value={filterSection}
                                            onChange={(e) => setFilterSection(e.target.value)}
                                            className="notes-filter-select"
                                        >
                                            <option value="all">كل الفصول</option>
                                            {uniqueSections.map(s => (
                                                <option key={s} value={s}>{SECTION_NAMES[s] || s}</option>
                                            ))}
                                        </select>

                                        {/* Sort */}
                                        <select
                                            value={sortBy}
                                            onChange={(e) => setSortBy(e.target.value as SortOption)}
                                            className="notes-filter-select"
                                        >
                                            <option value="date_desc">الأحدث أولاً</option>
                                            <option value="date_asc">الأقدم أولاً</option>
                                            <option value="section">حسب الفصل</option>
                                        </select>

                                        {/* Has note toggle */}
                                        <label className="notes-filter-checkbox">
                                            <input
                                                type="checkbox"
                                                checked={filterHasNote}
                                                onChange={(e) => setFilterHasNote(e.target.checked)}
                                            />
                                            <span>بها ملاحظات فقط</span>
                                        </label>

                                        {/* Export */}
                                        <button onClick={handleExport} className="notes-export-btn" title="تصدير الملاحظات">
                                            📥 تصدير
                                        </button>
                                    </div>
                                </motion.div>
                            )}

                            {/* Notes grid */}
                            <div className="notes-grid">
                                <AnimatePresence mode="popLayout">
                                    {filteredNotes.map((note, index) => (
                                        <motion.div
                                            key={note.id}
                                            className="notes-card"
                                            layout
                                            initial={prefersReduced ? false : { opacity: 0, y: 20 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            exit={prefersReduced ? { opacity: 0 } : { opacity: 0, scale: 0.9 }}
                                            transition={prefersReduced ? { duration: 0 } : { delay: index * 0.03 }}
                                        >
                                            {/* Highlight text */}
                                            {note.highlighted_text && (
                                                <div className="notes-card-highlight">
                                                    <span
                                                        className="notes-card-color-dot"
                                                        style={{ backgroundColor: COLOR_HEX[note.highlight_color] || COLOR_HEX.orange }}
                                                    />
                                                    <span className="notes-card-highlight-text">
                                                        &ldquo;{note.highlighted_text.length > 120
                                                            ? note.highlighted_text.slice(0, 120) + '...'
                                                            : note.highlighted_text
                                                        }&rdquo;
                                                    </span>
                                                </div>
                                            )}

                                            {/* Note text */}
                                            {note.note_text && (
                                                <p className="notes-card-note">{note.note_text}</p>
                                            )}

                                            {/* Meta */}
                                            <div className="notes-card-meta">
                                                <Link
                                                    href={`/read/${note.section_id}/${note.page_number}`}
                                                    className="notes-card-link"
                                                >
                                                    {SECTION_NAMES[note.section_id] || note.section_id} — صفحة {note.page_number}
                                                </Link>
                                                <span className="notes-card-date">
                                                    {new Date(note.created_at).toLocaleDateString('ar-EG', {
                                                        day: 'numeric',
                                                        month: 'short',
                                                    })}
                                                </span>
                                            </div>

                                            {/* Actions */}
                                            <div className="notes-card-actions">
                                                <button
                                                    onClick={() => handleEditNote(note)}
                                                    className="notes-card-action-btn"
                                                >
                                                    ✏️ تعديل
                                                </button>
                                                <button
                                                    onClick={() => handleDeleteNote(note.id)}
                                                    className="notes-card-action-btn notes-card-delete-btn"
                                                >
                                                    🗑️ حذف
                                                </button>
                                            </div>
                                        </motion.div>
                                    ))}
                                </AnimatePresence>
                            </div>

                            {/* Empty state (filtered) */}
                            {filteredNotes.length === 0 && totalNotes > 0 && (
                                <div className="notes-page-no-results">
                                    <p>لا توجد ملاحظات تطابق الفلتر الحالي</p>
                                    <button
                                        onClick={() => {
                                            setFilterColor('all')
                                            setFilterSection('all')
                                            setFilterHasNote(false)
                                            setSearchQuery('')
                                        }}
                                        className="notes-reset-filter-btn"
                                    >
                                        إزالة الفلاتر
                                    </button>
                                </div>
                            )}
                        </>
                    )}
                </div>
            </main>

            {/* Edit Modal */}
            <AnimatePresence>
                {editingNote && (
                    <motion.div
                        className="notes-modal-backdrop"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={() => setEditingNote(null)}
                    >
                        <motion.div
                            className="notes-modal"
                            initial={prefersReduced ? { opacity: 0 } : { opacity: 0, scale: 0.9, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={prefersReduced ? { opacity: 0 } : { opacity: 0, scale: 0.9, y: 20 }}
                            onClick={(e) => e.stopPropagation()}
                            dir="rtl"
                        >
                            <h3 className="notes-modal-title">تعديل الملاحظة</h3>

                            {editingNote.highlighted_text && (
                                <div className="notes-modal-highlight">
                                    &ldquo;{editingNote.highlighted_text}&rdquo;
                                </div>
                            )}

                            <textarea
                                value={editText}
                                onChange={(e) => setEditText(e.target.value)}
                                placeholder="اكتب ملاحظتك هنا..."
                                className="notes-modal-textarea"
                                maxLength={2000}
                                rows={4}
                                autoFocus
                            />

                            <div className="notes-modal-counter">
                                {editText.length} / 2000
                            </div>

                            <div className="notes-modal-actions">
                                <button
                                    onClick={handleSaveEdit}
                                    disabled={saving}
                                    className="notes-modal-save"
                                >
                                    {saving ? 'جاري الحفظ...' : 'حفظ'}
                                </button>
                                <button
                                    onClick={() => setEditingNote(null)}
                                    className="notes-modal-cancel"
                                >
                                    إلغاء
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </>
    )
}
