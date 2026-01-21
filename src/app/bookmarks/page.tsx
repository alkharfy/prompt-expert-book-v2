'use client'

import { motion } from 'framer-motion'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import Navigation from '@/components/Navigation'
import { useEffect, useState, useCallback } from 'react'
import { authSystem } from '@/lib/auth_system'
import { verifySession } from '@/lib/auth'
import { dbLogger } from '@/lib/logger'

interface Bookmark {
    id: string
    title: string
    date: string
}

export default function BookmarksPage() {
    const router = useRouter()
    const [isAuthed, setIsAuthed] = useState(false)
    const [bookmarks, setBookmarks] = useState<Bookmark[]>([])
    const [isLoading, setIsLoading] = useState(true)

    const fetchBookmarks = useCallback(async () => {
        try {
            const userId = authSystem.getCurrentUserId()
            if (!userId) return

            const response = await fetch('/api/bookmarks')
            if (!response.ok) {
                dbLogger.error('Error fetching bookmarks')
                setIsLoading(false)
                return
            }

            const data = await response.json()
            const bookmarksList = data.bookmarks || []

            if (Array.isArray(bookmarksList)) {
                // Sort by date descending (newest first)
                const sorted = [...bookmarksList].sort((a: Bookmark, b: Bookmark) =>
                    new Date(b.date).getTime() - new Date(a.date).getTime()
                )
                setBookmarks(sorted)
            }
        } catch (err) {
            dbLogger.error('Error fetching bookmarks:', err)
        } finally {
            setIsLoading(false)
        }
    }, [])

    useEffect(() => {
        const authed = verifySession()
        setIsAuthed(authed)

        if (!authed) {
            router.push('/login')
            return
        }

        fetchBookmarks()
    }, [router, fetchBookmarks])

    const deleteBookmark = async (bookmarkId: string) => {
        try {
            const userId = authSystem.getCurrentUserId()
            if (!userId) return

            const response = await fetch('/api/bookmarks', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    action: 'remove',
                    pageId: bookmarkId
                })
            })

            if (!response.ok) {
                dbLogger.error('Error deleting bookmark')
                return
            }

            setBookmarks(prev => prev.filter(b => b.id !== bookmarkId))
        } catch (err) {
            dbLogger.error('Error deleting bookmark:', err)
        }
    }

    const getBookmarkPath = (id: string): string => {
        // Parse bookmark ID to get path
        // Format: section-1-3 or intro-1 or library-2
        const parts = id.split('-')

        // Validate parts array
        if (!parts || parts.length === 0) {
            return '/toc' // Fallback
        }

        if (parts[0] === 'intro') {
            return `/read/intro/${parts[1] || '1'}`
        } else if (parts[0] === 'library') {
            return `/library/${parts[1] || '1'}`
        } else if (parts[0] === 'appendix') {
            return `/read/appendix/${parts[1] || '1'}`
        } else if (parts[0] === 'glossary') {
            return `/read/glossary/${parts[1] || '1'}`
        } else if (parts.length >= 3) {
            // section-X-Y format
            return `/read/${parts[0]}-${parts[1]}/${parts[2]}`
        } else {
            // Unknown format - fallback
            return '/toc'
        }
    }

    const formatDate = (dateString: string): string => {
        const date = new Date(dateString)
        return date.toLocaleDateString('ar-EG', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        })
    }

    return (
        <>
            <Navigation />

            <main style={{ minHeight: '100vh', position: 'relative', overflow: 'hidden', paddingTop: '120px' }}>
                <div className="container" style={{ maxWidth: '800px' }}>
                    <motion.div
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6 }}
                        style={{ marginBottom: '40px' }}
                    >
                        <h1 style={{
                            fontSize: 'clamp(2rem, 4vw, 3rem)',
                            background: 'linear-gradient(135deg, #FF6B35, #FFB800)',
                            WebkitBackgroundClip: 'text',
                            WebkitTextFillColor: 'transparent',
                            marginBottom: '12px'
                        }}>
                            📑 إشاراتي المرجعية
                        </h1>
                        <p style={{ color: '#b0b0b0', fontSize: '1.1rem' }}>
                            الصفحات التي حفظتها للرجوع إليها لاحقاً
                        </p>
                    </motion.div>

                    {isLoading ? (
                        <div style={{ textAlign: 'center', padding: '60px 0' }}>
                            <motion.div
                                animate={{ rotate: 360 }}
                                transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                                style={{
                                    width: '40px',
                                    height: '40px',
                                    border: '3px solid rgba(255, 107, 53, 0.2)',
                                    borderTopColor: '#FF6B35',
                                    borderRadius: '50%',
                                    margin: '0 auto'
                                }}
                            />
                        </div>
                    ) : bookmarks.length === 0 ? (
                        <motion.div
                            className="empty-state"
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ duration: 0.5 }}
                        >
                            <svg className="empty-state-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                                <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
                            </svg>
                            <h3 className="empty-state-title">لا توجد إشارات مرجعية</h3>
                            <p className="empty-state-text">
                                اضغط على أيقونة الإشارة المرجعية في أي صفحة لحفظها هنا
                            </p>
                            <Link href="/toc" className="btn btn-primary" style={{ marginTop: '24px' }}>
                                استكشف المحتوى
                            </Link>
                        </motion.div>
                    ) : (
                        <div className="bookmarks-list">
                            {bookmarks.map((bookmark, index) => (
                                <motion.div
                                    key={bookmark.id}
                                    className="bookmark-item"
                                    initial={{ opacity: 0, x: -20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ duration: 0.4, delay: index * 0.05 }}
                                >
                                    <Link
                                        href={getBookmarkPath(bookmark.id)}
                                        className="bookmark-item-content"
                                        style={{ textDecoration: 'none', flex: 1 }}
                                    >
                                        <span className="bookmark-item-title">{bookmark.title}</span>
                                        <span className="bookmark-item-date">{formatDate(bookmark.date)}</span>
                                    </Link>
                                    <div className="bookmark-item-actions">
                                        <button
                                            className="bookmark-delete-btn"
                                            onClick={() => deleteBookmark(bookmark.id)}
                                            title="حذف الإشارة"
                                        >
                                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                <path d="M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2m3 0v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6h14z" />
                                            </svg>
                                        </button>
                                    </div>
                                </motion.div>
                            ))}
                        </div>
                    )}

                    <div style={{ textAlign: 'center', marginTop: '60px' }}>
                        <Link href="/toc" style={{ color: '#b0b0b0', textDecoration: 'none', fontSize: '0.95rem' }}>
                            ← العودة إلى الفهرس
                        </Link>
                    </div>
                </div>
            </main>
        </>
    )
}
