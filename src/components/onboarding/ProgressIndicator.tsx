'use client'

import { motion } from 'framer-motion'

const labels = ['هدفك', 'مسارك', 'أول برومبت']

interface Props {
  currentStep: number // 0, 1, 2
}

export default function ProgressIndicator({ currentStep }: Props) {
  return (
    <div style={wrapper}>
      {labels.map((label, i) => {
        const done = i < currentStep
        const active = i === currentStep
        return (
          <div key={i} style={stepCol}>
            <motion.div
              animate={{
                background: done
                  ? '#FF6B35'
                  : active
                    ? 'rgba(255,107,53,0.25)'
                    : 'rgba(255,255,255,0.08)',
                borderColor: done || active ? '#FF6B35' : 'rgba(255,255,255,0.12)',
              }}
              style={{
                ...dot,
                border: '2px solid',
              }}
            >
              {done ? '✓' : i + 1}
            </motion.div>
            <span
              style={{
                fontSize: '0.72rem',
                fontWeight: active ? 700 : 500,
                color: active || done ? '#FF6B35' : 'rgba(255,255,255,0.35)',
                marginTop: 4,
              }}
            >
              {label}
            </span>
          </div>
        )
      })}
      {/* connector lines */}
      <div style={lineContainer}>
        {[0, 1].map((i) => (
          <div
            key={i}
            style={{
              ...line,
              background: i < currentStep ? '#FF6B35' : 'rgba(255,255,255,0.1)',
            }}
          />
        ))}
      </div>
    </div>
  )
}

const wrapper: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'center',
  gap: 48,
  position: 'relative',
  marginBottom: 40,
}

const stepCol: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  zIndex: 1,
}

const dot: React.CSSProperties = {
  width: 34,
  height: 34,
  borderRadius: '50%',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  fontSize: '0.82rem',
  fontWeight: 700,
  color: '#fff',
}

const lineContainer: React.CSSProperties = {
  position: 'absolute',
  top: 17,
  left: '50%',
  transform: 'translateX(-50%)',
  display: 'flex',
  gap: 48,
  width: 'calc(100% - 80px)',
  justifyContent: 'center',
  zIndex: 0,
}

const line: React.CSSProperties = {
  height: 2,
  flex: 1,
  borderRadius: 1,
  transition: 'background 0.3s ease',
}
