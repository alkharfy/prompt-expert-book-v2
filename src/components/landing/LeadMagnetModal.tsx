'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { trackLead } from '@/lib/meta-pixel'

const STORAGE_KEY = 'lead_magnet_dismissed'
const COOLDOWN_DAYS = 7
const SHOW_DELAY_MS = 30000 // 30 seconds

export default function LeadMagnetModal() {
    const [isOpen, setIsOpen] = useState(false)
    const [email, setEmail] = useState('')
    const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle')
    const [errorMsg, setErrorMsg] = useState('')
    const shownThisSessionRef = useRef(false)

    const dismiss = useCallback(() => {
        setIsOpen(false)
        try {
            localStorage.setItem(STORAGE_KEY, Date.now().toString())
        } catch { /* SSR-safe */ }
    }, [])

    useEffect(() => {
        function isOnCooldown() {
            try {
                const stored = localStorage.getItem(STORAGE_KEY)
                if (!stored) return false
                const elapsed = Date.now() - Number(stored)
                return elapsed < COOLDOWN_DAYS * 24 * 60 * 60 * 1000
            } catch {
                return false
            }
        }

        if (isOnCooldown()) return

        function showOnce() {
            if (shownThisSessionRef.current) return
            if (isOnCooldown()) return
            shownThisSessionRef.current = true
            setIsOpen(true)
        }

        // Timer trigger: show after 30s on page
        const timer = setTimeout(showOnce, SHOW_DELAY_MS)

        // Exit intent trigger (desktop only)
        function handleMouseLeave(e: MouseEvent) {
            if (e.clientY <= 0) showOnce()
        }

        document.addEventListener('mouseleave', handleMouseLeave)

        return () => {
            clearTimeout(timer)
            document.removeEventListener('mouseleave', handleMouseLeave)
        }
    }, [])

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault()
        if (!email.trim()) return

        setStatus('loading')
        setErrorMsg('')

        try {
            const res = await fetch('/api/lead-magnet', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email: email.trim() }),
            })

            const data = await res.json().catch(() => ({}))
            if (!res.ok) {
                throw new Error(data.error || 'حدث خطأ')
            }

            // Browser Pixel Lead with the server's shared event_id → CAPI dedup.
            if (data?.eventId) trackLead(data.eventId)

            setStatus('success')
            try {
                localStorage.setItem(STORAGE_KEY, Date.now().toString())
            } catch { /* SSR-safe */ }
        } catch (err) {
            setStatus('error')
            setErrorMsg(err instanceof Error ? err.message : 'حدث خطأ')
        }
    }

    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="lead-magnet-overlay"
                    onClick={(e) => {
                        if (e.target === e.currentTarget) dismiss()
                    }}
                >
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9, y: 30 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.9, y: 30 }}
                        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                        className="lead-magnet-modal"
                    >
                        <button className="close-btn" onClick={dismiss} aria-label="إغلاق">✕</button>

                        {status === 'success' ? (
                            <div className="success-content">
                                <span className="success-emoji">🎉</span>
                                <h3>تم بنجاح!</h3>
                                <p>تحقق من بريدك الإلكتروني — الدليل في طريقه إليك</p>
                                <button className="cta-btn" onClick={dismiss}>
                                    تمام، أكمل تصفح
                                </button>
                            </div>
                        ) : (
                            <>
                                <div className="modal-icon">📘</div>
                                <h3 className="modal-title">
                                    دليل GOLDS المصغّر — مجاناً
                                </h3>
                                <p className="modal-desc">
                                    5 تقنيات Prompt أساسية في 10 دقائق — حمّلها الآن وابدأ تكتب prompts احترافية
                                </p>

                                <ul className="modal-benefits">
                                    <li>✅ إطار GOLDS الكامل مع أمثلة</li>
                                    <li>✅ 5 قوالب prompt جاهزة للاستخدام</li>
                                    <li>✅ أخطاء شائعة وكيف تتجنبها</li>
                                </ul>

                                <form onSubmit={handleSubmit} className="lead-form">
                                    <input
                                        type="email"
                                        required
                                        placeholder="أدخل بريدك الإلكتروني"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        className="email-input"
                                        dir="ltr"
                                        disabled={status === 'loading'}
                                    />
                                    <button
                                        type="submit"
                                        className="cta-btn"
                                        disabled={status === 'loading'}
                                    >
                                        {status === 'loading' ? 'جاري الإرسال...' : 'حمّل الدليل المجاني'}
                                    </button>
                                </form>

                                {status === 'error' && (
                                    <p className="error-msg">{errorMsg}</p>
                                )}

                                <p className="privacy-note">
                                    لن نرسل لك سبام — إيميل واحد مفيد في الأسبوع على الأكثر
                                </p>
                            </>
                        )}
                    </motion.div>

                    <style jsx global>{`
                        .lead-magnet-overlay {
                            position: fixed;
                            inset: 0;
                            background: rgba(0, 0, 0, 0.75);
                            backdrop-filter: blur(6px);
                            z-index: 10001;
                            display: flex;
                            align-items: center;
                            justify-content: center;
                            padding: 20px;
                        }

                        .lead-magnet-modal {
                            position: relative;
                            background: #111;
                            border: 1px solid rgba(255, 107, 53, 0.25);
                            border-radius: 20px;
                            padding: 45px 35px;
                            max-width: 480px;
                            width: 100%;
                            text-align: center;
                        }

                        .close-btn {
                            position: absolute;
                            top: 14px;
                            left: 14px;
                            background: rgba(255, 255, 255, 0.08);
                            border: none;
                            color: rgba(255, 255, 255, 0.5);
                            font-size: 1.1rem;
                            width: 36px;
                            height: 36px;
                            border-radius: 50%;
                            cursor: pointer;
                            display: flex;
                            align-items: center;
                            justify-content: center;
                            transition: all 0.2s;
                        }

                        .close-btn:hover {
                            background: rgba(255, 255, 255, 0.15);
                            color: white;
                        }

                        .modal-icon {
                            font-size: 3rem;
                            margin-bottom: 15px;
                        }

                        .modal-title {
                            font-size: 1.4rem;
                            font-weight: 800;
                            color: white;
                            margin-bottom: 10px;
                        }

                        .modal-desc {
                            font-size: 0.95rem;
                            color: rgba(255, 255, 255, 0.6);
                            line-height: 1.7;
                            margin-bottom: 20px;
                        }

                        .modal-benefits {
                            list-style: none;
                            padding: 0;
                            text-align: right;
                            margin-bottom: 25px;
                            background: rgba(255, 107, 53, 0.04);
                            padding: 18px 22px;
                            border-radius: 12px;
                            border: 1px solid rgba(255, 107, 53, 0.1);
                        }

                        .modal-benefits li {
                            color: rgba(255, 255, 255, 0.7);
                            font-size: 0.9rem;
                            margin-bottom: 8px;
                            line-height: 1.6;
                        }

                        .modal-benefits li:last-child {
                            margin-bottom: 0;
                        }

                        .lead-form {
                            display: flex;
                            flex-direction: column;
                            gap: 12px;
                        }

                        .email-input {
                            width: 100%;
                            padding: 14px 18px;
                            background: rgba(255, 255, 255, 0.06);
                            border: 1px solid rgba(255, 255, 255, 0.12);
                            border-radius: 12px;
                            color: white;
                            font-size: 1rem;
                            outline: none;
                            transition: border-color 0.2s;
                            min-height: 44px;
                            box-sizing: border-box;
                        }

                        .email-input:focus {
                            border-color: #FF6B35;
                        }

                        .email-input::placeholder {
                            color: rgba(255, 255, 255, 0.3);
                        }

                        .cta-btn {
                            width: 100%;
                            padding: 14px 24px;
                            background: linear-gradient(135deg, #FF6B35, #FF8C42);
                            color: white;
                            border: none;
                            border-radius: 12px;
                            font-size: 1rem;
                            font-weight: 700;
                            cursor: pointer;
                            transition: all 0.3s ease;
                            min-height: 44px;
                        }

                        .cta-btn:hover:not(:disabled) {
                            transform: translateY(-1px);
                            box-shadow: 0 6px 20px rgba(255, 107, 53, 0.3);
                        }

                        .cta-btn:disabled {
                            opacity: 0.7;
                            cursor: not-allowed;
                        }

                        .error-msg {
                            color: #ef4444;
                            font-size: 0.85rem;
                            margin-top: 10px;
                        }

                        .privacy-note {
                            color: rgba(255, 255, 255, 0.35);
                            font-size: 0.78rem;
                            margin-top: 14px;
                        }

                        .success-content {
                            display: flex;
                            flex-direction: column;
                            align-items: center;
                            gap: 12px;
                        }

                        .success-emoji {
                            font-size: 3rem;
                        }

                        .success-content h3 {
                            font-size: 1.4rem;
                            font-weight: 800;
                            color: #4CAF50;
                        }

                        .success-content p {
                            color: rgba(255, 255, 255, 0.6);
                            font-size: 0.95rem;
                        }

                        @media (max-width: 576px) {
                            .lead-magnet-modal {
                                padding: 35px 22px;
                            }

                            .modal-title {
                                font-size: 1.2rem;
                            }
                        }
                    `}</style>
                </motion.div>
            )}
        </AnimatePresence>
    )
}
