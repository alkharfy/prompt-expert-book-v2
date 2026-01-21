'use client'

import { motion, useAnimationControls } from 'framer-motion'
import Link from 'next/link'
import Image from 'next/image'
import Robot from '@/components/Robot'
import { useEffect, useRef, useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { authSystem } from '@/lib/auth_system'
import { dbLogger, authLogger } from '@/lib/logger'

interface Chapter {
    number: string
    title: string
    description: string
    href: string
    icon: string
    isFree?: boolean
}

const chapters: Chapter[] = [
    {
        number: 'المقدمة',
        title: 'التمهيد',
        description: 'مرحباً بك في رحلة بناء المشاريع',
        href: '/read/intro/1',
        icon: '🚀',
        isFree: true
    },
    {
        number: '01',
        title: 'أساسيات برومبت مشروع',
        description: 'التفكير كمشروع لا كدردشة',
        href: '/read/section-1/1',
        icon: '📋',
        isFree: true
    },
    {
        number: '02',
        title: 'من الفكرة إلى المواصفات',
        description: 'تحويل الخيال إلى نقاط عمل',
        href: '/read/section-2/1',
        icon: '💡'
    },
    {
        number: '03',
        title: 'تصميم التجربة والهيكل',
        description: 'رحلة المستخدم وبناء الموقع',
        href: '/read/section-3/1',
        icon: '🎨'
    },
    {
        number: '04',
        title: 'كتابة محتوى الواجهة',
        description: 'نبرة المحتوى ونصوص الواجهات',
        href: '/read/section-4/1',
        icon: '✍️'
    },
    {
        number: '05',
        title: 'الجودة والتحسين',
        description: 'قوائم التدقيق وضمان الجودة',
        href: '/read/section-5/1',
        icon: '📋'
    },
    {
        number: '06',
        title: 'الأدوات المستخدمة',
        description: 'التقنيات وتصميم البيانات',
        href: '/read/section-6/1',
        icon: '⚙️'
    },
    {
        number: '07',
        title: 'مكتبة القوالب',
        description: '30 قالب برومبت جاهز للنسخ',
        href: '/library/1',
        icon: '📚'
    },
    {
        number: '08',
        title: 'الملحق',
        description: 'تمارين وإجابات نموذجية',
        href: '/read/appendix/1',
        icon: '📝'
    },
]

export default function RoadmapPath() {
    const router = useRouter()
    const pathname = usePathname()
    const containerRef = useRef<HTMLDivElement>(null)
    const cardRefs = useRef<(HTMLDivElement | null)[]>([])
    const startRef = useRef<HTMLDivElement>(null)
    const trophyRef = useRef<HTMLDivElement>(null)
    const robotRef = useRef<HTMLDivElement>(null)
    const [pathD, setPathD] = useState('')

    // Animation states
    const [robotPosition, setRobotPosition] = useState(-1) // -1 = at start
    const [completedCards, setCompletedCards] = useState<number[]>([])
    const [isAnimating, setIsAnimating] = useState(false)
    const [robotStyle, setRobotStyle] = useState<React.CSSProperties>({
        position: 'absolute',
        zIndex: 100,
        pointerEvents: 'none',
        opacity: 1,
        left: 0,
        top: 0
    })
    const robotControls = useAnimationControls()
    const [isLoadingProgress, setIsLoadingProgress] = useState(true)

    // 1. Fetch progress from Supabase
    useEffect(() => {
        const fetchProgress = async () => {
            const userId = authSystem.getCurrentUserId()

            if (userId) {
                try {
                    const data = await authSystem.getDetailedProgress()

                    if (data) {
                        setCompletedCards(data.completedChapters)

                        // Robot stands on the first UNCOMPLETED chapter
                        let nextToRead = 0
                        for (let i = 0; i < chapters.length; i++) {
                            if (!data.completedChapters.includes(i)) {
                                nextToRead = i
                                break
                            }
                            // If all completed, stand on the last one or finish line
                            nextToRead = chapters.length
                        }

                        setRobotPosition(nextToRead)
                    } else {
                        // Logged in but no progress yet -> stand on Intro
                        setRobotPosition(0)
                        setCompletedCards([])
                    }
                } catch (err) {
                    dbLogger.error("Error fetching roadmap progress:", err)
                    setRobotPosition(0)
                }
            } else {
                // Not logged in -> stay at START (-1)
                setRobotPosition(-1)
                setCompletedCards([])
            }
            setIsLoadingProgress(false)
        }

        fetchProgress()
    }, [pathname])

    useEffect(() => {
        const calculatePath = () => {
            if (!containerRef.current) return

            const container = containerRef.current
            const containerRect = container.getBoundingClientRect()

            const points: { x: number; y: number }[] = []

            // Add START point first
            if (startRef.current) {
                const startRect = startRef.current.getBoundingClientRect()
                const x = startRect.left - containerRect.left + startRect.width / 2
                const y = startRect.top - containerRect.top + startRect.height / 2
                points.push({ x, y })
            }

            // Add all card centers
            cardRefs.current.forEach((card) => {
                if (card) {
                    const rect = card.getBoundingClientRect()
                    const x = rect.left - containerRect.left + rect.width / 2
                    const y = rect.top - containerRect.top + rect.height / 2
                    points.push({ x, y })
                }
            })

            // Add TROPHY point last
            if (trophyRef.current) {
                const trophyRect = trophyRef.current.getBoundingClientRect()
                const x = trophyRect.left - containerRect.left + trophyRect.width / 2
                const y = trophyRect.top - containerRect.top + trophyRect.height / 2
                points.push({ x, y })
            }

            if (points.length < 2) return

            // Create smooth path through all points
            let d = `M ${points[0].x} ${points[0].y}`

            for (let i = 1; i < points.length; i++) {
                const prev = points[i - 1]
                const curr = points[i]

                // Use quadratic bezier for smooth curves
                const cpX = (prev.x + curr.x) / 2
                const cpY = (prev.y + curr.y) / 2 - 15

                d += ` Q ${cpX} ${cpY}, ${curr.x} ${curr.y}`
            }

            setPathD(d)
        }

        // Calculate after a short delay to ensure elements are rendered
        const timer = setTimeout(calculatePath, 100)
        window.addEventListener('resize', calculatePath)

        return () => {
            clearTimeout(timer)
            window.removeEventListener('resize', calculatePath)
        }
    }, [])

    // New effect to move robot to initial position once points and refs are ready
    useEffect(() => {
        let retryCount = 0
        const maxRetries = 15

        const moveRobotToInitial = async () => {
            if (robotPosition === -1 || !pathD || !robotRef.current || !containerRef.current || isAnimating) return

            const containerRect = containerRef.current.getBoundingClientRect()
            const targetCard = cardRefs.current[robotPosition] || (robotPosition === chapters.length ? trophyRef.current : null)

            if (!targetCard) {
                if (retryCount < maxRetries) {
                    retryCount++
                    setTimeout(moveRobotToInitial, 250)
                }
                return
            }

            const targetRect = targetCard.getBoundingClientRect()

            // Calculate absolute position within the container
            const x = (targetRect.left + targetRect.width / 2) - containerRect.left
            const y = (targetRect.top) - containerRect.top - 40 // Hover slightly above

            // Offset by robot's own half-width/height to center it (size 180x180)
            const finalX = x - 90
            const finalY = y - 120

            await robotControls.set({
                x: finalX,
                y: finalY,
                opacity: 1,
                rotate: 0
            })

            setRobotStyle(prev => ({ ...prev, opacity: 1 }))
        }

        const timer = setTimeout(moveRobotToInitial, 400)
        return () => clearTimeout(timer)
    }, [robotPosition, pathD, isLoadingProgress])

    // Handle card click with animation
    const handleCardClick = async (index: number, href: string) => {
        if (isAnimating) return

        // Check if user is logged in
        const userId = authSystem.getCurrentUserId()

        // If user is logged in, allow access to all chapters
        // If not logged in, only allow free chapters
        if (!userId && !chapters[index].isFree) {
            authLogger.debug("Chapter is locked - user not logged in")
            return
        }

        setIsAnimating(true)

        // Get references
        const targetCard = cardRefs.current[index]
        const robotElement = robotRef.current

        if (!targetCard || !robotElement || !containerRef.current) {
            router.push(href)
            return
        }

        // Get coordinates relative to roadmap-content container
        const containerRect = containerRef.current.getBoundingClientRect()
        const targetRect = targetCard.getBoundingClientRect()

        const x = (targetRect.left + targetRect.width / 2) - containerRect.left
        const y = (targetRect.top) - containerRect.top - 40

        const finalX = x - 90
        const finalY = y - 120

        // Navigation logic only - completion is handled by reading progress fetch

        // Fast smooth animation
        await robotControls.start({
            x: finalX,
            y: finalY,
            rotate: 360,
            opacity: 1,
            transition: {
                duration: 0.8,
                ease: [0.34, 1.56, 0.64, 1] // Bouncy jump
            }
        })

        // Update state and navigate
        setRobotPosition(index)
        router.push(href)
        setTimeout(() => setIsAnimating(false), 500)
    }

    return (
        <div className="roadmap-container">
            {/* Header */}
            <motion.div
                className="roadmap-header"
                initial={{ opacity: 0, y: -30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8 }}
            >
                <h1>رحلة تحويل فكرتك إلى مشروع</h1>
                <p>ابدأ رحلتك في تعلم البرومبتات خطوة بخطوة</p>
            </motion.div>

            {/* Roadmap Content */}
            <div className="roadmap-content" ref={containerRef}>
                {/* Animated Robot */}
                <motion.div
                    className="roadmap-robot"
                    ref={robotRef}
                    animate={robotControls}
                    style={robotStyle}
                    initial={false}
                >
                    <Robot size={180} />
                </motion.div>

                {/* Start Platform */}
                <motion.div
                    className="roadmap-start"
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.6, delay: 0.2 }}
                >
                    <motion.div
                        className="start-label"
                        ref={startRef}
                        animate={{
                            boxShadow: [
                                '0 0 20px rgba(255, 107, 53, 0.4)',
                                '0 0 40px rgba(255, 107, 53, 0.6)',
                                '0 0 20px rgba(255, 107, 53, 0.4)'
                            ]
                        }}
                        transition={{ duration: 2, repeat: Infinity }}
                    >
                        <span className="start-text">البداية</span>
                        <span className="start-number">0</span>
                    </motion.div>
                </motion.div>

                {/* Dynamic SVG Path */}
                <svg className="roadmap-svg">
                    <defs>
                        <linearGradient id="pathGradient" x1="0%" y1="100%" x2="100%" y2="0%">
                            <stop offset="0%" stopColor="#FF6B35" />
                            <stop offset="50%" stopColor="#FFB800" />
                            <stop offset="100%" stopColor="#FF6B35" />
                        </linearGradient>
                        <filter id="glow">
                            <feGaussianBlur stdDeviation="4" result="coloredBlur" />
                            <feMerge>
                                <feMergeNode in="coloredBlur" />
                                <feMergeNode in="SourceGraphic" />
                            </feMerge>
                        </filter>
                    </defs>
                    {pathD && (
                        <motion.path
                            d={pathD}
                            fill="none"
                            stroke="url(#pathGradient)"
                            strokeWidth="6"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            filter="url(#glow)"
                            initial={{ pathLength: 0 }}
                            animate={{ pathLength: 1 }}
                            transition={{ duration: 2.5, ease: "easeInOut", delay: 0.5 }}
                        />
                    )}
                </svg>

                {/* Steps */}
                <div className="roadmap-steps">
                    {chapters.map((chapter, index) => {
                        const isCompleted = completedCards.includes(index)
                        return (
                            <motion.div
                                key={chapter.number}
                                className={`roadmap-step step-${index}`}
                                ref={(el) => { cardRefs.current[index] = el }}
                                initial={{ opacity: 0, scale: 0.5, y: 30 }}
                                animate={{ opacity: 1, scale: 1, y: 0 }}
                                transition={{
                                    duration: 0.5,
                                    delay: 0.3 + (index * 0.1),
                                    type: "spring",
                                    stiffness: 200
                                }}
                            >
                                <motion.div
                                    className={`step-card ${isCompleted ? 'completed' : ''}`}
                                    whileHover={{ scale: 1.05, y: -5 }}
                                    whileTap={{ scale: 0.98 }}
                                    onClick={() => handleCardClick(index, chapter.href)}
                                    style={{ cursor: 'pointer' }}
                                >
                                    {isCompleted && <div className="completed-check-overlay">✓</div>}
                                    {chapter.isFree && (
                                        <span style={{
                                            position: 'absolute',
                                            top: '-28px',
                                            left: '50%',
                                            transform: 'translateX(-50%)',
                                            background: 'linear-gradient(135deg, #27c93f 0%, #1fa32e 100%)',
                                            color: '#fff',
                                            padding: '5px 16px',
                                            borderRadius: '15px',
                                            fontSize: '0.75rem',
                                            fontWeight: 'bold',
                                            boxShadow: '0 4px 12px rgba(39, 201, 63, 0.5)',
                                            zIndex: 10,
                                            whiteSpace: 'nowrap'
                                        }}>
                                            مجاني
                                        </span>
                                    )}
                                    <div className="step-number-circle">
                                        <span>{index === 0 ? '⭐' : chapter.number}</span>
                                    </div>
                                    <div className="step-icon">{chapter.icon}</div>
                                    <h3 className="step-title">{chapter.title}</h3>
                                    <p className="step-desc">{chapter.description}</p>
                                </motion.div>
                            </motion.div>
                        )
                    })}
                </div>

                {/* End Platform */}
                <motion.div
                    className="roadmap-end"
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.6, delay: 2 }}
                >
                    <motion.div
                        className="trophy-container"
                        ref={trophyRef}
                        animate={{
                            scale: [1, 1.05, 1],
                        }}
                        transition={{ duration: 2, repeat: Infinity }}
                    >
                        <Image
                            src="/assets/trophy.png"
                            alt="Trophy"
                            width={220}
                            height={220}
                            style={{ objectFit: 'contain' }}
                        />
                    </motion.div>
                    <motion.div
                        className="end-label"
                        animate={{
                            boxShadow: [
                                '0 0 20px rgba(255, 184, 0, 0.4)',
                                '0 0 40px rgba(255, 184, 0, 0.6)',
                                '0 0 20px rgba(255, 184, 0, 0.4)'
                            ]
                        }}
                        transition={{ duration: 2, repeat: Infinity }}
                    >
                        <span className="end-flag">🏁</span>
                        <span className="end-text">النهاية</span>
                    </motion.div>
                </motion.div>
            </div>

            {/* Back Button */}
            <motion.div
                className="roadmap-back"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 2.5 }}
            >
                <Link href="/" className="btn btn-secondary">
                    العودة إلى الصفحة الرئيسية
                </Link>
            </motion.div>
        </div>
    )
}
