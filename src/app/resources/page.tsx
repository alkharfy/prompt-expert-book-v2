'use client'

import { useState, useEffect, useCallback } from 'react'
import ResourceCard from '@/components/resources/ResourceCard'
import ResourceFilters from '@/components/resources/ResourceFilters'

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

export default function ResourcesPage() {
  const [resources, setResources] = useState<Resource[]>([])
  const [loading, setLoading] = useState(true)
  const [seeding, setSeeding] = useState(false)
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [category, setCategory] = useState('all')
  const [specialization, setSpecialization] = useState('all')
  const [level, setLevel] = useState('all')
  const [search, setSearch] = useState('')
  const [showSaved, setShowSaved] = useState(false)

  const fetchResources = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (category !== 'all') params.set('category', category)
      if (specialization !== 'all') params.set('specialization', specialization)
      if (level !== 'all') params.set('level', level)
      if (search) params.set('search', search)
      if (showSaved) params.set('saved', 'true')

      const res = await fetch(`/api/resources?${params}`)
      const data = await res.json()
      setResources(data.resources || [])
    } catch {
      setResources([])
    } finally {
      setLoading(false)
    }
  }, [category, specialization, level, search, showSaved])

  useEffect(() => {
    // Check auth
    const getCookie = (name: string) => {
      const match = document.cookie.match(new RegExp('(^| )' + name + '=([^;]+)'))
      return match ? match[2] : null
    }
    setIsLoggedIn(!!getCookie('ebook_user_id'))
    fetchResources()
  }, [fetchResources])

  const handleSave = async (resourceId: string, save: boolean) => {
    try {
      const method = save ? 'POST' : 'DELETE'
      await fetch(`/api/resources/${resourceId}/save`, { method })
      setResources(prev =>
        prev.map(r => r.id === resourceId ? { ...r, is_saved: save } : r)
      )
    } catch { /* ignore */ }
  }

  const handleSeed = async () => {
    setSeeding(true)
    try {
      const res = await fetch('/api/resources', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'seed' }),
      })
      const data = await res.json()
      if (data.seeded) {
        await fetchResources()
      }
    } catch { /* ignore */ }
    setSeeding(false)
  }

  // Debounce search
  const [searchTimeout, setSearchTimeout] = useState<NodeJS.Timeout | null>(null)
  const handleSearchChange = (q: string) => {
    setSearch(q)
    if (searchTimeout) clearTimeout(searchTimeout)
    const timeout = setTimeout(() => fetchResources(), 400)
    setSearchTimeout(timeout)
  }

  return (
    <div className="resources-page">
      <div className="resources-header">
        <h1>📚 مكتبة المصادر</h1>
        <p>أفضل المصادر لتعلم الذكاء الاصطناعي وهندسة البرومبتات</p>
      </div>

      <ResourceFilters
        activeCategory={category}
        activeSpecialization={specialization}
        activeLevel={level}
        searchQuery={search}
        showSaved={showSaved}
        isLoggedIn={isLoggedIn}
        onCategoryChange={(c) => { setCategory(c); }}
        onSpecializationChange={(s) => { setSpecialization(s); }}
        onLevelChange={(l) => { setLevel(l); }}
        onSearchChange={handleSearchChange}
        onSavedToggle={() => setShowSaved(!showSaved)}
      />

      {loading ? (
        <div className="loading-state">
          <div className="spinner"></div>
          <p>جاري تحميل المصادر...</p>
        </div>
      ) : resources.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">📭</div>
          <h3>لا توجد مصادر</h3>
          <p>{showSaved ? 'لم تحفظ أي مصادر بعد' : 'لم يتم العثور على مصادر بهذه الفلاتر'}</p>
          {!showSaved && (
            <button className="seed-button" onClick={handleSeed} disabled={seeding}>
              {seeding ? '⏳ جاري إضافة المصادر...' : '🌱 إضافة المصادر الأولية'}
            </button>
          )}
        </div>
      ) : (
        <>
          <div className="resources-count">
            📊 {resources.length} مصدر
          </div>
          <div className="resources-grid">
            {resources.map((resource) => (
              <ResourceCard
                key={resource.id}
                resource={resource}
                onSave={handleSave}
                isLoggedIn={isLoggedIn}
              />
            ))}
          </div>
        </>
      )}

      <style jsx>{`
        .resources-page {
          max-width: 900px;
          margin: 0 auto;
          padding: 2rem 1rem;
          min-height: 100vh;
          direction: rtl;
        }
        .resources-header {
          text-align: center;
          margin-bottom: 2rem;
        }
        .resources-header h1 {
          font-size: 2rem;
          background: linear-gradient(135deg, #FF6B35, #FFD700);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          margin-bottom: 0.5rem;
        }
        .resources-header p {
          color: rgba(255, 255, 255, 0.6);
          font-size: 1rem;
        }
        .loading-state {
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
          margin: 0 auto 1rem;
        }
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
        .loading-state p {
          color: rgba(255, 255, 255, 0.5);
        }
        .empty-state {
          text-align: center;
          padding: 3rem 0;
        }
        .empty-icon {
          font-size: 3rem;
          margin-bottom: 1rem;
        }
        .empty-state h3 {
          color: rgba(255, 255, 255, 0.8);
          margin-bottom: 0.5rem;
        }
        .empty-state p {
          color: rgba(255, 255, 255, 0.5);
          margin-bottom: 1.5rem;
        }
        .seed-button {
          padding: 0.75rem 1.5rem;
          background: linear-gradient(135deg, #FF6B35, #e55a2b);
          color: white;
          border: none;
          border-radius: 12px;
          font-size: 0.95rem;
          font-family: inherit;
          cursor: pointer;
          transition: all 0.2s;
        }
        .seed-button:hover:not(:disabled) {
          filter: brightness(1.1);
          transform: translateY(-1px);
        }
        .seed-button:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }
        .resources-count {
          color: rgba(255, 255, 255, 0.5);
          font-size: 0.85rem;
          margin-bottom: 1rem;
        }
        .resources-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
          gap: 1rem;
        }
        @media (max-width: 640px) {
          .resources-page {
            padding: 1rem 0.75rem;
          }
          .resources-header h1 {
            font-size: 1.5rem;
          }
          .resources-grid {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </div>
  )
}
