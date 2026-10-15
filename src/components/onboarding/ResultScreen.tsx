'use client'

import Link from 'next/link'
import { motion } from 'framer-motion'
import { LEARNING_SECTIONS } from '@/config/learningCatalog'
import { getProfessionTry } from '@/data/professionTries'
import { estimatePlan, parseReadingPath, type StartDestination } from '@/lib/onboarding'
import type { AiLevelId, DailyMinutes, ProfessionId } from '@/types/learning'
import ProfessionCheck from './ProfessionCheck'
import { days, duration, pages } from './arabicCounts'

export interface PlanOutcome {
  created: boolean
  existing: boolean
  failed: boolean
}

interface Props {
  profession: ProfessionId | null
  level: AiLevelId | null
  minutes: DailyMinutes
  destination: StartDestination
  hasFullAccess: boolean
  saveState: 'saving' | 'saved' | 'error'
  plan: PlanOutcome | null
  replanState: 'idle' | 'working' | 'done' | 'error'
  onRetrySave: () => void
  onReplan: () => void
  onCheckAnswer: (caughtMistake: boolean) => void
  onStart: () => void
  onEdit: () => void
}

const LEVEL_NOTE: Record<AiLevelId, string> = {
  new: '⚡ الكروت اللي للمتمرسين هتلاقيها مقفولة، وتفتحها لما تحب.',
  some: '⚡ لو حبيت تتعمق، الكروت اللي عليها ⚡ معمولة لده.',
  daily: '⚡ الكروت اللي عليها ⚡ معمولة ليك.',
}

function startLabel(destination: StartDestination, level: AiLevelId | null): string {
  if (destination.source === 'level') {
    return level === 'daily'
      ? 'المقدمة صفحة 3، وبعدها الفصل الأول على طول'
      : 'المقدمة — «جرّب في دقيقة»'
  }
  const position = parseReadingPath(destination.href)
  const section = position && LEARNING_SECTIONS.find(item => item.id === position.sectionId)
  return section
    ? `المكان اللي وقفت عنده: ${section.label}، صفحة ${position!.page}`
    : 'الصفحة اللي كنت فيها'
}

export default function ResultScreen(props: Props) {
  const { profession, level, minutes, destination, hasFullAccess, saveState, plan, replanState } = props
  const estimate = estimatePlan(minutes, destination.planStart)
  const startsAtIntroOne = destination.planStart.sectionId === 'intro' && destination.planStart.page === 1

  return (
    <motion.section initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }} aria-labelledby="result-title">
      <h1 id="result-title" className="rs-title">خطتك جاهزة 👌</h1>
      {/* Space so the fixed start button never covers the last card. */}
      <style jsx global>{`body { padding-bottom: 130px; }`}</style>

      {saveState === 'error' && (
        <div className="rs-alert" role="alert">
          <span>مقدرناش نحفظ اختياراتك.</span>
          <button type="button" onClick={props.onRetrySave}>حاول تاني</button>
        </div>
      )}

      {profession && (
        <ProfessionCheck
          item={getProfessionTry(profession)}
          liveTryIsNext={startsAtIntroOne}
          onAnswer={props.onCheckAnswer}
        />
      )}

      <div className="rs-card">
        <h2 className="rs-card-title"><span aria-hidden="true">📍</span> هتبدأ من</h2>
        <p className="rs-strong">{startLabel(destination, level)}</p>
        {level && <p className="rs-muted">{LEVEL_NOTE[level]}</p>}
        {!startsAtIntroOne && (
          <Link href="/read/intro/1" className="rs-link">أو ابدأ من أول الكتاب</Link>
        )}
      </div>

      <div className="rs-card">
        <h2 className="rs-card-title"><span aria-hidden="true">⏱️</span> {minutes} دقيقة في اليوم = {pages(estimate.pagesPerDay)} قراية</h2>
        {hasFullAccess ? (
          <p className="rs-strong">الكتاب كله من مكانك هيخلص في {duration(estimate.fullDays)}.</p>
        ) : estimate.freePages > 0 ? (
          <p className="rs-strong">
            الجزء المجاني ({pages(estimate.freePages)}) هيخلص في {days(estimate.freeDays)}.
            {' '}ولو اشتركت، الكتاب كله في {duration(estimate.fullDays)}.
          </p>
        ) : (
          <p className="rs-strong">خلّصت الجزء المجاني 👏 والباقي محتاج اشتراك — وبنفس وقتك هيخلص في {duration(estimate.fullDays)}.</p>
        )}
        {saveState === 'saving' && <p className="rs-muted">بنجهّز خطتك يوم بيوم…</p>}
        {saveState === 'saved' && plan?.created && <Link href="/my-plan" className="rs-link">شوف خطتك يوم بيوم ←</Link>}
        {saveState === 'saved' && plan?.existing && (
          replanState === 'done'
            ? <Link href="/my-plan" className="rs-link">اتحدّثت ✓ شوف خطتك ←</Link>
            : (
              <p className="rs-muted">
                عندك خطة شغالة بالفعل.{' '}
                <button type="button" className="rs-inline-btn" onClick={props.onReplan} disabled={replanState === 'working'}>
                  {replanState === 'working' ? 'بنحدّثها…' : 'حدّثها بالوقت الجديد'}
                </button>
                {replanState === 'error' && ' — مقدرناش نحدّثها دلوقتي.'}
              </p>
            )
        )}
        {saveState === 'saved' && plan?.failed && (
          <p className="rs-muted">مقدرناش نعمل الخطة دلوقتي — تقدر تعملها من <Link href="/my-plan">صفحة خطتي</Link>.</p>
        )}
      </div>

      <div className="rs-footer">
        <button type="button" className="rs-start" onClick={props.onStart}>يلا نبدأ ←</button>
        <button type="button" className="rs-edit" onClick={props.onEdit}>عدّل اختياراتي</button>
      </div>

      <style jsx>{`
        .rs-title {
          font-size: clamp(1.5rem, 5vw, 1.9rem);
          font-weight: 800;
          text-align: center;
          margin: 0 0 16px;
          color: #fff;
        }
        .rs-alert {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 10px;
          padding: 10px 14px;
          margin-bottom: 12px;
          border-radius: 12px;
          background: rgba(239, 68, 68, 0.12);
          border: 1px solid rgba(239, 68, 68, 0.4);
          color: #fecaca;
        }
        .rs-alert button {
          min-height: 44px;
          padding: 0 14px;
          border-radius: 10px;
          border: none;
          background: #ef4444;
          color: #fff;
          font-family: inherit;
          font-weight: 700;
          cursor: pointer;
        }
        .rs-card {
          margin-top: 12px;
          padding: 14px 16px;
          border-radius: 16px;
          background: rgba(255, 255, 255, 0.04);
          border: 1px solid rgba(255, 255, 255, 0.1);
        }
        .rs-card-title {
          font-size: 1rem;
          font-weight: 800;
          color: #ffb800;
          margin: 0 0 6px;
        }
        .rs-strong {
          color: #fff;
          margin: 0 0 6px;
          line-height: 1.7;
        }
        .rs-muted {
          color: rgba(255, 255, 255, 0.65);
          font-size: 0.88rem;
          margin: 0;
          line-height: 1.7;
        }
        .rs-card :global(.rs-link),
        .rs-card :global(a) {
          display: inline-block;
          margin-top: 6px;
          color: #ff8c5a;
          font-size: 0.92rem;
          font-weight: 700;
        }
        .rs-inline-btn {
          background: none;
          border: none;
          padding: 0;
          color: #ff8c5a;
          font-family: inherit;
          font-size: inherit;
          font-weight: 700;
          text-decoration: underline;
          cursor: pointer;
        }
        /* Fixed, not sticky: an overflow-x ancestor disables sticky. */
        .rs-footer {
          position: fixed;
          left: 0;
          right: 0;
          bottom: 0;
          z-index: 40;
          padding: 14px 16px calc(10px + env(safe-area-inset-bottom));
          background: linear-gradient(180deg, rgba(10, 10, 10, 0) 0%, rgba(10, 10, 10, 0.96) 28%);
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 6px;
        }
        .rs-start {
          width: 100%;
          max-width: 420px;
          min-height: 54px;
          border: none;
          border-radius: 14px;
          background: linear-gradient(135deg, #ff6b35, #ff8c5a);
          color: #fff;
          font-family: inherit;
          font-size: 1.1rem;
          font-weight: 800;
          cursor: pointer;
          box-shadow: 0 6px 20px rgba(255, 107, 53, 0.35);
        }
        .rs-edit {
          min-height: 44px;
          background: none;
          border: none;
          color: rgba(255, 255, 255, 0.6);
          font-family: inherit;
          font-size: 0.9rem;
          cursor: pointer;
        }
      `}</style>
    </motion.section>
  )
}
