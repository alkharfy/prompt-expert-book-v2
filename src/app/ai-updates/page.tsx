'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'

interface ChangelogEntry {
  id: string
  title_ar: string
  content_ar: string
  category: string
  importance: string
  source_url?: string
  published_at: string
}

const CATEGORY_ICONS: Record<string, string> = {
  update: '🔄',
  new_model: '🧠',
  new_tool: '🔧',
  tip: '💡',
  breaking: '🚨',
}

const CATEGORY_LABELS: Record<string, string> = {
  update: 'تحديث',
  new_model: 'نموذج جديد',
  new_tool: 'أداة جديدة',
  tip: 'نصيحة',
  breaking: 'تغيير مهم',
}

const IMPORTANCE_COLORS: Record<string, string> = {
  low: 'rgba(255,255,255,0.3)',
  normal: 'rgba(255,255,255,0.6)',
  high: '#FF6B35',
  critical: '#F44336',
}

export default function AiUpdatesPage() {
  const router = useRouter()
  const [updates, setUpdates] = useState<ChangelogEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [isVip, setIsVip] = useState(false)
  const [checking, setChecking] = useState(true)

  useEffect(() => {
    const checkAccess = async () => {
      try {
        const res = await fetch('/api/subscription/status')
        const data = await res.json()
        if (data.plan_id === 'vip') {
          setIsVip(true)
          // Fetch updates
          const updatesRes = await fetch('/api/ai-updates')
          const updatesData = await updatesRes.json()
          setUpdates(updatesData.updates || [])
        }
      } catch { /* ignore */ }
      setChecking(false)
      setLoading(false)
    }
    checkAccess()
  }, [])

  if (checking) {
    return (
      <div className="updates-page">
        <div className="loading">
          <div className="spinner"></div>
          <p>جاري التحقق من صلاحيتك...</p>
        </div>
        <style jsx>{`
          .updates-page { max-width: 800px; margin: 0 auto; padding: 3rem 1rem; text-align: center; direction: rtl; }
          .spinner { width: 40px; height: 40px; border: 3px solid rgba(255,107,53,0.2); border-top-color: #FF6B35; border-radius: 50%; animation: spin 0.8s linear infinite; margin: 0 auto 1rem; }
          @keyframes spin { to { transform: rotate(360deg); } }
          .loading p { color: rgba(255,255,255,0.5); }
        `}</style>
      </div>
    )
  }

  if (!isVip) {
    return (
      <div className="updates-page">
        <div className="locked-state">
          <div className="locked-icon">🔒</div>
          <h2>تحديثات AI الأسبوعية</h2>
          <p>هذه الميزة حصرية لمشتركي الباقة المميزة (VIP)</p>
          <p className="locked-desc">احصل على تحديثات أسبوعية عن أحدث أدوات ونماذج الذكاء الاصطناعي</p>
          <button className="upgrade-btn" onClick={() => router.push('/payment?feature=vip')}>
            ⭐ ترقية إلى VIP
          </button>
        </div>
        <style jsx>{`
          .updates-page { max-width: 800px; margin: 0 auto; padding: 3rem 1rem; direction: rtl; }
          .locked-state { text-align: center; padding: 3rem 0; }
          .locked-icon { font-size: 4rem; margin-bottom: 1rem; }
          .locked-state h2 { font-size: 1.5rem; color: #FF6B35; margin-bottom: 0.75rem; }
          .locked-state p { color: rgba(255,255,255,0.6); margin-bottom: 0.5rem; }
          .locked-desc { font-size: 0.9rem; opacity: 0.5; margin-bottom: 1.5rem !important; }
          .upgrade-btn { padding: 0.75rem 2rem; background: linear-gradient(135deg, #FFD700, #FF6B35); color: #000; border: none; border-radius: 12px; font-size: 1rem; font-weight: 700; font-family: inherit; cursor: pointer; transition: all 0.2s; }
          .upgrade-btn:hover { transform: translateY(-2px); filter: brightness(1.1); }
        `}</style>
      </div>
    )
  }

  return (
    <div className="updates-page">
      <div className="updates-header">
        <h1>🔮 تحديثات AI الأسبوعية</h1>
        <p>آخر الأخبار والتطورات في عالم الذكاء الاصطناعي</p>
        <span className="vip-badge">⭐ VIP حصري</span>
      </div>

      {loading ? (
        <div className="loading">
          <div className="spinner"></div>
        </div>
      ) : updates.length === 0 ? (
        <div className="empty">
          <p>لا توجد تحديثات حالياً</p>
        </div>
      ) : (
        <div className="updates-timeline">
          {updates.map((entry) => (
            <div key={entry.id} className="update-card" style={{ borderRightColor: IMPORTANCE_COLORS[entry.importance] }}>
              <div className="update-header">
                <span className="update-category">
                  {CATEGORY_ICONS[entry.category]} {CATEGORY_LABELS[entry.category]}
                </span>
                <span className="update-date">
                  {new Date(entry.published_at).toLocaleDateString('ar-EG', { day: 'numeric', month: 'long', year: 'numeric' })}
                </span>
              </div>
              <h3 className="update-title">{entry.title_ar}</h3>
              <p className="update-content">{entry.content_ar}</p>
              {entry.source_url && (
                <a href={entry.source_url} target="_blank" rel="noopener noreferrer" className="update-source">
                  🔗 المصدر
                </a>
              )}
            </div>
          ))}
        </div>
      )}

      <style jsx>{`
        .updates-page {
          max-width: 800px;
          margin: 0 auto;
          padding: 2rem 1rem;
          min-height: 100vh;
          direction: rtl;
        }
        .updates-header {
          text-align: center;
          margin-bottom: 2.5rem;
        }
        .updates-header h1 {
          font-size: 2rem;
          background: linear-gradient(135deg, #FFD700, #FF6B35);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          margin-bottom: 0.5rem;
        }
        .updates-header p {
          color: rgba(255, 255, 255, 0.6);
        }
        .vip-badge {
          display: inline-block;
          margin-top: 0.75rem;
          padding: 0.3rem 1rem;
          background: linear-gradient(135deg, rgba(255, 215, 0, 0.15), rgba(255, 107, 53, 0.15));
          border: 1px solid rgba(255, 215, 0, 0.3);
          border-radius: 20px;
          color: #FFD700;
          font-size: 0.8rem;
          font-weight: 600;
        }
        .loading {
          text-align: center;
          padding: 3rem 0;
        }
        .spinner {
          width: 40px;
          height: 40px;
          border: 3px solid rgba(255, 107, 53, 0.2);
          border-top-color: #FF6B35;
          border-radius: 50%;
          animation: spin 0.8s linear infinite;
          margin: 0 auto;
        }
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
        .empty {
          text-align: center;
          padding: 3rem 0;
          color: rgba(255, 255, 255, 0.5);
        }
        .updates-timeline {
          display: flex;
          flex-direction: column;
          gap: 1rem;
        }
        .update-card {
          background: rgba(255, 255, 255, 0.03);
          border: 1px solid rgba(255, 255, 255, 0.08);
          border-right: 4px solid #FF6B35;
          border-radius: 12px;
          padding: 1.25rem;
          transition: all 0.2s;
        }
        .update-card:hover {
          background: rgba(255, 255, 255, 0.05);
          transform: translateX(-4px);
        }
        .update-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 0.75rem;
        }
        .update-category {
          font-size: 0.8rem;
          color: #FF6B35;
          font-weight: 600;
        }
        .update-date {
          font-size: 0.75rem;
          color: rgba(255, 255, 255, 0.4);
        }
        .update-title {
          font-size: 1.1rem;
          color: #fff;
          margin: 0 0 0.5rem;
          font-weight: 700;
        }
        .update-content {
          font-size: 0.9rem;
          color: rgba(255, 255, 255, 0.7);
          line-height: 1.7;
          margin: 0;
        }
        .update-source {
          display: inline-block;
          margin-top: 0.75rem;
          font-size: 0.8rem;
          color: #FF6B35;
          text-decoration: none;
        }
        .update-source:hover {
          text-decoration: underline;
        }
        @media (max-width: 640px) {
          .updates-page {
            padding: 1rem 0.75rem;
          }
          .updates-header h1 {
            font-size: 1.5rem;
          }
        }
      `}</style>
    </div>
  )
}
