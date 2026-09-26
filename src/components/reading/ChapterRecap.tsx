'use client'

import { motion, useReducedMotion } from 'framer-motion'
import { useRouter } from 'next/navigation'
import RecapCard from './RecapCard'
import ShareButton from '@/components/sharing/ShareButton'
import type { ChapterRecap as ChapterRecapType } from '@/data/recapsData'

interface ChapterRecapProps {
    recap: ChapterRecapType
    nextSectionPath: string | null
    onShare?: () => void
}

export default function ChapterRecap({ recap, nextSectionPath, onShare }: ChapterRecapProps) {
    const router = useRouter()
    const prefersReduced = useReducedMotion()

    return (
        <motion.div
            className="chapter-recap"
            initial={prefersReduced ? { opacity: 1 } : { opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
        >
            {/* Header */}
            <motion.div
                className="recap-header"
                initial={prefersReduced ? {} : { scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.1, duration: 0.4 }}
            >
                <div className="recap-celebration-emoji">🎉</div>
                <h2 className="recap-title">
                    أكملت {recap.chapterLabel}: {recap.chapterTitle}!
                </h2>
            </motion.div>

            {/* Key Takeaways */}
            <div className="recap-section">
                <h3 className="recap-section-title">── أهم ما تعلمته ──</h3>
                <div className="recap-cards">
                    {recap.keyTakeaways.map((takeaway, i) => (
                        <RecapCard
                            key={i}
                            icon={takeaway.icon}
                            title={takeaway.title}
                            description={takeaway.description}
                            index={i}
                        />
                    ))}
                </div>
            </div>

            {/* Pro Tip */}
            <motion.div
                className="recap-pro-tip"
                initial={prefersReduced ? {} : { opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.8, duration: 0.4 }}
            >
                <div className="recap-pro-tip-header">
                    <span>{recap.proTip.icon}</span> نصيحة عملية
                </div>
                <p className="recap-pro-tip-text">{recap.proTip.text}</p>
            </motion.div>

            {/* Key Quote */}
            {recap.keyQuote && (
                <motion.blockquote
                    className="recap-quote"
                    initial={prefersReduced ? {} : { opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 1.0, duration: 0.4 }}
                >
                    <p>&ldquo;{recap.keyQuote.text}&rdquo;</p>
                    <cite>— صفحة {recap.keyQuote.pageNumber}</cite>
                </motion.blockquote>
            )}

            {/* Stats */}
            <motion.div
                className="recap-stats"
                initial={prefersReduced ? {} : { opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 1.1, duration: 0.3 }}
            >
                <h3 className="recap-section-title">── 📊 إحصائياتك ──</h3>
                <div className="recap-stats-grid">
                    <div className="recap-stat">
                        <span className="recap-stat-icon">📖</span>
                        <span className="recap-stat-num">{recap.stats.pages}</span>
                        <span className="recap-stat-label">صفحة</span>
                    </div>
                    <div className="recap-stat">
                        <span className="recap-stat-icon">⏱</span>
                        <span className="recap-stat-num">~{recap.stats.estimatedMinutes}</span>
                        <span className="recap-stat-label">دقيقة</span>
                    </div>
                    <div className="recap-stat">
                        <span className="recap-stat-icon">✏️</span>
                        <span className="recap-stat-num">{recap.stats.exercises}</span>
                        <span className="recap-stat-label">تمرين</span>
                    </div>
                </div>
            </motion.div>

            {/* Next Chapter Teaser */}
            {recap.nextChapterTeaser && (
                <motion.div
                    className="recap-next-teaser"
                    initial={prefersReduced ? {} : { opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 1.3, duration: 0.4 }}
                >
                    <h3 className="recap-section-title">── {recap.nextChapterTeaser.icon} {recap.nextChapterTeaser.title} ──</h3>
                    <p className="recap-teaser-text">{recap.nextChapterTeaser.description}</p>
                </motion.div>
            )}

            {/* Action Buttons */}
            <motion.div
                className="recap-actions"
                initial={prefersReduced ? {} : { opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 1.5, duration: 0.3 }}
            >
                <ShareButton
                    type="chapter"
                    data={{
                        type: 'chapter',
                        title: `${recap.chapterLabel}: ${recap.chapterTitle}`,
                        subtitle: `أكملت هذا الفصل!`,
                        icon: '🏆',
                        stats: [
                            { label: 'صفحة', value: recap.stats.pages },
                            { label: 'دقيقة', value: `~${recap.stats.estimatedMinutes}` },
                            { label: 'تمرين', value: recap.stats.exercises },
                        ],
                    }}
                    label="شارك إنجازك"
                />
                {nextSectionPath && (
                    <button
                        className="recap-btn recap-btn-primary"
                        onClick={() => router.push(nextSectionPath)}
                    >
                        ▶️ ابدأ الفصل التالي
                    </button>
                )}
            </motion.div>
        </motion.div>
    )
}
