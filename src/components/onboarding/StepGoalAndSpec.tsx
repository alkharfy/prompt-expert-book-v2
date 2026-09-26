'use client'

import { motion } from 'framer-motion'
import type { LearningGoalId, SpecializationId } from '@/types/learning'

const goals: { id: LearningGoalId; label: string; icon: string }[] = [
  { id: 'professional', label: 'تطوير مهني', icon: '💼' },
  { id: 'entrepreneurship', label: 'مشروعي الخاص', icon: '🚀' },
  { id: 'career-change', label: 'تغيير مسار', icon: '🔄' },
  { id: 'curiosity', label: 'فضول ومعرفة', icon: '💡' },
]

const specs: { id: SpecializationId; label: string; icon: string }[] = [
  { id: 'programming', label: 'برمجة', icon: '💻' },
  { id: 'ecommerce', label: 'تجارة إلكترونية', icon: '🛒' },
  { id: 'design', label: 'تصميم', icon: '🎨' },
  { id: 'marketing', label: 'تسويق', icon: '📢' },
  { id: 'general', label: 'عام', icon: '🌐' },
]

interface Props {
  selectedGoal: LearningGoalId | null
  selectedSpec: SpecializationId | null
  onGoalChange: (g: LearningGoalId) => void
  onSpecChange: (s: SpecializationId) => void
  onNext: () => void
}

export default function StepGoalAndSpec({
  selectedGoal,
  selectedSpec,
  onGoalChange,
  onSpecChange,
  onNext,
}: Props) {
  const canProceed = selectedGoal && selectedSpec

  return (
    <motion.div
      initial={{ opacity: 0, x: 40 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -40 }}
      transition={{ duration: 0.35 }}
    >
      {/* الهدف */}
      <div style={{ marginBottom: 36 }}>
        <h2 style={sectionTitle}>ما هدفك من التعلم؟</h2>
        <div style={chipsGrid}>
          {goals.map((g) => (
            <button
              key={g.id}
              onClick={() => onGoalChange(g.id)}
              style={{
                ...chipBase,
                ...(selectedGoal === g.id ? chipActive : chipInactive),
              }}
            >
              <span style={{ fontSize: 20 }}>{g.icon}</span>
              {g.label}
            </button>
          ))}
        </div>
      </div>

      {/* التخصص */}
      <div style={{ marginBottom: 40 }}>
        <h2 style={sectionTitle}>في أي مجال مهتم؟</h2>
        <div style={chipsGrid}>
          {specs.map((s) => (
            <button
              key={s.id}
              onClick={() => onSpecChange(s.id)}
              style={{
                ...chipBase,
                ...(selectedSpec === s.id ? chipActive : chipInactive),
              }}
            >
              <span style={{ fontSize: 20 }}>{s.icon}</span>
              {s.label}
            </button>
          ))}
        </div>
      </div>

      {/* زر التالي */}
      <div style={{ display: 'flex', justifyContent: 'center' }}>
        <motion.button
          whileHover={canProceed ? { scale: 1.04 } : {}}
          whileTap={canProceed ? { scale: 0.96 } : {}}
          onClick={canProceed ? onNext : undefined}
          style={{
            ...btnPrimary,
            opacity: canProceed ? 1 : 0.4,
            cursor: canProceed ? 'pointer' : 'not-allowed',
          }}
        >
          التالي ←
        </motion.button>
      </div>
    </motion.div>
  )
}

/* ── Shared Styles ── */

const sectionTitle: React.CSSProperties = {
  fontSize: 'clamp(1.1rem, 3vw, 1.4rem)',
  fontWeight: 700,
  color: '#ffffff',
  marginBottom: 16,
  textAlign: 'center',
}

const chipsGrid: React.CSSProperties = {
  display: 'flex',
  flexWrap: 'wrap',
  gap: 10,
  justifyContent: 'center',
}

const chipBase: React.CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: 8,
  padding: '12px 22px',
  borderRadius: 12,
  fontSize: '0.95rem',
  fontWeight: 600,
  cursor: 'pointer',
  transition: 'all 0.2s ease',
  border: '1.5px solid transparent',
  fontFamily: 'inherit',
}

const chipActive: React.CSSProperties = {
  background: 'rgba(255,107,53,0.15)',
  borderColor: '#FF6B35',
  color: '#FF6B35',
  boxShadow: '0 0 16px rgba(255,107,53,0.2)',
}

const chipInactive: React.CSSProperties = {
  background: 'rgba(255,255,255,0.04)',
  borderColor: 'rgba(255,255,255,0.1)',
  color: 'rgba(255,255,255,0.7)',
}

const btnPrimary: React.CSSProperties = {
  background: 'linear-gradient(135deg, #FF6B35, #FF8C42)',
  color: '#fff',
  border: 'none',
  borderRadius: 14,
  padding: '16px 56px',
  fontSize: '1.05rem',
  fontWeight: 700,
  cursor: 'pointer',
  boxShadow: '0 4px 24px rgba(255,107,53,0.35)',
  fontFamily: 'inherit',
}
