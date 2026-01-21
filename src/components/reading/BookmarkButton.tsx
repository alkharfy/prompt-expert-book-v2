'use client'

import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { supabase } from '@/lib/supabase'
import { authSystem } from '@/lib/auth_system'
import { dbLogger } from '@/lib/logger'

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

            const { data, error } = await supabase
                .from('reading_progress')
                .select('bookmarks')
                .eq('user_id', userId)
                .maybeSingle() as { data: { bookmarks?: unknown[] } | null; error: any }

            if (error) {
                dbLogger.error('Error checking bookmark status:', error)
                setIsLoading(false)
                return
            }

            if (data?.bookmarks) {
                const bookmarks = data.bookmarks as { id: string; title: string; date: string }[]
                setIsBookmarked(bookmarks.some(b => b.id === pageId))
            }
        } catch (err) {
            dbLogger.error('Error checking bookmark:', err)
        } finally {
            setIsLoading(false)
        }
    }, [pageId])

    useEffect(() => {
        checkBookmarkStatus()
    }, [checkBookmarkStatus])

    const toggleBookmark = async () => {
        const userId = authSystem.getCurrentUserId()
        if (!userId) {
            setToastMessage('يجب تسجيل الدخول لحفظ الإشارات')
            setShowToast(true)
            setTimeout(() => setShowToast(false), 2000)
            return
        }

        setIsLoading(true)

        try {
            // Get current bookmarks and page
            const { data, error: fetchError } = await supabase
                .from('reading_progress')
                .select('bookmarks, current_page')
                .eq('user_id', userId)
                .maybeSingle() as { data: { bookmarks?: unknown[]; current_page?: number } | null; error: any }

            let bookmarks = (data?.bookmarks as { id: string; title: string; date: string }[]) || []

            if (isBookmarked) {
                // Remove bookmark
                bookmarks = bookmarks.filter(b => b.id !== pageId)
                setToastMessage('تم إزالة الإشارة المرجعية')
            } else {
                // Add bookmark
                bookmarks.push({
                    id: pageId,
                    title: pageTitle,
                    date: new Date().toISOString()
                })
                setToastMessage('تم حفظ الإشارة المرجعية')
            }

            // Use upsert to handle both insert and update cases
            type UpsertTable = {
                upsert: (data: Record<string, unknown>, options?: { onConflict?: string }) => Promise<{ error: { message: string } | null }>
            }
            const { error: upsertError } = await (supabase
                .from('reading_progress') as unknown as UpsertTable)
                .upsert({
                    user_id: userId,
                    bookmarks: bookmarks,
                    current_page: data?.current_page || 1,
                    total_pages: 89  // Updated: Actual total is 89 pages
                }, {
                    onConflict: 'user_id'
                })

            if (upsertError) {
                dbLogger.error('Error saving bookmark:', upsertError)
                setToastMessage('حدث خطأ في الحفظ')
                setShowToast(true)
                setTimeout(() => setShowToast(false), 2000)
                return
            }

            setIsBookmarked(!isBookmarked)
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
                onClick={toggleBookmark}
                disabled={isLoading}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                title={isBookmarked ? 'إزالة الإشارة' : 'حفظ إشارة مرجعية'}
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
                    >
                        {toastMessage}
                    </motion.div>
                )}
            </AnimatePresence>
        </>
    )
}
