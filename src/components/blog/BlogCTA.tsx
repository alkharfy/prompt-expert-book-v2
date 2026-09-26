'use client'

import Link from 'next/link'
import { BOOK_PAGES_DISPLAY } from '@/lib/config'

export default function BlogCTA() {
  return (
    <div className="blog-cta">
      <div className="blog-cta-emoji">🚀</div>
      <h3 className="blog-cta-title">عايز تتعلم أكتر؟</h3>
      <p className="blog-cta-text">
        المقال ده بس البداية! في كتاب <strong>خبير البرومبتات</strong> هتتعلم 
        أكتر من 55 تقنية متقدمة مع تمارين تفاعلية ومسار تعليمي مخصص ليك.
      </p>
      <div className="blog-cta-features">
        <span>📚 {BOOK_PAGES_DISPLAY} صفحة تفاعلية</span>
        <span>✏️ 48 تمرين عملي</span>
        <span>🏆 شهادة إتمام</span>
      </div>
      <Link href="/#pricing" className="blog-cta-button">
        اشترك الآن — افتح الكتاب كامل ←
      </Link>
      <div style={{ marginTop: '12px' }}>
        <Link href="/read/intro/1" className="blog-cta-secondary">
          أو جرّب الفصل الأول مجاناً
        </Link>
      </div>

      <style jsx>{`
        .blog-cta {
          background: linear-gradient(135deg, rgba(255, 107, 53, 0.1), rgba(255, 215, 0, 0.05));
          border: 2px solid rgba(255, 107, 53, 0.3);
          border-radius: 20px;
          padding: 2rem;
          margin: 3rem 0;
          text-align: center;
        }
        .blog-cta-emoji {
          font-size: 3rem;
          margin-bottom: 0.75rem;
        }
        .blog-cta-title {
          font-size: 1.4rem;
          color: #fff;
          margin: 0 0 0.75rem;
          font-weight: 800;
        }
        .blog-cta-text {
          font-size: 0.95rem;
          color: rgba(255, 255, 255, 0.7);
          line-height: 1.8;
          margin: 0 0 1.25rem;
          max-width: 500px;
          margin-left: auto;
          margin-right: auto;
        }
        .blog-cta-features {
          display: flex;
          justify-content: center;
          gap: 1.25rem;
          flex-wrap: wrap;
          margin-bottom: 1.5rem;
          font-size: 0.85rem;
          color: rgba(255, 255, 255, 0.6);
        }
        .blog-cta-button {
          display: inline-block;
          background: linear-gradient(135deg, #FF6B35, #e55a2b);
          color: #fff;
          padding: 12px 32px;
          border-radius: 12px;
          font-weight: 700;
          font-size: 1rem;
          text-decoration: none;
          transition: all 0.3s ease;
        }
        .blog-cta-button:hover {
          transform: translateY(-2px);
          box-shadow: 0 8px 20px rgba(255, 107, 53, 0.3);
        }
        .blog-cta-secondary {
          color: rgba(255, 255, 255, 0.55);
          font-size: 0.9rem;
          text-decoration: underline;
          text-underline-offset: 3px;
          transition: color 0.2s ease;
        }
        .blog-cta-secondary:hover {
          color: rgba(255, 255, 255, 0.85);
        }
        @media (max-width: 600px) {
          .blog-cta {
            padding: 1.5rem 1rem;
          }
          .blog-cta-features {
            flex-direction: column;
            gap: 0.5rem;
          }
        }
      `}</style>
    </div>
  )
}
