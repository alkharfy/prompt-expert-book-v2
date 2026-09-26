'use client'

import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { authSystem } from '@/lib/auth_system'
import { onExerciseComplete } from '@/lib/gamification'
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
    return localStorage.getItem('running_project_selected')
}

function saveSelectedProject(projectId: string) {
    localStorage.setItem('running_project_selected', projectId)
}

function loadProgress(): ProjectProgress | null {
    if (typeof window === 'undefined') return null
    const raw = localStorage.getItem('running_project_progress')
    if (!raw) return null
    try {
        return JSON.parse(raw)
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
    const [showHints, setShowHints] = useState(false)
    const [showIdeal, setShowIdeal] = useState(false)
    const [evaluationResult, setEvaluationResult] = useState<{
        score: number
        passed: boolean
        partial: boolean
        criteriaResults: { criterion: PhaseScoringCriterion; passed: boolean }[]
        pointsEarned: number
    } | null>(null)
    const [isSubmitting, setIsSubmitting] = useState(false)

    // ============ Project Selection ============

    const handleSelectProject = useCallback((project: RunningProject) => {
        setSelectedProject(project)
        saveSelectedProject(project.id)

        const newProgress: ProjectProgress = {
            projectId: project.id,
            currentPhaseIndex: 0,
            phases: {},
        }
        setProgress(newProgress)
        saveProgress(newProgress)
        setView('dashboard')
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
        setShowHints(false)
        setShowIdeal(false)
        setEvaluationResult(null)
        setView('phase')
    }, [progress])

    // ============ Submit / Evaluate ============

    const handleSubmit = useCallback(async () => {
        if (!selectedProject || activePhaseIndex === null || !progress) return
        if (userPrompt.trim().length < 20) return

        setIsSubmitting(true)

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
        const scorePercent = Math.round((earnedWeight / totalWeight) * 100)

        // Determine result
        const passed = scorePercent >= 60
        const partial = scorePercent >= 60 && scorePercent < 80
        const fullSuccess = scorePercent >= 80

        // Calculate points
        let pointsEarned = 0
        if (fullSuccess) {
            pointsEarned = phase.points
        } else if (partial) {
            pointsEarned = Math.round(phase.points * 0.7)
        }

        // Update progress
        const newProgress = { ...progress }
        newProgress.phases = { ...newProgress.phases }
        newProgress.phases[activePhaseIndex] = {
            completed: passed,
            score: scorePercent,
            pointsEarned,
            userPrompt,
        }

        // Advance to next phase if passed and this is the current phase
        if (passed && activePhaseIndex === progress.currentPhaseIndex) {
            newProgress.currentPhaseIndex = Math.min(
                activePhaseIndex + 1,
                selectedProject.phases.length - 1
            )
            // If last phase is completed, keep index at last
            if (activePhaseIndex === selectedProject.phases.length - 1) {
                newProgress.currentPhaseIndex = selectedProject.phases.length
            }
        }

        setProgress(newProgress)
        saveProgress(newProgress)

        // Record in gamification system (Supabase) if user is logged in
        if (passed) {
            const userId = authSystem.getCurrentUserId()
            if (userId) {
                try {
                    const exerciseId = `running-project-${selectedProject.id}-phase-${activePhaseIndex}`
                    await onExerciseComplete(userId, 'prompt_builder', true, pointsEarned, exerciseId)
                } catch {
                    // Silently fail - localStorage already saved
                }
            }
        }

        setEvaluationResult({
            score: scorePercent,
            passed,
            partial,
            criteriaResults,
            pointsEarned,
        })
        setIsSubmitting(false)
    }, [selectedProject, activePhaseIndex, progress, userPrompt])

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
        setUserPrompt('')
        setEvaluationResult(null)
        setShowIdeal(false)
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
                                    أنجزت كل المراحل السبع بنجاح! أنت الآن تملك خبرة عملية في Prompt Engineering من خلال مشروع حقيقي.
                                </p>
                                <div className="project-complete-stats">
                                    <div>
                                        <div className="project-complete-stat-value">{completedPhasesCount}/7</div>
                                        <div className="project-complete-stat-label">مراحل مكتملة</div>
                                    </div>
                                    <div>
                                        <div className="project-complete-stat-value">{totalPointsEarned}</div>
                                        <div className="project-complete-stat-label">نقطة مكتسبة</div>
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
                                        <div className="project-stat-label">نقاط مكتسبة</div>
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
                                                                <>⭐ {phase.points} نقطة</>
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
                                                placeholder="اكتب البرومبت هنا... كلّما كان أكثر تفصيلاً، كلّما كانت النتيجة أفضل!"
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
                                                {isSubmitting ? 'جاري التقييم...' : '🚀 تسليم البرومبت'}
                                            </button>
                                        </div>
                                    )}

                                    {/* Already completed view */}
                                    {phaseCompleted && !evaluationResult && (
                                        <div className="phase-result success">
                                            <div className="phase-result-header">
                                                <div className="phase-result-icon">✅</div>
                                                <div className="phase-result-title">تم إكمال هذه المرحلة</div>
                                                <div className="phase-result-score">
                                                    النتيجة: {progress?.phases[activePhaseIndex]?.score}% • النقاط: {progress?.phases[activePhaseIndex]?.pointsEarned}
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

                                            {/* Ideal + Coach Tip */}
                                            <div className="phase-ideal-section">
                                                <button
                                                    className="phase-ideal-toggle"
                                                    onClick={() => setShowIdeal(!showIdeal)}
                                                >
                                                    🎯 عرض البرومبت المثالي {showIdeal ? '▲' : '▼'}
                                                </button>
                                                <AnimatePresence>
                                                    {showIdeal && (
                                                        <motion.div
                                                            className="phase-ideal-content"
                                                            initial={{ opacity: 0, height: 0 }}
                                                            animate={{ opacity: 1, height: 'auto' }}
                                                            exit={{ opacity: 0, height: 0 }}
                                                        >
                                                            <div className="phase-ideal-label">البرومبت المثالي:</div>
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
                                            <div className={`phase-result ${evaluationResult.score >= 80 ? 'success' : evaluationResult.score >= 60 ? 'partial' : 'fail'}`}>
                                                <div className="phase-result-header">
                                                    <div className="phase-result-icon">
                                                        {evaluationResult.score >= 80 ? '🎉' : evaluationResult.score >= 60 ? '👍' : '💪'}
                                                    </div>
                                                    <div className="phase-result-title">
                                                        {evaluationResult.score >= 80
                                                            ? 'ممتاز! نجحت بتفوق'
                                                            : evaluationResult.score >= 60
                                                            ? 'جيد! نجحت بنجاح جزئي'
                                                            : 'لم تنجح - حاول مرة أخرى'}
                                                    </div>
                                                    <div className="phase-result-score">
                                                        النتيجة: {evaluationResult.score}%
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

                                                {/* Points */}
                                                {evaluationResult.pointsEarned > 0 && (
                                                    <div className="phase-points-earned">
                                                        <div className="phase-points-value">
                                                            +{evaluationResult.pointsEarned} نقطة
                                                        </div>
                                                        <div className="phase-points-label">
                                                            {evaluationResult.score >= 80
                                                                ? 'نقاط كاملة!'
                                                                : '70% من النقاط (نجاح جزئي)'}
                                                        </div>
                                                    </div>
                                                )}

                                                {/* Ideal prompt (always show after evaluation) */}
                                                <div className="phase-ideal-section">
                                                    <button
                                                        className="phase-ideal-toggle"
                                                        onClick={() => setShowIdeal(!showIdeal)}
                                                    >
                                                        🎯 {evaluationResult.passed ? 'قارن مع' : 'عرض'} البرومبت المثالي {showIdeal ? '▲' : '▼'}
                                                    </button>
                                                    <AnimatePresence>
                                                        {showIdeal && (
                                                            <motion.div
                                                                className="phase-ideal-content"
                                                                initial={{ opacity: 0, height: 0 }}
                                                                animate={{ opacity: 1, height: 'auto' }}
                                                                exit={{ opacity: 0, height: 0 }}
                                                            >
                                                                <div className="phase-ideal-label">البرومبت المثالي:</div>
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
                                                {evaluationResult.passed ? (
                                                    activePhaseIndex < selectedProject.phases.length - 1 ? (
                                                        <button className="phase-next-btn" onClick={handleNextPhase}>
                                                            المرحلة التالية ←
                                                        </button>
                                                    ) : (
                                                        <button className="phase-next-btn" onClick={handleBackToDashboard}>
                                                            🏆 العودة للوحة المشروع
                                                        </button>
                                                    )
                                                ) : (
                                                    <button className="phase-retry-btn" onClick={handleRetry}>
                                                        🔄 حاول مرة أخرى
                                                    </button>
                                                )}
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
