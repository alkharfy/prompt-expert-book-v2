'use client'

import { useState, useEffect } from 'react'

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
  const [updates, setUpdates] = useState<ChangelogEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState(false)

  useEffect(() => {
    let cancelled = false
    const fetchUpdates = async () => {
      try {
        const res = await fetch('/api/ai-updates')
        if (!res.ok) throw new Error('Could not load AI news')
        const data = await res.json()
        if (!cancelled) setUpdates(data.updates || [])
      } catch { if (!cancelled) setLoadError(true) }
      if (!cancelled) setLoading(false)
    }
    fetchUpdates()
    return () => { cancelled = true }
  }, [])

  return (
    <div className="updates-page">
      <div className="updates-header">
        <h1>🔮 أخبار AI</h1>
        <p>أخبار ومصادر متاحة مجانًا للجميع؛ راجع تاريخ نشر كل خبر ومصدره.</p>
      </div>

      {loading ? (
        <div className="loading">
          <div className="spinner"></div>
          <p>جاري تحميل أخبار AI...</p>
        </div>
      ) : loadError ? (
        <p role="alert">تعذّر تحميل أخبار AI. أعد تحميل الصفحة للمحاولة مجددًا.</p>
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
