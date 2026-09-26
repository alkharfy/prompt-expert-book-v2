'use client'

import { useState } from 'react'
import Link from 'next/link'

interface DailyTask {
  id: string
  taskType: 'reading' | 'exercise' | 'review' | 'celebration'
  sectionId?: string
  startPage?: number
  endPage?: number
  titleAr: string
  descriptionAr?: string
  estimatedMinutes: number
  status: 'pending' | 'completed' | 'skipped' | 'postponed'
}

interface Props {
  dayNumber: number
  totalDays: number
  progressPercent: number
  tasks: DailyTask[]
  isFlexible: boolean
  onTaskAction: (taskId: string, action: 'completed' | 'skipped') => Promise<void>
}

const TASK_ICONS: Record<string, string> = {
  reading: '📖',
  exercise: '✏️',
  review: '🔄',
  celebration: '🎉',
}

const STATUS_LABELS: Record<string, { label: string; icon: string }> = {
  pending: { label: 'مطلوب', icon: '⏳' },
  completed: { label: 'مكتمل', icon: '✅' },
  skipped: { label: 'تم تخطيه', icon: '⏭️' },
  postponed: { label: 'مؤجل', icon: '📌' },
}

export default function DailyTaskCard({ dayNumber, totalDays, progressPercent, tasks, isFlexible, onTaskAction }: Props) {
  const [loadingTask, setLoadingTask] = useState<string | null>(null)

  const handleAction = async (taskId: string, action: 'completed' | 'skipped') => {
    setLoadingTask(taskId)
    try {
      await onTaskAction(taskId, action)
    } finally {
      setLoadingTask(null)
    }
  }

  const pendingTasks = tasks.filter(t => t.status === 'pending')
  const completedTasks = tasks.filter(t => t.status === 'completed')
  const totalMinutes = pendingTasks.reduce((sum, t) => sum + t.estimatedMinutes, 0)

  if (isFlexible) {
    return (
      <div className="daily-task-card">
        <div className="dtc-header">
          <div className="dtc-icon">🌊</div>
          <div className="dtc-header-info">
            <h3>خطة مرنة</h3>
            <p>أنت ماشي على مزاجك — بدون جدول محدد</p>
          </div>
        </div>
        <div className="dtc-flexible-tips">
          <p>💡 <strong>اقتراحات:</strong></p>
          <ul>
            <li>اقرأ صفحة واحدة على الأقل يومياً</li>
            <li>حافظ على سلسلة القراءة بتاعتك 🔥</li>
            <li>حل تمرين واحد بعد كل فصل</li>
          </ul>
          <Link href="/toc" className="dtc-action-btn dtc-primary">
            أكمل القراءة ←
          </Link>
        </div>
        <style jsx>{`
          .daily-task-card {
            background: linear-gradient(135deg, rgba(255,107,53,0.08), rgba(255,107,53,0.02));
            border: 1px solid rgba(255,107,53,0.2);
            border-radius: 16px;
            padding: 24px;
            margin-bottom: 24px;
          }
          .dtc-header {
            display: flex;
            align-items: center;
            gap: 16px;
            margin-bottom: 20px;
          }
          .dtc-icon {
            font-size: 40px;
            line-height: 1;
          }
          .dtc-header-info h3 {
            color: #FF6B35;
            font-size: 1.2rem;
            margin: 0;
          }
          .dtc-header-info p {
            color: #999;
            font-size: 0.85rem;
            margin: 4px 0 0;
          }
          .dtc-flexible-tips {
            background: rgba(255,255,255,0.03);
            border-radius: 12px;
            padding: 16px;
          }
          .dtc-flexible-tips p {
            color: #ccc;
            margin: 0 0 8px;
            font-size: 0.9rem;
          }
          .dtc-flexible-tips ul {
            list-style: none;
            padding: 0;
            margin: 0 0 16px;
          }
          .dtc-flexible-tips li {
            color: #aaa;
            font-size: 0.85rem;
            padding: 6px 0;
            padding-right: 8px;
            border-right: 2px solid rgba(255,107,53,0.3);
            margin-bottom: 4px;
          }
          .dtc-action-btn {
            display: inline-block;
            padding: 10px 24px;
            border-radius: 8px;
            font-size: 0.9rem;
            font-weight: 600;
            text-decoration: none;
            cursor: pointer;
            border: none;
            transition: all 0.2s;
          }
          .dtc-primary {
            background: #FF6B35;
            color: #fff;
          }
          .dtc-primary:hover {
            background: #e55a2b;
            transform: translateY(-1px);
          }
        `}</style>
      </div>
    )
  }

  return (
    <div className="daily-task-card">
      {/* Header */}
      <div className="dtc-header">
        <div className="dtc-icon">📅</div>
        <div className="dtc-header-info">
          <h3>يوم {dayNumber} من {totalDays}</h3>
          <p>مهمتك اليوم</p>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="dtc-progress">
        <div className="dtc-progress-bar">
          <div className="dtc-progress-fill" style={{ width: `${progressPercent}%` }} />
        </div>
        <span className="dtc-progress-label">{progressPercent}% مكتمل</span>
      </div>

      {/* Tasks */}
      {tasks.length === 0 ? (
        <div className="dtc-empty">
          <p>🎯 لا يوجد مهام مجدولة اليوم</p>
          <Link href="/toc" className="dtc-action-btn dtc-primary">
            اقرأ على مزاجك ←
          </Link>
        </div>
      ) : (
        <div className="dtc-tasks">
          {tasks.map((task) => (
            <div key={task.id} className={`dtc-task ${task.status}`}>
              <div className="dtc-task-icon">{TASK_ICONS[task.taskType]}</div>
              <div className="dtc-task-info">
                <span className="dtc-task-title">{task.titleAr}</span>
                {task.descriptionAr && <span className="dtc-task-desc">{task.descriptionAr}</span>}
                {task.estimatedMinutes > 0 && (
                  <span className="dtc-task-time">⏰ ~{task.estimatedMinutes} دقيقة</span>
                )}
              </div>
              <div className="dtc-task-actions">
                {task.status === 'pending' ? (
                  <>
                    {task.taskType === 'reading' && task.sectionId && (
                      <Link
                        href={`/read/${task.sectionId}/${task.startPage || 1}`}
                        className="dtc-action-btn dtc-primary dtc-small"
                      >
                        ابدأ
                      </Link>
                    )}
                    {task.taskType === 'exercise' && (
                      <Link
                        href="/exercises"
                        className="dtc-action-btn dtc-primary dtc-small"
                      >
                        حل
                      </Link>
                    )}
                    <button
                      className="dtc-action-btn dtc-complete dtc-small"
                      onClick={() => handleAction(task.id, 'completed')}
                      disabled={loadingTask === task.id}
                    >
                      {loadingTask === task.id ? '...' : '✓'}
                    </button>
                    <button
                      className="dtc-action-btn dtc-skip dtc-small"
                      onClick={() => handleAction(task.id, 'skipped')}
                      disabled={loadingTask === task.id}
                    >
                      تخطي
                    </button>
                  </>
                ) : (
                  <span className="dtc-status-badge">
                    {STATUS_LABELS[task.status].icon} {STATUS_LABELS[task.status].label}
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Summary */}
      {pendingTasks.length > 0 && (
        <div className="dtc-summary">
          <span>📋 {pendingTasks.length} مهام متبقية</span>
          <span>⏰ ~{totalMinutes} دقيقة</span>
          {completedTasks.length > 0 && <span>✅ {completedTasks.length} مكتملة</span>}
        </div>
      )}

      <style jsx>{`
        .daily-task-card {
          background: linear-gradient(135deg, rgba(255,107,53,0.08), rgba(255,107,53,0.02));
          border: 1px solid rgba(255,107,53,0.2);
          border-radius: 16px;
          padding: 24px;
          margin-bottom: 24px;
        }
        .dtc-header {
          display: flex;
          align-items: center;
          gap: 16px;
          margin-bottom: 20px;
        }
        .dtc-icon {
          font-size: 40px;
          line-height: 1;
        }
        .dtc-header-info h3 {
          color: #FF6B35;
          font-size: 1.2rem;
          margin: 0;
        }
        .dtc-header-info p {
          color: #999;
          font-size: 0.85rem;
          margin: 4px 0 0;
        }
        .dtc-progress {
          display: flex;
          align-items: center;
          gap: 12px;
          margin-bottom: 20px;
        }
        .dtc-progress-bar {
          flex: 1;
          height: 8px;
          background: rgba(255,255,255,0.08);
          border-radius: 4px;
          overflow: hidden;
        }
        .dtc-progress-fill {
          height: 100%;
          background: linear-gradient(90deg, #FF6B35, #ff8f5e);
          border-radius: 4px;
          transition: width 0.5s ease;
        }
        .dtc-progress-label {
          color: #FF6B35;
          font-size: 0.85rem;
          font-weight: 600;
          white-space: nowrap;
        }
        .dtc-empty {
          text-align: center;
          padding: 20px;
        }
        .dtc-empty p {
          color: #999;
          margin-bottom: 16px;
        }
        .dtc-tasks {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }
        .dtc-task {
          display: flex;
          align-items: flex-start;
          gap: 12px;
          background: rgba(255,255,255,0.03);
          border: 1px solid rgba(255,255,255,0.06);
          border-radius: 12px;
          padding: 14px;
          transition: all 0.2s;
        }
        .dtc-task.completed {
          opacity: 0.6;
          border-color: rgba(76,175,80,0.3);
        }
        .dtc-task.skipped {
          opacity: 0.5;
        }
        .dtc-task-icon {
          font-size: 24px;
          line-height: 1;
          flex-shrink: 0;
          margin-top: 2px;
        }
        .dtc-task-info {
          flex: 1;
          display: flex;
          flex-direction: column;
          gap: 4px;
        }
        .dtc-task-title {
          color: #e0e0e0;
          font-size: 0.95rem;
          font-weight: 500;
        }
        .dtc-task-desc {
          color: #888;
          font-size: 0.8rem;
        }
        .dtc-task-time {
          color: #777;
          font-size: 0.75rem;
        }
        .dtc-task-actions {
          display: flex;
          align-items: center;
          gap: 6px;
          flex-shrink: 0;
        }
        .dtc-action-btn {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          padding: 8px 16px;
          border-radius: 8px;
          font-size: 0.85rem;
          font-weight: 600;
          text-decoration: none;
          cursor: pointer;
          border: none;
          transition: all 0.2s;
          font-family: inherit;
        }
        .dtc-small {
          padding: 6px 12px;
          font-size: 0.8rem;
        }
        .dtc-primary {
          background: #FF6B35;
          color: #fff;
        }
        .dtc-primary:hover {
          background: #e55a2b;
          transform: translateY(-1px);
        }
        .dtc-complete {
          background: rgba(76,175,80,0.15);
          color: #4CAF50;
          border: 1px solid rgba(76,175,80,0.3);
        }
        .dtc-complete:hover {
          background: rgba(76,175,80,0.25);
        }
        .dtc-skip {
          background: rgba(255,255,255,0.05);
          color: #888;
          border: 1px solid rgba(255,255,255,0.1);
        }
        .dtc-skip:hover {
          background: rgba(255,255,255,0.1);
          color: #aaa;
        }
        .dtc-status-badge {
          font-size: 0.75rem;
          color: #888;
          white-space: nowrap;
        }
        .dtc-summary {
          display: flex;
          align-items: center;
          gap: 16px;
          margin-top: 16px;
          padding-top: 16px;
          border-top: 1px solid rgba(255,255,255,0.06);
        }
        .dtc-summary span {
          color: #888;
          font-size: 0.8rem;
        }
        @media (max-width: 600px) {
          .daily-task-card {
            padding: 16px;
          }
          .dtc-task {
            flex-direction: column;
            gap: 8px;
          }
          .dtc-task-actions {
            align-self: flex-end;
          }
          .dtc-summary {
            flex-wrap: wrap;
            gap: 8px;
          }
        }
      `}</style>
    </div>
  )
}
