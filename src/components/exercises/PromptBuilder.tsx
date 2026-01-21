'use client'

import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence, Reorder } from 'framer-motion'
import { supabase } from '@/lib/supabase'
import { authSystem } from '@/lib/auth_system'
import { onExerciseComplete } from '@/lib/gamification'
import { dbLogger } from '@/lib/logger'

interface PromptStep {
    id: string
    label: string
    placeholder: string
    example: string
    required?: boolean
}

interface PromptBuilderProps {
    exerciseId: string
    sectionId: string
    title: string
    description: string
    steps: PromptStep[]
    templateFormat: string // مثل: "أنت {{role}}. أريد منك {{task}}. الشروط: {{constraints}}. المخرجات: {{output}}."
    exampleOutput?: string
    points?: number
    onComplete?: (isCorrect: boolean, points: number) => void
}

export default function PromptBuilder({
    exerciseId,
    sectionId,
    title,
    description,
    steps,
    templateFormat,
    exampleOutput,
    points = 20,
    onComplete
}: PromptBuilderProps) {
    const [values, setValues] = useState<Record<string, string>>({})
    const [isSubmitted, setIsSubmitted] = useState(false)
    const [generatedPrompt, setGeneratedPrompt] = useState('')
    const [isLoading, setIsLoading] = useState(true)
    const [alreadyCompleted, setAlreadyCompleted] = useState(false)
    const [copied, setCopied] = useState(false)
    const [activeStep, setActiveStep] = useState(0)
    const [showExample, setShowExample] = useState<string | null>(null)

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
                
                const savedValues = JSON.parse(data.user_answer || '{}')
                setValues(savedValues)
                
                // إعادة بناء البرومبت
                let prompt = templateFormat
                Object.entries(savedValues).forEach(([key, value]) => {
                    prompt = prompt.replace(new RegExp(`\\{\\{${key}\\}\\}`, 'g'), value as string)
                })
                setGeneratedPrompt(prompt)
            }
        } catch (error) {
            dbLogger.error('Error checking progress:', error)
        } finally {
            if (isMounted()) setIsLoading(false)
        }
    }, [exerciseId, templateFormat])

    useEffect(() => {
        let mounted = true
        const isMounted = () => mounted
        checkPreviousProgress(isMounted)
        return () => { mounted = false }
    }, [checkPreviousProgress])

    const saveProgress = async () => {
        try {
            const userId = authSystem.getCurrentUserId()
            if (!userId) return

            // منع تكرار النقاط إذا كان التمرين مكتملاً سابقاً
            if (alreadyCompleted) {
                dbLogger.debug('Exercise already completed, skipping points update')
                return
            }

            // حفظ تقدم التمرين
            const { error } = await (supabase
                .from('exercise_progress') as unknown as { 
                    upsert: (data: Record<string, unknown>, options: { onConflict: string }) => Promise<{ error: unknown }> 
                })
                .upsert({
                    user_id: userId,
                    exercise_id: exerciseId,
                    exercise_type: 'prompt_builder',
                    section_id: sectionId,
                    is_completed: true,
                    is_correct: true,
                    user_answer: JSON.stringify(values),
                    points_earned: points,
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
            await onExerciseComplete(userId, 'prompt_builder', true, points, exerciseId)

            onComplete?.(true, points)
        } catch (error) {
            dbLogger.error('Error saving progress:', error)
        }
    }

    const handleInputChange = (stepId: string, value: string) => {
        setValues(prev => ({ ...prev, [stepId]: value }))
    }

    const buildPrompt = () => {
        let prompt = templateFormat
        Object.entries(values).forEach(([key, value]) => {
            prompt = prompt.replace(new RegExp(`\\{\\{${key}\\}\\}`, 'g'), value)
        })
        return prompt
    }

    const handleSubmit = () => {
        if (isSubmitted) return

        const prompt = buildPrompt()
        setGeneratedPrompt(prompt)
        setIsSubmitted(true)
        saveProgress()
    }

    const handleCopy = async () => {
        try {
            await navigator.clipboard.writeText(generatedPrompt)
            setCopied(true)
            setTimeout(() => setCopied(false), 2000)
        } catch {
            // Silent fail for clipboard
        }
    }

    const handleReset = () => {
        setValues({})
        setIsSubmitted(false)
        setGeneratedPrompt('')
        setActiveStep(0)
    }

    const handleNextStep = () => {
        if (activeStep < steps.length - 1) {
            setActiveStep(activeStep + 1)
        }
    }

    const handlePrevStep = () => {
        if (activeStep > 0) {
            setActiveStep(activeStep - 1)
        }
    }

    const requiredSteps = steps.filter(s => s.required !== false)
    const allRequiredFilled = requiredSteps.every(step => (values[step.id] || '').trim() !== '')
    const filledCount = steps.filter(step => (values[step.id] || '').trim() !== '').length
    const progress = (filledCount / steps.length) * 100

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
            className="prompt-builder-container"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
        >
            {/* Header */}
            <div className="quiz-header">
                <span className="quiz-type-badge">🔨 بناء برومبت</span>
                {alreadyCompleted && (
                    <span className="quiz-completed-badge">✅ تم البناء</span>
                )}
                <span className="quiz-points">{points} نقطة</span>
            </div>

            {/* Title & Description */}
            <h3 className="quiz-question">{title}</h3>
            <p className="prompt-builder-description">{description}</p>

            {/* Progress Bar */}
            <div className="prompt-progress-bar">
                <div 
                    className="prompt-progress-fill"
                    style={{ width: `${progress}%` }}
                />
                <span className="prompt-progress-text">{filledCount}/{steps.length} خطوات</span>
            </div>

            {/* Steps - Wizard Style */}
            {!isSubmitted && (
                <div className="prompt-steps-wizard">
                    {/* Step Indicators */}
                    <div className="step-indicators">
                        {steps.map((step, index) => (
                            <button
                                key={step.id}
                                className={`step-indicator ${index === activeStep ? 'active' : ''} ${(values[step.id] || '').trim() !== '' ? 'filled' : ''}`}
                                onClick={() => setActiveStep(index)}
                            >
                                {index + 1}
                            </button>
                        ))}
                    </div>

                    {/* Active Step */}
                    <AnimatePresence mode="wait">
                        <motion.div
                            key={activeStep}
                            className="prompt-step"
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -20 }}
                            transition={{ duration: 0.3 }}
                        >
                            <div className="step-header">
                                <span className="step-number">خطوة {activeStep + 1}</span>
                                <label className="step-label">
                                    {steps[activeStep].label}
                                    {steps[activeStep].required !== false && <span className="required">*</span>}
                                </label>
                            </div>

                            <textarea
                                className="prompt-input"
                                value={values[steps[activeStep].id] || ''}
                                onChange={e => handleInputChange(steps[activeStep].id, e.target.value)}
                                placeholder={steps[activeStep].placeholder}
                                rows={3}
                            />

                            {/* Example Toggle */}
                            <button
                                className="example-toggle"
                                onClick={() => setShowExample(showExample === steps[activeStep].id ? null : steps[activeStep].id)}
                            >
                                💡 {showExample === steps[activeStep].id ? 'إخفاء المثال' : 'عرض مثال'}
                            </button>

                            <AnimatePresence>
                                {showExample === steps[activeStep].id && (
                                    <motion.div
                                        className="example-box"
                                        initial={{ opacity: 0, height: 0 }}
                                        animate={{ opacity: 1, height: 'auto' }}
                                        exit={{ opacity: 0, height: 0 }}
                                    >
                                        <span className="example-label">مثال:</span>
                                        <p>{steps[activeStep].example}</p>
                                        <button
                                            className="use-example-btn"
                                            onClick={() => {
                                                handleInputChange(steps[activeStep].id, steps[activeStep].example)
                                                setShowExample(null)
                                            }}
                                        >
                                            استخدم هذا المثال
                                        </button>
                                    </motion.div>
                                )}
                            </AnimatePresence>

                            {/* Navigation Buttons */}
                            <div className="step-navigation">
                                <button
                                    className="nav-btn prev"
                                    onClick={handlePrevStep}
                                    disabled={activeStep === 0}
                                >
                                    ← السابق
                                </button>
                                
                                {activeStep < steps.length - 1 ? (
                                    <button
                                        className="nav-btn next"
                                        onClick={handleNextStep}
                                    >
                                        التالي →
                                    </button>
                                ) : (
                                    <motion.button
                                        className="quiz-submit-btn"
                                        onClick={handleSubmit}
                                        disabled={!allRequiredFilled}
                                        whileHover={{ scale: 1.02 }}
                                        whileTap={{ scale: 0.98 }}
                                    >
                                        🚀 إنشاء البرومبت
                                    </motion.button>
                                )}
                            </div>
                        </motion.div>
                    </AnimatePresence>
                </div>
            )}

            {/* Generated Prompt */}
            <AnimatePresence>
                {isSubmitted && (
                    <motion.div
                        className="generated-prompt-section"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5 }}
                    >
                        <div className="generated-header">
                            <h4>🎉 البرومبت الخاص بك جاهز!</h4>
                            <span className="points-earned">+{points} نقطة</span>
                        </div>

                        <div className="generated-prompt-box">
                            <pre className="generated-prompt-text">{generatedPrompt}</pre>
                            
                            <button
                                className={`copy-prompt-btn ${copied ? 'copied' : ''}`}
                                onClick={handleCopy}
                            >
                                {copied ? '✓ تم النسخ!' : '📋 نسخ البرومبت'}
                            </button>
                        </div>

                        {exampleOutput && (
                            <div className="example-output-section">
                                <h5>مثال على المخرجات المتوقعة:</h5>
                                <p className="example-output-text">{exampleOutput}</p>
                            </div>
                        )}

                        {!alreadyCompleted && (
                            <button className="retry-btn" onClick={handleReset}>
                                🔄 إنشاء برومبت جديد
                            </button>
                        )}
                    </motion.div>
                )}
            </AnimatePresence>
        </motion.div>
    )
}
