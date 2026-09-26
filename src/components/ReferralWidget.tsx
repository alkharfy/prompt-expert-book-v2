'use client'

import { useState, useEffect } from 'react'
import { trackWhatsAppClick, trackReferralShared } from '@/lib/analytics'

interface ReferralWidgetProps {
    trigger?: 'chapter' | 'achievement' | 'inline'
    chapterName?: string
}

/**
 * ReferralWidget — Shows after completing a chapter or achievement
 * "شارك الكتاب مع صديق واكسبوا معاً!"
 */
export default function ReferralWidget({ trigger = 'inline', chapterName }: ReferralWidgetProps) {
    const [referralCode, setReferralCode] = useState('')
    const [referralLink, setReferralLink] = useState('')
    const [copied, setCopied] = useState(false)
    const [dismissed, setDismissed] = useState(false)
    const [hidden, setHidden] = useState(false)

    useEffect(() => {
        // Daily throttle — only show once per day (except 'inline' which is always visible)
        if (trigger !== 'inline') {
            try {
                const today = new Date().toDateString()
                const storageKey = `referral_shown_${trigger}_${today}`
                if (localStorage.getItem(storageKey)) {
                    setHidden(true)
                    return
                }
                localStorage.setItem(storageKey, '1')
            } catch { /* SSR-safe */ }
        }

        // Load referral code
        const loadCode = async () => {
            try {
                const res = await fetch('/api/referral')
                const data = await res.json()
                if (data.ok) {
                    setReferralCode(data.referralCode || '')
                    setReferralLink(data.referralLink || '')
                }
            } catch {
                // Silent fail
            }
        }
        loadCode()
    }, [])

    if (dismissed || hidden || !referralCode) return null

    const copyCode = async () => {
        try {
            await navigator.clipboard.writeText(referralCode)
            setCopied(true)
            setTimeout(() => setCopied(false), 2000)
        } catch {
            // Fallback
        }
    }

    const shareWhatsApp = () => {
        const message = `🎁 جرب كتاب PromptMaster — أحسن كتاب عربي لتعلم الـ AI Prompts!\n\nاستخدم كودي: ${referralCode}\nخصم 50 ج.م!\n\n${referralLink}`
        window.open(`https://wa.me/?text=${encodeURIComponent(message)}`, '_blank')
        trackWhatsAppClick('referral_widget')
        trackReferralShared('whatsapp')
    }

    const title = trigger === 'chapter' && chapterName
        ? `🎉 ممتاز! خلصت "${chapterName}"`
        : trigger === 'achievement'
        ? '🏆 إنجاز جديد!'
        : '🎁 ادعو صديقك'

    return (
        <div className="referral-widget">
            <button
                className="referral-widget-close"
                onClick={() => setDismissed(true)}
                aria-label="إغلاق"
            >
                ✕
            </button>

            <div className="referral-widget-content">
                <h4 className="referral-widget-title">{title}</h4>
                <p className="referral-widget-subtitle">
                    شارك الكتاب مع صديق واكسبوا معاً — خصم 50 ج.م لكل واحد!
                </p>

                <div className="referral-widget-code">
                    <span>{referralCode}</span>
                    <button onClick={copyCode}>
                        {copied ? '✅' : '📋'}
                    </button>
                </div>

                <div className="referral-widget-actions">
                    <button className="referral-widget-btn whatsapp" onClick={shareWhatsApp}>
                        💬 شارك على WhatsApp
                    </button>
                </div>
            </div>
        </div>
    )
}
