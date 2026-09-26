'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { supabaseProxy as supabase } from '@/lib/supabase_proxy'
import { authSystem } from '@/lib/auth_system'
import { onExerciseComplete } from '@/lib/gamification'
import { dbLogger } from '@/lib/logger'

interface BlankItem {
    id: string
    correctAnswer: string
    alternatives?: string[] // إجابات بديلة مقبولة
}

interface FillInBlankProps {
    exerciseId: string
    sectionId: string
    title: string
    // النص مع الفراغات بصيغة: "هذا {{blank1}} وهذا {{blank2}}"
    textWithBlanks: string
    blanks: BlankItem[]
    hint?: string
    points?: number
    onComplete?: (isCorrect: boolean, points: number) => void
}

export default function FillInBlank({
    exerciseId,
    sectionId,
    title,
    textWithBlanks,
    blanks,
    hint,
    points = 15,
    onComplete
}: FillInBlankProps) {
    const [answers, setAnswers] = useState<Record<string, string>>({})
    const [isSubmitted, setIsSubmitted] = useState(false)
    const [results, setResults] = useState<Record<string, boolean>>({})
    const [isLoading, setIsLoading] = useState(true)
    const [alreadyCompleted, setAlreadyCompleted] = useState(false)
    const [showHint, setShowHint] = useState(false)
    const inputRefs = useRef<Record<string, HTMLInputElement | null>>({})

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
                .maybeSingle() as { data: { is_completed?: boolean; user_answer?: string } | null; error: { message: string } | null }

            if (!isMounted()) return

            if (data && data.is_completed && !error) {
                setAlreadyCompleted(true)
                setIsSubmitted(true)
                
                // استعادة الإجابات المحفوظة
                const savedAnswers = JSON.parse(data.user_answer || '{}')
                setAnswers(savedAnswers)
                
                // حساب النتائج
                const newResults: Record<string, boolean> = {}
                blanks.forEach(blank => {
                    const userAnswer = (savedAnswers[blank.id] || '').trim().toLowerCase()
                    const correct = blank.correctAnswer.toLowerCase()
                    const alternatives = blank.alternatives?.map(a => a.toLowerCase()) || []
                    newResults[blank.id] = userAnswer === correct || alternatives.includes(userAnswer)
                })
                setResults(newResults)
            }
        } catch (error) {
            dbLogger.error('Error checking progress:', error)
        } finally {
            if (isMounted()) setIsLoading(false)
        }
    }, [exerciseId, blanks])

    useEffect(() => {
        let mounted = true
        const isMounted = () => mounted
        checkPreviousProgress(isMounted)
        return () => { mounted = false }
    }, [checkPreviousProgress])

    const saveProgress = async (allCorrect: boolean, resultsMap: Record<string, boolean>) => {
        try {
            const userId = authSystem.getCurrentUserId()
            if (!userId) return

            // منع تكرار النقاط إذا كان التمرين مكتملاً سابقاً
            if (alreadyCompleted) {
                dbLogger.debug('Exercise already completed, skipping points update')
                return
            }

            const correctCount = Object.values(resultsMap).filter(Boolean).length
            const earnedPoints = allCorrect ? points : Math.floor((correctCount / blanks.length) * points * 0.5)

            // حفظ تقدم التمرين
            const { error } = await (supabase
                .from('exercise_progress') as unknown as { 
                    upsert: (data: Record<string, unknown>, options: { onConflict: string }) => Promise<{ error: unknown }> 
                })
                .upsert({
                    user_id: userId,
                    exercise_id: exerciseId,
                    exercise_type: 'fill_blank',
                    section_id: sectionId,
                    is_completed: true,
                    is_correct: allCorrect,
                    user_answer: JSON.stringify(answers),
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
            await onExerciseComplete(userId, 'fill_blank', allCorrect, earnedPoints, exerciseId)

            onComplete?.(allCorrect, earnedPoints)
        } catch (error) {
            dbLogger.error('Error saving progress:', error)
        }
    }

    const handleInputChange = (blankId: string, value: string) => {
        setAnswers(prev => ({ ...prev, [blankId]: value }))
    }

    const handleSubmit = () => {
        if (isSubmitted) return

        // التحقق من الإجابات
        const newResults: Record<string, boolean> = {}
        let allCorrect = true

        blanks.forEach(blank => {
            const userAnswer = (answers[blank.id] || '').trim().toLowerCase()
            const correct = blank.correctAnswer.toLowerCase()
            const alternatives = blank.alternatives?.map(a => a.toLowerCase()) || []
            
            const isCorrect = userAnswer === correct || alternatives.includes(userAnswer)
            newResults[blank.id] = isCorrect
            
            if (!isCorrect) allCorrect = false
        })

        setResults(newResults)
        setIsSubmitted(true)
        saveProgress(allCorrect, newResults)
    }

    const handleRetry = () => {
        setAnswers({})
        setResults({})
        setIsSubmitted(false)
        setShowHint(false)
        
        // Focus on first input
        const firstBlank = blanks[0]
        if (firstBlank && inputRefs.current[firstBlank.id]) {
            inputRefs.current[firstBlank.id]?.focus()
        }
    }

    const allFilled = blanks.every(blank => (answers[blank.id] || '').trim() !== '')
    const allCorrect = isSubmitted && Object.values(results).every(Boolean)
    const correctCount = Object.values(results).filter(Boolean).length

    // تحويل النص مع الفراغات إلى عناصر
    const renderTextWithInputs = () => {
        const parts = textWithBlanks.split(/(\[[^\]]+\]|\{\{[^}]+\}\})/)
        
        return parts.map((part, index) => {
            const match = part.match(/\[([^\]]+)\]|\{\{([^}]+)\}\}/)
            if (match) {
                const blankId = match[1] || match[2]
                const blank = blanks.find(b => b.id === blankId)
                if (!blank) return null

                const isCorrect = results[blankId]
                let inputClass = 'fill-blank-input'
                if (isSubmitted) {
                    inputClass += isCorrect ? ' correct' : ' incorrect'
                }

                return (
                    <span key={index} className="fill-blank-wrapper">
                        <input
                            ref={el => { inputRefs.current[blankId] = el }}
                            type="text"
                            className={inputClass}
                            value={answers[blankId] || ''}
                            onChange={e => handleInputChange(blankId, e.target.value)}
                            disabled={isSubmitted}
                            placeholder="..."
                            dir="auto"
                        />
                        {isSubmitted && !isCorrect && (
                            <span className="correct-answer-hint">
                                ({blank.correctAnswer})
                            </span>
                        )}
                    </span>
                )
            }
            return <span key={index}>{part}</span>
        })
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
            className="fill-blank-container"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
        >
            {/* Header */}
            <div className="quiz-header">
                <span className="quiz-type-badge">✏️ أكمل الفراغات</span>
                {alreadyCompleted && (
                    <span className="quiz-completed-badge">
                        {allCorrect ? '✅ تم بشكل صحيح' : `⚡ ${correctCount}/${blanks.length} صحيح`}
                    </span>
                )}
                <span className="quiz-points">{points} نقطة</span>
            </div>

            {/* Title */}
            <h3 className="quiz-question">{title}</h3>

            {/* Text with Blanks */}
            <div className="fill-blank-text">
                {renderTextWithInputs()}
            </div>

            {/* Hint */}
            {hint && !isSubmitted && (
                <div className="hint-section">
                    <button 
                        className="hint-toggle"
                        onClick={() => setShowHint(!showHint)}
                    >
                        💡 {showHint ? 'إخفاء التلميح' : 'عرض تلميح'}
                    </button>
                    <AnimatePresence>
                        {showHint && (
                            <motion.p
                                className="hint-text"
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: 'auto' }}
                                exit={{ opacity: 0, height: 0 }}
                            >
                                {hint}
                            </motion.p>
                        )}
                    </AnimatePresence>
                </div>
            )}

            {/* Submit Button */}
            {!isSubmitted && (
                <motion.button
                    className="quiz-submit-btn"
                    onClick={handleSubmit}
                    disabled={!allFilled}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                >
                    تحقق من الإجابات
                </motion.button>
            )}

            {/* Result */}
            <AnimatePresence>
                {isSubmitted && (
                    <motion.div
                        className={`quiz-result ${allCorrect ? 'correct' : 'incorrect'}`}
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                    >
                        <div className="result-header">
                            {allCorrect ? (
                                <>
                                    <span className="result-icon">🎉</span>
                                    <span className="result-text">ممتاز! جميع الإجابات صحيحة +{points} نقطة</span>
                                </>
                            ) : (
                                <>
                                    <span className="result-icon">📝</span>
                                    <span className="result-text">
                                        أحسنت! {correctCount} من {blanks.length} إجابات صحيحة
                                    </span>
                                </>
                            )}
                        </div>
                        
                        {!allCorrect && !alreadyCompleted && (
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
