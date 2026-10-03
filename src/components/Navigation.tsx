'use client'

import Link from 'next/link'
import { useRef, useEffect, useState, useCallback } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { authSystem } from '@/lib/auth_system'
import ProgressCircle from '@/components/ProgressCircle'
import SearchDialog from '@/components/SearchDialog'
import { useSubscription } from '@/context/SubscriptionContext'

export default function Navigation() {
    const pathname = usePathname()
    const router = useRouter()
    const [isLoggedIn, setIsLoggedIn] = useState(false)
    const [hasPaid, setHasPaid] = useState(true) // Default to true to avoid flashing button
    const [readingProgress, setReadingProgress] = useState(0)
    const [isMenuOpen, setIsMenuOpen] = useState(false)
    const [isDropdownOpen, setIsDropdownOpen] = useState(false)
    const [isSearchOpen, setIsSearchOpen] = useState(false)
    const [isMobileMenu, setIsMobileMenu] = useState(false)

    // New: Subscription system integration (parallel mode)
    const { currentPlan, hasFeature, isLoading: subLoading } = useSubscription()

    // Derive hasPaid from subscription context
    const hasPaidFromSub = !subLoading && !!currentPlan
    const effectiveHasPaid = hasPaidFromSub || hasPaid

    const toggleMenu = () => setIsMenuOpen(!isMenuOpen)
    const toggleDropdown = (e: React.MouseEvent) => {
        e.preventDefault()
        e.stopPropagation()
        setIsDropdownOpen(!isDropdownOpen)
    }

    const headerRef = useRef<HTMLElement>(null)
    const menuRef = useRef<HTMLDivElement>(null)
    const menuToggleRef = useRef<HTMLButtonElement>(null)

    useEffect(() => {
        const media = window.matchMedia('(max-width: 1024px)')
        const update = () => {
            setIsMobileMenu(media.matches)
            if (!media.matches) setIsMenuOpen(false)
        }
        update()
        media.addEventListener('change', update)
        return () => media.removeEventListener('change', update)
    }, [])

    useEffect(() => {
        if (!isMobileMenu || !isMenuOpen || !menuRef.current) return

        const menu = menuRef.current
        const toggle = menuToggleRef.current
        const previousOverflow = document.body.style.overflow
        document.body.style.overflow = 'hidden'

        const focusable = () => Array.from(menu.querySelectorAll<HTMLElement>(
            'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
        )).filter(element => element.getClientRects().length > 0 && getComputedStyle(element).visibility !== 'hidden')

        focusable()[0]?.focus({ preventScroll: true })

        const handleMenuKeyDown = (event: KeyboardEvent) => {
            if (event.key === 'Escape') {
                event.preventDefault()
                setIsMenuOpen(false)
                setIsDropdownOpen(false)
                return
            }
            if (event.key !== 'Tab') return

            const elements = focusable()
            const first = elements[0]
            const last = elements[elements.length - 1]
            if (!first || !last) return

            if (event.shiftKey && (document.activeElement === first || !menu.contains(document.activeElement))) {
                event.preventDefault()
                last.focus()
            } else if (!event.shiftKey && (document.activeElement === last || !menu.contains(document.activeElement))) {
                event.preventDefault()
                first.focus()
            }
        }

        document.addEventListener('keydown', handleMenuKeyDown)
        return () => {
            document.removeEventListener('keydown', handleMenuKeyDown)
            document.body.style.overflow = previousOverflow
            if (window.matchMedia('(max-width: 1024px)').matches) {
                toggle?.focus({ preventScroll: true })
            }
        }
    }, [isMobileMenu, isMenuOpen])

    useEffect(() => {
        // Close menus on route change
        // eslint-disable-next-line react-hooks/set-state-in-effect -- resetting UI state on route navigation
        setIsMenuOpen(false)
        setIsDropdownOpen(false)
    }, [pathname])

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (isDropdownOpen) {
                setIsDropdownOpen(false)
            }
            if (isMenuOpen && headerRef.current && !headerRef.current.contains(event.target as Node)) {
                setIsMenuOpen(false)
            }
        }
        document.addEventListener('click', handleClickOutside)
        return () => document.removeEventListener('click', handleClickOutside)
    }, [isDropdownOpen, isMenuOpen])

    // Re-verify session and reading progress on every route change
    useEffect(() => {
        const verifyUserSession = async () => {
            const userId = authSystem.getCurrentUserId()
            if (userId) {
                const result = await authSystem.verifySession()
                if (!result.valid) {
                     
                    setIsLoggedIn(false)
                    return
                }
                 
                setIsLoggedIn(true)
                 
                setHasPaid(result.hasPaid ?? false)

                // If verify-session says not paid, try activation API as fallback
                if (!result.hasPaid) {
                    try {
                        const activateRes = await fetch('/api/payment/activate', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({})
                        })
                        const activateData = await activateRes.json()
                        if (activateData.success && activateData.hasPaid) {
                             
                            setHasPaid(true)
                        }
                    } catch { /* silent */ }
                }
            } else {
                 
                setIsLoggedIn(false)
                 
                setHasPaid(true)
            }
        }

        verifyUserSession()

        const fetchProgress = async () => {
            const data = await authSystem.getDetailedProgress()
            if (data) {
                const TOTAL_CHAPTERS = 10
                const percentage = Math.min((data.completedChapters.length / TOTAL_CHAPTERS) * 100, 100)
                 
                setReadingProgress(Math.round(percentage))
            }
        }
        fetchProgress()
    }, [pathname])

    // Periodic re-verification + header height observer (mount only)
    useEffect(() => {
        const verifyUserSession = async () => {
            const userId = authSystem.getCurrentUserId()
            if (userId) {
                const result = await authSystem.verifySession()
                setIsLoggedIn(result.valid)
                if (result.valid) {
                    setHasPaid(result.hasPaid ?? false)
                }
            }
        }

        // Re-verify session every 15 minutes (debounce cache in authSystem handles duplicates)
        const intervalId = setInterval(() => {
            if (authSystem.getCurrentUserId()) {
                verifyUserSession()
            }
        }, 15 * 60 * 1000)

        // Also re-verify when tab becomes visible again
        const handleVisibilityChange = () => {
            if (document.visibilityState === 'visible' && authSystem.getCurrentUserId()) {
                verifyUserSession()
            }
        }
        document.addEventListener('visibilitychange', handleVisibilityChange)

        if (!headerRef.current) return

        const updateHeaderHeight = () => {
            const height = headerRef.current?.offsetHeight || 0
            document.documentElement.style.setProperty('--header-h', `${height}px`)
        }

        const resizeObserver = new ResizeObserver(updateHeaderHeight)
        resizeObserver.observe(headerRef.current)

        updateHeaderHeight()
        window.addEventListener('resize', updateHeaderHeight)

        return () => {
            clearInterval(intervalId)
            document.removeEventListener('visibilitychange', handleVisibilityChange)
            resizeObserver.disconnect()
            window.removeEventListener('resize', updateHeaderHeight)
        }
    }, [])

    const handleLogout = async () => {
        // Call server-side logout to properly clear httpOnly cookies
        try {
            await fetch('/api/auth/logout', { method: 'POST', credentials: 'include' })
        } catch { /* continue with client-side cleanup */ }
        await authSystem.logout()
        setIsLoggedIn(false)
        router.push('/')
        router.refresh()
    }

    const closeSearch = useCallback(() => setIsSearchOpen(false), [])

    // Helper: Check if feature is locked (new subscription system)
    const isFeatureLocked = useCallback((feature: string): boolean => {
        if (subLoading || !currentPlan) return false // Fallback during loading or no subscription
        return !hasFeature(feature as any)
    }, [subLoading, currentPlan, hasFeature])

    // Ctrl+K / Cmd+K to open search
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
                e.preventDefault()
                setIsSearchOpen((prev) => !prev)
            }
        }
        window.addEventListener('keydown', handleKeyDown)
        return () => window.removeEventListener('keydown', handleKeyDown)
    }, [])

    return (
        <>
        <motion.nav
            ref={headerRef}
            aria-label="التنقل الرئيسي"
            className={`nav ${isMenuOpen ? 'menu-open' : ''}`}
            initial={{ y: -100 }}
            animate={{ y: 0 }}
            transition={{ duration: 0.5 }}
        >
            <div className="nav-content">
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    {pathname !== '/' && (
                        <button
                            onClick={() => router.back()}
                            className="nav-back-btn"
                            aria-label="رجوع"
                        >
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M5 12h14M12 5l7 7-7 7" />
                            </svg>
                        </button>
                    )}
                    <Link href="/" className="nav-logo">
                        PromptMaster
                    </Link>
                    <button
                        onClick={() => setIsSearchOpen(true)}
                        className="nav-search-btn"
                        aria-label="البحث في المحتوى (Ctrl+K)"
                        title="بحث (Ctrl+K)"
                    >
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                            <circle cx="11" cy="11" r="8" />
                            <path d="M21 21l-4.35-4.35" />
                        </svg>
                    </button>
                </div>

                <button
                    ref={menuToggleRef}
                    className={`nav-toggle ${isMenuOpen ? 'active' : ''}`}
                    onClick={toggleMenu}
                    aria-label={isMenuOpen ? 'إغلاق القائمة' : 'فتح القائمة'}
                    aria-expanded={isMenuOpen}
                    aria-controls="main-navigation-links"
                >
                    <span></span>
                    <span></span>
                    <span></span>
                </button>

                <div
                    ref={menuRef}
                    id="main-navigation-links"
                    className={`nav-links-container ${isMenuOpen ? 'open' : ''}`}
                    inert={isMobileMenu && !isMenuOpen}
                    aria-hidden={isMobileMenu && !isMenuOpen ? true : undefined}
                    role={isMobileMenu ? 'dialog' : undefined}
                    aria-modal={isMobileMenu && isMenuOpen ? true : undefined}
                    aria-label={isMobileMenu ? 'القائمة الرئيسية' : undefined}
                >
                    <button className="nav-close-btn" onClick={toggleMenu} aria-label="إغلاق القائمة">
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <line x1="18" y1="6" x2="6" y2="18"></line>
                            <line x1="6" y1="6" x2="18" y2="18"></line>
                        </svg>
                    </button>
                    <ul className="nav-links">
                        <li>
                            <div className="nav-progress-wrapper">
                                <Link
                                    href="/"
                                    className={`nav-link ${pathname === '/' ? 'active' : ''}`}
                                >
                                    الرئيسية
                                </Link>
                                <ProgressCircle percentage={readingProgress} size={28} strokeWidth={3} />
                            </div>
                        </li>

                        {isLoggedIn && !effectiveHasPaid && (
                            <li>
                                <Link
                                    href="/payment"
                                    className="nav-link payment-highlight-btn"
                                >
                                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ marginLeft: '6px' }}>
                                        <rect x="1" y="4" width="22" height="16" rx="2" ry="2"></rect>
                                        <line x1="1" y1="10" x2="23" y2="10"></line>
                                    </svg>
                                    أكمل الدفع
                                </Link>
                            </li>
                        )}

                        <li>
                            <Link
                                href="/toc"
                                className={`nav-link ${pathname === '/toc' ? 'active' : ''}`}
                            >
                                الفهرس
                            </Link>
                        </li>

                        <li>
                            <Link
                                href="/blog"
                                className={`nav-link ${pathname === '/blog' || pathname.startsWith('/blog/') ? 'active' : ''}`}
                            >
                                ✍️ المدونة
                            </Link>
                        </li>

                        <li>
                            <Link href="/resources" className={`nav-link ${pathname === '/resources' ? 'active' : ''}`}>
                                📚 المصادر
                            </Link>
                        </li>
                        <li>
                            <Link href="/ai-updates" className={`nav-link ${pathname === '/ai-updates' ? 'active' : ''}`}>
                                🔔 تحديثات AI
                            </Link>
                        </li>

                        {isLoggedIn && (
                            <li className={`nav-dropdown-parent ${isDropdownOpen ? 'open' : ''}`}>
                                <span
                                    className={`nav-link dropdown-trigger ${isDropdownOpen ? 'active' : ''}`}
                                    onClick={toggleDropdown}
                                >
                                    الأدوات والتعلم
                                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" style={{ transform: isDropdownOpen ? 'rotate(180deg)' : 'none' }}>
                                        <path d="M6 9l6 6 6-6" />
                                    </svg>
                                </span>
                                <ul className={`nav-dropdown ${isDropdownOpen ? 'show' : ''}`}>
                                    <li>
                                        <Link href="/exercises" className={`dropdown-link ${pathname === '/exercises' ? 'active' : ''}`}>
                                            التمارين التفاعلية
                                            {isFeatureLocked('exercises') && (
                                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{ marginRight: '6px', opacity: 0.6 }}>
                                                    <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
                                                    <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
                                                </svg>
                                            )}
                                        </Link>
                                    </li>
                                    <li>
                                        <Link href="/tools" className={`dropdown-link ${pathname === '/tools' ? 'active' : ''}`}>
                                            صندوق الأدوات
                                            {isFeatureLocked('tools') && (
                                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{ marginRight: '6px', opacity: 0.6 }}>
                                                    <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
                                                    <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
                                                </svg>
                                            )}
                                        </Link>
                                    </li>
                                    <li>
                                        <Link href="/prompt-hospital" className={`dropdown-link ${pathname === '/prompt-hospital' ? 'active' : ''}`}>
                                            مستشفى البرومبتات
                                            {isFeatureLocked('tools') && (
                                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{ marginRight: '6px', opacity: 0.6 }}>
                                                    <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
                                                    <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
                                                </svg>
                                            )}
                                        </Link>
                                    </li>
                                    <li>
                                        <Link href="/running-project" className={`dropdown-link ${pathname === '/running-project' ? 'active' : ''}`}>
                                            المشروع الممتد
                                            {isFeatureLocked('tools') && (
                                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{ marginRight: '6px', opacity: 0.6 }}>
                                                    <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
                                                    <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
                                                </svg>
                                            )}
                                        </Link>
                                    </li>
                                    <li>
                                        <Link href="/bookmarks" className={`dropdown-link ${pathname === '/bookmarks' ? 'active' : ''}`}>
                                            إشاراتي المرجعية
                                        </Link>
                                    </li>
                                    <li>
                                        <Link href="/notes" className={`dropdown-link ${pathname === '/notes' ? 'active' : ''}`}>
                                            📝 ملاحظاتي
                                        </Link>
                                    </li>
                                    <li>
                                        <Link href="/my-plan" className={`dropdown-link ${pathname === '/my-plan' ? 'active' : ''}`}>
                                            📅 خطتي
                                        </Link>
                                    </li>
                                    <li>
                                        <Link href="/achievements" className={`dropdown-link ${pathname === '/achievements' ? 'active' : ''}`}>
                                            الإنجازات والشهادات
                                            {isFeatureLocked('gamification') && (
                                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{ marginRight: '6px', opacity: 0.6 }}>
                                                    <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
                                                    <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
                                                </svg>
                                            )}
                                        </Link>
                                    </li>
                                    <li>
                                        <Link href="/leaderboard" className={`dropdown-link ${pathname === '/leaderboard' ? 'active' : ''}`}>
                                            لوحة المتصدرين
                                            {isFeatureLocked('gamification') && (
                                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{ marginRight: '6px', opacity: 0.6 }}>
                                                    <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
                                                    <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
                                                </svg>
                                            )}
                                        </Link>
                                    </li>

                                    {/* المجتمع */}
                                    <li>
                                        <Link href="/community" className={`dropdown-link ${pathname === '/community' ? 'active' : ''}`}>
                                            المجتمع
                                        </Link>
                                    </li>

                                    {/* عرض الباقة الحالية */}
                                    {currentPlan && !subLoading && (
                                        <li style={{ padding: '0.5rem 1rem', fontSize: '0.8rem', opacity: 0.7, borderTop: '1px solid rgba(255,255,255,0.1)', marginTop: '0.5rem' }}>
                                            <strong>باقتك:</strong>{' '}
                                            {currentPlan === 'basic' ? 'أساسية' :
                                             currentPlan === 'pro' ? 'احترافية' :
                                             'مميزة'}
                                        </li>
                                    )}
                                </ul>
                            </li>
                        )}

                        {isLoggedIn && (
                            <li>
                                <Link
                                    href="/profile#referral"
                                    className="nav-link referral-nav-link"
                                    title="ادعو صديقك واكسب خصم"
                                >
                                    🎁
                                </Link>
                            </li>
                        )}

                        {isLoggedIn && (
                            <li>
                                <Link
                                    href="/profile"
                                    className={`nav-link ${pathname === '/profile' ? 'active' : ''}`}
                                >
                                    الملف الشخصي
                                </Link>
                            </li>
                        )}

                        <li>
                            {isLoggedIn ? (
                                <motion.button
                                    onClick={handleLogout}
                                    className="nav-link logout-btn"
                                    whileHover={{ color: 'var(--color-orange-glow)', scale: 1.1 }}
                                    title="تسجيل الخروج"
                                    aria-label="تسجيل الخروج"
                                >
                                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                        <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                                        <polyline points="16 17 21 12 16 7" />
                                        <line x1="21" y1="12" x2="9" y2="12" />
                                    </svg>
                                </motion.button>
                            ) : (
                                <Link
                                    href="/login"
                                    className={`nav-link ${pathname === '/login' ? 'active' : ''}`}
                                >
                                    تسجيل الدخول
                                </Link>
                            )}
                        </li>
                    </ul>
                </div>
            </div>
            <SearchDialog isOpen={isSearchOpen} onClose={closeSearch} />
        </motion.nav>

        {/* Overlay for mobile menu - outside motion.nav to avoid transform stacking context */}
        {(isMenuOpen || isDropdownOpen) && (
            <div className="nav-overlay" onClick={() => {
                setIsMenuOpen(false)
                setIsDropdownOpen(false)
            }}></div>
        )}
        </>
    )


}
