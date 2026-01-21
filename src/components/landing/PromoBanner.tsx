'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { getPromoSettings, getPromoTimeRemaining, isPromoValid, PromoSettings } from '@/lib/promo'

export default function PromoBanner() {
    const [promo, setPromo] = useState<PromoSettings | null>(null)
    const [timeLeft, setTimeLeft] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 })
    const [isVisible, setIsVisible] = useState(true)

    useEffect(() => {
        async function loadPromo() {
            const settings = await getPromoSettings()
            if (settings.is_active && isPromoValid(settings.end_date)) {
                setPromo(settings)
            }
        }
        loadPromo()
    }, [])

    useEffect(() => {
        if (!promo) return

        const timer = setInterval(() => {
            if (isPromoValid(promo.end_date)) {
                setTimeLeft(getPromoTimeRemaining(promo.end_date))
            } else {
                setPromo(null)
            }
        }, 1000)

        // Initial calculation
        setTimeLeft(getPromoTimeRemaining(promo.end_date))

        return () => clearInterval(timer)
    }, [promo])

    if (!promo || !isVisible) return null

    return (
        <AnimatePresence>
            <motion.div
                initial={{ y: -100, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: -100, opacity: 0 }}
                className="promo-banner"
            >
                <div className="promo-content">
                    <span className="promo-icon">🔥</span>
                    <span className="promo-text">{promo.promo_text}</span>
                    
                    <div className="promo-countdown">
                        <div className="countdown-item">
                            <span className="countdown-value">{timeLeft.days}</span>
                            <span className="countdown-label">يوم</span>
                        </div>
                        <span className="countdown-separator">:</span>
                        <div className="countdown-item">
                            <span className="countdown-value">{String(timeLeft.hours).padStart(2, '0')}</span>
                            <span className="countdown-label">ساعة</span>
                        </div>
                        <span className="countdown-separator">:</span>
                        <div className="countdown-item">
                            <span className="countdown-value">{String(timeLeft.minutes).padStart(2, '0')}</span>
                            <span className="countdown-label">دقيقة</span>
                        </div>
                        <span className="countdown-separator">:</span>
                        <div className="countdown-item">
                            <span className="countdown-value">{String(timeLeft.seconds).padStart(2, '0')}</span>
                            <span className="countdown-label">ثانية</span>
                        </div>
                    </div>
                </div>

                <button 
                    className="promo-close"
                    onClick={() => setIsVisible(false)}
                    aria-label="إغلاق العرض"
                >
                    ✕
                </button>

                <style jsx>{`
                    .promo-banner {
                        position: fixed;
                        top: 0;
                        left: 0;
                        right: 0;
                        z-index: 1000;
                        background: linear-gradient(135deg, #FF6B35 0%, #FF8C42 50%, #FFB347 100%);
                        padding: 12px 20px;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        gap: 20px;
                        box-shadow: 0 4px 20px rgba(255, 107, 53, 0.3);
                    }

                    .promo-content {
                        display: flex;
                        align-items: center;
                        gap: 15px;
                        flex-wrap: wrap;
                        justify-content: center;
                    }

                    .promo-icon {
                        font-size: 1.5rem;
                        animation: pulse 1s infinite;
                    }

                    @keyframes pulse {
                        0%, 100% { transform: scale(1); }
                        50% { transform: scale(1.2); }
                    }

                    .promo-text {
                        color: white;
                        font-weight: 700;
                        font-size: 1rem;
                        text-shadow: 0 1px 2px rgba(0,0,0,0.2);
                    }

                    .promo-countdown {
                        display: flex;
                        align-items: center;
                        gap: 5px;
                        background: rgba(255,255,255,0.2);
                        padding: 6px 12px;
                        border-radius: 8px;
                        backdrop-filter: blur(10px);
                    }

                    .countdown-item {
                        display: flex;
                        flex-direction: column;
                        align-items: center;
                        min-width: 40px;
                    }

                    .countdown-value {
                        color: white;
                        font-weight: 800;
                        font-size: 1.1rem;
                        font-family: 'Courier New', monospace;
                    }

                    .countdown-label {
                        color: rgba(255,255,255,0.9);
                        font-size: 0.65rem;
                        font-weight: 500;
                    }

                    .countdown-separator {
                        color: white;
                        font-weight: 700;
                        font-size: 1.2rem;
                        opacity: 0.8;
                    }

                    .promo-close {
                        position: absolute;
                        left: 15px;
                        background: rgba(255,255,255,0.2);
                        border: none;
                        color: white;
                        width: 28px;
                        height: 28px;
                        border-radius: 50%;
                        cursor: pointer;
                        font-size: 0.9rem;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        transition: all 0.2s;
                    }

                    .promo-close:hover {
                        background: rgba(255,255,255,0.3);
                        transform: scale(1.1);
                    }

                    @media (max-width: 768px) {
                        .promo-banner {
                            padding: 10px 15px;
                            padding-left: 50px;
                        }

                        .promo-text {
                            font-size: 0.85rem;
                        }

                        .promo-countdown {
                            padding: 4px 8px;
                        }

                        .countdown-item {
                            min-width: 30px;
                        }

                        .countdown-value {
                            font-size: 0.9rem;
                        }

                        .countdown-label {
                            font-size: 0.55rem;
                        }
                    }
                `}</style>
            </motion.div>
        </AnimatePresence>
    )
}
