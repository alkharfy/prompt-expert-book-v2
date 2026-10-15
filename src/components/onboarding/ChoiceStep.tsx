'use client'

import { motion } from 'framer-motion'

export interface ChoiceOption<T extends string | number> {
  id: T
  icon: string
  label: string
  /** Second line: what this choice means for the reader. */
  hint?: string
}

interface Props<T extends string | number> {
  title: string
  helper: string
  options: readonly ChoiceOption<T>[]
  selected: T | null
  columns: 1 | 2
  onSelect: (id: T) => void
}

/** One question per screen; tapping an option answers it (the parent advances). */
export default function ChoiceStep<T extends string | number>({ title, helper, options, selected, columns, onSelect }: Props<T>) {
  return (
    <motion.section
      initial={{ opacity: 0, x: -24 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 24 }}
      transition={{ duration: 0.25 }}
      aria-labelledby="onboarding-question"
    >
      <h1 id="onboarding-question" className="ob-title">{title}</h1>
      <p className="ob-helper">{helper}</p>
      <div className={`ob-options ob-cols-${columns}`} role="radiogroup" aria-labelledby="onboarding-question">
        {options.map(option => (
          <button
            key={String(option.id)}
            type="button"
            role="radio"
            aria-checked={selected === option.id}
            className={`ob-option ${selected === option.id ? 'is-selected' : ''}`}
            onClick={() => onSelect(option.id)}
          >
            <span className="ob-option-icon" aria-hidden="true">{option.icon}</span>
            <span className="ob-option-text">
              <span className="ob-option-label">{option.label}</span>
              {option.hint && <span className="ob-option-hint">{option.hint}</span>}
            </span>
          </button>
        ))}
      </div>
      <style jsx>{`
        .ob-title {
          font-size: clamp(1.45rem, 5vw, 1.9rem);
          font-weight: 800;
          color: #fff;
          margin: 0 0 6px;
          text-align: center;
        }
        .ob-helper {
          color: rgba(255, 255, 255, 0.6);
          font-size: 0.95rem;
          margin: 0 0 22px;
          text-align: center;
        }
        .ob-options {
          display: grid;
          gap: 10px;
        }
        .ob-cols-2 {
          grid-template-columns: repeat(2, minmax(0, 1fr));
        }
        .ob-cols-1 {
          grid-template-columns: 1fr;
        }
        .ob-option {
          display: flex;
          align-items: center;
          gap: 10px;
          min-height: 58px;
          padding: 12px 14px;
          border-radius: 14px;
          border: 1px solid rgba(255, 255, 255, 0.12);
          background: rgba(255, 255, 255, 0.04);
          color: #fff;
          font-family: inherit;
          font-size: 0.98rem;
          text-align: right;
          cursor: pointer;
          transition: border-color 0.15s, background 0.15s;
        }
        .ob-option:focus-visible {
          border-color: rgba(255, 107, 53, 0.6);
          outline: none;
        }
        /* Touch screens keep :hover after a tap, which would make the next
           screen's option look pre-selected — hover only with a real pointer. */
        @media (hover: hover) {
          .ob-option:hover {
            border-color: rgba(255, 107, 53, 0.6);
          }
        }
        .ob-option.is-selected {
          border-color: #ff6b35;
          background: rgba(255, 107, 53, 0.14);
        }
        .ob-option-icon {
          font-size: 1.4rem;
          flex-shrink: 0;
        }
        .ob-option-text {
          display: flex;
          flex-direction: column;
          gap: 2px;
          min-width: 0;
        }
        .ob-option-label {
          font-weight: 700;
          line-height: 1.35;
        }
        .ob-option-hint {
          color: rgba(255, 255, 255, 0.6);
          font-size: 0.85rem;
          line-height: 1.4;
        }
      `}</style>
    </motion.section>
  )
}
