'use client'

import { useState } from 'react'
import { BLOG_POSTS, BLOG_CATEGORIES } from '@/data/blogPosts'
import BlogCard from '@/components/blog/BlogCard'

export default function BlogListClient() {
  const [activeCategory, setActiveCategory] = useState('all')

  const filtered = activeCategory === 'all'
    ? BLOG_POSTS
    : BLOG_POSTS.filter(p => p.category === activeCategory)

  return (
    <div className="blog-page">
      <div className="blog-header">
        <h1 className="blog-title">✍️ المدونة</h1>
        <p className="blog-subtitle">
          مقالات عملية عن هندسة البرومبت والذكاء الاصطناعي — نصائح، قوالب جاهزة، ومقارنات
        </p>
      </div>

      <div className="blog-categories">
        <button
          className={`blog-cat-btn ${activeCategory === 'all' ? 'active' : ''}`}
          onClick={() => setActiveCategory('all')}
        >
          📚 الكل
        </button>
        {Object.entries(BLOG_CATEGORIES).map(([key, cat]) => (
          <button
            key={key}
            className={`blog-cat-btn ${activeCategory === key ? 'active' : ''}`}
            onClick={() => setActiveCategory(key)}
          >
            {cat.icon} {cat.name}
          </button>
        ))}
      </div>

      <div className="blog-count">📊 {filtered.length} مقال</div>

      <div className="blog-grid">
        {filtered.map(post => (
          <BlogCard key={post.slug} post={post} />
        ))}
      </div>

      {filtered.length === 0 && (
        <div className="blog-empty">
          <span>📝</span>
          <p>لا توجد مقالات في هذا التصنيف حالياً</p>
        </div>
      )}

      <style jsx>{`
        .blog-page {
          max-width: 900px;
          margin: 0 auto;
          padding: 2rem 1rem;
          min-height: 80vh;
        }
        .blog-header {
          text-align: center;
          margin-bottom: 2rem;
        }
        .blog-title {
          font-size: clamp(1.5rem, 4vw, 2.2rem);
          font-weight: 800;
          background: linear-gradient(135deg, #FF6B35, #FFD700);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
          margin: 0 0 0.5rem;
        }
        .blog-subtitle {
          color: rgba(255, 255, 255, 0.6);
          font-size: 0.95rem;
          margin: 0;
          line-height: 1.7;
        }
        .blog-categories {
          display: flex;
          gap: 0.5rem;
          flex-wrap: wrap;
          justify-content: center;
          margin-bottom: 1.5rem;
        }
        .blog-cat-btn {
          background: rgba(255, 255, 255, 0.05);
          border: 1px solid rgba(255, 255, 255, 0.1);
          color: rgba(255, 255, 255, 0.7);
          padding: 8px 16px;
          border-radius: 20px;
          cursor: pointer;
          font-size: 0.85rem;
          transition: all 0.2s;
          font-family: inherit;
        }
        .blog-cat-btn:hover {
          border-color: rgba(255, 107, 53, 0.3);
          color: #fff;
        }
        .blog-cat-btn.active {
          background: rgba(255, 107, 53, 0.15);
          border-color: #FF6B35;
          color: #FF6B35;
          font-weight: 600;
        }
        .blog-count {
          text-align: center;
          font-size: 0.85rem;
          color: rgba(255, 255, 255, 0.4);
          margin-bottom: 1.5rem;
        }
        .blog-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
          gap: 1.25rem;
        }
        .blog-empty {
          text-align: center;
          padding: 3rem;
          color: rgba(255, 255, 255, 0.4);
        }
        .blog-empty span {
          font-size: 3rem;
          display: block;
          margin-bottom: 1rem;
        }
        @media (max-width: 600px) {
          .blog-page {
            padding: 1rem 0.75rem;
          }
          .blog-grid {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </div>
  )
}
