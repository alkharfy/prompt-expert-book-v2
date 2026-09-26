'use client'

interface ResourceFiltersProps {
  activeCategory: string
  activeSpecialization: string
  activeLevel: string
  searchQuery: string
  showSaved: boolean
  isLoggedIn: boolean
  onCategoryChange: (cat: string) => void
  onSpecializationChange: (spec: string) => void
  onLevelChange: (level: string) => void
  onSearchChange: (q: string) => void
  onSavedToggle: () => void
}

const CATEGORIES = [
  { id: 'all', label: 'الكل', icon: '📚' },
  { id: 'tool', label: 'أدوات AI', icon: '🔧' },
  { id: 'course', label: 'دورات', icon: '🎓' },
  { id: 'article', label: 'مقالات', icon: '📄' },
  { id: 'video', label: 'فيديوهات', icon: '🎬' },
  { id: 'template', label: 'قوالب', icon: '📋' },
  { id: 'book', label: 'كتب', icon: '📚' },
  { id: 'community', label: 'مجتمعات', icon: '👥' },
]

const SPECIALIZATIONS = [
  { id: 'all', label: 'كل التخصصات' },
  { id: 'general', label: 'عام' },
  { id: 'programming', label: 'برمجة' },
  { id: 'ecommerce', label: 'تجارة إلكترونية' },
  { id: 'design', label: 'تصميم' },
  { id: 'marketing', label: 'تسويق' },
]

const LEVELS = [
  { id: 'all', label: 'كل المستويات' },
  { id: 'beginner', label: 'مبتدئ' },
  { id: 'intermediate', label: 'متوسط' },
  { id: 'advanced', label: 'متقدم' },
]

export default function ResourceFilters({
  activeCategory,
  activeSpecialization,
  activeLevel,
  searchQuery,
  showSaved,
  isLoggedIn,
  onCategoryChange,
  onSpecializationChange,
  onLevelChange,
  onSearchChange,
  onSavedToggle,
}: ResourceFiltersProps) {
  return (
    <div className="filters-container">
      {/* بحث */}
      <div className="search-box">
        <span className="search-icon">🔍</span>
        <input
          type="text"
          placeholder="ابحث عن مصدر..."
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          className="search-input"
        />
      </div>

      {/* تصنيفات */}
      <div className="filter-row">
        {CATEGORIES.map((cat) => (
          <button
            key={cat.id}
            className={`filter-chip ${activeCategory === cat.id ? 'active' : ''}`}
            onClick={() => onCategoryChange(cat.id)}
          >
            {cat.icon} {cat.label}
          </button>
        ))}
      </div>

      {/* فلاتر إضافية */}
      <div className="filter-row secondary">
        <select
          value={activeSpecialization}
          onChange={(e) => onSpecializationChange(e.target.value)}
          className="filter-select"
        >
          {SPECIALIZATIONS.map((s) => (
            <option key={s.id} value={s.id}>{s.label}</option>
          ))}
        </select>

        <select
          value={activeLevel}
          onChange={(e) => onLevelChange(e.target.value)}
          className="filter-select"
        >
          {LEVELS.map((l) => (
            <option key={l.id} value={l.id}>{l.label}</option>
          ))}
        </select>

        {isLoggedIn && (
          <button
            className={`filter-chip saved-chip ${showSaved ? 'active' : ''}`}
            onClick={onSavedToggle}
          >
            {showSaved ? '💛 المحفوظات' : '🤍 المحفوظات'}
          </button>
        )}
      </div>

      <style jsx>{`
        .filters-container {
          display: flex;
          flex-direction: column;
          gap: 1rem;
          margin-bottom: 1.5rem;
        }
        .search-box {
          display: flex;
          align-items: center;
          background: rgba(255, 255, 255, 0.05);
          border: 1px solid rgba(255, 107, 53, 0.2);
          border-radius: 12px;
          padding: 0.5rem 1rem;
          gap: 0.5rem;
        }
        .search-icon {
          font-size: 1rem;
          opacity: 0.6;
        }
        .search-input {
          background: none;
          border: none;
          color: white;
          font-size: 0.95rem;
          width: 100%;
          outline: none;
          font-family: inherit;
        }
        .search-input::placeholder {
          color: rgba(255, 255, 255, 0.4);
        }
        .filter-row {
          display: flex;
          flex-wrap: wrap;
          gap: 0.5rem;
        }
        .filter-row.secondary {
          align-items: center;
        }
        .filter-chip {
          padding: 0.4rem 0.8rem;
          background: rgba(255, 255, 255, 0.05);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 20px;
          color: rgba(255, 255, 255, 0.7);
          cursor: pointer;
          font-size: 0.8rem;
          font-family: inherit;
          transition: all 0.2s;
          white-space: nowrap;
        }
        .filter-chip:hover {
          background: rgba(255, 107, 53, 0.1);
          border-color: rgba(255, 107, 53, 0.3);
        }
        .filter-chip.active {
          background: rgba(255, 107, 53, 0.2);
          border-color: #FF6B35;
          color: #FF6B35;
        }
        .filter-select {
          padding: 0.4rem 0.8rem;
          background: rgba(255, 255, 255, 0.05);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 10px;
          color: rgba(255, 255, 255, 0.8);
          font-size: 0.8rem;
          font-family: inherit;
          cursor: pointer;
          outline: none;
        }
        .filter-select option {
          background: #1a1a2e;
          color: white;
        }
        .saved-chip {
          margin-right: auto;
        }
        @media (max-width: 640px) {
          .filter-row {
            overflow-x: auto;
            flex-wrap: nowrap;
            padding-bottom: 0.5rem;
            -webkit-overflow-scrolling: touch;
          }
        }
      `}</style>
    </div>
  )
}
