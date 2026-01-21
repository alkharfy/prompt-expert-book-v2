'use client'

import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { supabase } from '@/lib/supabase'
import { authSystem } from '@/lib/auth_system'
import { onExerciseComplete } from '@/lib/gamification'
import { dbLogger } from '@/lib/logger'

interface QuizOption {
    id: string
    text: string
}

interface QuizQuestionProps {
    exerciseId: string
    sectionId: string
    question: string
    options: QuizOption[]
    correctAnswerId: string
    explanation: string
    points?: number
    onComplete?: (isCorrect: boolean, points: number) => void
}

export default function QuizQuestion({
    exerciseId,
    sectionId,
    question,
    options,
    correctAnswerId,
    explanation,
    points = 10,
    onComplete
}: QuizQuestionProps) {
    const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null)
    const [isSubmitted, setIsSubmitted] = useState(false)
    const [isCorrect, setIsCorrect] = useState(false)
    const [showExplanation, setShowExplanation] = useState(false)
    const [isLoading, setIsLoading] = useState(true)
    const [alreadyCompleted, setAlreadyCompleted] = useState(false)

    const checkPreviousProgress = useCallback(async (isMounted: () => boolean) => {
        try {
            const userId = authSystem.getCurrentUserId()
            if (!userId) {
                if (isMounted()) setIsLoading(false)
                return
            }

            const { data, error } = await supabase
                .from('exercise_progress')
                .select('*')
                .eq('user_id', userId)
                .eq('exercise_id', exerciseId)
                .maybeSingle() as { data: { is_completed?: boolean; is_correct?: boolean; user_answer?: string } | null; error: { message: string } | null }

            if (!isMounted()) return

            if (data && data.is_completed && !error) {
                setAlreadyCompleted(true)
                setIsSubmitted(true)
                setIsCorrect(data.is_correct || false)
                setSelectedAnswer(data.user_answer || '')
                setShowExplanation(true)
            }
        } catch (error) {
            dbLogger.error('Error checking progress:', error)
        } finally {
            if (isMounted()) setIsLoading(false)
        }
    }, [exerciseId])

    useEffect(() => {
        let mounted = true
        const isMounted = () => mounted
        checkPreviousProgress(isMounted)
        return () => { mounted = false }
    }, [checkPreviousProgress])

    const saveProgress = async (correct: boolean) => {
        try {
            const userId = authSystem.getCurrentUserId()
            if (!userId) return

            // منع تكرار النقاط إذا كان التمرين مكتملاً سابقاً
            if (alreadyCompleted) {
                dbLogger.debug('Exercise already completed, skipping points update')
                return
            }

            const earnedPoints = correct ? points : 0

            // حفظ تقدم التمرين
            const { error } = await (supabase
                .from('exercise_progress') as unknown as { 
                    upsert: (data: Record<string, unknown>, options: { onConflict: string }) => Promise<{ error: unknown }> 
                })
                .upsert({
                    user_id: userId,
                    exercise_id: exerciseId,
                    exercise_type: 'quiz',
                    section_id: sectionId,
                    is_completed: true,
                    is_correct: correct,
                    user_answer: selectedAnswer,
                    points_earned: earnedPoints,
                    completed_at: new Date().toISOString(),
                    last_attempt_at: new Date().toISOString()
                }, {
                    onConflict: 'user_id,exercise_id'
                })

            if (error) {
                dbLogger.error('Error saving exercise progress:', error)
                return
            }

            // تحديث إحصائيات المستخدم والنقاط
            await onExerciseComplete(userId, 'quiz', correct, earnedPoints, exerciseId)

            onComplete?.(correct, earnedPoints)
        } catch (error) {
            dbLogger.error('Error saving progress:', error)
        }
    }

    const handleSubmit = () => {
        if (!selectedAnswer || isSubmitted) return

        const correct = selectedAnswer === correctAnswerId
        setIsCorrect(correct)
        setIsSubmitted(true)
        setShowExplanation(true)
        saveProgress(correct)
    }

    const handleRetry = () => {
        setSelectedAnswer(null)
        setIsSubmitted(false)
        setShowExplanation(false)
        setIsCorrect(false)
    }

    if (isLoading) {
        return (
            <div className="quiz-loading">
                <div className="loading-spinner"></div>
                <span>جاري التحميل...</span>
            </div>
        )
    }

    return (
        <motion.div 
            className="quiz-container"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
        >
            {/* Header */}
            <div className="quiz-header">
                <span className="quiz-type-badge">🎯 اختبار</span>
                {alreadyCompleted && (
                    <span className="quiz-completed-badge">
                        {isCorrect ? '✅ تم الإجابة بشكل صحيح' : '❌ تمت المحاولة'}
                    </span>
                )}
                <span className="quiz-points">{points} نقطة</span>
            </div>

            {/* Question */}
            <h3 className="quiz-question">{question}</h3>

            {/* Options */}
            <div className="quiz-options">
                {options.map((option, index) => {
                    const isSelected = selectedAnswer === option.id
                    const isCorrectOption = option.id === correctAnswerId
                    
                    let optionClass = 'quiz-option'
                    if (isSubmitted) {
                        if (isCorrectOption) {
                            optionClass += ' correct'
                        } else if (isSelected && !isCorrect) {
                            optionClass += ' incorrect'
                        }
                    } else if (isSelected) {
                        optionClass += ' selected'
                    }

                    return (
                        <motion.button
                            key={option.id}
                            className={optionClass}
                            onClick={() => !isSubmitted && setSelectedAnswer(option.id)}
                            disabled={isSubmitted}
                            whileHover={!isSubmitted ? { scale: 1.02 } : {}}
                            whileTap={!isSubmitted ? { scale: 0.98 } : {}}
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: index * 0.1 }}
                        >
                            <span className="option-letter">
                                {String.fromCharCode(1571 + index)}
                            </span>
                            <span className="option-text">{option.text}</span>
                            {isSubmitted && isCorrectOption && (
                                <span className="option-icon">✓</span>
                            )}
                            {isSubmitted && isSelected && !isCorrect && !isCorrectOption && (
                                <span className="option-icon">✗</span>
                            )}
                        </motion.button>
                    )
                })}
            </div>

            {/* Submit Button */}
            {!isSubmitted && (
                <motion.button
                    className="quiz-submit-btn"
                    onClick={handleSubmit}
                    disabled={!selectedAnswer}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                >
                    تحقق من الإجابة
                </motion.button>
            )}

            {/* Result & Explanation */}
            <AnimatePresence>
                {showExplanation && (
                    <motion.div
                        className={`quiz-result ${isCorrect ? 'correct' : 'incorrect'}`}
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                    >
                        <div className="result-header">
                            {isCorrect ? (
                                <>
                                    <span className="result-icon">🎉</span>
                                    <span className="result-text">إجابة صحيحة! +{points} نقطة</span>
                                </>
                            ) : (
                                <>
                                    <span className="result-icon">💡</span>
                                    <span className="result-text">إجابة خاطئة</span>
                                </>
                            )}
                        </div>
                        <p className="result-explanation">{explanation}</p>
                        
                        {!isCorrect && !alreadyCompleted && (
                            <button className="retry-btn" onClick={handleRetry}>
                                🔄 حاول مرة أخرى
                            </button>
                        )}
                    </motion.div>
                )}
            </AnimatePresence>
        </motion.div>
    )
}
