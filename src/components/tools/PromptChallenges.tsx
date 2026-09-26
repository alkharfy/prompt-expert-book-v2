'use client'

import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { supabase } from '@/lib/supabase'
import { authSystem } from '@/lib/auth_system'
import { onExerciseComplete } from '@/lib/gamification'
import {
    hospitalChallenges,
    evaluateCriterion,
    type PromptDisease,
    type ScoringCriterion,
} from '@/data/hospitalChallengesData'

interface CriterionResult extends ScoringCriterion {
    passed: boolean
}

interface ChallengeResult {
    score: number
    pointsEarned: number
    criteriaResults: CriterionResult[]
    passed: boolean
}

function scoreFix(userPrompt: string, challenge: PromptDisease): ChallengeResult {
    let totalWeight = 0
    let earnedWeight = 0
    const criteriaResults: CriterionResult[] = []

    challenge.scoringCriteria.forEach((criterion) => {
        totalWeight += criterion.weight
        const passed = evaluateCriterion(userPrompt, criterion)
        if (passed) earnedWeight += criterion.weight
        criteriaResults.push({ ...criterion, passed })
    })

    const score = Math.round((earnedWeight / totalWeight) * 100)
    const pointsEarned = score >= 70
        ? challenge.points
        : Math.floor((score / 100) * challenge.points * 0.5)

    return { score, pointsEarned, criteriaResults, passed: score >= 70 }
}

export default function PromptChallenges() {
    const [activeChallenge, setActiveChallenge] = useState<PromptDisease | null>(null)
    const [userFix, setUserFix] = useState('')
    const [showHints, setShowHints] = useState(false)
    const [showIdeal, setShowIdeal] = useState(false)
    const [result, setResult] = useState<ChallengeResult | null>(null)
    const [completedChallenges, setCompletedChallenges] = useState<Set<string>>(new Set())
    const [submitting, setSubmitting] = useState(false)

    // Load completed challenges on mount
    useEffect(() => {
        const loadProgress = async () => {
            const userId = authSystem.getCurrentUserId()
            if (!userId) return

            try {
                const { data } = await supabase
                    .from('exercise_progress')
                    .select('exercise_id')
                    .eq('user_id', userId)
                    .eq('is_completed', true)
                    .like('exercise_id', 'hospital-challenge-%') as { data: { exercise_id: string }[] | null }

                if (data) {
                    setCompletedChallenges(new Set(data.map((d) => d.exercise_id)))
                }
            } catch {
                // Silently fail
            }
        }
        loadProgress()
    }, [])

    const handleSubmit = useCallback(async () => {
        if (!activeChallenge || !userFix.trim() || submitting) return

        setSubmitting(true)
        const challengeResult = scoreFix(userFix, activeChallenge)
        setResult(challengeResult)

        // Save to gamification if not already completed
        const userId = authSystem.getCurrentUserId()
        if (userId && !completedChallenges.has(activeChallenge.exerciseId)) {
            try {
                await onExerciseComplete(
                    userId,
                    'prompt_builder',
                    challengeResult.passed,
                    challengeResult.pointsEarned,
                    activeChallenge.exerciseId
                )
                if (challengeResult.passed) {
                    setCompletedChallenges((prev) => new Set(prev).add(activeChallenge.exerciseId))
                }
            } catch {
                // Silently fail
            }
        }
        setSubmitting(false)
    }, [activeChallenge, userFix, submitting, completedChallenges])

    const handleBack = () => {
        setActiveChallenge(null)
        setUserFix('')
        setShowHints(false)
        setShowIdeal(false)
        setResult(null)
    }

    const getDifficultyLabel = (d: string) => {
        switch (d) {
            case 'easy': return 'سهل'
            case 'medium': return 'متوسط'
            case 'hard': return 'صعب'
            default: return d
        }
    }

    return (
        <div>
            <AnimatePresence mode="wait">
                {!activeChallenge ? (
                    /* شبكة التحديات */
                    <motion.div
                        key="grid"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                    >
                        <p style={{ textAlign: 'center', color: 'var(--color-text-secondary)', marginBottom: 25 }}>
                            برومبتات مريضة تحتاج مساعدتك - أصلحها واكسب نقاط!
                        </p>
                        <div className="challenges-grid">
                            {hospitalChallenges.map((challenge, i) => {
                                const isCompleted = completedChallenges.has(challenge.exerciseId)
                                return (
                                    <motion.div
                                        key={challenge.id}
                                        className={`challenge-card ${isCompleted ? 'completed' : ''}`}
                                        onClick={() => setActiveChallenge(challenge)}
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: i * 0.05 }}
                                        whileHover={{ scale: 1.02 }}
                                        whileTap={{ scale: 0.98 }}
                                    >
                                        <div className="challenge-card-header">
                                            <span className="challenge-card-icon">{challenge.icon}</span>
                                            <span className="challenge-card-title">{challenge.name}</span>
                                        </div>
                                        <p className="challenge-card-desc">{challenge.description}</p>
                                        <div className="challenge-card-meta">
                                            <span className={`difficulty-badge difficulty-${challenge.difficulty}`}>
                                                {getDifficultyLabel(challenge.difficulty)}
                                            </span>
                                            {isCompleted ? (
                                                <span className="challenge-completed-badge">✅ مكتمل</span>
                                            ) : (
                                                <span className="challenge-points">⭐ {challenge.points} نقطة</span>
                                            )}
                                        </div>
                                    </motion.div>
                                )
                            })}
                        </div>
                    </motion.div>
                ) : (
                    /* التحدي النشط */
                    <motion.div
                        key="active"
                        initial={{ opacity: 0, x: 50 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -50 }}
                        className="active-challenge"
                    >
                        <button className="back-to-challenges" onClick={handleBack}>
                            → العودة للتحديات
                        </button>

                        {/* رأس التحدي */}
                        <div className="challenge-header">
                            <h2 className="challenge-title">
                                <span>{activeChallenge.icon}</span>
                                <span>{activeChallenge.name}</span>
                                <span className={`difficulty-badge difficulty-${activeChallenge.difficulty}`}>
                                    {getDifficultyLabel(activeChallenge.difficulty)}
                                </span>
                            </h2>
                            <p className="challenge-description">{activeChallenge.description}</p>
                            <div className="challenge-diseases">
                                {activeChallenge.diseases.map((d, i) => (
                                    <span key={i} className="disease-tag">🔴 {d}</span>
                                ))}
                            </div>
                        </div>

                        {/* البرومبت المريض */}
                        <div className="sick-prompt-display">
                            <span className="sick-prompt-label">🤒 البرومبت المريض</span>
                            {activeChallenge.sickPrompt}
                        </div>

                        {/* حقل الإصلاح */}
                        <textarea
                            className="fix-textarea"
                            placeholder="اكتب البرومبت بعد إصلاحه هنا..."
                            value={userFix}
                            onChange={(e) => setUserFix(e.target.value)}
                            disabled={!!result}
                        />

                        {/* التلميحات */}
                        <div className="hints-section">
                            <button className="hints-toggle" onClick={() => setShowHints(!showHints)}>
                                💡 {showHints ? 'إخفاء التلميحات' : 'عرض التلميحات'}
                            </button>
                            <AnimatePresence>
                                {showHints && (
                                    <motion.div
                                        initial={{ opacity: 0, height: 0 }}
                                        animate={{ opacity: 1, height: 'auto' }}
                                        exit={{ opacity: 0, height: 0 }}
                                        className="hints-list"
                                    >
                                        {activeChallenge.hints.map((hint, i) => (
                                            <div key={i} className="hint-item">💡 {hint}</div>
                                        ))}
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>

                        {/* أزرار */}
                        {!result && (
                            <div className="challenge-actions">
                                <button
                                    className="submit-fix-btn"
                                    onClick={handleSubmit}
                                    disabled={!userFix.trim() || submitting}
                                >
                                    {submitting ? 'جارٍ التقييم...' : '✅ تسليم العلاج'}
                                </button>
                                <button
                                    className="show-ideal-btn"
                                    onClick={() => setShowIdeal(!showIdeal)}
                                >
                                    {showIdeal ? 'إخفاء الإجابة' : '👁️ عرض الإجابة المثالية'}
                                </button>
                            </div>
                        )}

                        {/* الإجابة المثالية */}
                        <AnimatePresence>
                            {showIdeal && (
                                <motion.div
                                    initial={{ opacity: 0, height: 0 }}
                                    animate={{ opacity: 1, height: 'auto' }}
                                    exit={{ opacity: 0, height: 0 }}
                                    className="ideal-prompt-section"
                                    style={{ marginTop: 20 }}
                                >
                                    <span className="ideal-prompt-label">الإجابة المثالية</span>
                                    <div className="ideal-prompt-text">{activeChallenge.idealPrompt}</div>
                                </motion.div>
                            )}
                        </AnimatePresence>

                        {/* نتائج التقييم */}
                        <AnimatePresence>
                            {result && (
                                <motion.div
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className={`scoring-result ${result.passed ? 'passed' : 'failed'}`}
                                >
                                    <div className="score-header">
                                        <span className="score-icon">
                                            {result.passed ? '🎉' : '🔄'}
                                        </span>
                                        <span
                                            className="score-value"
                                            style={{ color: result.passed ? '#22c55e' : '#ef4444' }}
                                        >
                                            {result.score}%
                                        </span>
                                        <span className="score-label">
                                            {result.passed ? 'تم العلاج بنجاح!' : 'يحتاج مزيداً من العلاج'}
                                        </span>
                                        <span className="score-points">
                                            +{result.pointsEarned} نقطة
                                        </span>
                                    </div>

                                    <div className="criteria-list">
                                        {result.criteriaResults.map((cr) => (
                                            <div key={cr.id} className="criterion-item">
                                                <span className="criterion-status">
                                                    {cr.passed ? '✅' : '❌'}
                                                </span>
                                                <div className="criterion-info">
                                                    <span className="criterion-name">{cr.name}</span>
                                                    <span className="criterion-desc">{cr.description}</span>
                                                </div>
                                                <span className="criterion-weight">{cr.weight}%</span>
                                            </div>
                                        ))}
                                    </div>

                                    {/* أزرار بعد النتيجة */}
                                    <div className="challenge-actions" style={{ marginTop: 20 }}>
                                        {!result.passed && (
                                            <button
                                                className="submit-fix-btn"
                                                onClick={() => { setResult(null); setUserFix('') }}
                                            >
                                                🔄 حاول مرة أخرى
                                            </button>
                                        )}
                                        <button className="show-ideal-btn" onClick={handleBack}>
                                            → تحدي آخر
                                        </button>
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    )
}
