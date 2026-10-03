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

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { authSystem } from '@/lib/auth_system'
import { useSubscription } from '@/context/SubscriptionContext'
import { trackPaywallHit } from '@/lib/analytics'

interface LockedOverlayProps {
    isOpen: boolean
    onClose: () => void
    nextPath: string
    isDirectAccess?: boolean
    /** الميزة المطلوبة للوصول (اختياري — للتحديد الدقيق) */
    requiredFeature?: string
}

// التحقق من أن المسار آمن (داخلي فقط)
function getSafeRedirectPath(path: string): string {
    if (!path || typeof path !== 'string') return '/toc'
    const trimmed = path.trim()
    if (!trimmed.startsWith('/') || trimmed.startsWith('//') || trimmed.includes('://')) {
        return '/toc'
    }
    const allowedPrefixes = ['/read/', '/library/', '/toc', '/exercises', '/profile', '/achievements', '/tools', '/bookmarks', '/leaderboard']
    if (!allowedPrefixes.some(prefix => trimmed.startsWith(prefix))) {
        return '/toc'
    }
    return trimmed
}

/** فهرس فصول الكتاب للعرض في Paywall */
const BOOK_CHAPTERS = [
    { num: 1, title: 'أساسيات AI التوليدي', pages: 17, free: true, freeLabel: '🆓 مجاني بالكامل' },
    { num: 2, title: 'تجربتك الأولى مع AI', pages: 18, free: false, freeLabel: '4 صفحات مجانية' },
    { num: 3, title: 'إطار GOLDS الاحترافي', pages: 18, free: false },
    { num: 4, title: 'البرومبتات المتسلسلة', pages: 18, free: false },
    { num: 5, title: 'الجودة والتصحيح', pages: 18, free: false },
    { num: 6, title: 'AI متعدد الوسائط', pages: 18, free: false },
    { num: 7, title: 'وكلاء AI والأتمتة', pages: 18, free: false },
    { num: 8, title: 'RAG والبيانات', pages: 16, free: false },
    { num: 9, title: 'تطبيقات عملية', pages: 16, free: false },
    { num: 10, title: 'مستقبل AI', pages: 12, free: false },
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
        const safePath = getSafeRedirectPath(nextPath)

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
            router.push('/read/section-1/17') // آخر صفحة مجانية (نهاية الفصل 1)
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
            title = 'متابعة الكتاب تحتاج اشتراكًا'
            description = 'المقدمة والفصل الأول مجانيان. باقي الكتاب والتمارين يحتاجان اشتراكًا نشطًا. سجّل دخولك إذا كنت مشتركًا، أو شاهد الباقات قبل الشراء.'
            actionLabel = 'تسجيل الدخول'
            showPaymentIcon = false
            showValueProps = true
            break

        case 'unpaid':
        case 'no_subscription':
            title = 'أكملت المحتوى المجاني — جاهز تكمل؟'
            description = 'المقدمة والفصل الأول متاحان مجانًا. اختر اشتراكًا لمتابعة باقي الكتاب والتمارين؛ المزايا الإضافية تختلف حسب الباقة.'
            actionLabel = 'اشترك الآن — حسب الباقة المختارة'
            showPaymentIcon = true
            showValueProps = true
            break

        case 'wrong_plan':
            title = 'ترقِّ باقتك للوصول لهذه الميزة'
            description = currentPlan
                ? `باقتك الحالية لا تتضمن هذه الميزة. قم بالترقية للاستفادة الكاملة من جميع الأدوات والتمارين.`
                : 'هذه الميزة متاحة في الباقات الأعلى فقط.'
            actionLabel = 'ترقية الباقة'
            showPaymentIcon = true
            showValueProps = false
            break

        case 'expired':
            title = 'جدّد اشتراكك للاستمرار'
            description = 'اشتراكك قد انتهى. جدده الآن لمواصلة الوصول لجميع محتويات الكتاب والأدوات.'
            actionLabel = 'تجديد الاشتراك'
            showPaymentIcon = true
            showValueProps = true
            break

        default:
            title = 'أكمل القراءة'
            description = 'يمكنك الآن الوصول لهذا المحتوى.'
            actionLabel = 'متابعة'
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

                        {/* إحصائيات المحتوى المتبقي */}
                        {showValueProps && (
                            <motion.div
                                className="lock-value-stats"
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.2 }}
                            >
                                <div className="lock-stat-item">
                                    <span className="lock-stat-icon">📖</span>
                                    <span>محتوى الكتاب والملاحق</span>
                                </div>
                                <div className="lock-stat-item">
                                    <span className="lock-stat-icon">✏️</span>
                                    <span>45 تمرين تفاعلي</span>
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
                                {currentPlan === 'basic' ? 'الباقة الأساسية' :
                                 currentPlan === 'pro' ? 'الباقة الاحترافية' :
                                 'الباقة المميزة'}
                            </div>
                        )}

                        {/* أزرار الإجراء */}
                        <div className="lock-actions">
                            <button onClick={handleAction} className="lock-btn-primary">
                                {actionLabel}
                            </button>

                            {status === 'unauthenticated' && (
                                <Link href="/#pricing" className="lock-btn-secondary">
                                    شاهد الباقات والأسعار
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
                                    <span>🛡️</span> ضمان استرداد 30 يوم — بدون أسئلة
                                </motion.div>
                            )}

                            <button onClick={handleBack} className="lock-btn-secondary">
                                {isDirectAccess ? 'العودة للصفحات المجانية' : 'إلغاء'}
                            </button>
                        </div>

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
                                    <span>ماذا ستتعلم في باقي الكتاب؟</span>
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
                                            {BOOK_CHAPTERS.map((ch) => (
                                                <li key={ch.num} className={`lock-chapter-item ${ch.free ? 'lock-chapter-free' : ''}`}>
                                                    <span className="lock-chapter-icon">{ch.free ? '🆓' : '📗'}</span>
                                                    <span className="lock-chapter-info">
                                                        <span className="lock-chapter-title">الفصل {ch.num}: {ch.title}</span>
                                                        <span className="lock-chapter-meta">
                                                            {ch.pages} صفحة
                                                            {ch.freeLabel && <span className="lock-chapter-badge">{ch.freeLabel}</span>}
                                                        </span>
                                                    </span>
                                                </li>
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
