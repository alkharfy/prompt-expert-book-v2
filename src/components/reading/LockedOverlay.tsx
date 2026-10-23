'use client'

/**
 * Locked Overlay Component — Enhanced Paywall with Value Proposition
 *
 * يعرض رسالة حجب محسّنة للصفحات المقفلة مع:
 * - إحصائيات المحتوى المتبقي
 * - شهادة قارئ
 * - ضمان استرداد بارز
 * - معاينة فهرس الفصول (قابل للطي)
 * - 3 حالات اشتراك: لا اشتراك / باقة خاطئة / منتهي
 *
 * @module components/reading/LockedOverlay
 */

import { Fragment, useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { authSystem } from '@/lib/auth_system'
import { useSubscription } from '@/context/SubscriptionContext'
import { trackPaywallHit } from '@/lib/analytics'
import { SECTION_REGISTRY } from '@/config/sections'
import { PRODUCT_STATS, planLabel } from '@/lib/pricing'
import { REFUND_GUARANTEE_TEXT } from '@/lib/config'
import { getSafeRedirectPath } from '@/lib/safe-redirect'

interface LockedOverlayProps {
    isOpen: boolean
    onClose: () => void
    nextPath: string
    isDirectAccess?: boolean
    /** الميزة المطلوبة للوصول (اختياري — للتحديد الدقيق) */
    requiredFeature?: string
}

// Where ?next= may send the visitor after this step (see lib/safe-redirect).
const LOCKED_REDIRECT_PREFIXES = ['/read/', '/library/', '/toc', '/exercises', '/profile', '/achievements', '/tools', '/bookmarks', '/leaderboard']

/** فهرس فصول الكتاب للعرض في Paywall */
const FIRST_CHAPTER = SECTION_REGISTRY.find(section => section.id === 'section-1')!
const INTRO = SECTION_REGISTRY.find(section => section.id === 'intro')!
const pagesOf = (id: string) => SECTION_REGISTRY.find(section => section.id === id)?.pageCount ?? 0
// Levels 1–5 replaced book chapters 1–5 (2026-10-16 to 2026-10-20). Chapters 6–10 of the book stay open to
// subscribers as extra reading (same wording as WhatYouLearn), so they're listed as the book's.
const BOOK_CHAPTERS: { key: string; title: string; pages?: number; free: boolean; freeLabel?: string; soon?: boolean; book?: boolean }[] = [
    { key: 'l1', title: 'المستوى 1: بتستخدمه صح', pages: FIRST_CHAPTER.pageCount, free: false },
    { key: 'l2', title: 'المستوى 2: بتطلب زي المحترف', pages: pagesOf('section-2'), free: false },
    { key: 'l3', title: 'المستوى 3: بتجهّزه لشغلك', pages: pagesOf('section-3'), free: false },
    { key: 'l4', title: 'المستوى 4: بيشتغل معاك', pages: pagesOf('section-4'), free: false },
    { key: 'l5', title: 'المستوى 5: نظام شغلك', pages: pagesOf('section-5'), free: false },
    { key: 'c6', title: 'الفصل 6: صور وصوت وملفات', pages: pagesOf('section-6'), free: false, book: true },
    { key: 'c7', title: 'الفصل 7: وكلاء AI والأتمتة', pages: pagesOf('section-7'), free: false, book: true },
    { key: 'c8', title: 'الفصل 8: AI على ملفاتك وبياناتك', pages: pagesOf('section-8'), free: false, book: true },
    { key: 'c9', title: 'الفصل 9: تطبيقات عملية', pages: pagesOf('section-9'), free: false, book: true },
    { key: 'c10', title: 'الفصل 10: مستقبل AI', pages: pagesOf('section-10'), free: false, book: true },
]

type UserStatus =
    | 'loading'
    | 'unauthenticated'
    | 'unpaid'               // قديم — لا اشتراك
    | 'paid'                 // قديم — لديه دفع
    | 'no_subscription'      // جديد — لا اشتراك نشط
    | 'wrong_plan'           // جديد — لديه اشتراك لكن باقة خاطئة
    | 'expired'              // جديد — اشتراك منتهي
    | 'active'               // جديد — اشتراك نشط

export default function LockedOverlay({
    isOpen,
    onClose,
    nextPath,
    isDirectAccess,
    requiredFeature,
}: LockedOverlayProps) {
    const router = useRouter()
    const [status, setStatus] = useState<UserStatus>('loading')
    const [showChapters, setShowChapters] = useState(false)
    const { currentPlan, status: subStatus, expiresAt, hasFeature, isLoading: subLoading } = useSubscription()

    useEffect(() => {
        if (!isOpen) return

        // Track paywall hit
        trackPaywallHit(nextPath, 0)

        const checkStatus = async () => {
            const userId = authSystem.getCurrentUserId()
            if (!userId) {
                setStatus('unauthenticated')
                return
            }

            // Parallel Mode: استخدام النظام الجديد مع fallback للقديم
            if (!subLoading && currentPlan) {
                if (subStatus === 'expired') {
                    setStatus('expired')
                    return
                }

                if (requiredFeature && !hasFeature(requiredFeature as any)) {
                    setStatus('wrong_plan')
                    return
                }

                setStatus('active')
                onClose()
                return
            }

            if (!subLoading && !currentPlan) {
                setStatus('no_subscription')
                return
            }

            // Fallback للنظام القديم (checkPaymentStatus)
            const hasPaid = await authSystem.checkPaymentStatus(userId)
            if (hasPaid) {
                setStatus('paid')
                onClose()
            } else {
                setStatus('unpaid')
            }
        }

        checkStatus()
    }, [isOpen, onClose, nextPath, currentPlan, subStatus, expiresAt, requiredFeature, hasFeature, subLoading])

    const handleAction = () => {
        const safePath = getSafeRedirectPath(nextPath, LOCKED_REDIRECT_PREFIXES)

        // Identity comes from the httpOnly cookie — never put userId in the URL.
        if (status === 'unauthenticated') {
            router.push(`/login?next=${encodeURIComponent(safePath)}`)
        } else if (status === 'unpaid' || status === 'no_subscription') {
            router.push('/payment?plan=pro')
        } else if (status === 'wrong_plan') {
            router.push(`/payment?upgrade=true&feature=${requiredFeature || ''}`)
        } else if (status === 'expired') {
            router.push('/payment?renew=true')
        }
    }

    const handleBack = () => {
        if (isDirectAccess) {
            router.push(`/read/${INTRO.id}/${INTRO.pageCount}`) // آخر صفحة مجانية (نهاية التمهيد)
        } else {
            onClose()
        }
    }

    // لا نعرض شيء أثناء التحميل
    if (status === 'loading' && isOpen) return null

    // تحديد العنوان والوصف حسب الحالة
    let title = ''
    let description = ''
    let actionLabel = ''
    let showPaymentIcon = false
    let showValueProps = false

    switch (status) {
        case 'unauthenticated':
            title = 'عشان تكمّل، محتاج اشتراك'
            description = 'التمهيد مجاني. المستوى الأول وباقي الكورس والتمارين محتاجين اشتراك. سجّل دخولك لو مشترك، أو شوف الباقات قبل ما تشتري.'
            actionLabel = 'سجّل دخولك'
            showPaymentIcon = false
            showValueProps = true
            break

        case 'unpaid':
        case 'no_subscription':
            title = 'خلّصت الجزء المجاني. جاهز تكمّل؟'
            description = 'اختار باقة عشان تبدأ المستوى الأول وتكمّل باقي الكورس والتمارين. المزايا الزيادة بتختلف من باقة للتانية.'
            actionLabel = 'اشترك دلوقتي'
            showPaymentIcon = true
            showValueProps = true
            break

        case 'wrong_plan':
            title = 'رقّي باقتك عشان تفتح الميزة دي'
            description = currentPlan
                ? 'باقتك الحالية مفيهاش الميزة دي. رقّيها وخد كل الأدوات والتمارين.'
                : 'الميزة دي موجودة في الباقات الأعلى بس.'
            actionLabel = 'رقّي الباقة'
            showPaymentIcon = true
            showValueProps = false
            break

        case 'expired':
            title = 'جدّد اشتراكك عشان تكمّل'
            description = 'اشتراكك خلص. جدّده دلوقتي وكمّل الكورس والأدوات من مكانك.'
            actionLabel = 'جدّد الاشتراك'
            showPaymentIcon = true
            showValueProps = true
            break

        default:
            title = 'كمّل'
            description = 'المحتوى ده مفتوحلك دلوقتي.'
            actionLabel = 'كمّل'
            showPaymentIcon = false
            showValueProps = false
    }

    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    className="lock-overlay"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                >
                    <motion.div
                        className="lock-card lock-card-enhanced"
                        initial={{ scale: 0.9, opacity: 0, y: 30 }}
                        animate={{ scale: 1, opacity: 1, y: 0 }}
                        exit={{ scale: 0.9, opacity: 0, y: 30 }}
                        transition={{ type: 'spring', damping: 25, stiffness: 300, delay: 0.1 }}
                    >
                        {/* أيقونة القفل */}
                        <div className="lock-icon-wrapper">
                            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                {showPaymentIcon ? (
                                    <>
                                        <rect x="1" y="4" width="22" height="16" rx="2" ry="2"></rect>
                                        <line x1="1" y1="10" x2="23" y2="10"></line>
                                    </>
                                ) : (
                                    <>
                                        <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
                                        <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
                                    </>
                                )}
                            </svg>
                        </div>

                        <h2 className="lock-title">{title}</h2>
                        <p className="lock-description">{description}</p>

                        {/* عرض الباقة الحالية إذا كان المستخدم لديه اشتراك */}
                        {currentPlan && status === 'wrong_plan' && (
                            <div style={{
                                marginTop: '1rem',
                                padding: '0.75rem',
                                backgroundColor: 'rgba(139, 92, 246, 0.1)',
                                borderRadius: '8px',
                                fontSize: '0.875rem'
                            }}>
                                <strong>باقتك الحالية:</strong>{' '}
                                {planLabel(currentPlan)}
                            </div>
                        )}

                        {/* أزرار الإجراء */}
                        <div className="lock-actions">
                            <button onClick={handleAction} className="lock-btn-primary">
                                {actionLabel}
                            </button>

                            {status === 'unauthenticated' && (
                                <Link href="/#pricing" className="lock-btn-secondary">
                                    شوف الباقات والأسعار
                                </Link>
                            )}

                            {/* ضمان الاسترداد */}
                            {showValueProps && (
                                <motion.div
                                    className="lock-guarantee"
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    transition={{ delay: 0.4 }}
                                >
                                    <span>🛡️</span> {REFUND_GUARANTEE_TEXT}، من غير أسئلة
                                </motion.div>
                            )}
                        </div>

                        {/* What the subscription opens — under the buttons so they stay on the first screen of small phones */}
                        {showValueProps && (
                            <motion.div
                                className="lock-value-stats"
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.2 }}
                            >
                                <div className="lock-stat-item">
                                    <span className="lock-stat-icon">📖</span>
                                    <span>المستويات الخمسة والورش</span>
                                </div>
                                <div className="lock-stat-item">
                                    <span className="lock-stat-icon">✏️</span>
                                    <span>{PRODUCT_STATS.exercises} تمرين تفاعلي</span>
                                </div>
                                <div className="lock-stat-item">
                                    <span className="lock-stat-icon">🛠️</span>
                                    <span>أدوات حسب الباقة</span>
                                </div>
                                <div className="lock-stat-item">
                                    <span className="lock-stat-icon">🎓</span>
                                    <span>شهادة إتمام حسب الباقة</span>
                                </div>
                            </motion.div>
                        )}

                        <button onClick={handleBack} className="lock-btn-secondary lock-btn-back">
                            {isDirectAccess ? 'ارجع للجزء المجاني' : 'رجوع'}
                        </button>

                        {/* معاينة الفهرس — Section 1.3 */}
                        {showValueProps && (
                            <motion.div
                                className="lock-chapters-preview"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={{ delay: 0.5 }}
                            >
                                <button
                                    className="lock-chapters-toggle"
                                    onClick={() => setShowChapters(!showChapters)}
                                    aria-expanded={showChapters}
                                >
                                    <span>{showChapters ? '▼' : '◀'}</span>
                                    <span>هتتعلّم إيه في باقي الكورس؟</span>
                                </button>

                                <AnimatePresence>
                                    {showChapters && (
                                        <motion.ul
                                            className="lock-chapters-list"
                                            initial={{ height: 0, opacity: 0 }}
                                            animate={{ height: 'auto', opacity: 1 }}
                                            exit={{ height: 0, opacity: 0 }}
                                            transition={{ duration: 0.3 }}
                                        >
                                            {BOOK_CHAPTERS.map((ch, i) => (
                                                <Fragment key={ch.key}>
                                                    {ch.book && !BOOK_CHAPTERS[i - 1]?.book && (
                                                        <li className="lock-chapters-note">وزيادة على المستويات، الفصول دي من كتاب PromptMaster مفتوحة للمشتركين:</li>
                                                    )}
                                                    <li className={`lock-chapter-item ${ch.free ? 'lock-chapter-free' : ''}`}>
                                                        <span className="lock-chapter-icon">{ch.free ? '🆓' : ch.soon ? '⏳' : ch.book ? '📘' : '📗'}</span>
                                                        <span className="lock-chapter-info">
                                                            <span className="lock-chapter-title">{ch.title}</span>
                                                            <span className="lock-chapter-meta">
                                                                {ch.soon ? 'بينزل قريب' : `${ch.pages} صفحة${ch.book ? ' · من الكتاب' : ''}`}
                                                                {ch.freeLabel && <span className="lock-chapter-badge">{ch.freeLabel}</span>}
                                                            </span>
                                                        </span>
                                                    </li>
                                                </Fragment>
                                            ))}
                                        </motion.ul>
                                    )}
                                </AnimatePresence>
                            </motion.div>
                        )}
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    )
}
