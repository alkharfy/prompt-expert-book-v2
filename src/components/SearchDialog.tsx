'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { useRouter } from 'next/navigation'
import Fuse, { FuseResult } from 'fuse.js'
import type { SearchIndexItem } from '@/utils/searchIndex'
import { trackSearch } from '@/lib/meta-pixel'

interface SearchDialogProps {
    isOpen: boolean
    onClose: () => void
}

export default function SearchDialog({ isOpen, onClose }: SearchDialogProps) {
    const router = useRouter()
    const inputRef = useRef<HTMLInputElement>(null)
    const [query, setQuery] = useState('')
    const [results, setResults] = useState<FuseResult<SearchIndexItem>[]>([])
    const [fuse, setFuse] = useState<Fuse<SearchIndexItem> | null>(null)
    const [isLoading, setIsLoading] = useState(false)
    const [selectedIndex, setSelectedIndex] = useState(0)
    const resultsRef = useRef<HTMLDivElement>(null)

    // Build index on first open
    useEffect(() => {
        if (!isOpen || fuse) return

        setIsLoading(true)
        // Fetch the entitlement-gated index from the server. Locked pages arrive
        // with no `body`, so the book text is never bundled into the client.
        fetch('/api/search-index')
            .then((r) => r.json())
            .then((data: { items?: SearchIndexItem[] }) => {
                const fuseInstance = new Fuse(data.items || [], {
                    keys: [
                        { name: 'title', weight: 3 },
                        { name: 'description', weight: 2 },
                        { name: 'body', weight: 1 },
                    ],
                    threshold: 0.35,
                    distance: 200,
                    minMatchCharLength: 2,
                    includeMatches: true,
                })
                setFuse(fuseInstance)
                setIsLoading(false)
            })
            .catch(() => setIsLoading(false))
    }, [isOpen, fuse])

    // Focus input when opened
    useEffect(() => {
        if (isOpen && inputRef.current) {
            setTimeout(() => inputRef.current?.focus(), 100)
        }
        if (!isOpen) {
            setQuery('')
            setResults([])
            setSelectedIndex(0)
        }
    }, [isOpen])

    // Search on query change
    useEffect(() => {
        if (!fuse || !query.trim()) {
            setResults([])
            setSelectedIndex(0)
            return
        }
        const searchResults = fuse.search(query, { limit: 15 })
        setResults(searchResults)
        setSelectedIndex(0)
        if (searchResults.length > 0) {
            trackSearch(query)
        }
    }, [query, fuse])

    // Close on Escape
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') {
                onClose()
            }
        }
        if (isOpen) {
            document.addEventListener('keydown', handleKeyDown)
            return () => document.removeEventListener('keydown', handleKeyDown)
        }
    }, [isOpen, onClose])

    // Keyboard shortcut: Ctrl+K / Cmd+K to open
    // (handled externally in Navigation)

    const handleNavigate = useCallback((path: string) => {
        onClose()
        router.push(path)
    }, [onClose, router])

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'ArrowDown') {
            e.preventDefault()
            setSelectedIndex((prev) => Math.min(prev + 1, results.length - 1))
        } else if (e.key === 'ArrowUp') {
            e.preventDefault()
            setSelectedIndex((prev) => Math.max(prev - 1, 0))
        } else if (e.key === 'Enter' && results[selectedIndex]) {
            e.preventDefault()
            handleNavigate(results[selectedIndex].item.path)
        }
    }

    // Scroll selected item into view
    useEffect(() => {
        if (resultsRef.current) {
            const selected = resultsRef.current.querySelector('[data-selected="true"]')
            if (selected) {
                selected.scrollIntoView({ block: 'nearest' })
            }
        }
    }, [selectedIndex])

    if (!isOpen) return null

    return (
        <div
            className="search-overlay"
            onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
            role="dialog"
            aria-modal="true"
            aria-label="البحث في المحتوى"
        >
            <div className="search-dialog">
                {/* Search Input */}
                <div className="search-input-wrapper">
                    <svg className="search-input-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                        <circle cx="11" cy="11" r="8" />
                        <path d="M21 21l-4.35-4.35" />
                    </svg>
                    <input
                        ref={inputRef}
                        type="text"
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        onKeyDown={handleKeyDown}
                        placeholder="ابحث في الكتاب..."
                        className="search-input"
                        aria-label="ابحث في الكتاب"
                        autoComplete="off"
                    />
                    <kbd className="search-shortcut">Esc</kbd>
                </div>

                {/* Results */}
                <div className="search-results" ref={resultsRef}>
                    {isLoading && (
                        <div className="search-loading">
                            <div className="loading-spinner" />
                            <span>جاري تحميل الفهرس...</span>
                        </div>
                    )}

                    {!isLoading && query.trim() && results.length === 0 && (
                        <div className="search-empty">
                            <span>لا توجد نتائج لـ &ldquo;{query}&rdquo;</span>
                        </div>
                    )}

                    {results.map((result, idx) => (
                        <button
                            key={result.item.id}
                            className={`search-result-item ${idx === selectedIndex ? 'selected' : ''}`}
                            data-selected={idx === selectedIndex}
                            onClick={() => handleNavigate(result.item.path)}
                            onMouseEnter={() => setSelectedIndex(idx)}
                        >
                            <div className="search-result-section">{result.item.sectionLabel}</div>
                            <div className="search-result-title">{result.item.title}</div>
                            <div className="search-result-desc">{result.item.description}</div>
                        </button>
                    ))}
                </div>

                {/* Footer */}
                {!isLoading && (
                    <div className="search-footer">
                        <span><kbd>↑</kbd><kbd>↓</kbd> للتنقل</span>
                        <span><kbd>Enter</kbd> للانتقال</span>
                        <span><kbd>Esc</kbd> للإغلاق</span>
                    </div>
                )}
            </div>
        </div>
    )
}
