'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import Navigation from '@/components/Navigation'
import QuizQuestion from '@/components/exercises/QuizQuestion'
import FillInBlank from '@/components/exercises/FillInBlank'
import PromptBuilder from '@/components/exercises/PromptBuilder'
import FeatureGate from '@/components/FeatureGate'
import ProgressDashboard from '@/components/exercises/ProgressDashboard'
import { allExercises, sectionInfo, ExerciseData } from '@/data/exercisesData'
import { useLearning } from '@/context/LearningContext'
import { hasSpecContent } from '@/data/specializationContent'
import { getSpecialization } from '@/data/specializations'
import { supabaseProxy as supabase } from '@/lib/supabase_proxy'
import { authSystem } from '@/lib/auth_system'
import { dbLogger } from '@/lib/logger'

interface UserStats {
    total_completed: number
    total_correct: number
    total_points: number
}

export default function ExercisesPage() {
    const router = useRouter()
    const { preferences: learningPrefs } = useLearning()
    const [isLoading, setIsLoading] = useState(true)
    const [isLoggedIn, setIsLoggedIn] = useState(false)
    const [selectedSection, setSelectedSection] = useState<string | null>(null)
    const [activeTab, setActiveTab] = useState<'exercises' | 'progress'>('exercises')
    const [userStats, setUserStats] = useState<UserStats | null>(null)
    const [completedExercises, setCompletedExercises] = useState<Set<string>>(new Set())
    const [sectionProgress, setSectionProgress] = useState<Record<string, number>>({})

    useEffect(() => {
        const requestedSection = new URLSearchParams(window.location.search).get('section')
        if (requestedSection && allExercises[requestedSection]) setSelectedSection(requestedSection)
        checkAuthAndLoadData()
    }, [])

    const checkAuthAndLoadData = async () => {
        try {
            const userId = authSystem.getCurrentUserId()
            if (!userId) {
                setIsLoggedIn(false)
                setIsLoading(false)
                return
            }

            setIsLoggedIn(true)

            // Load user stats
            const { data: stats, error: statsError } = await supabase
                .from('user_exercise_stats')
                .select('*')
                .eq('user_id', userId)
                .maybeSingle() as { data: any; error: any }

            if (stats && !statsError) {
                setUserStats(stats)
            }

            // Load completed exercises
            const { data: progress, error: progressError } = await supabase
                .from('exercise_progress')
                .select('exercise_id, section_id, is_completed, is_correct, points_earned')
                .eq('user_id', userId)
                .eq('is_completed', true) as { data: Array<{ exercise_id: string; section_id: string; is_completed: boolean; is_correct: boolean | null; points_earned: number }> | null; error: any }

            if (progress && !progressError) {
                const courseExercises = Object.values(allExercises).flat()
                const validRecords = progress.filter(record => courseExercises.some(exercise => exercise.exerciseId === record.exercise_id && exercise.sectionId === record.section_id))
                const completed = new Set(validRecords.map(p => p.exercise_id))
                setCompletedExercises(completed)
                setUserStats({
                    total_completed: completed.size,
                    total_correct: validRecords.filter(record => record.is_correct === true && courseExercises.find(exercise => exercise.exerciseId === record.exercise_id)?.type !== 'prompt_builder').length,
                    total_points: validRecords.reduce((total, record) => total + (record.points_earned || 0), 0),
                })

                // Calculate section progress
                const sectionProg: Record<string, number> = {}
                Object.keys(allExercises).forEach(sectionId => {
                    const total = allExercises[sectionId].length
                    const done = allExercises[sectionId].filter(exercise => completed.has(exercise.exerciseId)).length
                    sectionProg[sectionId] = Math.round((done / total) * 100)
                })
                setSectionProgress(sectionProg)
            }
        } catch (error) {
            dbLogger.error('Error loading data:', error)
        } finally {
            setIsLoading(false)
        }
    }

    const handleExerciseComplete = () => {
        // Refresh stats
        checkAuthAndLoadData()
    }

    const renderExercise = (exercise: ExerciseData) => {
        const isCompleted = completedExercises.has(exercise.exerciseId)

        switch (exercise.type) {
            case 'quiz':
                return (
                    <QuizQuestion
                        key={exercise.exerciseId}
                        exerciseId={exercise.exerciseId}
                        sectionId={exercise.sectionId}
                        question={exercise.question}
                        options={exercise.options}
                        correctAnswerId={exercise.correctAnswerId}
                        explanation={exercise.explanation}
                        points={exercise.points}
                        onComplete={handleExerciseComplete}
                    />
                )
            case 'fill_blank':
                return (
                    <FillInBlank
                        key={exercise.exerciseId}
                        exerciseId={exercise.exerciseId}
                        sectionId={exercise.sectionId}
                        title={exercise.title}
                        textWithBlanks={exercise.textWithBlanks}
                        blanks={exercise.blanks}
                        hint={exercise.hint}
                        points={exercise.points}
                        onComplete={handleExerciseComplete}
                    />
                )
            case 'prompt_builder':
                return (
                    <PromptBuilder
                        key={exercise.exerciseId}
                        exerciseId={exercise.exerciseId}
                        sectionId={exercise.sectionId}
                        title={exercise.title}
                        description={exercise.description}
                        steps={exercise.steps}
                        templateFormat={exercise.templateFormat}
                        exampleOutput={exercise.exampleOutput}
                        points={exercise.points}
                        onComplete={handleExerciseComplete}
                    />
                )
            default:
                return null
        }
    }

    if (isLoading) {
        return (
            <>
                <Navigation />
                <main className="exercises-page">
                    <div className="loading-container">
                        <div className="loading-spinner"></div>
                        <p>جاري التحميل...</p>
                    </div>
                </main>
            </>
        )
    }

    if (!isLoggedIn) {
        return (
            <>
                <Navigation />
                <main className="exercises-page">
                    <div className="container">
                        <motion.div 
                            className="login-prompt"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                        >
                            <span className="login-icon">🔒</span>
                            <h2>سجّل الدخول للوصول للتمارين</h2>
                            <p>التمارين التفاعلية متاحة للمستخدمين المسجلين فقط</p>
                            <button 
                                className="login-btn"
                                onClick={() => router.push('/login')}
                            >
                                تسجيل الدخول
                            </button>
                        </motion.div>
                    </div>
                </main>
            </>
        )
    }

    return (
        <>
            <Navigation />
            <FeatureGate feature="exercises">
                <main className="exercises-page">
                    <div className="container">
                    {/* Header */}
                    <motion.div 
                        className="exercises-header"
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                    >
                        <h1>🎯 التمارين التفاعلية</h1>
                        <p>اختبر فهمك وطبّق ما تعلمته عملياً</p>
                    </motion.div>

                    {/* Stats Card */}
                    <motion.div 
                        className="stats-card"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 }}
                    >
                        <div className="stat-item">
                            <span className="stat-icon">✅</span>
                            <span className="stat-value">{userStats?.total_completed || 0}</span>
                            <span className="stat-label">تمرين مكتمل</span>
                        </div>
                        <div className="stat-item">
                            <span className="stat-icon">🎯</span>
                            <span className="stat-value">{userStats?.total_correct || 0}</span>
                            <span className="stat-label">إجابة صحيحة</span>
                        </div>
                        <div className="stat-item">
                            <span className="stat-icon">⭐</span>
                            <span className="stat-value">{userStats?.total_points || 0}</span>
                            <span className="stat-label">نقطة</span>
                        </div>
                    </motion.div>

                    {/* Tab Switcher */}
                    {!selectedSection && (
                        <div style={{
                            display: 'flex',
                            gap: '8px',
                            justifyContent: 'center',
                            marginBottom: '24px',
                        }}>
                            <button
                                onClick={() => setActiveTab('exercises')}
                                style={{
                                    padding: '10px 24px',
                                    borderRadius: '10px',
                                    border: 'none',
                                    cursor: 'pointer',
                                    fontWeight: 600,
                                    fontSize: '0.95rem',
                                    fontFamily: 'inherit',
                                    background: activeTab === 'exercises'
                                        ? 'linear-gradient(135deg, #ff6b35, #ff8c42)'
                                        : 'rgba(255,255,255,0.06)',
                                    color: activeTab === 'exercises' ? '#fff' : 'rgba(255,255,255,0.5)',
                                    transition: 'all 0.2s',
                                }}
                            >
                                التمارين
                            </button>
                            <button
                                onClick={() => setActiveTab('progress')}
                                style={{
                                    padding: '10px 24px',
                                    borderRadius: '10px',
                                    border: 'none',
                                    cursor: 'pointer',
                                    fontWeight: 600,
                                    fontSize: '0.95rem',
                                    fontFamily: 'inherit',
                                    background: activeTab === 'progress'
                                        ? 'linear-gradient(135deg, #ff6b35, #ff8c42)'
                                        : 'rgba(255,255,255,0.06)',
                                    color: activeTab === 'progress' ? '#fff' : 'rgba(255,255,255,0.5)',
                                    transition: 'all 0.2s',
                                }}
                            >
                                تقدمي
                            </button>
                        </div>
                    )}

                    {/* Progress Dashboard Tab */}
                    {activeTab === 'progress' && !selectedSection && (
                        <ProgressDashboard
                            userStats={userStats}
                            completedExercises={completedExercises}
                            sectionProgress={sectionProgress}
                            onSectionClick={(sectionId) => {
                                setSelectedSection(sectionId)
                                setActiveTab('exercises')
                            }}
                        />
                    )}

                    {/* Section Selection or Exercises */}
                    {activeTab === 'exercises' && !selectedSection ? (
                        // Section Cards
                        <div className="sections-grid">
                            {Object.entries(sectionInfo)
                                .sort(([aId], [bId]) => {
                                    // Sort specialization-matching sections first
                                    if (!learningPrefs?.specialization) return 0
                                    const aHas = hasSpecContent(aId) ? -1 : 0
                                    const bHas = hasSpecContent(bId) ? -1 : 0
                                    return aHas - bHas
                                })
                                .map(([sectionId, info], index) => {
                                const exercises = allExercises[sectionId] || []
                                const progress = sectionProgress[sectionId] || 0
                                const completedCount = exercises.filter(e => completedExercises.has(e.exerciseId)).length
                                const isSpecSection = learningPrefs?.specialization && hasSpecContent(sectionId)
                                const specInfo = learningPrefs?.specialization ? getSpecialization(learningPrefs.specialization) : null

                                return (
                                    <motion.div
                                        key={sectionId}
                                        className={`section-card${isSpecSection ? ' spec-highlight' : ''}`}
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: index * 0.1 }}
                                        onClick={() => setSelectedSection(sectionId)}
                                        whileHover={{ scale: 1.02, y: -5 }}
                                        whileTap={{ scale: 0.98 }}
                                    >
                                        {isSpecSection && specInfo && (
                                            <span className="spec-badge">{specInfo.icon} تخصصك</span>
                                        )}
                                        <div className="section-icon">{info.icon}</div>
                                        <h3>{info.title}</h3>
                                        <div className="section-meta">
                                            <span>{exercises.length} تمرين</span>
                                            <span>•</span>
                                            <span>{info.totalPoints} نقطة</span>
                                        </div>
                                        
                                        {/* Progress Bar */}
                                        <div className="section-progress">
                                            <div 
                                                className="progress-fill"
                                                style={{ width: `${progress}%` }}
                                            />
                                        </div>
                                        <span className="progress-text">
                                            {completedCount}/{exercises.length} مكتمل
                                        </span>

                                        {progress === 100 && (
                                            <span className="section-complete-badge">✅ مكتمل</span>
                                        )}

                                        <span
                                            className="read-chapter-link"
                                            onClick={(e) => {
                                                e.stopPropagation()
                                                router.push(`/read/${sectionId}/1`)
                                            }}
                                        >
                                            📖 اقرأ الفصل
                                        </span>
                                    </motion.div>
                                )
                            })}
                        </div>
                    ) : selectedSection ? (
                        // Exercises List
                        <div className="exercises-section">
                            <motion.button
                                className="back-btn"
                                onClick={() => setSelectedSection(null)}
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                            >
                                → العودة للأقسام
                            </motion.button>

                            <motion.div
                                className="section-header"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                            >
                                <span className="section-icon-large">
                                    {sectionInfo[selectedSection]?.icon}
                                </span>
                                <h2>{sectionInfo[selectedSection]?.title}</h2>
                                <p>
                                    {allExercises[selectedSection]?.length} تمارين •
                                    {sectionInfo[selectedSection]?.totalPoints} نقطة
                                </p>
                            </motion.div>

                            <div className="exercises-list">
                                {allExercises[selectedSection]?.map((exercise: ExerciseData, index: number) => (
                                    <motion.div
                                        key={exercise.exerciseId}
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: index * 0.1 }}
                                    >
                                        {renderExercise(exercise)}
                                    </motion.div>
                                ))}
                            </div>
                        </div>
                    ) : null}
                </div>
            </main>
            </FeatureGate>
        </>
    )
}
