'use client'

import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { authSystem } from '@/lib/auth_system'
import { dbLogger } from '@/lib/logger'
import { getBookmarks, toggleBookmark } from '@/actions/bookmarks'

interface BookmarkButtonProps {
    pageId: string  // e.g., "section-1-3" or "intro-1"
    pageTitle: string
    className?: string
}

export default function BookmarkButton({ pageId, pageTitle, className = '' }: BookmarkButtonProps) {
    const [isBookmarked, setIsBookmarked] = useState(false)
    const [isLoading, setIsLoading] = useState(true)
    const [showToast, setShowToast] = useState(false)
    const [toastMessage, setToastMessage] = useState('')

    const checkBookmarkStatus = useCallback(async () => {
        try {
            const userId = authSystem.getCurrentUserId()
            if (!userId) {
                setIsLoading(false)
                return
            }

            const { bookmarks } = await getBookmarks()
            setIsBookmarked(bookmarks.some((b) => b.id === pageId))
        } catch (err) {
            dbLogger.error('Error checking bookmark:', err)
        } finally {
            setIsLoading(false)
        }
    }, [pageId])

    useEffect(() => {
        checkBookmarkStatus()
    }, [checkBookmarkStatus])

    const handleToggle = async () => {
        const userId = authSystem.getCurrentUserId()
        if (!userId) {
            setToastMessage('يجب تسجيل الدخول لحفظ الإشارات')
            setShowToast(true)
            setTimeout(() => setShowToast(false), 2000)
            return
        }

        setIsLoading(true)

        try {
            const action = isBookmarked ? 'remove' : 'add'
            const result = await toggleBookmark(action, pageId, pageTitle)

            if (!result.success) {
                dbLogger.error('Error saving bookmark:', result.message)
                setToastMessage('حدث خطأ في الحفظ')
                setShowToast(true)
                setTimeout(() => setShowToast(false), 2000)
                return
            }

            setIsBookmarked(result.isBookmarked)
            setToastMessage(result.message)
            setShowToast(true)
            setTimeout(() => setShowToast(false), 2000)
        } catch (err) {
            dbLogger.error('Error toggling bookmark:', err)
            setToastMessage('حدث خطأ')
            setShowToast(true)
            setTimeout(() => setShowToast(false), 2000)
        } finally {
            setIsLoading(false)
        }
    }


    return (
        <>
            <motion.button
                className={`bookmark-button ${isBookmarked ? 'bookmarked' : ''} ${className}`}
                onClick={handleToggle}
                disabled={isLoading}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                title={isBookmarked ? 'إزالة الإشارة' : 'حفظ إشارة مرجعية'}
                aria-label={isBookmarked ? 'إزالة الإشارة المرجعية' : 'حفظ إشارة مرجعية'}
                aria-pressed={isBookmarked}
            >
                <motion.svg
                    width="22"
                    height="22"
                    viewBox="0 0 24 24"
                    fill={isBookmarked ? 'currentColor' : 'none'}
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    animate={isBookmarked ? { scale: [1, 1.3, 1] } : {}}
                    transition={{ duration: 0.3 }}
                    aria-hidden="true"
                >
                    <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
                </motion.svg>
            </motion.button>

            {/* Toast Notification */}
            <AnimatePresence>
                {showToast && (
                    <motion.div
                        className="bookmark-toast"
                        initial={{ opacity: 0, y: 50 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 50 }}
                        role="alert"
                    >
                        {toastMessage}
                    </motion.div>
                )}
            </AnimatePresence>
        </>
    )
}
