'use client'

import { useState } from 'react'
import { asRolePhrase, type ProfessionTry } from '@/data/professionTries'

interface Props {
  item: ProfessionTry
  /** Whether the next page is intro p1, where the same request is tried live. */
  liveTryIsNext: boolean
  onAnswer: (caughtMistake: boolean) => void
}

/**
 * «أول تجربة من شغلك»: a pre-written practice reply with ONE planted mistake —
 * no live AI call. Labelled as written for practice; the reveal says so plainly.
 */
export default function ProfessionCheck({ item, liveTryIsNext, onAnswer }: Props) {
  const [answer, setAnswer] = useState<'right' | 'wrong' | null>(null)
  const heading = item.id === 'other' ? 'أول تجربة — مثال من الحياة اليومية' : `أول تجربة — من شغلك ${asRolePhrase(item)}`

  const choose = (value: 'right' | 'wrong') => {
    if (answer) return
    setAnswer(value)
    onAnswer(value === 'wrong')
  }

  return (
    <section className="pc-card" aria-labelledby="pc-heading">
      <h2 id="pc-heading" className="pc-heading"><span aria-hidden="true">💼</span> {heading}</h2>
      <p className="pc-label">طلب واضح للـ AI:</p>
      <pre className="pc-request">{item.request}</pre>
      <p className="pc-label">ورد مكتوب للتدريب:</p>
      <blockquote className="pc-claim">{item.claim}</blockquote>
      <p className="pc-question">الرد ده صح ولا غلط؟</p>
      <div className="pc-choices">
        <button type="button" className={`pc-choice ${answer === 'right' ? 'is-picked' : ''}`} disabled={!!answer} onClick={() => choose('right')}>
          ✅ صح
        </button>
        <button type="button" className={`pc-choice ${answer === 'wrong' ? 'is-picked' : ''}`} disabled={!!answer} onClick={() => choose('wrong')}>
          ❌ غلط
        </button>
      </div>
      {answer && (
        <div className="pc-feedback" role="status">
          <p className="pc-verdict">{answer === 'wrong' ? '👏 مسكتها!' : '👀 بص تاني — فيه غلطة:'}</p>
          <p>{item.feedback}</p>
          <p className="pc-note">
            الغلطة دي احنا حاطينها قصد عشان تتمرن، بس الـ AI ممكن يغلط كده فعلاً وهو واثق. عشان كده أهم خطوة في الكتاب: راجع.
            {liveTryIsNext ? ' في الصفحة الجاية هتجرّب نفس الطلب بنفسك.' : ''}
          </p>
        </div>
      )}
      <style jsx>{`
        .pc-card {
          background: rgba(255, 107, 53, 0.06);
          border: 1px solid rgba(255, 107, 53, 0.25);
          border-radius: 16px;
          padding: 16px;
        }
        .pc-heading {
          font-size: 1.05rem;
          font-weight: 800;
          color: #ffb800;
          margin: 0 0 10px;
        }
        .pc-label {
          color: rgba(255, 255, 255, 0.6);
          font-size: 0.85rem;
          margin: 10px 0 4px;
        }
        .pc-request {
          margin: 0;
          padding: 10px 12px;
          border-radius: 10px;
          background: rgba(0, 0, 0, 0.35);
          color: #f3f3f3;
          font-family: inherit;
          font-size: 0.88rem;
          line-height: 1.7;
          white-space: pre-wrap;
          unicode-bidi: plaintext;
          text-align: start;
        }
        .pc-claim {
          margin: 0;
          padding: 10px 12px;
          border-right: 3px solid #ff6b35;
          background: rgba(255, 255, 255, 0.04);
          border-radius: 8px;
          color: #fff;
          font-size: 0.95rem;
          line-height: 1.6;
        }
        .pc-question {
          font-weight: 700;
          color: #fff;
          margin: 14px 0 8px;
        }
        .pc-choices {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 10px;
        }
        .pc-choice {
          min-height: 52px;
          border-radius: 12px;
          border: 1px solid rgba(255, 255, 255, 0.18);
          background: rgba(255, 255, 255, 0.05);
          color: #fff;
          font-family: inherit;
          font-size: 1rem;
          font-weight: 700;
          cursor: pointer;
        }
        .pc-choice:disabled {
          cursor: default;
          opacity: 0.6;
        }
        .pc-choice.is-picked {
          opacity: 1;
          border-color: #ff6b35;
          background: rgba(255, 107, 53, 0.16);
        }
        .pc-feedback {
          margin-top: 12px;
          padding: 12px;
          border-radius: 12px;
          background: rgba(39, 201, 63, 0.08);
          border: 1px solid rgba(39, 201, 63, 0.3);
          color: #e8e8e8;
          font-size: 0.92rem;
          line-height: 1.7;
        }
        .pc-feedback p {
          margin: 0 0 6px;
        }
        .pc-verdict {
          font-weight: 800;
          color: #fff;
        }
        .pc-note {
          color: rgba(255, 255, 255, 0.7);
          font-size: 0.85rem;
        }
      `}</style>
    </section>
  )
}
