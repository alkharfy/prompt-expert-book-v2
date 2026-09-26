'use client'

import Link from 'next/link'
import { useState } from 'react'

/**
 * GuestBanner — sticky banner at the bottom for unauthenticated readers.
 * Encourages registration to save progress, solve exercises, etc.
 */
export default function GuestBanner() {
  const [dismissed, setDismissed] = useState(false)

  if (dismissed) return null

  return (
    <div className="guest-banner">
      <div className="guest-banner-content">
        <span className="guest-banner-icon">📚</span>
        <p className="guest-banner-text">
          افتح الكتاب كامل + 95 قالب جاهز — شاهد الباقات والأسعار
        </p>
        <div className="guest-banner-actions">
          <Link href="/payment?plan=pro" className="guest-banner-cta">
            اشترك الآن
          </Link>
          <Link href="/register" className="guest-banner-secondary">
            سجّل مجاناً
          </Link>
          <button
            onClick={() => setDismissed(true)}
            className="guest-banner-dismiss"
            aria-label="إغلاق"
          >
            ✕
          </button>
        </div>
      </div>

      <style jsx>{`
        .guest-banner {
          position: fixed;
          bottom: 0;
          left: 0;
          right: 0;
          z-index: 1000;
          background: rgba(15, 15, 30, 0.95);
          backdrop-filter: blur(12px);
          border-top: 1px solid rgba(255, 107, 53, 0.3);
          padding: 14px 20px;
          animation: slideUp 0.4s ease-out;
        }

        @keyframes slideUp {
          from { transform: translateY(100%); }
          to { transform: translateY(0); }
        }

        .guest-banner-content {
          max-width: 900px;
          margin: 0 auto;
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .guest-banner-icon {
          font-size: 1.4rem;
          flex-shrink: 0;
        }

        .guest-banner-text {
          color: rgba(255, 255, 255, 0.9);
          font-size: 0.95rem;
          font-weight: 500;
          margin: 0;
          flex: 1;
          line-height: 1.5;
        }

        .guest-banner-actions {
          display: flex;
          align-items: center;
          gap: 10px;
          flex-shrink: 0;
        }

        .guest-banner-cta {
          display: inline-block;
          background: #FF6B35;
          color: white;
          padding: 10px 24px;
          border-radius: 10px;
          font-weight: 700;
          font-size: 0.9rem;
          text-decoration: none;
          white-space: nowrap;
          min-height: 44px;
          display: flex;
          align-items: center;
          transition: background 0.2s;
        }

        .guest-banner-cta:hover {
          background: #e55a28;
        }

        .guest-banner-secondary {
          display: inline-flex;
          align-items: center;
          color: rgba(255, 255, 255, 0.6);
          font-size: 0.85rem;
          font-weight: 600;
          text-decoration: underline;
          text-underline-offset: 3px;
          white-space: nowrap;
          min-height: 44px;
        }

        .guest-banner-secondary:hover {
          color: rgba(255, 255, 255, 0.9);
        }

        .guest-banner-dismiss {
          background: transparent;
          border: none;
          color: rgba(255, 255, 255, 0.5);
          font-size: 1.1rem;
          cursor: pointer;
          padding: 8px;
          min-width: 44px;
          min-height: 44px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 8px;
          transition: color 0.2s;
        }

        .guest-banner-dismiss:hover {
          color: rgba(255, 255, 255, 0.8);
        }

        @media (max-width: 600px) {
          .guest-banner {
            padding: 12px 16px;
          }

          .guest-banner-content {
            flex-wrap: wrap;
            gap: 8px;
          }

          .guest-banner-icon {
            display: none;
          }

          .guest-banner-text {
            font-size: 0.85rem;
            flex-basis: calc(100% - 50px);
          }

          .guest-banner-actions {
            width: 100%;
            justify-content: center;
          }

          .guest-banner-cta {
            flex: 1;
            justify-content: center;
          }
        }
      `}</style>
    </div>
  )
}
