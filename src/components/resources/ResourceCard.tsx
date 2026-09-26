'use client'

interface Resource {
  id: string
  title_ar: string
  title_en?: string
  description_ar: string
  url: string
  category: string
  specialization: string[]
  level: string
  is_free: boolean
  language: string
  freshness_status: string
  is_saved?: boolean
  is_model_specific?: boolean
  ai_model_version?: string
}

interface ResourceCardProps {
  resource: Resource
  onSave: (id: string, saved: boolean) => void
  isLoggedIn: boolean
}

const CATEGORY_ICONS: Record<string, string> = {
  tool: '🔧',
  course: '🎓',
  article: '📄',
  video: '🎬',
  template: '📋',
  book: '📚',
  community: '👥',
}

const CATEGORY_NAMES: Record<string, string> = {
  tool: 'أداة',
  course: 'دورة',
  article: 'مقال',
  video: 'فيديو',
  template: 'قالب',
  book: 'كتاب',
  community: 'مجتمع',
}

const LEVEL_NAMES: Record<string, string> = {
  beginner: 'مبتدئ',
  intermediate: 'متوسط',
  advanced: 'متقدم',
}

const LEVEL_COLORS: Record<string, string> = {
  beginner: '#4CAF50',
  intermediate: '#FF9800',
  advanced: '#F44336',
}

const FRESHNESS_BADGES: Record<string, { label: string; color: string }> = {
  fresh: { label: '🟢 حديث', color: '#4CAF50' },
  aging: { label: '🟡 قد يحتاج تحديث', color: '#FF9800' },
  outdated: { label: '🔴 قديم', color: '#F44336' },
  evergreen: { label: '🌿 دائم', color: '#2196F3' },
}

export default function ResourceCard({ resource, onSave, isLoggedIn }: ResourceCardProps) {
  const freshness = FRESHNESS_BADGES[resource.freshness_status] || FRESHNESS_BADGES.fresh

  return (
    <div className="resource-card">
      <div className="resource-header">
        <span className="resource-category">
          {CATEGORY_ICONS[resource.category]} {CATEGORY_NAMES[resource.category]}
        </span>
        <div className="resource-badges">
          <span className="resource-level" style={{ color: LEVEL_COLORS[resource.level] }}>
            {LEVEL_NAMES[resource.level]}
          </span>
          {resource.is_free ? (
            <span className="resource-free">مجاني</span>
          ) : (
            <span className="resource-paid">مدفوع</span>
          )}
        </div>
      </div>

      <h3 className="resource-title">{resource.title_ar}</h3>
      <p className="resource-description">{resource.description_ar}</p>

      {resource.is_model_specific && resource.ai_model_version && (
        <div className="resource-model">🤖 {resource.ai_model_version}</div>
      )}

      <div className="resource-meta">
        <span className="resource-freshness" style={{ color: freshness.color }}>
          {freshness.label}
        </span>
        <span className="resource-lang">
          {resource.language === 'ar' ? '🇸🇦 عربي' : resource.language === 'en' ? '🇺🇸 إنجليزي' : '🌍 عربي + إنجليزي'}
        </span>
      </div>

      <div className="resource-actions">
        <a href={resource.url} target="_blank" rel="noopener noreferrer" className="resource-visit">
          زيارة ↗
        </a>
        {isLoggedIn && (
          <button
            className={`resource-save ${resource.is_saved ? 'saved' : ''}`}
            onClick={() => onSave(resource.id, !resource.is_saved)}
          >
            {resource.is_saved ? '💛 محفوظ' : '🤍 حفظ'}
          </button>
        )}
      </div>

      <style jsx>{`
        .resource-card {
          background: rgba(255, 255, 255, 0.03);
          border: 1px solid rgba(255, 107, 53, 0.15);
          border-radius: 16px;
          padding: 1.25rem;
          transition: all 0.3s ease;
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
        }
        .resource-card:hover {
          border-color: rgba(255, 107, 53, 0.4);
          transform: translateY(-2px);
          box-shadow: 0 8px 25px rgba(255, 107, 53, 0.1);
        }
        .resource-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }
        .resource-category {
          font-size: 0.8rem;
          opacity: 0.8;
        }
        .resource-badges {
          display: flex;
          gap: 0.5rem;
          align-items: center;
        }
        .resource-level {
          font-size: 0.75rem;
          font-weight: 600;
        }
        .resource-free {
          font-size: 0.7rem;
          background: rgba(76, 175, 80, 0.15);
          color: #4CAF50;
          padding: 2px 8px;
          border-radius: 12px;
        }
        .resource-paid {
          font-size: 0.7rem;
          background: rgba(255, 152, 0, 0.15);
          color: #FF9800;
          padding: 2px 8px;
          border-radius: 12px;
        }
        .resource-title {
          font-size: 1.05rem;
          color: #fff;
          margin: 0;
          font-weight: 700;
        }
        .resource-description {
          font-size: 0.85rem;
          color: rgba(255, 255, 255, 0.7);
          margin: 0;
          line-height: 1.6;
        }
        .resource-model {
          font-size: 0.75rem;
          color: rgba(255, 107, 53, 0.8);
          background: rgba(255, 107, 53, 0.08);
          padding: 4px 10px;
          border-radius: 8px;
          display: inline-block;
          width: fit-content;
        }
        .resource-meta {
          display: flex;
          justify-content: space-between;
          align-items: center;
          font-size: 0.75rem;
        }
        .resource-freshness {
          font-size: 0.7rem;
        }
        .resource-lang {
          font-size: 0.7rem;
          opacity: 0.6;
        }
        .resource-actions {
          display: flex;
          gap: 0.5rem;
          margin-top: 0.25rem;
        }
        .resource-visit {
          flex: 1;
          text-align: center;
          padding: 0.5rem;
          background: linear-gradient(135deg, #FF6B35, #e55a2b);
          color: white;
          border-radius: 10px;
          text-decoration: none;
          font-size: 0.85rem;
          font-weight: 600;
          transition: all 0.2s;
        }
        .resource-visit:hover {
          filter: brightness(1.1);
        }
        .resource-save {
          padding: 0.5rem 1rem;
          background: rgba(255, 255, 255, 0.05);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 10px;
          color: white;
          cursor: pointer;
          font-size: 0.85rem;
          transition: all 0.2s;
        }
        .resource-save:hover {
          background: rgba(255, 255, 255, 0.1);
        }
        .resource-save.saved {
          background: rgba(255, 215, 0, 0.1);
          border-color: rgba(255, 215, 0, 0.3);
        }
      `}</style>
    </div>
  )
}
