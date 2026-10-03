'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { supabaseProxy as supabase } from '@/lib/supabase_proxy'
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

    const score = totalWeight > 0 ? Math.round((earnedWeight / totalWeight) * 100) : 0
    const pointsEarned = score >= 70
        ? challenge.points
        : 0

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
    const [saveError, setSaveError] = useState<string | null>(null)
    const submitBusyRef = useRef(false)

    // Load completed challenges on mount
    useEffect(() => {
        let active = true
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

                if (data && active) {
                    setCompletedChallenges(prev => new Set([...prev, ...data.map((d) => d.exercise_id)]))
                }
            } catch {
                // Silently fail
            }
        }
        loadProgress()
        return () => { active = false }
    }, [])

    const handleSubmit = useCallback(async () => {
        if (!activeChallenge || !userFix.trim() || submitBusyRef.current) return

        submitBusyRef.current = true
        setSubmitting(true)
        setSaveError(null)
        const challengeResult = scoreFix(userFix, activeChallenge)
        setResult(challengeResult)

        // Insert first: the unique user/exercise key prevents points on repeat visits or another tab.
        const userId = authSystem.getCurrentUserId()
        try {
            if (challengeResult.passed && userId && !completedChallenges.has(activeChallenge.exerciseId)) {
                const now = new Date().toISOString()
                const { error } = await supabase.from('exercise_progress').insert({
                    user_id: userId, exercise_id: activeChallenge.exerciseId,
                    exercise_type: 'prompt_builder', section_id: 'hospital-challenges',
                    is_completed: true, is_correct: null,
                    user_answer: JSON.stringify({ prompt: userFix, structureScore: challengeResult.score,
                        assessment: 'structure-only-participation' }),
                    points_earned: challengeResult.pointsEarned, completed_at: now, last_attempt_at: now,
                })
                if (error && error.code !== '23505') {
                    setSaveError('تعذّر حفظ المحاولة في حسابك. لم يُسجّل الإتمام أو نقاط المشاركة؛ أعد المحاولة لاحقًا.')
                } else {
                    setCompletedChallenges((prev) => new Set(prev).add(activeChallenge.exerciseId))
                    if (!error) {
                        try {
                            await onExerciseComplete(userId, 'prompt_builder', null,
                                challengeResult.pointsEarned, activeChallenge.exerciseId)
                        } catch {
                            setSaveError('حُفظت المحاولة في حسابك، لكن تعذّر تحديث عرض التقدم. أعد تحميل الصفحة؛ إعادة المحاولة لا تسجل مشاركة إضافية.')
                        }
                    }
                }
            }
        } catch {
            setSaveError('تعذّر حفظ المحاولة في حسابك. لم يُسجّل الإتمام أو نقاط المشاركة؛ أعد المحاولة لاحقًا.')
        } finally {
            submitBusyRef.current = false
            setSubmitting(false)
        }
    }, [activeChallenge, userFix, completedChallenges])

    const handleBack = () => {
        setActiveChallenge(null)
        setUserFix('')
        setShowHints(false)
        setShowIdeal(false)
        setResult(null)
        setSaveError(null)
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
                            حسّن بنية الطلب، ثم جرّبه وراجع الناتج. النقاط للمشاركة فقط ولا تثبت جودة المخرجات.
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
                                                <span className="challenge-completed-badge">✅ مشاركة مسجلة</span>
                                            ) : (
                                                <span className="challenge-points">⭐ {challenge.points} نقاط مشاركة</span>
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
                                    {submitting ? 'جارٍ الفحص...' : 'فحص بنية أولي'}
                                </button>
                                <button
                                    className="show-ideal-btn"
                                    onClick={() => setShowIdeal(!showIdeal)}
                                >
                                    {showIdeal ? 'إخفاء المثال' : 'عرض مثال للمقارنة'}
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
                                    <span className="ideal-prompt-label">مثال للمقارنة يحتاج تجربة ومراجعة</span>
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
                                            🔎
                                        </span>
                                        <span
                                            className="score-value"
                                            style={{ color: result.passed ? '#22c55e' : '#ef4444' }}
                                        >
                                            {result.score}%
                                        </span>
                                        <span className="score-label">
                                            فحص بنية أولي: {result.passed ? 'توجد مؤشرات كافية لبدء التجربة' : 'أكمل مؤشرات البنية وأعد الفحص'}
                                        </span>
                                        <span className="score-points">
                                            {result.passed ? `${result.pointsEarned} نقاط مشاركة متاحة` : 'لا نقاط أو إتمام لهذا الفحص'}
                                        </span>
                                    </div>

                                    <p>النسبة لتغطية مؤشرات البنية وليست درجة جودة. جرّب الطلب في أداة AI، وافحص دقة الناتج واكتماله وقيوده، ثم عدّل الطلب وأعد التجربة.</p>
                                    {saveError && <p role="alert">{saveError}</p>}

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
                                        <button
                                                className="submit-fix-btn"
                                                onClick={() => { setResult(null); setSaveError(null) }}
                                            >
                                                عدّل الطلب وأعد الفحص
                                        </button>
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
