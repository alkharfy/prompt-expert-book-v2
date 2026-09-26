'use client'

import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Testimonial } from '@/lib/testimonials'

// Real testimonials must come from a verified source (the testimonials DB via
// /api/testimonials). No hardcoded/fallback testimonials are allowed here — if
// the API returns none, this component renders nothing rather than fabricating
// social proof.

function highlightNumbers(text: string): React.ReactNode[] {
    const parts = text.split(/(\d+(?:\.\d+)?%?)/g)
    return parts.map((part, i) =>
        /^\d+(?:\.\d+)?%?$/.test(part)
            ? <span key={i} className="tm-num-highlight">{part}</span>
            : part
    )
}

function getInitials(name: string): string {
    return name.split(' ').map(n => n[0]).join('').substring(0, 2)
}

export default function Testimonials() {
    const [testimonials, setTestimonials] = useState<Testimonial[]>([])
    const [featuredIdx, setFeaturedIdx] = useState(0)


    useEffect(() => {
        async function loadTestimonials() {
            try {
                const res = await fetch('/api/testimonials')
                const json = await res.json()
                if (json.data && json.data.length > 0) setTestimonials(json.data)
            } catch { /* keep fallback */ }
        }
        loadTestimonials()
    }, [])

    // Auto-rotate featured testimonial
    useEffect(() => {
        const maxFeatured = Math.min(testimonials.length, 3)
        const timer = setInterval(() => setFeaturedIdx(prev => (prev + 1) % maxFeatured), 7000)
        return () => clearInterval(timer)
    }, [testimonials.length])


    // Render nothing until verified, DB-sourced testimonials are available.
    if (testimonials.length === 0) return null

    const featured = testimonials[featuredIdx]
    const maxFeaturedCount = Math.min(testimonials.length, 3)

    return (
        <section className="landing-section tm-section">
            <div className="container">
                {/* Header */}
                <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.6 }} className="tm-header">
                    <span className="tm-badge">💬 آراء المتعلمين</span>
                    <h2 className="tm-title">ماذا يقول طلابنا؟</h2>
                    <p className="tm-subtitle">آراء حقيقية من متعلمين استخدموا المنصة</p>
                </motion.div>

                {/* Featured Testimonial */}
                <div className="tm-featured-wrap">
                    <AnimatePresence mode="wait">
                        <motion.div
                            key={featuredIdx}
                            initial={{ opacity: 0, y: 20, scale: 0.97 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: -15, scale: 0.97 }}
                            transition={{ duration: 0.4, ease: 'easeInOut' }}
                            className="tm-featured"
                        >
                            <div className="tm-featured-glow" />
                            <div className="tm-featured-quote">&ldquo;</div>
                            <p className="tm-featured-text">{highlightNumbers(featured.content)}</p>
                            <div className="tm-featured-author">
                                <div className="tm-avatar-ring tm-avatar-ring-lg">
                                    <div className="tm-avatar tm-avatar-lg">
                                        {featured.photo_url ? (
                                            // eslint-disable-next-line @next/next/no-img-element
                                            <img src={featured.photo_url} alt={featured.name} />
                                        ) : (
                                            <div className="tm-avatar-fallback">{getInitials(featured.name)}</div>
                                        )}
                                    </div>
                                </div>
                                <div>
                                    <div className="tm-featured-name">{featured.name}</div>
                                    <div className="tm-featured-role">{featured.title}</div>
                                    <div className="tm-stars tm-stars-lg">
                                        {[1, 2, 3, 4, 5].map(s => (
                                            <span key={s} className={s <= featured.rating ? 'tm-star tm-star-on' : 'tm-star'}>★</span>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    </AnimatePresence>
                    {/* Dots */}
                    <div className="tm-dots">
                        {Array.from({ length: maxFeaturedCount }).map((_, i) => (
                            <button key={i} className={`tm-dot${i === featuredIdx ? ' tm-dot-active' : ''}`} onClick={() => setFeaturedIdx(i)} aria-label={`عرض رأي ${i + 1}`} />
                        ))}
                    </div>
                </div>




            </div>

            <style jsx global>{`
                .tm-section { padding: 100px 0; position: relative; }
                .tm-header { text-align: center; margin-bottom: 32px; }
                .tm-badge { display: inline-block; background: rgba(255,107,53,0.15); color: #FF6B35; padding: 8px 20px; border-radius: 30px; font-size: 0.9rem; font-weight: 600; margin-bottom: 20px; border: 1px solid rgba(255,107,53,0.3); }
                .tm-title { font-size: 2.4rem; font-weight: 800; margin-bottom: 14px; background: linear-gradient(135deg, #fff, #FF6B35); -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text; }
                .tm-subtitle { font-size: 1.05rem; color: rgba(255,255,255,0.6); }

                /* Trust Bar */
                .tm-trust-bar {
                    display: flex; align-items: center; justify-content: center; gap: 24px;
                    background: rgba(255,107,53,0.06); backdrop-filter: blur(14px); -webkit-backdrop-filter: blur(14px);
                    border: 1px solid rgba(255,107,53,0.18); border-radius: 16px;
                    padding: 16px 36px; max-width: 520px; margin: 0 auto 44px;
                    box-shadow: 0 4px 24px rgba(0,0,0,0.2);
                }
                .tm-trust-item { display: flex; align-items: center; gap: 6px; }
                .tm-trust-gold { color: #FFD700; font-size: 0.85rem; direction: ltr; letter-spacing: 1px; }
                .tm-trust-val { font-weight: 800; color: white; font-size: 1.05rem; }
                .tm-trust-label { color: rgba(255,255,255,0.45); font-size: 0.85rem; }
                .tm-trust-sep { width: 1px; height: 24px; background: rgba(255,255,255,0.1); }

                /* Featured */
                .tm-featured-wrap { max-width: 720px; margin: 0 auto 48px; }
                .tm-featured {
                    position: relative; text-align: center; padding: 44px 40px 36px;
                    background: linear-gradient(165deg, rgba(30,20,14,0.95), rgba(15,12,28,0.95));
                    backdrop-filter: blur(14px); -webkit-backdrop-filter: blur(14px);
                    border: 1px solid rgba(255,107,53,0.22); border-radius: 24px;
                    overflow: hidden;
                    box-shadow: 0 8px 40px rgba(0,0,0,0.3), 0 0 30px rgba(255,107,53,0.06);
                }
                .tm-featured-glow {
                    position: absolute; top: -60px; left: 50%; transform: translateX(-50%);
                    width: 300px; height: 120px; background: radial-gradient(ellipse, rgba(255,107,53,0.12) 0%, transparent 70%);
                    pointer-events: none;
                }
                .tm-featured-quote { position: absolute; top: 16px; right: 28px; font-size: 4.5rem; font-weight: 900; color: rgba(255,107,53,0.12); line-height: 1; pointer-events: none; font-family: Georgia, serif; }
                .tm-featured-text { font-size: 1.15rem; color: rgba(255,255,255,0.88); line-height: 1.9; margin-bottom: 28px; position: relative; z-index: 1; }
                .tm-featured-author { display: flex; align-items: center; justify-content: center; gap: 16px; flex-wrap: wrap; position: relative; z-index: 1; }
                .tm-featured-name { font-size: 1.1rem; font-weight: 700; color: white; }
                .tm-featured-role { font-size: 0.82rem; color: rgba(255,255,255,0.4); margin-bottom: 4px; }

                /* Avatar */
                .tm-avatar-ring { width: 48px; height: 48px; border-radius: 50%; padding: 2px; background: conic-gradient(from 0deg, #FF6B35, #FFB347, #FF8C42, #FF6B35); flex-shrink: 0; }
                .tm-avatar-ring-lg { width: 56px; height: 56px; }
                .tm-avatar { width: 100%; height: 100%; border-radius: 50%; overflow: hidden; border: 2px solid rgba(10,10,26,0.9); }
                .tm-avatar-lg { }
                .tm-avatar img { width: 100%; height: 100%; object-fit: cover; }
                .tm-avatar-fallback { width: 100%; height: 100%; background: linear-gradient(135deg, #FF6B35, #FF8C42); display: flex; align-items: center; justify-content: center; color: white; font-weight: 700; font-size: 0.95rem; }

                /* Stars */
                .tm-stars { display: flex; gap: 1px; direction: ltr; }
                .tm-stars-lg { gap: 2px; }
                .tm-star { color: rgba(255,255,255,0.15); font-size: 0.95rem; }
                .tm-star-on { color: #FFD700; }
                .tm-stars-lg .tm-star { font-size: 1.05rem; }

                /* Verified badge */


                /* Number highlight */
                .tm-num-highlight { color: #FF6B35; font-weight: 700; }

                /* Dots */
                .tm-dots { display: flex; justify-content: center; gap: 8px; margin-top: 20px; }
                .tm-dot { width: 8px; height: 8px; border-radius: 50%; border: none; background: rgba(255,255,255,0.15); cursor: pointer; transition: all 0.3s; padding: 0; }
                .tm-dot-active { background: #FF6B35; box-shadow: 0 0 8px rgba(255,107,53,0.5); transform: scale(1.3); }



                /* Responsive */
                @media (max-width: 768px) {
                    .tm-trust-bar { gap: 16px; padding: 14px 24px; flex-wrap: wrap; }
                    .tm-featured { padding: 32px 26px 28px; }
                    .tm-featured-text { font-size: 1.02rem; }
                }
                @media (max-width: 576px) {
                    .tm-section { padding: 60px 0; }
                    .tm-title { font-size: 1.8rem; }
                    .tm-subtitle { font-size: 0.92rem; }
                    .tm-featured { padding: 26px 20px 24px; }
                    .tm-featured-text { font-size: 0.95rem; }
                    .tm-featured-quote { font-size: 3rem; top: 10px; right: 16px; }
                    .tm-trust-bar { gap: 12px; padding: 12px 18px; max-width: 100%; }
                    .tm-trust-val { font-size: 0.92rem; }
                    .tm-featured-author { gap: 10px; }
                }
            `}</style>
        </section>
    )
}
