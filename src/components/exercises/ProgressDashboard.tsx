'use client'

import { motion } from 'framer-motion'
import { sectionInfo, allExercises } from '@/data/exercisesData'

interface ProgressDashboardProps {
    userStats: {
        total_completed: number
        total_correct: number
        total_points: number
    } | null
    completedExercises: Set<string>
    sectionProgress: Record<string, number>
    onSectionClick: (sectionId: string) => void
}

export default function ProgressDashboard({
    userStats,
    completedExercises,
    sectionProgress,
    onSectionClick,
}: ProgressDashboardProps) {
    const totalExercises = Object.values(allExercises).reduce((sum, arr) => sum + arr.length, 0)
    const totalCompleted = userStats?.total_completed || 0
    const overallProgress = totalExercises > 0 ? Math.round((totalCompleted / totalExercises) * 100) : 0

    // Calculate level from points
    const totalPoints = userStats?.total_points || 0
    const level = Math.floor(totalPoints / 100) + 1
    const pointsToNextLevel = 100 - (totalPoints % 100)

    // Find weakest sections (lowest progress)
    const sectionEntries = Object.entries(sectionProgress)
        .map(([id, progress]) => ({ id, progress, title: sectionInfo[id]?.title || id }))
        .sort((a, b) => a.progress - b.progress)

    const weakSections = sectionEntries.filter(s => s.progress < 100).slice(0, 3)

    // Find next recommended exercise
    const nextSection = sectionEntries.find(s => s.progress < 100)

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            style={{ maxWidth: '900px', margin: '0 auto' }}
        >
            {/* Overall Progress */}
            <div style={{
                background: 'rgba(255, 107, 53, 0.08)',
                border: '1px solid rgba(255, 107, 53, 0.2)',
                borderRadius: '16px',
                padding: '30px',
                marginBottom: '24px',
                textAlign: 'center',
            }}>
                <div style={{ fontSize: '3rem', marginBottom: '8px' }}>
                    {overallProgress >= 100 ? '🏆' : overallProgress >= 50 ? '🔥' : '📈'}
                </div>
                <h3 style={{ color: '#fff', fontSize: '1.4rem', marginBottom: '8px' }}>
                    التقدم الكلي
                </h3>
                <div style={{
                    fontSize: '2.5rem',
                    fontWeight: 700,
                    color: '#ff6b35',
                    marginBottom: '12px',
                }}>
                    {overallProgress}%
                </div>

                {/* Progress bar */}
                <div style={{
                    height: '10px',
                    background: 'rgba(255, 255, 255, 0.1)',
                    borderRadius: '5px',
                    overflow: 'hidden',
                    marginBottom: '16px',
                    maxWidth: '400px',
                    margin: '0 auto 16px',
                }}>
                    <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${overallProgress}%` }}
                        transition={{ duration: 1, ease: 'easeOut' }}
                        style={{
                            height: '100%',
                            background: 'linear-gradient(90deg, #ff6b35, #ff8c42)',
                            borderRadius: '5px',
                        }}
                    />
                </div>

                <div style={{
                    display: 'flex',
                    justifyContent: 'center',
                    gap: '30px',
                    flexWrap: 'wrap',
                }}>
                    <div>
                        <div style={{ fontSize: '1.3rem', fontWeight: 700, color: '#fff' }}>
                            المستوى {level}
                        </div>
                        <div style={{ fontSize: '0.85rem', color: 'rgba(255,255,255,0.5)' }}>
                            {pointsToNextLevel} نقطة للمستوى التالي
                        </div>
                    </div>
                    <div>
                        <div style={{ fontSize: '1.3rem', fontWeight: 700, color: '#fff' }}>
                            {totalCompleted}/{totalExercises}
                        </div>
                        <div style={{ fontSize: '0.85rem', color: 'rgba(255,255,255,0.5)' }}>
                            تمرين مكتمل
                        </div>
                    </div>
                    <div>
                        <div style={{ fontSize: '1.3rem', fontWeight: 700, color: '#fff' }}>
                            {totalPoints}
                        </div>
                        <div style={{ fontSize: '0.85rem', color: 'rgba(255,255,255,0.5)' }}>
                            نقطة إجمالية
                        </div>
                    </div>
                </div>
            </div>

            {/* Per-section progress */}
            <div style={{
                background: 'var(--color-bg-card, rgba(20,20,20,0.8))',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                borderRadius: '16px',
                padding: '24px',
                marginBottom: '24px',
            }}>
                <h3 style={{ color: '#fff', fontSize: '1.1rem', marginBottom: '20px' }}>
                    تقدم الوحدات
                </h3>

                {Object.entries(sectionInfo).map(([sectionId, info]) => {
                    const progress = sectionProgress[sectionId] || 0
                    const exercises = allExercises[sectionId] || []
                    const completed = exercises.filter(e => completedExercises.has(e.exerciseId)).length

                    return (
                        <div
                            key={sectionId}
                            onClick={() => onSectionClick(sectionId)}
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '12px',
                                padding: '12px',
                                borderRadius: '10px',
                                cursor: 'pointer',
                                marginBottom: '8px',
                                transition: 'background 0.2s',
                            }}
                            onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,107,53,0.08)')}
                            onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                        >
                            <span style={{ fontSize: '1.3rem', minWidth: '32px' }}>{info.icon}</span>
                            <div style={{ flex: 1, minWidth: 0 }}>
                                <div style={{
                                    fontSize: '0.9rem',
                                    color: '#fff',
                                    marginBottom: '6px',
                                    whiteSpace: 'nowrap',
                                    overflow: 'hidden',
                                    textOverflow: 'ellipsis',
                                }}>
                                    {info.title}
                                </div>
                                <div style={{
                                    height: '6px',
                                    background: 'rgba(255, 255, 255, 0.08)',
                                    borderRadius: '3px',
                                    overflow: 'hidden',
                                }}>
                                    <div style={{
                                        width: `${progress}%`,
                                        height: '100%',
                                        background: progress === 100
                                            ? 'linear-gradient(90deg, #4ade80, #22c55e)'
                                            : 'linear-gradient(90deg, #ff6b35, #ff8c42)',
                                        borderRadius: '3px',
                                        transition: 'width 0.5s ease',
                                    }} />
                                </div>
                            </div>
                            <span style={{
                                fontSize: '0.8rem',
                                color: 'rgba(255,255,255,0.5)',
                                minWidth: '55px',
                                textAlign: 'left',
                            }}>
                                {completed}/{exercises.length}
                            </span>
                        </div>
                    )
                })}
            </div>

            {/* Weak areas + recommendation */}
            {weakSections.length > 0 && (
                <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
                    gap: '16px',
                }}>
                    {/* Weakest areas */}
                    <div style={{
                        background: 'var(--color-bg-card, rgba(20,20,20,0.8))',
                        border: '1px solid rgba(255, 255, 255, 0.1)',
                        borderRadius: '16px',
                        padding: '24px',
                    }}>
                        <h4 style={{ color: '#fff', fontSize: '1rem', marginBottom: '16px' }}>
                            📊 نقاط تحتاج تحسين
                        </h4>
                        {weakSections.map(s => (
                            <div
                                key={s.id}
                                onClick={() => onSectionClick(s.id)}
                                style={{
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    alignItems: 'center',
                                    padding: '10px 12px',
                                    borderRadius: '8px',
                                    marginBottom: '6px',
                                    cursor: 'pointer',
                                    background: 'rgba(255, 107, 53, 0.05)',
                                }}
                            >
                                <span style={{ fontSize: '0.85rem', color: 'rgba(255,255,255,0.7)' }}>
                                    {sectionInfo[s.id]?.icon} {s.title}
                                </span>
                                <span style={{
                                    fontSize: '0.85rem',
                                    fontWeight: 600,
                                    color: s.progress < 30 ? '#ef4444' : '#ff6b35',
                                }}>
                                    {s.progress}%
                                </span>
                            </div>
                        ))}
                    </div>

                    {/* Next recommendation */}
                    {nextSection && (
                        <div
                            onClick={() => onSectionClick(nextSection.id)}
                            style={{
                                background: 'linear-gradient(135deg, rgba(255, 107, 53, 0.15), rgba(255, 140, 66, 0.1))',
                                border: '1px solid rgba(255, 107, 53, 0.3)',
                                borderRadius: '16px',
                                padding: '24px',
                                cursor: 'pointer',
                                display: 'flex',
                                flexDirection: 'column',
                                justifyContent: 'center',
                                alignItems: 'center',
                                textAlign: 'center',
                            }}
                        >
                            <div style={{ fontSize: '2rem', marginBottom: '12px' }}>
                                {sectionInfo[nextSection.id]?.icon}
                            </div>
                            <h4 style={{ color: '#fff', fontSize: '1rem', marginBottom: '8px' }}>
                                التمرين التالي المقترح
                            </h4>
                            <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.9rem', marginBottom: '12px' }}>
                                {nextSection.title}
                            </p>
                            <span style={{
                                background: 'rgba(255, 107, 53, 0.2)',
                                color: '#ff6b35',
                                padding: '8px 20px',
                                borderRadius: '8px',
                                fontWeight: 600,
                                fontSize: '0.9rem',
                            }}>
                                ابدأ الآن
                            </span>
                        </div>
                    )}
                </div>
            )}
        </motion.div>
    )
}
