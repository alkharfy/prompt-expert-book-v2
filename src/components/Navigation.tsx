'use client'

import Link from 'next/link'
import { useRef, useEffect, useState } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { authSystem } from '@/lib/auth_system'
import ProgressCircle from '@/components/ProgressCircle'
import { supabase } from '@/lib/supabase'
import { TOTAL_BOOK_PAGES } from '@/lib/config'

export default function Navigation() {
    const pathname = usePathname()
    const router = useRouter()
    const [isLoggedIn, setIsLoggedIn] = useState(false)
    const [readingProgress, setReadingProgress] = useState(0)
    const [isMenuOpen, setIsMenuOpen] = useState(false)
    const [isDropdownOpen, setIsDropdownOpen] = useState(false)

    const toggleMenu = () => setIsMenuOpen(!isMenuOpen)
    const toggleDropdown = (e: React.MouseEvent) => {
        e.preventDefault()
        e.stopPropagation()
        setIsDropdownOpen(!isDropdownOpen)
    }

    const headerRef = useRef<HTMLElement>(null)

    useEffect(() => {
        // Close menus on route change
        setIsMenuOpen(false)
        setIsDropdownOpen(false)
    }, [pathname])

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (isDropdownOpen) {
                setIsDropdownOpen(false)
            }
        }
        document.addEventListener('click', handleClickOutside)
        return () => document.removeEventListener('click', handleClickOutside)
    }, [isDropdownOpen])

    useEffect(() => {
        // ... existing useEffect logic ...
        // Verify session with database
        const verifyUserSession = async () => {
            const userId = authSystem.getCurrentUserId()
            if (userId) {
                const result = await authSystem.verifySession()
                if (!result.valid) {
                    window.location.reload()
                }
                setIsLoggedIn(result.valid)
            } else {
                setIsLoggedIn(false)
            }
        }

        verifyUserSession()

        // Fetch reading progress
        const fetchProgress = async () => {
            const data = await authSystem.getDetailedProgress()
            if (data) {
                // Calculate percentage based on completed chapters (9 total chapters in roadmap)
                const TOTAL_CHAPTERS = 9
                const percentage = Math.min((data.completedChapters.length / TOTAL_CHAPTERS) * 100, 100)
                setReadingProgress(Math.round(percentage))
            }
        }
        fetchProgress()

        const intervalId = setInterval(() => {
            if (authSystem.getCurrentUserId()) {
                verifyUserSession()
            }
        }, 10000)

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
            resizeObserver.disconnect()
            window.removeEventListener('resize', updateHeaderHeight)
        }
    }, [])

    const handleLogout = async () => {
        await authSystem.logout()
        setIsLoggedIn(false)
        router.push('/')
        router.refresh()
    }

    return (
        <motion.nav
            ref={headerRef}
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
                        خبير التوجيهات الذكية
                    </Link>
                </div>

                <button
                    className={`nav-toggle ${isMenuOpen ? 'active' : ''}`}
                    onClick={toggleMenu}
                    aria-label="Toggle Menu"
                >
                    <span></span>
                    <span></span>
                    <span></span>
                </button>

                <div className={`nav-links-container ${isMenuOpen ? 'open' : ''}`}>
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
                        <li>
                            <Link
                                href="/toc"
                                className={`nav-link ${pathname === '/toc' ? 'active' : ''}`}
                            >
                                الفهرس
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
                                        </Link>
                                    </li>
                                    <li>
                                        <Link href="/tools" className={`dropdown-link ${pathname === '/tools' ? 'active' : ''}`}>
                                            صندوق الأدوات
                                        </Link>
                                    </li>
                                    <li>
                                        <Link href="/bookmarks" className={`dropdown-link ${pathname === '/bookmarks' ? 'active' : ''}`}>
                                            إشاراتي المرجعية
                                        </Link>
                                    </li>
                                    <li>
                                        <Link href="/achievements" className={`dropdown-link ${pathname === '/achievements' ? 'active' : ''}`}>
                                            الإنجازات والشهادات
                                        </Link>
                                    </li>
                                    <li>
                                        <Link href="/leaderboard" className={`dropdown-link ${pathname === '/leaderboard' ? 'active' : ''}`}>
                                            لوحة المتصدرين
                                        </Link>
                                    </li>
                                </ul>
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
            {/* Overlay for mobile menu */}
            {(isMenuOpen || isDropdownOpen) && (
                <div className="nav-overlay" onClick={() => {
                    setIsMenuOpen(false)
                    setIsDropdownOpen(false)
                }}></div>
            )}
        </motion.nav>
    )


}
