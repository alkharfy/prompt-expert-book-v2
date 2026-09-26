'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { trackCtaClick } from '@/lib/analytics'

export default function MobileStickyBuy() {
    const [visible, setVisible] = useState(false)
    const pricingVisible = useRef(false)

    useEffect(() => {
        // Track scroll position
        function onScroll() {
            if (pricingVisible.current) {
                setVisible(false)
                return
            }
            setVisible(window.scrollY > 500)
        }

        // Track pricing section visibility
        const pricingEl = document.getElementById('pricing')
        let observer: IntersectionObserver | null = null

        if (pricingEl) {
            observer = new IntersectionObserver(
                ([entry]) => {
                    pricingVisible.current = entry.isIntersecting
                    if (entry.isIntersecting) setVisible(false)
                },
                { threshold: 0.1 }
            )
            observer.observe(pricingEl)
        }

        window.addEventListener('scroll', onScroll, { passive: true })
        return () => {
            window.removeEventListener('scroll', onScroll)
            observer?.disconnect()
        }
    }, [])

    if (!visible) return null

    return (
        <div className="mobile-sticky-buy">
            <Link href="#pricing" className="mobile-sticky-btn" onClick={() => trackCtaClick('اشترك الآن', 'mobile_sticky_bar')}>
                اشترك الآن — من 99 ج.م 🚀
            </Link>

            <style jsx>{`
                .mobile-sticky-buy {
                    position: fixed;
                    bottom: 0;
                    left: 0;
                    right: 0;
                    display: none;
                    align-items: center;
                    justify-content: center;
                    gap: 14px;
                    padding: 12px 16px;
                    background: rgba(10, 10, 10, 0.96);
                    backdrop-filter: blur(12px);
                    border-top: 1px solid rgba(255, 107, 53, 0.2);
                    z-index: 40;
                    animation: slideUp 0.3s ease-out;
                }

                @keyframes slideUp {
                    from { transform: translateY(100%); }
                    to { transform: translateY(0); }
                }

                .mobile-sticky-text {
                    color: #fff;
                    font-size: 0.9rem;
                    font-weight: 700;
                }

                .mobile-sticky-btn {
                    display: inline-flex;
                    align-items: center;
                    padding: 10px 24px;
                    background: linear-gradient(135deg, #FF6B35, #FF8C42);
                    color: #fff;
                    border-radius: 10px;
                    font-weight: 700;
                    font-size: 0.9rem;
                    text-decoration: none;
                    white-space: nowrap;
                    transition: transform 0.2s;
                }

                .mobile-sticky-btn:hover {
                    transform: translateY(-1px);
                }

                @media (max-width: 768px) {
                    .mobile-sticky-buy {
                        display: flex;
                    }
                }
            `}</style>
        </div>
    )
}
