'use client'

import Link from 'next/link'
import type { BlogPost } from '@/data/blogPosts'
import { BLOG_CATEGORIES } from '@/data/blogPosts'

interface BlogCardProps {
  post: BlogPost
}

export default function BlogCard({ post }: BlogCardProps) {
  const cat = BLOG_CATEGORIES[post.category]
  const date = new Date(post.publishedAt).toLocaleDateString('ar-EG', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })

  return (
    <Link href={`/blog/${post.slug}`} className="blog-card-link">
      <article className="blog-card">
        <div className="blog-card-cover">{post.coverEmoji}</div>
        <div className="blog-card-body">
          <div className="blog-card-meta">
            <span className="blog-card-category">
              {cat?.icon} {cat?.name}
            </span>
            <span className="blog-card-date">{date}</span>
          </div>
          <h2 className="blog-card-title">{post.title}</h2>
          <p className="blog-card-excerpt">{post.excerpt}</p>
          <div className="blog-card-footer">
            <span className="blog-card-read-time">⏱️ {post.readTime} دقائق قراءة</span>
            <span className="blog-card-arrow">← اقرأ المقال</span>
          </div>
        </div>
      </article>

      <style jsx>{`
        .blog-card-link {
          text-decoration: none;
          color: inherit;
          display: block;
        }
        .blog-card {
          background: rgba(255, 255, 255, 0.03);
          border: 1px solid rgba(255, 107, 53, 0.15);
          border-radius: 16px;
          overflow: hidden;
          transition: all 0.3s ease;
          display: flex;
          flex-direction: column;
        }
        .blog-card:hover {
          border-color: rgba(255, 107, 53, 0.4);
          transform: translateY(-3px);
          box-shadow: 0 12px 30px rgba(255, 107, 53, 0.12);
        }
        .blog-card-cover {
          height: 140px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 4rem;
          background: linear-gradient(135deg, rgba(255, 107, 53, 0.08), rgba(255, 215, 0, 0.05));
        }
        .blog-card-body {
          padding: 1.25rem;
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
          flex: 1;
        }
        .blog-card-meta {
          display: flex;
          justify-content: space-between;
          align-items: center;
          font-size: 0.8rem;
        }
        .blog-card-category {
          background: rgba(255, 107, 53, 0.1);
          color: #FF6B35;
          padding: 3px 10px;
          border-radius: 12px;
          font-size: 0.75rem;
          font-weight: 600;
        }
        .blog-card-date {
          opacity: 0.5;
          font-size: 0.75rem;
        }
        .blog-card-title {
          font-size: 1.1rem;
          color: #fff;
          margin: 0;
          font-weight: 700;
          line-height: 1.5;
        }
        .blog-card-excerpt {
          font-size: 0.85rem;
          color: rgba(255, 255, 255, 0.6);
          margin: 0;
          line-height: 1.7;
          display: -webkit-box;
          -webkit-line-clamp: 3;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }
        .blog-card-footer {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-top: auto;
          padding-top: 0.75rem;
          border-top: 1px solid rgba(255, 255, 255, 0.06);
        }
        .blog-card-read-time {
          font-size: 0.75rem;
          opacity: 0.5;
        }
        .blog-card-arrow {
          font-size: 0.8rem;
          color: #FF6B35;
          font-weight: 600;
        }
        .blog-card:hover .blog-card-arrow {
          text-decoration: underline;
        }
      `}</style>
    </Link>
  )
}
