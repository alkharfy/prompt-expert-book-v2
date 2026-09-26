'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useLearning } from '@/context/LearningContext'
import { getSpecialization } from '@/data/specializations'
import type { SpecExample, SpecExercise } from '@/data/specializationContent'

interface Props {
  sectionId: string
}

export default function SpecializationExamples({ sectionId }: Props) {
  const { preferences, isLoading } = useLearning()
  const [expandedExample, setExpandedExample] = useState<number | null>(null)
  const [showExercise, setShowExercise] = useState(false)
  const [data, setData] = useState<{ examples: SpecExample[]; exercise: SpecExercise | null } | null>(null)

  const specId = preferences?.specialization

  // Examples + expected-outputs are paid content — fetched from an entitlement-gated
  // API so the specialization data module is never bundled into the client.
  useEffect(() => {
    if (!specId) return
    let cancelled = false
    fetch(`/api/spec-examples?spec=${encodeURIComponent(specId)}&section=${encodeURIComponent(sectionId)}`)
      .then((r) => r.json())
      .then((d) => { if (!cancelled) setData({ examples: d.examples || [], exercise: d.exercise || null }) })
      .catch(() => { if (!cancelled) setData({ examples: [], exercise: null }) })
    return () => { cancelled = true }
  }, [specId, sectionId])

  if (isLoading || !specId) return null
  if (!data || data.examples.length === 0) return null

  const examples = data.examples
  const exercise = data.exercise
  const spec = getSpecialization(specId)

  return (
    <motion.div
      className="spec-examples-wrapper"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2 }}
    >
      <div className="spec-examples-header">
        <span className="spec-examples-icon">{spec.icon}</span>
        <div>
          <h3 className="spec-examples-title">أمثلة من تخصصك: {spec.nameAr}</h3>
          <p className="spec-examples-subtitle">
            أمثلة عملية مخصصة ليك — جرّب تطبقها مباشرة
          </p>
        </div>
      </div>

      <div className="spec-examples-list">
        {examples.map((example, idx) => (
          <ExampleCard
            key={idx}
            example={example}
            index={idx}
            isExpanded={expandedExample === idx}
            onToggle={() => setExpandedExample(expandedExample === idx ? null : idx)}
          />
        ))}
      </div>

      {exercise && (
        <div className="spec-exercise-section">
          <button
            className="spec-exercise-toggle"
            onClick={() => setShowExercise(!showExercise)}
          >
            <span>🎯</span>
            <span>{showExercise ? 'إخفاء التمرين' : 'تمرين تطبيقي — جرّب بنفسك'}</span>
            <span className="spec-exercise-points">{exercise.points} نقطة</span>
          </button>
          <AnimatePresence>
            {showExercise && (
              <ExerciseCard exercise={exercise} />
            )}
          </AnimatePresence>
        </div>
      )}

      <style jsx>{`
        .spec-examples-wrapper {
          margin-top: 40px;
          padding: 24px;
          border-radius: 16px;
          background: linear-gradient(135deg, rgba(255,107,53,0.08) 0%, rgba(255,107,53,0.02) 100%);
          border: 1px solid rgba(255,107,53,0.15);
        }
        .spec-examples-header {
          display: flex;
          align-items: center;
          gap: 14px;
          margin-bottom: 20px;
        }
        .spec-examples-icon {
          font-size: 2rem;
          width: 50px;
          height: 50px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: rgba(255,107,53,0.12);
          border-radius: 12px;
          flex-shrink: 0;
        }
        .spec-examples-title {
          margin: 0;
          font-size: 1.2rem;
          color: #FF6B35;
          font-weight: 700;
        }
        .spec-examples-subtitle {
          margin: 4px 0 0;
          font-size: 0.85rem;
          color: #999;
        }
        .spec-examples-list {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }
        .spec-exercise-section {
          margin-top: 20px;
        }
        .spec-exercise-toggle {
          width: 100%;
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 14px 18px;
          border-radius: 12px;
          background: rgba(255,107,53,0.06);
          border: 1px dashed rgba(255,107,53,0.3);
          color: #FF6B35;
          font-size: 1rem;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s;
          font-family: inherit;
        }
        .spec-exercise-toggle:hover {
          background: rgba(255,107,53,0.12);
        }
        .spec-exercise-points {
          margin-right: auto;
          background: rgba(255,107,53,0.15);
          padding: 3px 10px;
          border-radius: 20px;
          font-size: 0.8rem;
        }
      `}</style>
    </motion.div>
  )
}

function ExampleCard({
  example,
  index,
  isExpanded,
  onToggle,
}: {
  example: SpecExample
  index: number
  isExpanded: boolean
  onToggle: () => void
}) {
  const [copied, setCopied] = useState(false)

  const copyPrompt = async () => {
    try {
      await navigator.clipboard.writeText(example.prompt)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // Silent fail
    }
  }

  return (
    <div className="spec-example-card">
      <button className="spec-example-header" onClick={onToggle}>
        <span className="spec-example-num">{index + 1}</span>
        <span className="spec-example-title">{example.title}</span>
        <span className={`spec-example-arrow ${isExpanded ? 'expanded' : ''}`}>▼</span>
      </button>

      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="spec-example-body"
          >
            <div className="spec-example-content">
              <div className="spec-example-prompt-label">البرومبت:</div>
              <div className="spec-example-prompt">
                {example.prompt}
                <button
                  className="spec-copy-btn"
                  onClick={copyPrompt}
                  title="نسخ البرومبت"
                >
                  {copied ? '✅' : '📋'}
                </button>
              </div>

              <div className="spec-example-output-label">النتيجة المتوقعة:</div>
              <div className="spec-example-output">{example.expectedOutput}</div>

              {example.tips.length > 0 && (
                <div className="spec-example-tips">
                  <div className="spec-example-tips-label">💡 نصائح:</div>
                  <ul>
                    {example.tips.map((tip, i) => (
                      <li key={i}>{tip}</li>
                    ))}
                  </ul>
                </div>
              )}

              {example.modelSpecific && (
                <div className="spec-model-badge">
                  ⚠️ مرتبط بأدوات محددة — تحقق من التحديثات ({example.lastVerified})
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <style jsx>{`
        .spec-example-card {
          border-radius: 12px;
          background: rgba(255,255,255,0.03);
          border: 1px solid rgba(255,255,255,0.06);
          overflow: hidden;
        }
        .spec-example-header {
          width: 100%;
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 14px 16px;
          background: none;
          border: none;
          color: #e0e0e0;
          cursor: pointer;
          font-family: inherit;
          font-size: 0.95rem;
          text-align: right;
          transition: background 0.2s;
        }
        .spec-example-header:hover {
          background: rgba(255,255,255,0.04);
        }
        .spec-example-num {
          width: 28px;
          height: 28px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: rgba(255,107,53,0.15);
          color: #FF6B35;
          border-radius: 8px;
          font-size: 0.85rem;
          font-weight: 700;
          flex-shrink: 0;
        }
        .spec-example-title {
          flex: 1;
          font-weight: 600;
        }
        .spec-example-arrow {
          font-size: 0.7rem;
          transition: transform 0.25s;
          color: #888;
        }
        .spec-example-arrow.expanded {
          transform: rotate(180deg);
        }
        .spec-example-body {
          overflow: hidden;
        }
        .spec-example-content {
          padding: 0 16px 16px;
        }
        .spec-example-prompt-label,
        .spec-example-output-label {
          font-size: 0.8rem;
          color: #FF6B35;
          font-weight: 600;
          margin-bottom: 6px;
          margin-top: 12px;
        }
        .spec-example-prompt {
          position: relative;
          padding: 14px;
          padding-left: 40px;
          border-radius: 10px;
          background: rgba(0,0,0,0.3);
          border: 1px solid rgba(255,107,53,0.15);
          font-size: 0.9rem;
          color: #e0e0e0;
          line-height: 1.7;
          white-space: pre-wrap;
          direction: rtl;
        }
        .spec-copy-btn {
          position: absolute;
          left: 8px;
          top: 8px;
          background: rgba(255,255,255,0.08);
          border: none;
          border-radius: 6px;
          padding: 4px 8px;
          cursor: pointer;
          font-size: 0.85rem;
          transition: background 0.2s;
        }
        .spec-copy-btn:hover {
          background: rgba(255,255,255,0.15);
        }
        .spec-example-output {
          padding: 12px;
          border-radius: 10px;
          background: rgba(76,175,80,0.08);
          border: 1px solid rgba(76,175,80,0.15);
          font-size: 0.85rem;
          color: #b0b0b0;
          line-height: 1.6;
        }
        .spec-example-tips {
          margin-top: 12px;
        }
        .spec-example-tips-label {
          font-size: 0.85rem;
          font-weight: 600;
          color: #FFB800;
          margin-bottom: 6px;
        }
        .spec-example-tips ul {
          margin: 0;
          padding: 0 20px;
          list-style-type: '→ ';
        }
        .spec-example-tips li {
          font-size: 0.85rem;
          color: #999;
          line-height: 1.6;
          margin-bottom: 4px;
        }
        .spec-model-badge {
          margin-top: 10px;
          padding: 8px 12px;
          border-radius: 8px;
          background: rgba(255,183,0,0.08);
          border: 1px solid rgba(255,183,0,0.15);
          font-size: 0.8rem;
          color: #FFB800;
        }
      `}</style>
    </div>
  )
}

function ExerciseCard({ exercise }: { exercise: SpecExercise }) {
  const [copied, setCopied] = useState(false)

  const copyPrompt = async () => {
    try {
      await navigator.clipboard.writeText(exercise.prompt)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // Silent fail
    }
  }

  return (
    <motion.div
      initial={{ height: 0, opacity: 0 }}
      animate={{ height: 'auto', opacity: 1 }}
      exit={{ height: 0, opacity: 0 }}
      transition={{ duration: 0.25 }}
      className="spec-exercise-card"
    >
      <div className="spec-exercise-content">
        <h4 className="spec-exercise-title">{exercise.title}</h4>
        <p className="spec-exercise-desc">{exercise.description}</p>

        <div className="spec-exercise-prompt-label">البرومبت المقترح:</div>
        <div className="spec-exercise-prompt">
          {exercise.prompt}
          <button
            className="spec-copy-btn"
            onClick={copyPrompt}
            title="نسخ البرومبت"
          >
            {copied ? '✅' : '📋'}
          </button>
        </div>

        <div className="spec-exercise-criteria-label">معايير التقييم:</div>
        <ul className="spec-exercise-criteria">
          {exercise.evaluationCriteria.map((c, i) => (
            <li key={i}>{c}</li>
          ))}
        </ul>
      </div>

      <style jsx>{`
        .spec-exercise-card {
          overflow: hidden;
        }
        .spec-exercise-content {
          padding: 16px 18px;
          border-radius: 12px;
          margin-top: 10px;
          background: rgba(255,107,53,0.04);
          border: 1px solid rgba(255,107,53,0.12);
        }
        .spec-exercise-title {
          font-size: 1.05rem;
          color: #FF6B35;
          margin: 0 0 8px;
          font-weight: 700;
        }
        .spec-exercise-desc {
          font-size: 0.9rem;
          color: #b0b0b0;
          margin: 0 0 14px;
          line-height: 1.6;
        }
        .spec-exercise-prompt-label,
        .spec-exercise-criteria-label {
          font-size: 0.8rem;
          color: #FF6B35;
          font-weight: 600;
          margin-bottom: 6px;
        }
        .spec-exercise-prompt {
          position: relative;
          padding: 14px;
          padding-left: 40px;
          border-radius: 10px;
          background: rgba(0,0,0,0.3);
          border: 1px solid rgba(255,107,53,0.15);
          font-size: 0.9rem;
          color: #e0e0e0;
          line-height: 1.7;
          white-space: pre-wrap;
          direction: rtl;
          margin-bottom: 14px;
        }
        .spec-copy-btn {
          position: absolute;
          left: 8px;
          top: 8px;
          background: rgba(255,255,255,0.08);
          border: none;
          border-radius: 6px;
          padding: 4px 8px;
          cursor: pointer;
          font-size: 0.85rem;
          transition: background 0.2s;
        }
        .spec-copy-btn:hover {
          background: rgba(255,255,255,0.15);
        }
        .spec-exercise-criteria-label {
          margin-top: 4px;
        }
        .spec-exercise-criteria {
          margin: 0;
          padding: 0 20px;
          list-style-type: '✓ ';
        }
        .spec-exercise-criteria li {
          font-size: 0.85rem;
          color: #999;
          line-height: 1.6;
          margin-bottom: 4px;
        }
      `}</style>
    </motion.div>
  )
}
