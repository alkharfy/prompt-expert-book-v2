'use client'

import { useEffect, useState } from 'react'
import Navigation from '@/components/Navigation'
import RoadmapPath from '@/components/RoadmapPath'
import PathProgressBar from '@/components/plan/PathProgressBar'
import { trackViewContent } from '@/lib/meta-pixel'
import { trackViewItem, trackFunnelStep, trackCtaClick } from '@/lib/analytics'
import Link from 'next/link'

function StickyPurchaseBar() {
    const [visible, setVisible] = useState(false)
    const [dismissed, setDismissed] = useState(false)

    useEffect(() => {
        function onScroll() {
            setVisible(window.scrollY > 200)
        }
        window.addEventListener('scroll', onScroll, { passive: true })
        return () => window.removeEventListener('scroll', onScroll)
    }, [])

    if (!visible || dismissed) return null

    return (
        <div style={{
            position: 'fixed',
            bottom: 0,
            left: 0,
            right: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 16,
            padding: '12px 16px',
            background: 'rgba(10, 10, 10, 0.95)',
            backdropFilter: 'blur(12px)',
            borderTop: '1px solid rgba(255, 107, 53, 0.2)',
            zIndex: 100,
        }}>
            <span style={{ color: '#fff', fontSize: '0.9rem', fontWeight: 600 }}>
                الكتاب كامل بـ 5 ج.م — كود AI56
            </span>
            <Link href="/#pricing" onClick={() => trackCtaClick('اشتري الآن', 'toc_sticky_bar')} style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                padding: '10px 24px',
                background: 'linear-gradient(135deg, #FF6B35, #FF8C42)',
                color: '#fff',
                borderRadius: 10,
                fontWeight: 700,
                fontSize: '0.9rem',
                textDecoration: 'none',
                whiteSpace: 'nowrap',
            }}>
                اشتري الآن 🚀
            </Link>
            <button
                onClick={() => setDismissed(true)}
                aria-label="إغلاق"
                style={{
                    position: 'absolute',
                    top: 4,
                    left: 8,
                    background: 'none',
                    border: 'none',
                    color: 'rgba(255,255,255,0.4)',
                    fontSize: '1.2rem',
                    cursor: 'pointer',
                    padding: 4,
                }}
            >
                ✕
            </button>
        </div>
    )
}

export default function TOCPage() {
    useEffect(() => {
        trackViewContent()
        trackViewItem()
        trackFunnelStep('table_of_contents', 2)
    }, [])

    return (
        <>
            <Navigation />
            <main>
                <div style={{ maxWidth: 1400, margin: '0 auto', padding: '24px 20px 0' }}>
                    <PathProgressBar />
                </div>
                <RoadmapPath />
            </main>
            <StickyPurchaseBar />
        </>
    )
}
