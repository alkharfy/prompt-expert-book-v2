'use client'

import { motion } from 'framer-motion'
import type { LearningPathId, LearningDurationId } from '@/types/learning'

const paths: { id: LearningPathId; label: string; desc: string; icon: string }[] = [
  { id: 'quick', label: 'سريع', desc: 'المقدمة وأول فصلين', icon: '⚡' },
  { id: 'intermediate', label: 'متوسط', desc: 'تطبيقات عملية', icon: '📘' },
  { id: 'comprehensive', label: 'شامل', desc: 'الفصول العشرة والمراجع', icon: '🏆' },
]

const durations: { id: LearningDurationId; label: string }[] = [
  { id: '1week', label: 'أسبوع' },
  { id: '2weeks', label: 'أسبوعين' },
  { id: '1month', label: 'شهر' },
  { id: '2months', label: 'شهرين' },
  { id: 'flexible', label: 'مرن' },
]

interface Props {
  selectedPath: LearningPathId | null
  selectedDuration: LearningDurationId | null
  onPathChange: (p: LearningPathId) => void
  onDurationChange: (d: LearningDurationId) => void
  onNext: () => void
  onBack: () => void
}

export default function StepPathAndDuration({
  selectedPath,
  selectedDuration,
  onPathChange,
  onDurationChange,
  onNext,
  onBack,
}: Props) {
  const canProceed = selectedPath && selectedDuration

  return (
    <motion.div
      initial={{ opacity: 0, x: 40 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -40 }}
      transition={{ duration: 0.35 }}
    >
      {/* المسار */}
      <div style={{ marginBottom: 32 }}>
        <h2 style={sectionTitle}>اختر مسارك</h2>
        <div style={cardsRow}>
          {paths.map((p) => (
            <button
              key={p.id}
              onClick={() => onPathChange(p.id)}
              style={{
                ...cardBase,
                ...(selectedPath === p.id ? cardActive : cardInactive),
              }}
            >
              <span style={{ fontSize: 28 }}>{p.icon}</span>
              <span style={{ fontWeight: 700, fontSize: '1rem' }}>{p.label}</span>
              <span style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.5)' }}>
                {p.desc}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* المدة */}
      <div style={{ marginBottom: 40 }}>
        <h2 style={sectionTitle}>كم وقتك المتاح؟</h2>
        <div style={chipsGrid}>
          {durations.map((d) => (
            <button
              key={d.id}
              onClick={() => onDurationChange(d.id)}
              style={{
                ...chipBase,
                ...(selectedDuration === d.id ? chipActive : chipInactive),
              }}
            >
              {d.label}
            </button>
          ))}
        </div>
        <p style={{ color: 'rgba(255,255,255,0.65)', fontSize: '0.85rem', lineHeight: 1.7, marginTop: 12 }}>المدة تختار توزيع الصفحات على الأيام. المسار الشامل في أسبوع يحتاج عدة ساعات يوميًا مع التطبيق؛ اختر شهرًا أو شهرين إذا وقتك محدود. التمارين والمشروع يُضافان بحسب باقتك، وإتمام الجدول لا يثبت الإتقان.</p>
      </div>

      {/* أزرار */}
      <div style={btnRow}>
        <button onClick={onBack} style={btnBack}>
          → الرجوع
        </button>
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

/* ── Styles ── */

const sectionTitle: React.CSSProperties = {
  fontSize: 'clamp(1.1rem, 3vw, 1.4rem)',
  fontWeight: 700,
  color: '#ffffff',
  marginBottom: 16,
  textAlign: 'center',
}

const cardsRow: React.CSSProperties = {
  display: 'flex',
  gap: 12,
  justifyContent: 'center',
  flexWrap: 'wrap',
}

const cardBase: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  gap: 8,
  padding: '18px 22px',
  borderRadius: 16,
  cursor: 'pointer',
  transition: 'all 0.2s ease',
  border: '1.5px solid transparent',
  width: 130,
  fontFamily: 'inherit',
  background: 'transparent',
}

const cardActive: React.CSSProperties = {
  background: 'rgba(255,107,53,0.12)',
  borderColor: '#FF6B35',
  color: '#FF6B35',
  boxShadow: '0 0 24px rgba(255,107,53,0.18)',
}

const cardInactive: React.CSSProperties = {
  background: 'rgba(255,255,255,0.04)',
  borderColor: 'rgba(255,255,255,0.08)',
  color: 'rgba(255,255,255,0.7)',
}

const chipsGrid: React.CSSProperties = {
  display: 'flex',
  flexWrap: 'wrap',
  gap: 10,
  justifyContent: 'center',
}

const chipBase: React.CSSProperties = {
  padding: '10px 20px',
  borderRadius: 10,
  fontSize: '0.92rem',
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
}

const chipInactive: React.CSSProperties = {
  background: 'rgba(255,255,255,0.04)',
  borderColor: 'rgba(255,255,255,0.1)',
  color: 'rgba(255,255,255,0.7)',
}

const btnRow: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'center',
  gap: 16,
  flexWrap: 'wrap',
}

const btnBack: React.CSSProperties = {
  background: 'rgba(255,255,255,0.06)',
  color: 'rgba(255,255,255,0.6)',
  border: '1px solid rgba(255,255,255,0.1)',
  borderRadius: 14,
  padding: '14px 32px',
  fontSize: '0.95rem',
  fontWeight: 600,
  cursor: 'pointer',
  fontFamily: 'inherit',
}

const btnPrimary: React.CSSProperties = {
  background: 'linear-gradient(135deg, #FF6B35, #FF8C42)',
  color: '#fff',
  border: 'none',
  borderRadius: 14,
  padding: '16px 48px',
  fontSize: '1.05rem',
  fontWeight: 700,
  cursor: 'pointer',
  boxShadow: '0 4px 24px rgba(255,107,53,0.35)',
  fontFamily: 'inherit',
}
