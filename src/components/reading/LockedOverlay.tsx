'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { useRouter } from 'next/navigation'

interface LockedOverlayProps {
    isOpen: boolean
    onClose: () => void
    nextPath: string
    isDirectAccess?: boolean
}

// التحقق من أن المسار آمن (داخلي فقط)
function getSafeRedirectPath(path: string): string {
    // التحقق من أن المسار يبدأ بـ / وليس //
    if (!path || typeof path !== 'string') return '/toc'
    const trimmed = path.trim()
    // منع Open Redirect: يجب أن يكون المسار نسبياً وليس URL خارجي
    if (!trimmed.startsWith('/') || trimmed.startsWith('//') || trimmed.includes('://')) {
        return '/toc'
    }
    // التحقق من المسارات المسموحة فقط
    const allowedPrefixes = ['/read/', '/library/', '/toc', '/exercises', '/profile', '/achievements', '/tools', '/bookmarks', '/leaderboard']
    if (!allowedPrefixes.some(prefix => trimmed.startsWith(prefix))) {
        return '/toc'
    }
    return trimmed
}

export default function LockedOverlay({ isOpen, onClose, nextPath, isDirectAccess }: LockedOverlayProps) {
    const router = useRouter()

    const handleLogin = () => {
        const safePath = getSafeRedirectPath(nextPath)
        router.push(`/login?next=${encodeURIComponent(safePath)}`)
    }

    const handleBack = () => {
        if (isDirectAccess) {
            router.push('/read/section-1/2') // Go back to last free page
        } else {
            onClose()
        }
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
                        className="lock-card"
                        initial={{ scale: 0.9, opacity: 0, y: 30 }}
                        animate={{ scale: 1, opacity: 1, y: 0 }}
                        exit={{ scale: 0.9, opacity: 0, y: 30 }}
                        transition={{ type: 'spring', damping: 25, stiffness: 300, delay: 0.1 }}
                    >
                        <div className="lock-icon-wrapper">
                            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
                                <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
                            </svg>
                        </div>

                        <h2 className="lock-title">أكمل القراءة بعد تسجيل الدخول</h2>
                        <p className="lock-description">
                            هذا المحتوى مخصص للأعضاء فقط. سجل دخولك الآن لتتمكن من الوصول لجميع محاور القسم والتمارين التطبيقية.
                        </p>

                        <div className="lock-actions">
                            <button onClick={handleLogin} className="lock-btn-primary">
                                تسجيل الدخول
                            </button>
                            <button onClick={handleBack} className="lock-btn-secondary">
                                {isDirectAccess ? 'العودة للصفحات المجانية' : 'إلغاء'}
                            </button>
                        </div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    )
}
