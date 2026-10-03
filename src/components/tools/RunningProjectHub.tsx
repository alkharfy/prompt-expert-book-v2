'use client'

import { useState, useRef, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { authSystem } from '@/lib/auth_system'
import { onExerciseComplete } from '@/lib/gamification'
import { supabaseProxy as supabase } from '@/lib/supabase_proxy'
import {
    runningProjects,
    evaluatePhaseCriterion,
    type RunningProject,
    type ProjectPhase,
    type PhaseScoringCriterion,
} from '@/data/runningProjectData'

// ============ Types ============

type ViewState = 'select' | 'dashboard' | 'phase'

interface PhaseProgress {
    completed: boolean
    score: number
    pointsEarned: number
    userPrompt?: string
    trialOutput?: string
    reviewedCriteria?: string[]
    reviewNotes?: string
    completionVersion?: number
}

interface ProjectProgress {
    projectId: string
    currentPhaseIndex: number
    phases: Record<number, PhaseProgress>
}

// ============ Color RGB mapping ============

const colorToRgb: Record<string, string> = {
    '#FF6B35': '255, 107, 53',
    '#4ECDC4': '78, 205, 196',
    '#A855F7': '168, 85, 247',
    '#22C55E': '34, 197, 94',
}

// ============ Difficulty labels ============

const difficultyLabels: Record<string, string> = {
    beginner: 'مبتدئ',
    intermediate: 'متوسط',
    advanced: 'متقدم',
}

// ============ Helper: localStorage ============

function loadSelectedProject(): string | null {
    if (typeof window === 'undefined') return null
    try { return localStorage.getItem('running_project_selected') } catch { return null }
}

function saveSelectedProject(projectId: string) {
    localStorage.setItem('running_project_selected', projectId)
}

function loadProgress(): ProjectProgress | null {
    if (typeof window === 'undefined') return null
    try {
        const raw = localStorage.getItem('running_project_progress')
        if (!raw) return null
        const saved = JSON.parse(raw) as ProjectProgress
        const project = runningProjects.find(p => p.id === saved?.projectId)
        if (!project || !saved.phases || typeof saved.phases !== 'object') return null
        const phases: ProjectProgress['phases'] = {}
        project.phases.forEach((phase, index) => {
            const entry = saved.phases[index]
            if (!entry) return
            const completed = entry.completed && entry.completionVersion === 2
                && typeof entry.trialOutput === 'string' && entry.trialOutput.trim().length >= 20
                && typeof entry.reviewNotes === 'string' && entry.reviewNotes.trim().length >= 10
                && Array.isArray(entry.reviewedCriteria)
                && phase.scoringCriteria.every(c => entry.reviewedCriteria!.includes(c.id))
            phases[index] = { ...entry, completed: !!completed, pointsEarned: completed ? entry.pointsEarned || 0 : 0 }
        })
        const firstIncomplete = project.phases.findIndex((_, i) => !phases[i]?.completed)
        return { ...saved, phases, currentPhaseIndex: firstIncomplete < 0 ? project.phases.length : firstIncomplete }
    } catch {
        return null
    }
}

function saveProgress(progress: ProjectProgress) {
    localStorage.setItem('running_project_progress', JSON.stringify(progress))
}

function clearProjectData() {
    localStorage.removeItem('running_project_selected')
    localStorage.removeItem('running_project_progress')
}

// ============ Component ============

export default function RunningProjectHub() {
    const [view, setView] = useState<ViewState>(() => {
        const savedProjectId = loadSelectedProject()
        const savedProgress = loadProgress()
        if (savedProjectId && savedProgress && savedProgress.projectId === savedProjectId) {
            const project = runningProjects.find(p => p.id === savedProjectId)
            if (project) return 'dashboard'
        }
        return 'select'
    })
    const [selectedProject, setSelectedProject] = useState<RunningProject | null>(() => {
        const savedProjectId = loadSelectedProject()
        const savedProgress = loadProgress()
        if (savedProjectId && savedProgress && savedProgress.projectId === savedProjectId) {
            return runningProjects.find(p => p.id === savedProjectId) || null
        }
        return null
    })
    const [progress, setProgress] = useState<ProjectProgress | null>(() => {
        const savedProjectId = loadSelectedProject()
        const savedProgress = loadProgress()
        if (savedProjectId && savedProgress && savedProgress.projectId === savedProjectId) {
            const project = runningProjects.find(p => p.id === savedProjectId)
            if (project) return savedProgress
        }
        return null
    })
    const [activePhaseIndex, setActivePhaseIndex] = useState<number | null>(null)
    const [userPrompt, setUserPrompt] = useState('')
    const [trialOutput, setTrialOutput] = useState('')
    const [savedTrialOutput, setSavedTrialOutput] = useState('')
    const [reviewedCriteria, setReviewedCriteria] = useState<string[]>([])
    const [reviewNotes, setReviewNotes] = useState('')
    const [saveError, setSaveError] = useState<string | null>(null)
    const completionBusyRef = useRef(false)
    const [showHints, setShowHints] = useState(false)
    const [showIdeal, setShowIdeal] = useState(false)
    const [evaluationResult, setEvaluationResult] = useState<{
        score: number
        passed: boolean
        criteriaResults: { criterion: PhaseScoringCriterion; passed: boolean }[]
    } | null>(null)
    const [isSubmitting, setIsSubmitting] = useState(false)

    // ============ Project Selection ============

    const handleSelectProject = useCallback((project: RunningProject) => {
        const newProgress: ProjectProgress = {
            projectId: project.id,
            currentPhaseIndex: 0,
            phases: {},
        }
        try {
            saveSelectedProject(project.id)
            saveProgress(newProgress)
            setSelectedProject(project)
            setProgress(newProgress)
            setSaveError(null)
            setView('dashboard')
        } catch {
            setSaveError('تعذّر حفظ المشروع في هذا المتصفح. اسمح بالتخزين المحلي ثم أعد المحاولة.')
        }
    }, [])

    // ============ Change Project ============

    const handleChangeProject = useCallback(() => {
        clearProjectData()
        setSelectedProject(null)
        setProgress(null)
        setActivePhaseIndex(null)
        setView('select')
    }, [])

    // ============ Open Phase ============

    const handleOpenPhase = useCallback((phaseIndex: number) => {
        if (!progress) return
        // Can only open completed phases or the current one
        if (phaseIndex > progress.currentPhaseIndex) return
        setActivePhaseIndex(phaseIndex)
        setUserPrompt(progress.phases[phaseIndex]?.userPrompt || '')
        setTrialOutput(progress.phases[phaseIndex]?.trialOutput || '')
        setSavedTrialOutput(progress.phases[phaseIndex]?.trialOutput || '')
        setReviewedCriteria(progress.phases[phaseIndex]?.reviewedCriteria || [])
        setReviewNotes(progress.phases[phaseIndex]?.reviewNotes || '')
        setSaveError(null)
        setShowHints(false)
        setShowIdeal(false)
        setEvaluationResult(null)
        setView('phase')
    }, [progress])

    // ============ Submit / Evaluate ============

    const handleSubmit = useCallback(() => {
        if (!selectedProject || activePhaseIndex === null || !progress) return
        if (userPrompt.trim().length < 20) return

        const phase = selectedProject.phases[activePhaseIndex]

        // Evaluate criteria
        const criteriaResults = phase.scoringCriteria.map(criterion => ({
            criterion,
            passed: evaluatePhaseCriterion(userPrompt, criterion),
        }))

        // Calculate weighted score
        const totalWeight = phase.scoringCriteria.reduce((sum, c) => sum + c.weight, 0)
        const earnedWeight = criteriaResults
            .filter(r => r.passed)
            .reduce((sum, r) => sum + r.criterion.weight, 0)
        const scorePercent = totalWeight > 0 ? Math.round((earnedWeight / totalWeight) * 100) : 0

        // فحص مؤشرات البنية فقط؛ لا يثبت صحة الناتج أو جودة الطلب.
        const passed = scorePercent >= 60
        setEvaluationResult({
            score: scorePercent,
            passed,
            criteriaResults,
        })
    }, [selectedProject, activePhaseIndex, progress, userPrompt])

    const handleSaveTrial = useCallback(() => {
        if (!progress || activePhaseIndex === null || !evaluationResult?.passed || trialOutput.trim().length < 20) return
        const updated: ProjectProgress = { ...progress, phases: { ...progress.phases, [activePhaseIndex]: {
            completed: false, score: evaluationResult.score, pointsEarned: 0, userPrompt,
            trialOutput: trialOutput.trim(), reviewedCriteria: [], reviewNotes: '',
        } } }
        try {
            saveProgress(updated)
            setProgress(updated)
            setSavedTrialOutput(trialOutput.trim())
            setReviewedCriteria([])
            setSaveError(null)
        } catch {
            setSaveError('تعذّر حفظ ناتج التجربة في هذا المتصفح. اسمح بالتخزين المحلي ثم أعد المحاولة.')
        }
    }, [progress, activePhaseIndex, evaluationResult, trialOutput, userPrompt])

    const handleCompleteTrial = useCallback(async () => {
        if (!selectedProject || !progress || activePhaseIndex === null || !evaluationResult?.passed || completionBusyRef.current) return
        const phase = selectedProject.phases[activePhaseIndex]
        if (progress.phases[activePhaseIndex]?.completed || trialOutput.trim() !== savedTrialOutput || savedTrialOutput.length < 20
            || reviewNotes.trim().length < 10 || !phase.scoringCriteria.every(c => reviewedCriteria.includes(c.id))) return
        completionBusyRef.current = true
        setIsSubmitting(true)
        setSaveError(null)
        const userId = authSystem.getCurrentUserId()
        const exerciseId = `running-project-${selectedProject.id}-phase-${activePhaseIndex}`
        const updated: ProjectProgress = { ...progress, phases: { ...progress.phases, [activePhaseIndex]: {
            completed: true, score: evaluationResult.score, pointsEarned: userId ? phase.points : 0, userPrompt,
            trialOutput: savedTrialOutput, reviewedCriteria, reviewNotes: reviewNotes.trim(), completionVersion: 2,
        } }, currentPhaseIndex: activePhaseIndex === progress.currentPhaseIndex ? activePhaseIndex + 1 : progress.currentPhaseIndex }
        let accountSaved = false
        let progressNotificationFailed = false
        try {
            // Keep the reviewed draft if the account save fails; do not unlock the next phase yet.
            const draft: ProjectProgress = { ...progress, phases: { ...progress.phases, [activePhaseIndex]: {
                ...updated.phases[activePhaseIndex], completed: false, pointsEarned: 0,
            } } }
            saveProgress(draft)
            setProgress(draft)
            if (userId) {
                const now = new Date().toISOString()
                const { error } = await supabase.from('exercise_progress').insert({
                    user_id: userId, exercise_id: exerciseId, exercise_type: 'prompt_builder',
                    section_id: 'running-project', is_completed: true, is_correct: null,
                    user_answer: JSON.stringify({ prompt: userPrompt, trialOutput: savedTrialOutput,
                        reviewedCriteria, reviewNotes: reviewNotes.trim(), structureScore: evaluationResult.score,
                        assessment: 'self-reviewed-trial', completionVersion: 2 }),
                    points_earned: phase.points, completed_at: now, last_attempt_at: now,
                })
                if (error && error.code !== '23505') {
                    setSaveError('تعذّر حفظ المحاولة في حسابك. بقيت المسودة محليًا؛ لم يُسجّل الإتمام أو الانتقال للمرحلة التالية.')
                    return
                }
                accountSaved = true
                // A duplicate means another tab or an earlier visit already recorded participation.
                if (!error) {
                    try {
                        await onExerciseComplete(userId, 'prompt_builder', null, phase.points, exerciseId)
                    } catch {
                        progressNotificationFailed = true
                    }
                }
            }
            saveProgress(updated)
            setProgress(updated)
            setEvaluationResult(null)
            if (progressNotificationFailed) setSaveError('حُفظت المحاولة في حسابك، لكن تعذّر تحديث عرض التقدم. أعد تحميل الصفحة؛ إعادة المحاولة لا تسجل مشاركة إضافية.')
        } catch {
            setSaveError(accountSaved
                ? 'حُفظت المحاولة في حسابك، لكن تعذّر حفظ الإتمام في هذا المتصفح. أعد المحاولة لإعادة حفظه دون نقاط إضافية.'
                : 'تعذّر حفظ إتمام التجربة. بقيت المسودة محليًا؛ لم يتم الانتقال إلى المرحلة التالية.')
        } finally {
            completionBusyRef.current = false
            setIsSubmitting(false)
        }
    }, [selectedProject, progress, activePhaseIndex, evaluationResult, trialOutput, savedTrialOutput, reviewNotes, reviewedCriteria, userPrompt])

    // ============ Navigation helpers ============

    const handleBackToDashboard = useCallback(() => {
        setActivePhaseIndex(null)
        setUserPrompt('')
        setEvaluationResult(null)
        setShowHints(false)
        setShowIdeal(false)
        setView('dashboard')
    }, [])

    const handleNextPhase = useCallback(() => {
        if (!selectedProject || activePhaseIndex === null) return
        const nextIndex = activePhaseIndex + 1
        if (nextIndex < selectedProject.phases.length) {
            handleOpenPhase(nextIndex)
        } else {
            handleBackToDashboard()
        }
    }, [selectedProject, activePhaseIndex, handleOpenPhase, handleBackToDashboard])

    const handleRetry = useCallback(() => {
        setEvaluationResult(null)
        setShowIdeal(false)
        setSavedTrialOutput('')
        setReviewedCriteria([])
        setSaveError(null)
    }, [])

    // ============ Computed values ============

    const completedPhasesCount = progress
        ? Object.values(progress.phases).filter(p => p.completed).length
        : 0

    const totalPointsEarned = progress
        ? Object.values(progress.phases).reduce((sum, p) => sum + p.pointsEarned, 0)
        : 0

    const completionPercent = selectedProject
        ? Math.round((completedPhasesCount / selectedProject.phases.length) * 100)
        : 0

    const isProjectComplete = selectedProject
        ? completedPhasesCount === selectedProject.phases.length
        : false

    // ============ RENDER ============

    return (
        <div className="running-project-container">
            <p style={{ color: 'var(--color-text-secondary)' }}>المسودات والتقدم في المشروع محفوظة في هذا المتصفح. عند إتمام مرحلة وأنت مسجل الدخول، يُحفظ الطلب وناتج التجربة والمراجعة في حسابك لتسجيل المشاركة مرة واحدة؛ الزائر يكمل محليًا دون نقاط حساب. الفحص الأولي يبحث عن مؤشرات بنية الطلب؛ لا يتحقق من صحة المخرجات أو إتقان المهارة.</p>
            {saveError && <p role="alert" style={{ color: '#fca5a5' }}>{saveError}</p>}
            <AnimatePresence mode="wait">
                {/* ===== Project Selection ===== */}
                {view === 'select' && (
                    <motion.div
                        key="select"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                    >
                        <h2 className="project-selection-title">اختر مشروعك 🚀</h2>
                        <div className="project-cards-grid">
                            {runningProjects.map(project => (
                                <motion.div
                                    key={project.id}
                                    className="project-select-card"
                                    style={{ '--project-color': project.color } as React.CSSProperties}
                                    whileHover={{ scale: 1.02 }}
                                    whileTap={{ scale: 0.98 }}
                                    onClick={() => handleSelectProject(project)}
                                >
                                    <div className="project-card-icon">{project.icon}</div>
                                    <div className="project-card-name">{project.name}</div>
                                    <div className="project-card-desc">{project.description}</div>
                                    <div className="project-card-meta">
                                        <span className={`project-card-badge difficulty-${project.difficulty}`}>
                                            {difficultyLabels[project.difficulty]}
                                        </span>
                                        <span className="project-card-badge domain">{project.domain}</span>
                                        <span className="project-card-badge phases-count">
                                            {project.phases.length} مراحل
                                        </span>
                                        <span className="project-card-badge total-points">
                                            ⭐ {project.totalPoints} نقطة
                                        </span>
                                    </div>
                                </motion.div>
                            ))}
                        </div>
                    </motion.div>
                )}

                {/* ===== Dashboard ===== */}
                {view === 'dashboard' && selectedProject && progress && (
                    <motion.div
                        key="dashboard"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        className="project-dashboard"
                        style={{
                            '--project-color': selectedProject.color,
                            '--project-color-rgb': colorToRgb[selectedProject.color] || '255, 107, 53',
                        } as React.CSSProperties}
                    >
                        {/* Project Complete state */}
                        {isProjectComplete ? (
                            <div className="project-complete">
                                <motion.div
                                    className="project-complete-icon"
                                    initial={{ scale: 0 }}
                                    animate={{ scale: 1 }}
                                    transition={{ type: 'spring', stiffness: 200 }}
                                >
                                    🏆
                                </motion.div>
                                <h2 className="project-complete-title">
                                    أحسنت! أكملت مشروع &ldquo;{selectedProject.name}&rdquo; 🎉
                                </h2>
                                <p className="project-complete-desc">
                                    سجلت تجارب المراحل ومراجعتها الذاتية. احتفظ بنواتجك وراجعها مع شخص مختص عند الحاجة؛ الإتمام لا يثبت إتقان المهارة.
                                </p>
                                <div className="project-complete-stats">
                                    <div>
                                        <div className="project-complete-stat-value">{completedPhasesCount}/{selectedProject.phases.length}</div>
                                        <div className="project-complete-stat-label">مراحل مكتملة</div>
                                    </div>
                                    <div>
                                        <div className="project-complete-stat-value">{totalPointsEarned}</div>
                                        <div className="project-complete-stat-label">نقاط مشاركة</div>
                                    </div>
                                </div>
                                <button className="project-restart-btn" onClick={handleChangeProject}>
                                    اختر مشروع آخر
                                </button>
                            </div>
                        ) : (
                            <>
                                {/* Header */}
                                <div className="project-dashboard-header">
                                    <div className="project-dashboard-info">
                                        <div className="project-dashboard-icon">{selectedProject.icon}</div>
                                        <div>
                                            <div className="project-dashboard-name">{selectedProject.name}</div>
                                            <div className="project-dashboard-domain">{selectedProject.domain}</div>
                                        </div>
                                    </div>
                                    <button className="project-change-btn" onClick={handleChangeProject}>
                                        تغيير المشروع
                                    </button>
                                </div>

                                {/* Stats */}
                                <div className="project-stats-row">
                                    <div className="project-stat-card">
                                        <div className="project-stat-value">{completionPercent}%</div>
                                        <div className="project-stat-label">نسبة الإكمال</div>
                                    </div>
                                    <div className="project-stat-card">
                                        <div className="project-stat-value">{completedPhasesCount}/{selectedProject.phases.length}</div>
                                        <div className="project-stat-label">مراحل مكتملة</div>
                                    </div>
                                    <div className="project-stat-card">
                                        <div className="project-stat-value">{totalPointsEarned}</div>
                                        <div className="project-stat-label">نقاط مشاركة</div>
                                    </div>
                                </div>

                                {/* Timeline */}
                                <div className="project-timeline">
                                    {selectedProject.phases.map((phase, index) => {
                                        const phaseProgress = progress.phases[index]
                                        const isCompleted = phaseProgress?.completed
                                        const isCurrent = index === progress.currentPhaseIndex
                                        const isLocked = index > progress.currentPhaseIndex

                                        return (
                                            <motion.div
                                                key={index}
                                                className={`timeline-item ${isCompleted ? 'completed' : ''} ${isCurrent ? 'current' : ''} ${isLocked ? 'locked' : ''}`}
                                                initial={{ opacity: 0, x: 20 }}
                                                animate={{ opacity: 1, x: 0 }}
                                                transition={{ delay: index * 0.08 }}
                                                onClick={() => !isLocked && handleOpenPhase(index)}
                                            >
                                                <div className={`timeline-dot ${isCompleted ? 'completed' : ''} ${isCurrent ? 'current' : ''} ${isLocked ? 'locked' : ''}`}>
                                                    {isCompleted ? '✓' : isLocked ? '🔒' : ''}
                                                </div>
                                                <div className="timeline-card">
                                                    <div className="timeline-card-header">
                                                        <span className="timeline-card-phase">
                                                            المرحلة {index + 1}
                                                        </span>
                                                        <span className="timeline-card-points">
                                                            {isCompleted && phaseProgress ? (
                                                                <>⭐ {phaseProgress.pointsEarned}/{phase.points}</>
                                                            ) : (
                                                                <>⭐ {phase.points} نقاط مشاركة</>
                                                            )}
                                                        </span>
                                                    </div>
                                                    <div className="timeline-card-title">{phase.title}</div>
                                                    <div className="timeline-card-desc">{phase.description}</div>
                                                    <span className="timeline-card-units">{phase.relatedUnits}</span>
                                                </div>
                                            </motion.div>
                                        )
                                    })}
                                </div>
                            </>
                        )}
                    </motion.div>
                )}

                {/* ===== Phase View ===== */}
                {view === 'phase' && selectedProject && activePhaseIndex !== null && (
                    <motion.div
                        key={`phase-${activePhaseIndex}`}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        className="phase-view"
                        style={{
                            '--project-color': selectedProject.color,
                            '--project-color-rgb': colorToRgb[selectedProject.color] || '255, 107, 53',
                        } as React.CSSProperties}
                    >
                        {(() => {
                            const phase: ProjectPhase = selectedProject.phases[activePhaseIndex]
                            const phaseCompleted = progress?.phases[activePhaseIndex]?.completed

                            return (
                                <>
                                    {/* Back button */}
                                    <button className="phase-back-btn" onClick={handleBackToDashboard}>
                                        → العودة للوحة المشروع
                                    </button>

                                    {/* Phase header */}
                                    <div className="phase-header">
                                        <div className="phase-label">
                                            المرحلة {activePhaseIndex + 1} من {selectedProject.phases.length} • {phase.relatedUnits}
                                        </div>
                                        <h2 className="phase-title">{phase.title}</h2>
                                        <p className="phase-description">{phase.description}</p>
                                    </div>

                                    {/* Brief */}
                                    <div className="phase-brief">
                                        <div className="phase-brief-title">📋 المطلوب منك</div>
                                        <div className="phase-brief-text">{phase.brief}</div>
                                    </div>

                                    {/* Hints */}
                                    <div className="phase-hints">
                                        <button
                                            className="phase-hints-toggle"
                                            onClick={() => setShowHints(!showHints)}
                                        >
                                            💡 تلميحات ({phase.hints.length}) {showHints ? '▲' : '▼'}
                                        </button>
                                        <AnimatePresence>
                                            {showHints && (
                                                <motion.ul
                                                    className="phase-hints-list"
                                                    initial={{ opacity: 0, height: 0 }}
                                                    animate={{ opacity: 1, height: 'auto' }}
                                                    exit={{ opacity: 0, height: 0 }}
                                                >
                                                    {phase.hints.map((hint, i) => (
                                                        <li key={i}>{hint}</li>
                                                    ))}
                                                </motion.ul>
                                            )}
                                        </AnimatePresence>
                                    </div>

                                    {/* Input (only if not evaluated or retrying) */}
                                    {!evaluationResult && !phaseCompleted && (
                                        <div className="phase-input-section">
                                            <label className="phase-input-label">
                                                ✏️ اكتب البرومبت الخاص بك:
                                            </label>
                                            <textarea
                                                className="phase-textarea"
                                                value={userPrompt}
                                                onChange={(e) => setUserPrompt(e.target.value)}
                                                placeholder="حدد المهمة والسياق والقيود وشكل الناتج الذي تحتاجه."
                                                dir="rtl"
                                            />
                                            <div className="phase-char-count">
                                                {userPrompt.length} حرف
                                            </div>
                                            <button
                                                className="phase-submit-btn"
                                                onClick={handleSubmit}
                                                disabled={userPrompt.trim().length < 20 || isSubmitting}
                                                style={{ '--project-color': selectedProject.color } as React.CSSProperties}
                                            >
                                                فحص بنية أولي
                                            </button>
                                        </div>
                                    )}

                                    {/* Already completed view */}
                                    {phaseCompleted && !evaluationResult && (
                                        <div className="phase-result success">
                                            <div className="phase-result-header">
                                                <div className="phase-result-icon">✅</div>
                                                <div className="phase-result-title">إتمام تجربة ومراجعة ذاتية</div>
                                                <div className="phase-result-score">
                                                    تغطية مؤشرات البنية: {progress?.phases[activePhaseIndex]?.score}% • نقاط مشاركة: {progress?.phases[activePhaseIndex]?.pointsEarned}
                                                </div>
                                            </div>

                                            {/* Show saved prompt */}
                                            {progress?.phases[activePhaseIndex]?.userPrompt && (
                                                <div className="phase-brief" style={{ marginTop: 16 }}>
                                                    <div className="phase-brief-title">📝 إجابتك السابقة</div>
                                                    <div className="phase-brief-text">
                                                        {progress.phases[activePhaseIndex].userPrompt}
                                                    </div>
                                                </div>
                                            )}

                                            <div className="phase-brief">
                                                <div className="phase-brief-title">ناتج التجربة المحفوظ محليًا</div>
                                                <div className="phase-brief-text">{progress?.phases[activePhaseIndex]?.trialOutput}</div>
                                                <div className="phase-brief-title">ملاحظات المراجعة الذاتية</div>
                                                <div className="phase-brief-text">{progress?.phases[activePhaseIndex]?.reviewNotes}</div>
                                            </div>
                                            <button className="phase-next-btn" onClick={handleNextPhase}>متابعة المشروع ←</button>

                                            {/* Ideal + Coach Tip */}
                                            <div className="phase-ideal-section">
                                                <button
                                                    className="phase-ideal-toggle"
                                                    onClick={() => setShowIdeal(!showIdeal)}
                                                >
                                                    🎯 عرض مثال للمقارنة {showIdeal ? '▲' : '▼'}
                                                </button>
                                                <AnimatePresence>
                                                    {showIdeal && (
                                                        <motion.div
                                                            className="phase-ideal-content"
                                                            initial={{ opacity: 0, height: 0 }}
                                                            animate={{ opacity: 1, height: 'auto' }}
                                                            exit={{ opacity: 0, height: 0 }}
                                                        >
                                                            <div className="phase-ideal-label">مثال للمقارنة:</div>
                                                            <div className="phase-ideal-text">{phase.idealPrompt}</div>
                                                        </motion.div>
                                                    )}
                                                </AnimatePresence>
                                            </div>

                                            <div className="phase-coach-tip">
                                                <div className="phase-coach-tip-title">🎓 ملاحظة المدرب</div>
                                                <div className="phase-coach-tip-text">{phase.coachTip}</div>
                                            </div>
                                        </div>
                                    )}

                                    {/* Evaluation Result */}
                                    {evaluationResult && (
                                        <motion.div
                                            initial={{ opacity: 0, y: 20 }}
                                            animate={{ opacity: 1, y: 0 }}
                                        >
                                            <div className={`phase-result ${evaluationResult.passed ? 'partial' : 'fail'}`}>
                                                <div className="phase-result-header">
                                                    <div className="phase-result-icon">
                                                        🔎
                                                    </div>
                                                    <div className="phase-result-title">فحص بنية أولي — {evaluationResult.passed ? 'توجد مؤشرات كافية لبدء التجربة' : 'أكمل مؤشرات البنية ثم أعد الفحص'}</div>
                                                    <div className="phase-result-score">
                                                        تغطية مؤشرات البنية: {evaluationResult.score}% — ليست درجة جودة
                                                    </div>
                                                </div>

                                                {/* Criteria breakdown */}
                                                <div className="phase-criteria-list">
                                                    {evaluationResult.criteriaResults.map((r, i) => (
                                                        <div key={i} className="phase-criterion">
                                                            <span className="phase-criterion-name">
                                                                {r.criterion.name}: {r.criterion.description}
                                                            </span>
                                                            <span className="phase-criterion-status">
                                                                {r.passed ? '✅' : '❌'}
                                                            </span>
                                                        </div>
                                                    ))}
                                                </div>

                                                {evaluationResult.passed && (
                                                    <div className="phase-input-section">
                                                        <p>جرّب الطلب في أداة AI، ثم احفظ الناتج وراجعه مقابل معايير المرحلة. لا توجد مراجعة دلالية آلية هنا.</p>
                                                        <label className="phase-input-label" htmlFor="phase-trial-output">ناتج التجربة</label>
                                                        <textarea id="phase-trial-output" className="phase-textarea" value={trialOutput} onChange={e => {
                                                            setTrialOutput(e.target.value)
                                                            setSavedTrialOutput('')
                                                            setReviewedCriteria([])
                                                        }} placeholder="الصق الناتج الذي حصلت عليه من تجربة الطلب. لا تضف معلومات حساسة." />
                                                        <button className="phase-submit-btn" onClick={handleSaveTrial} disabled={trialOutput.trim().length < 20 || isSubmitting}>حفظ ناتج التجربة محليًا</button>
                                                        {savedTrialOutput && <p role="status">حُفظ ناتج التجربة في هذا المتصفح.</p>}
                                                        <fieldset style={{ border: '1px solid #444', padding: 16, marginTop: 16 }}>
                                                            <legend>مراجعة ذاتية مقابل معايير المرحلة</legend>
                                                            {phase.scoringCriteria.map(c => <label key={c.id} style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
                                                                <input type="checkbox" checked={reviewedCriteria.includes(c.id)} disabled={!savedTrialOutput} onChange={e => setReviewedCriteria(prev => e.target.checked ? [...prev, c.id] : prev.filter(id => id !== c.id))} />
                                                                راجعت {c.name}: {c.description}
                                                            </label>)}
                                                            <label htmlFor="phase-review-notes">ماذا وجدت بعد مقارنة الناتج بالمعايير؟ اذكر نقصًا أو سبب قبول الناتج.</label>
                                                            <textarea id="phase-review-notes" className="phase-textarea" value={reviewNotes} onChange={e => setReviewNotes(e.target.value)} />
                                                        </fieldset>
                                                        <button className="phase-next-btn" onClick={handleCompleteTrial} disabled={isSubmitting || !savedTrialOutput || savedTrialOutput !== trialOutput.trim() || reviewNotes.trim().length < 10 || !phase.scoringCriteria.every(c => reviewedCriteria.includes(c.id))}>
                                                            {isSubmitting ? 'جاري الحفظ...' : 'إتمام تجربة ومراجعة ذاتية'}
                                                        </button>
                                                        <p>نقاط المشاركة تُسجل بعد حفظ التجربة والمراجعة، ولا تعني نجاح الناتج أو إتقان المهارة.</p>
                                                    </div>
                                                )}

                                                {/* Ideal prompt (always show after evaluation) */}
                                                <div className="phase-ideal-section">
                                                    <button
                                                        className="phase-ideal-toggle"
                                                        onClick={() => setShowIdeal(!showIdeal)}
                                                    >
                                                        🎯 {evaluationResult.passed ? 'قارن مع' : 'عرض'} مثال الطلب {showIdeal ? '▲' : '▼'}
                                                    </button>
                                                    <AnimatePresence>
                                                        {showIdeal && (
                                                            <motion.div
                                                                className="phase-ideal-content"
                                                                initial={{ opacity: 0, height: 0 }}
                                                                animate={{ opacity: 1, height: 'auto' }}
                                                                exit={{ opacity: 0, height: 0 }}
                                                            >
                                                                <div className="phase-ideal-label">مثال للمقارنة:</div>
                                                                <div className="phase-ideal-text">{phase.idealPrompt}</div>
                                                            </motion.div>
                                                        )}
                                                    </AnimatePresence>
                                                </div>

                                                {/* Coach tip */}
                                                <div className="phase-coach-tip">
                                                    <div className="phase-coach-tip-title">🎓 ملاحظة المدرب</div>
                                                    <div className="phase-coach-tip-text">{phase.coachTip}</div>
                                                </div>

                                                {/* Actions */}
                                                <button className="phase-retry-btn" onClick={handleRetry}>عدّل الطلب وأعد فحص البنية</button>
                                            </div>
                                        </motion.div>
                                    )}
                                </>
                            )
                        })()}
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    )
}
