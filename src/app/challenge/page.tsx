'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import Navigation from '@/components/Navigation'
import { challengeDays, challengeInfo } from '@/data/challengeData'
import { trackWhatsAppClick } from '@/lib/analytics'
import { SITE_URL } from '@/lib/config'
import './challenge.css'

const STORAGE_KEY = 'promptmaster_challenge_progress'

interface ChallengeProgress {
    [day: number]: boolean;
}

function loadProgress(): ChallengeProgress {
    if (typeof window === 'undefined') return {}
    try {
        const saved = localStorage.getItem(STORAGE_KEY)
        return saved ? JSON.parse(saved) : {}
    } catch {
        return {}
    }
}

function saveProgress(progress: ChallengeProgress) {
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(progress))
    } catch {
        // ignore storage errors
    }
}

export default function ChallengePage() {
    const [progress, setProgress] = useState<ChallengeProgress>({})
    const [expandedDay, setExpandedDay] = useState<number | null>(null)

    useEffect(() => {
        setProgress(loadProgress())
    }, [])

    const completedCount = Object.values(progress).filter(Boolean).length
    const totalPoints = challengeDays
        .filter(d => progress[d.day])
        .reduce((sum, d) => sum + d.points, 0)
    const progressPercent = Math.round((completedCount / 7) * 100)

    function toggleDay(day: number) {
        const updated = { ...progress, [day]: !progress[day] }
        setProgress(updated)
        saveProgress(updated)
    }

    function toggleExpand(day: number) {
        setExpandedDay(expandedDay === day ? null : day)
    }

    return (
        <main className="auth-container">
            <Navigation />
            <div className="challenge-page">
                <div className="challenge-header">
                    <div className="challenge-icon">🏆</div>
                    <h1 className="challenge-title">{challengeInfo.title}</h1>
                    <p className="challenge-subtitle">{challengeInfo.description}</p>
                </div>

                {/* Progress Bar */}
                <div className="challenge-progress-section">
                    <div className="challenge-stats">
                        <span>{completedCount}/7 أيام</span>
                        <span>{totalPoints}/{challengeInfo.totalPoints} نقطة</span>
                    </div>
                    <div className="challenge-progress-bar">
                        <div
                            className="challenge-progress-fill"
                            style={{ width: `${progressPercent}%` }}
                        />
                    </div>
                    {completedCount === 7 && (
                        <div className="challenge-completed-banner">
                            🎉 تهانينا! أكملت التحدي بالكامل — أنت الآن {challengeInfo.completionBadge}
                        </div>
                    )}
                </div>

                {/* Challenge Days */}
                <div className="challenge-days">
                    {challengeDays.map((day) => (
                        <div
                            key={day.day}
                            className={`challenge-day-card ${progress[day.day] ? 'completed' : ''} ${expandedDay === day.day ? 'expanded' : ''}`}
                        >
                            <div className="challenge-day-header" onClick={() => toggleExpand(day.day)}>
                                <div className="challenge-day-left">
                                    <span className="challenge-day-emoji">{day.emoji}</span>
                                    <div>
                                        <h3 className="challenge-day-title">
                                            اليوم {day.day}: {day.title}
                                        </h3>
                                        <p className="challenge-day-subtitle">{day.subtitle}</p>
                                    </div>
                                </div>
                                <div className="challenge-day-right">
                                    <span className="challenge-day-duration">⏱️ {day.duration}</span>
                                    <span className="challenge-day-points">+{day.points} نقطة</span>
                                    <svg
                                        className={`challenge-chevron ${expandedDay === day.day ? 'rotated' : ''}`}
                                        width="20" height="20" viewBox="0 0 24 24"
                                        fill="none" stroke="currentColor" strokeWidth="2"
                                        strokeLinecap="round" strokeLinejoin="round"
                                    >
                                        <polyline points="6 9 12 15 18 9"></polyline>
                                    </svg>
                                </div>
                            </div>

                            {expandedDay === day.day && (
                                <div className="challenge-day-details">
                                    <div className="challenge-task">
                                        <h4>📋 المهمة:</h4>
                                        <p style={{ whiteSpace: 'pre-line' }}>{day.task}</p>
                                    </div>
                                    <div className="challenge-result">
                                        <h4>🎯 النتيجة المتوقعة:</h4>
                                        <p>{day.expectedResult}</p>
                                    </div>
                                    <div className="challenge-hint">
                                        <h4>💡 نصيحة:</h4>
                                        <p>{day.hint}</p>
                                    </div>
                                    <div className="challenge-reward">
                                        <span>{day.badgeEmoji} شارة: {day.badge}</span>
                                        <span>+{day.points} نقطة</span>
                                    </div>
                                    <div className="challenge-day-actions">
                                        <button
                                            className={`challenge-complete-btn ${progress[day.day] ? 'done' : ''}`}
                                            onClick={() => toggleDay(day.day)}
                                        >
                                            {progress[day.day] ? '✅ مكتمل — إلغاء؟' : '☐ علّم كمكتمل'}
                                        </button>
                                        <Link
                                            href={`/read/section-${day.relatedUnit}/1`}
                                            className="challenge-unit-link"
                                        >
                                            📖 راجع الفصل {day.relatedUnit}
                                        </Link>
                                    </div>
                                </div>
                            )}
                        </div>
                    ))}
                </div>

                {/* Bottom CTA */}
                <div className="challenge-bottom-cta">
                    <p>شارك تقدمك مع أصحابك وادعيهم يعملوا التحدي معاك!</p>
                    <a
                        href={`https://wa.me/?text=${encodeURIComponent(`أنا بعمل تحدي PromptMaster — 7 أيام لاحتراف AI! 🚀\nتعالوا اعملوا التحدي معايا: ${SITE_URL}/challenge`)}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="challenge-share-btn"
                        onClick={() => trackWhatsAppClick('challenge_page')}
                    >
                        📤 شارك التحدي على WhatsApp
                    </a>
                </div>
            </div>
        </main>
    )
}
