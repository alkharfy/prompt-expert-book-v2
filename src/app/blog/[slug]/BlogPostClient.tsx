'use client'

import Link from 'next/link'
import type { BlogPost } from '@/data/blogPosts'
import { BLOG_CATEGORIES } from '@/data/blogPosts'
import BlogCTA from '@/components/blog/BlogCTA'
import BlogCard from '@/components/blog/BlogCard'

interface BlogPostClientProps {
  post: BlogPost
  relatedPosts: BlogPost[]
}

// Strip <script>/<iframe>/<object>/<embed>, on* event handlers, and javascript: URLs.
// Defense-in-depth — blog content is dev-controlled at build time, but this prevents
// any future regression if content ever becomes dynamic.
function sanitizeBlogHtml(html: string): string {
  return html
    .replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, '')
    .replace(/<\/?(?:iframe|object|embed|form|input|textarea|select|button|link|meta|base)\b[^>]*>/gi, '')
    .replace(/\son[a-z]+\s*=\s*"[^"]*"/gi, '')
    .replace(/\son[a-z]+\s*=\s*'[^']*'/gi, '')
    .replace(/\son[a-z]+\s*=\s*[^\s>]+/gi, '')
    .replace(/(href|src|action|formaction)\s*=\s*"\s*javascript:[^"]*"/gi, '$1="#"')
    .replace(/(href|src|action|formaction)\s*=\s*'\s*javascript:[^']*'/gi, "$1='#'")
}

export default function BlogPostClient({ post, relatedPosts }: BlogPostClientProps) {
  const cat = BLOG_CATEGORIES[post.category]
  const date = new Date(post.publishedAt).toLocaleDateString('ar-EG', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })

  return (
    <article className="blog-post-page">
      <div className="blog-post-nav">
        <Link href="/blog" className="blog-back-link">→ العودة للمدونة</Link>
      </div>

      <header className="blog-post-header">
        <div className="blog-post-cover">{post.coverEmoji}</div>
        <div className="blog-post-meta-row">
          <span className="blog-post-category">{cat?.icon} {cat?.name}</span>
          <span className="blog-post-date">{date}</span>
          <span className="blog-post-read-time">⏱️ {post.readTime} دقائق</span>
        </div>
        <h1 className="blog-post-title">{post.title}</h1>
        <p className="blog-post-excerpt">{post.excerpt}</p>
        <div className="blog-post-tags">
          {post.tags.map(tag => (
            <span key={tag} className="blog-post-tag">#{tag}</span>
          ))}
        </div>
      </header>

      <div
        className="blog-post-content"
        dangerouslySetInnerHTML={{ __html: sanitizeBlogHtml(post.content) }}
      />

      <BlogCTA />

      {relatedPosts.length > 0 && (
        <div className="blog-related">
          <h2 className="blog-related-title">📖 مقالات مشابهة</h2>
          <div className="blog-related-grid">
            {relatedPosts.map(p => (
              <BlogCard key={p.slug} post={p} />
            ))}
          </div>
        </div>
      )}

      <style jsx>{`
        .blog-post-page {
          max-width: 740px;
          margin: 0 auto;
          padding: 2rem 1rem 4rem;
        }
        .blog-post-nav {
          margin-bottom: 1.5rem;
        }
        .blog-back-link {
          color: #FF6B35;
          text-decoration: none;
          font-size: 0.9rem;
          font-weight: 600;
          transition: opacity 0.2s;
        }
        .blog-back-link:hover {
          opacity: 0.8;
          text-decoration: underline;
        }
        .blog-post-header {
          text-align: center;
          margin-bottom: 2.5rem;
          padding-bottom: 2rem;
          border-bottom: 1px solid rgba(255, 255, 255, 0.08);
        }
        .blog-post-cover {
          font-size: 5rem;
          margin-bottom: 1rem;
        }
        .blog-post-meta-row {
          display: flex;
          justify-content: center;
          gap: 1rem;
          align-items: center;
          margin-bottom: 1rem;
          flex-wrap: wrap;
        }
        .blog-post-category {
          background: rgba(255, 107, 53, 0.1);
          color: #FF6B35;
          padding: 4px 12px;
          border-radius: 12px;
          font-size: 0.8rem;
          font-weight: 600;
        }
        .blog-post-date, .blog-post-read-time {
          font-size: 0.8rem;
          color: rgba(255, 255, 255, 0.45);
        }
        .blog-post-title {
          font-size: clamp(1.4rem, 4vw, 2rem);
          font-weight: 800;
          color: #fff;
          margin: 0 0 1rem;
          line-height: 1.5;
        }
        .blog-post-excerpt {
          font-size: 1rem;
          color: rgba(255, 255, 255, 0.6);
          margin: 0 0 1rem;
          line-height: 1.8;
        }
        .blog-post-tags {
          display: flex;
          justify-content: center;
          gap: 0.5rem;
          flex-wrap: wrap;
        }
        .blog-post-tag {
          font-size: 0.75rem;
          color: rgba(255, 255, 255, 0.35);
          background: rgba(255, 255, 255, 0.04);
          padding: 3px 10px;
          border-radius: 10px;
        }
        .blog-related {
          margin-top: 3rem;
          padding-top: 2rem;
          border-top: 1px solid rgba(255, 255, 255, 0.08);
        }
        .blog-related-title {
          font-size: 1.2rem;
          color: #fff;
          margin: 0 0 1.25rem;
          text-align: center;
        }
        .blog-related-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
          gap: 1rem;
        }
        @media (max-width: 600px) {
          .blog-post-page {
            padding: 1rem 0.75rem 3rem;
          }
          .blog-post-cover {
            font-size: 3.5rem;
          }
        }
      `}</style>

      <style jsx global>{`
        .blog-post-content {
          color: rgba(255, 255, 255, 0.85);
          font-size: 1rem;
          line-height: 1.9;
        }
        .blog-post-content h2 {
          font-size: 1.35rem;
          color: #fff;
          margin: 2rem 0 1rem;
          font-weight: 700;
        }
        .blog-post-content h3 {
          font-size: 1.1rem;
          color: #FF6B35;
          margin: 1.5rem 0 0.75rem;
          font-weight: 700;
        }
        .blog-post-content p {
          margin: 0 0 1rem;
          color: rgba(255, 255, 255, 0.75);
        }
        .blog-post-content ul, .blog-post-content ol {
          margin: 0 0 1rem;
          padding-right: 1.5rem;
          color: rgba(255, 255, 255, 0.75);
        }
        .blog-post-content li {
          margin-bottom: 0.5rem;
          line-height: 1.8;
        }
        .blog-post-content strong {
          color: #fff;
        }
        .blog-post-content em {
          color: #FF6B35;
          font-style: normal;
          background: rgba(255, 107, 53, 0.08);
          padding: 1px 6px;
          border-radius: 4px;
        }
        .blog-example {
          background: rgba(255, 255, 255, 0.03);
          border: 1px solid rgba(255, 255, 255, 0.08);
          border-radius: 12px;
          padding: 1rem;
          margin: 1rem 0;
        }
        .blog-bad {
          color: #F44336;
          padding: 0.5rem 0.75rem;
          background: rgba(244, 67, 54, 0.08);
          border-radius: 8px;
          margin-bottom: 0.5rem;
          font-size: 0.9rem;
          line-height: 1.7;
        }
        .blog-good {
          color: #4CAF50;
          padding: 0.5rem 0.75rem;
          background: rgba(76, 175, 80, 0.08);
          border-radius: 8px;
          font-size: 0.9rem;
          line-height: 1.7;
        }
        .blog-table {
          overflow-x: auto;
          margin: 1rem 0;
        }
        .blog-table table {
          width: 100%;
          border-collapse: collapse;
          font-size: 0.85rem;
        }
        .blog-table th {
          background: rgba(255, 107, 53, 0.1);
          color: #FF6B35;
          padding: 10px 12px;
          text-align: right;
          font-weight: 700;
        }
        .blog-table td {
          padding: 8px 12px;
          border-bottom: 1px solid rgba(255, 255, 255, 0.06);
          color: rgba(255, 255, 255, 0.7);
        }
        .blog-table tr:hover td {
          background: rgba(255, 255, 255, 0.03);
        }
      `}</style>
    </article>
  )
}
