'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import Navigation from '@/components/Navigation'
import QuizQuestion from '@/components/exercises/QuizQuestion'
import FillInBlank from '@/components/exercises/FillInBlank'
import PromptBuilder from '@/components/exercises/PromptBuilder'
import { allExercises, sectionInfo, ExerciseData } from '@/data/exercisesData'
import { supabase } from '@/lib/supabase'
import { authSystem } from '@/lib/auth_system'
import { dbLogger } from '@/lib/logger'

interface UserStats {
    total_completed: number
    total_correct: number
    total_points: number
}

export default function ExercisesPage() {
    const router = useRouter()
    const [isLoading, setIsLoading] = useState(true)
    const [isLoggedIn, setIsLoggedIn] = useState(false)
    const [selectedSection, setSelectedSection] = useState<string | null>(null)
    const [userStats, setUserStats] = useState<UserStats | null>(null)
    const [completedExercises, setCompletedExercises] = useState<Set<string>>(new Set())
    const [sectionProgress, setSectionProgress] = useState<Record<string, number>>({})

    useEffect(() => {
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
                .select('exercise_id, section_id, is_completed')
                .eq('user_id', userId)
                .eq('is_completed', true) as { data: Array<{ exercise_id: string; section_id: string; is_completed: boolean }> | null; error: any }

            if (progress) {
                const completed = new Set(progress.map(p => p.exercise_id))
                setCompletedExercises(completed)

                // Calculate section progress
                const sectionProg: Record<string, number> = {}
                Object.keys(allExercises).forEach(sectionId => {
                    const total = allExercises[sectionId].length
                    const done = progress.filter(p => p.section_id === sectionId).length
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

    const handleExerciseComplete = (isCorrect: boolean, points: number) => {
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

                    {/* Section Selection or Exercises */}
                    {!selectedSection ? (
                        // Section Cards
                        <div className="sections-grid">
                            {Object.entries(sectionInfo).map(([sectionId, info], index) => {
                                const exercises = allExercises[sectionId] || []
                                const progress = sectionProgress[sectionId] || 0
                                const completedCount = exercises.filter(e => completedExercises.has(e.exerciseId)).length

                                return (
                                    <motion.div
                                        key={sectionId}
                                        className="section-card"
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: index * 0.1 }}
                                        onClick={() => setSelectedSection(sectionId)}
                                        whileHover={{ scale: 1.02, y: -5 }}
                                        whileTap={{ scale: 0.98 }}
                                    >
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
                                    </motion.div>
                                )
                            })}
                        </div>
                    ) : (
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
                                {allExercises[selectedSection]?.map((exercise, index) => (
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
                    )}
                </div>
            </main>
        </>
    )
}
