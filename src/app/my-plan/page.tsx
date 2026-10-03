'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { authSystem } from '@/lib/auth_system'
import DailyTaskCard from '@/components/plan/DailyTaskCard'

interface DailyTask {
  id: string
  taskDate: string
  taskType: 'reading' | 'exercise' | 'review' | 'celebration'
  sectionId?: string
  startPage?: number
  endPage?: number
  titleAr: string
  descriptionAr?: string
  dayNumber: number
  estimatedMinutes: number
  status: 'pending' | 'completed' | 'skipped' | 'postponed'
}

interface TodayPlan {
  dayNumber: number
  totalDays: number
  progressPercent: number
  needsRegeneration?: boolean
  tasks: DailyTask[]
  isFlexible: boolean
  summary: {
    learningPath: string
    learningDuration: string
    startDate: string
    expectedEndDate: string
    totalReadingTasks: number
    totalExerciseTasks: number
  } | null
}

const PATH_NAMES: Record<string, string> = {
  quick: '⚡ المسار السريع',
  intermediate: '📘 المسار المتوسط',
  comprehensive: '🏆 المسار الشامل',
}

const DURATION_NAMES: Record<string, string> = {
  '1week': 'أسبوع واحد',
  '2weeks': 'أسبوعين',
  '1month': 'شهر واحد',
  '2months': 'شهرين',
  'flexible': 'مرن',
}

export default function MyPlanPage() {
  const router = useRouter()
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [todayPlan, setTodayPlan] = useState<TodayPlan | null>(null)
  const [generating, setGenerating] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<'today' | 'overview'>('today')
  const [fullPlan, setFullPlan] = useState<DailyTask[]>([])

  useEffect(() => {
    const checkAuth = async () => {
      const userId = authSystem.getCurrentUserId()
      if (!userId) {
        router.push('/login?redirect=/my-plan')
        return
      }
      setIsLoggedIn(true)
      await fetchTodayPlan()
    }
    checkAuth()
  }, [router])

  const fetchTodayPlan = async () => {
    setIsLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/learning-plan')
      const data = await res.json()
      if (data.plan) {
        setTodayPlan(data.plan)
      }
    } catch {
      setError('فشل تحميل الخطة')
    } finally {
      setIsLoading(false)
    }
  }

  const generatePlan = async () => {
    setGenerating(true)
    setError(null)
    try {
      const res = await fetch('/api/learning-plan', { method: 'POST' })
      const data = await res.json()
      if (data.ok) {
        await fetchTodayPlan()
      } else if (data.flexible) {
        await fetchTodayPlan()
      } else {
        setError(data.error || 'فشل توليد الخطة')
      }
    } catch {
      setError('خطأ في الاتصال')
    } finally {
      setGenerating(false)
    }
  }

  const fetchFullPlan = async () => {
    try {
      const res = await fetch('/api/learning-plan?view=full')
      const data = await res.json()
      if (data.tasks) {
        setFullPlan(data.tasks)
      }
    } catch {
      // silent
    }
  }

  const handleTabChange = (tab: 'today' | 'overview') => {
    setActiveTab(tab)
    if (tab === 'overview' && fullPlan.length === 0) {
      fetchFullPlan()
    }
  }

  const handleTaskAction = useCallback(async (taskId: string, action: 'completed' | 'skipped') => {
    try {
      const res = await fetch('/api/learning-plan', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ taskId, status: action }),
      })
      const data = await res.json()
      if (data.ok) {
        const planResponse = await fetch('/api/learning-plan')
        const refreshed = await planResponse.json()
        if (planResponse.ok && refreshed.plan) setTodayPlan(refreshed.plan)
        setFullPlan(prev =>
          prev.map(t => t.id === taskId ? { ...t, status: action } : t)
        )
      } else {
        setError(data.error || 'تعذر تسجيل حالة المهمة')
      }
    } catch {
      setError('تعذر تسجيل حالة المهمة. جرّب مرة أخرى.')
    }
  }, [])

  if (!isLoggedIn) return null

  if (isLoading) {
    return (
      <div className="plan-page">
        <div className="plan-loading">
          <div className="plan-spinner" />
          <p>جاري تحميل خطتك...</p>
        </div>
        <style jsx>{pageStyles}</style>
      </div>
    )
  }

  const hasPlan = todayPlan && (todayPlan.summary || todayPlan.tasks.length > 0 || todayPlan.isFlexible)
  const noPlanYet = !hasPlan && !todayPlan?.summary

  // Group full plan by date
  const groupedPlan: Record<string, DailyTask[]> = {}
  for (const task of fullPlan) {
    if (!groupedPlan[task.taskDate]) groupedPlan[task.taskDate] = []
    groupedPlan[task.taskDate].push(task)
  }

  return (
    <div className="plan-page">
      <motion.div
        className="plan-container"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        {/* Header */}
        <div className="plan-header">
          <h1>📅 خطتي</h1>
          <p>خطة التعلم الشخصية بتاعتك</p>
        </div>

        {error && (
          <div className="plan-error">
            ⚠️ {error}
          </div>
        )}

        {/* No Plan Yet */}
        {noPlanYet && (
          <div className="plan-empty">
            <div className="plan-empty-icon">🗺️</div>
            <h2>لسه ما عندكش خطة!</h2>
            <p>بناءً على تفضيلاتك في الـ Onboarding، هنولّدلك خطة تعلم يومية مخصصة ليك.</p>
            <button
              className="plan-generate-btn"
              onClick={generatePlan}
              disabled={generating}
            >
              {generating ? (
                <>
                  <span className="plan-spinner-inline" /> جاري التوليد...
                </>
              ) : (
                '🚀 ولّد خطتي'
              )}
            </button>
            <p className="plan-tip">
              💡 لو مش عامل Onboarding، <a href="/onboarding">ابدأ من هنا</a>
            </p>
          </div>
        )}

        {/* Has Plan */}
        {hasPlan && (
          <>
            {/* Summary badge */}
            {todayPlan.summary && (
              <div className="plan-summary-bar">
                <span>{PATH_NAMES[todayPlan.summary.learningPath] || todayPlan.summary.learningPath}</span>
                <span className="plan-sep">•</span>
                <span>{DURATION_NAMES[todayPlan.summary.learningDuration] || todayPlan.summary.learningDuration}</span>
                <span className="plan-sep">•</span>
                <span>{todayPlan.summary.totalReadingTasks} قراءة + {todayPlan.summary.totalExerciseTasks} تمرين</span>
              </div>
            )}

            {/* Tabs */}
            <div className="plan-tabs">
              <button
                className={`plan-tab ${activeTab === 'today' ? 'active' : ''}`}
                onClick={() => handleTabChange('today')}
              >
                📅 اليوم
              </button>
              <button
                className={`plan-tab ${activeTab === 'overview' ? 'active' : ''}`}
                onClick={() => handleTabChange('overview')}
              >
                📊 نظرة عامة
              </button>
            </div>

            {/* Today Tab */}
            {activeTab === 'today' && (
              <DailyTaskCard
                dayNumber={todayPlan.dayNumber}
                totalDays={todayPlan.totalDays}
                progressPercent={todayPlan.progressPercent}
                tasks={todayPlan.tasks}
                isFlexible={todayPlan.isFlexible}
                needsRegeneration={todayPlan.needsRegeneration}
                onTaskAction={handleTaskAction}
              />
            )}

            {/* Overview Tab */}
            {activeTab === 'overview' && (
              <div className="plan-overview">
                {todayPlan.isFlexible ? (
                  <div className="plan-loading-mini">
                    <p>🌊 أنت على الخطة المرنة — مفيش جدول زمني محدد</p>
                  </div>
                ) : fullPlan.length === 0 ? (
                  <div className="plan-loading-mini">
                    <div className="plan-spinner" />
                    <p>جاري تحميل الخطة الكاملة...</p>
                  </div>
                ) : (
                  <div className="plan-timeline">
                    {Object.entries(groupedPlan).map(([date, dateTasks]) => {
                      const dayNum = dateTasks[0]?.dayNumber || 0
                      const allDone = dateTasks.every(t => t.status === 'completed')
                      const anyDone = dateTasks.some(t => t.status === 'completed')
                      return (
                        <div key={date} className={`plan-day ${allDone ? 'done' : anyDone ? 'partial' : ''}`}>
                          <div className="plan-day-header">
                            <span className="plan-day-num">يوم {dayNum}</span>
                            <span className="plan-day-date">{formatDate(date)}</span>
                            {allDone && <span className="plan-day-badge">✅</span>}
                          </div>
                          <div className="plan-day-tasks">
                            {dateTasks.map(t => (
                              <div key={t.id} className={`plan-day-task ${t.status}`}>
                                <span className="plan-day-task-icon">
                                  {t.status === 'completed' ? '✅' :
                                   t.status === 'skipped' ? '⏭️' :
                                   t.taskType === 'reading' ? '📖' :
                                   t.taskType === 'exercise' ? '✏️' :
                                   t.taskType === 'review' ? '🔄' : '🎉'}
                                </span>
                                <span className={`plan-day-task-title ${t.status}`}>{t.titleAr}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>
            )}

            {/* Regenerate button */}
            <div className="plan-footer">
              <button
                className="plan-regen-btn"
                onClick={generatePlan}
                disabled={generating}
              >
                {generating ? 'جاري إعادة التوليد...' : '🔄 أعد توليد الخطة'}
              </button>
              <p className="plan-footer-note">ⓘ إعادة التوليد هتمسح الخطة الحالية وتعمل واحدة جديدة</p>
            </div>
          </>
        )}
      </motion.div>
      <style jsx>{pageStyles}</style>
    </div>
  )
}

function formatDate(dateStr: string): string {
  try {
    const date = new Date(dateStr)
    return date.toLocaleDateString('ar-EG', { weekday: 'short', month: 'short', day: 'numeric' })
  } catch {
    return dateStr
  }
}

const pageStyles = `
  .plan-page {
    min-height: 100vh;
    background: #0A0A0A;
    padding: calc(var(--header-h, 70px) + 24px) 16px 40px;
  }
  .plan-container {
    max-width: 700px;
    margin: 0 auto;
  }
  .plan-header {
    text-align: center;
    margin-bottom: 28px;
  }
  .plan-header h1 {
    color: #FF6B35;
    font-size: 1.8rem;
    margin: 0;
  }
  .plan-header p {
    color: #888;
    font-size: 0.9rem;
    margin-top: 8px;
  }
  .plan-loading {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    min-height: 50vh;
    gap: 16px;
  }
  .plan-loading p,
  .plan-loading-mini p {
    color: #888;
    font-size: 0.9rem;
  }
  .plan-loading-mini {
    display: flex;
    flex-direction: column;
    align-items: center;
    padding: 40px;
    gap: 12px;
  }
  .plan-spinner {
    width: 32px;
    height: 32px;
    border: 3px solid rgba(255,107,53,0.2);
    border-top-color: #FF6B35;
    border-radius: 50%;
    animation: spin 0.8s linear infinite;
  }
  .plan-spinner-inline {
    display: inline-block;
    width: 16px;
    height: 16px;
    border: 2px solid rgba(255,255,255,0.3);
    border-top-color: #fff;
    border-radius: 50%;
    animation: spin 0.8s linear infinite;
    margin-left: 8px;
    vertical-align: middle;
  }
  @keyframes spin {
    to { transform: rotate(360deg); }
  }
  .plan-error {
    background: rgba(244,67,54,0.1);
    border: 1px solid rgba(244,67,54,0.3);
    color: #f44336;
    padding: 12px 16px;
    border-radius: 8px;
    margin-bottom: 16px;
    text-align: center;
    font-size: 0.9rem;
  }
  .plan-empty {
    text-align: center;
    padding: 40px 20px;
    background: rgba(255,255,255,0.02);
    border: 1px dashed rgba(255,107,53,0.3);
    border-radius: 16px;
  }
  .plan-empty-icon {
    font-size: 64px;
    margin-bottom: 16px;
  }
  .plan-empty h2 {
    color: #FF6B35;
    font-size: 1.3rem;
    margin: 0 0 12px;
  }
  .plan-empty p {
    color: #999;
    font-size: 0.9rem;
    margin: 0 0 20px;
    line-height: 1.6;
  }
  .plan-generate-btn {
    background: #FF6B35;
    color: #fff;
    border: none;
    padding: 14px 32px;
    border-radius: 12px;
    font-size: 1.1rem;
    font-weight: 700;
    cursor: pointer;
    transition: all 0.3s;
    font-family: inherit;
  }
  .plan-generate-btn:hover:not(:disabled) {
    background: #e55a2b;
    transform: translateY(-2px);
    box-shadow: 0 4px 20px rgba(255,107,53,0.3);
  }
  .plan-generate-btn:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
  .plan-tip {
    margin-top: 16px;
    font-size: 0.8rem !important;
    color: #666 !important;
  }
  .plan-tip a {
    color: #FF6B35;
    text-decoration: underline;
  }
  .plan-summary-bar {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    flex-wrap: wrap;
    background: rgba(255,107,53,0.06);
    border: 1px solid rgba(255,107,53,0.15);
    border-radius: 10px;
    padding: 10px 16px;
    margin-bottom: 20px;
    font-size: 0.85rem;
    color: #ccc;
  }
  .plan-sep {
    color: rgba(255,107,53,0.4);
  }
  .plan-tabs {
    display: flex;
    gap: 8px;
    margin-bottom: 20px;
  }
  .plan-tab {
    flex: 1;
    padding: 10px;
    border: 1px solid rgba(255,255,255,0.1);
    border-radius: 10px;
    background: rgba(255,255,255,0.03);
    color: #999;
    font-size: 0.9rem;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s;
    text-align: center;
    font-family: inherit;
  }
  .plan-tab.active {
    background: rgba(255,107,53,0.1);
    border-color: rgba(255,107,53,0.4);
    color: #FF6B35;
  }
  .plan-tab:hover:not(.active) {
    border-color: rgba(255,255,255,0.2);
    color: #ccc;
  }
  .plan-overview {
    margin-bottom: 24px;
  }
  .plan-timeline {
    display: flex;
    flex-direction: column;
    gap: 12px;
  }
  .plan-day {
    background: rgba(255,255,255,0.02);
    border: 1px solid rgba(255,255,255,0.06);
    border-radius: 12px;
    padding: 14px;
    transition: all 0.2s;
  }
  .plan-day.done {
    border-color: rgba(76,175,80,0.3);
    background: rgba(76,175,80,0.04);
  }
  .plan-day.partial {
    border-color: rgba(255,107,53,0.2);
  }
  .plan-day-header {
    display: flex;
    align-items: center;
    gap: 12px;
    margin-bottom: 8px;
  }
  .plan-day-num {
    color: #FF6B35;
    font-weight: 700;
    font-size: 0.9rem;
  }
  .plan-day-date {
    color: #777;
    font-size: 0.8rem;
  }
  .plan-day-badge {
    margin-right: auto;
    font-size: 0.9rem;
  }
  .plan-day-tasks {
    display: flex;
    flex-direction: column;
    gap: 6px;
  }
  .plan-day-task {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 4px 0;
  }
  .plan-day-task-icon {
    font-size: 0.9rem;
  }
  .plan-day-task-title {
    color: #ccc;
    font-size: 0.85rem;
  }
  .plan-day-task-title.completed {
    text-decoration: line-through;
    color: #777;
  }
  .plan-day-task-title.skipped {
    text-decoration: line-through;
    color: #555;
  }
  .plan-footer {
    text-align: center;
    margin-top: 24px;
    padding-top: 24px;
    border-top: 1px solid rgba(255,255,255,0.06);
  }
  .plan-regen-btn {
    background: rgba(255,255,255,0.05);
    color: #999;
    border: 1px solid rgba(255,255,255,0.1);
    padding: 10px 24px;
    border-radius: 8px;
    font-size: 0.85rem;
    cursor: pointer;
    transition: all 0.2s;
    font-family: inherit;
  }
  .plan-regen-btn:hover:not(:disabled) {
    border-color: rgba(255,107,53,0.3);
    color: #FF6B35;
  }
  .plan-regen-btn:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
  .plan-footer-note {
    color: #555;
    font-size: 0.75rem;
    margin-top: 8px;
  }
`
