'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { trackWhatsAppClick } from '@/lib/analytics'
import ShareCardPreview, { type ShareCardData, type ShareCardType } from './ShareCardPreview'
import '@/styles/sharing.css'

interface ShareButtonProps {
    type: ShareCardType
    data: ShareCardData
    variant?: 'icon' | 'full'
    label?: string
}

const APP_URL = typeof window !== 'undefined' ? window.location.origin : ''

export default function ShareButton({ type, data, variant = 'full', label }: ShareButtonProps) {
    const [isOpen, setIsOpen] = useState(false)
    const [toast, setToast] = useState('')

    const shareUrl = `${APP_URL}/share/${type}/${encodeURIComponent(data.title || 'my-progress')}`
    const shareText = getShareText(type, data)

    const showToast = (msg: string) => {
        setToast(msg)
        setTimeout(() => setToast(''), 2500)
    }

    const handleCopyLink = async () => {
        try {
            await navigator.clipboard.writeText(shareUrl)
            showToast('✅ تم نسخ الرابط')
        } catch {
            showToast('❌ فشل نسخ الرابط')
        }
        setIsOpen(false)
    }

    const handleNativeShare = async () => {
        if (navigator.share) {
            try {
                await navigator.share({
                    title: data.title || 'PromptMaster',
                    text: shareText,
                    url: shareUrl,
                })
                setIsOpen(false)
            } catch {
                // User cancelled share
            }
        }
    }

    const handleDownloadImage = async () => {
        try {
            const el = document.getElementById('share-card-render')
            if (!el) return
            const html2canvas = (await import('html2canvas')).default
            const canvas = await html2canvas(el, {
                backgroundColor: '#0a0a0a',
                scale: 2,
            })
            const link = document.createElement('a')
            link.download = `promptexpert-${type}.png`
            link.href = canvas.toDataURL('image/png')
            link.click()
            showToast('✅ تم تحميل الصورة')
        } catch {
            showToast('❌ فشل تحميل الصورة')
        }
        setIsOpen(false)
    }

    const shareOptions = [
        {
            icon: '🐦',
            label: 'X (Twitter)',
            action: () => {
                window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(shareUrl)}`, '_blank')
                setIsOpen(false)
            },
        },
        {
            icon: '💬',
            label: 'WhatsApp',
            action: () => {
                window.open(`https://wa.me/?text=${encodeURIComponent(shareText + '\n' + shareUrl)}`, '_blank')
                trackWhatsAppClick('share_button')
                setIsOpen(false)
            },
        },
        {
            icon: '📘',
            label: 'Facebook',
            action: () => {
                window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`, '_blank')
                setIsOpen(false)
            },
        },
        {
            icon: '💼',
            label: 'LinkedIn',
            action: () => {
                window.open(`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(shareUrl)}`, '_blank')
                setIsOpen(false)
            },
        },
        { icon: '📋', label: 'نسخ الرابط', action: handleCopyLink },
        { icon: '📥', label: 'تحميل كصورة', action: handleDownloadImage },
    ]

    // Add native share for mobile
    if (typeof navigator !== 'undefined' && 'share' in navigator) {
        shareOptions.unshift({
            icon: '📤',
            label: 'مشاركة...',
            action: handleNativeShare,
        })
    }

    return (
        <>
            {variant === 'icon' ? (
                <button className="share-btn-icon" onClick={() => setIsOpen(true)} title="شارك">
                    📤
                </button>
            ) : (
                <button className="share-btn" onClick={() => setIsOpen(true)}>
                    📤 {label || 'شارك'}
                </button>
            )}

            <AnimatePresence>
                {isOpen && (
                    <>
                        <motion.div
                            className="share-backdrop"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setIsOpen(false)}
                        />
                        <motion.div
                            className="share-modal"
                            initial={{ y: '100%', opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            exit={{ y: '100%', opacity: 0 }}
                            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                        >
                            <div className="share-modal-handle" />
                            <div className="share-modal-header">
                                <h3>📤 شارك إنجازك</h3>
                                <button className="share-modal-close" onClick={() => setIsOpen(false)}>✕</button>
                            </div>

                            {/* Card Preview */}
                            <ShareCardPreview data={data} />

                            {/* Share Options */}
                            <div className="share-options">
                                {shareOptions.map((opt, i) => (
                                    <button key={i} className="share-option" onClick={opt.action}>
                                        <span className="share-option-icon">{opt.icon}</span>
                                        <span className="share-option-label">{opt.label}</span>
                                    </button>
                                ))}
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>

            <AnimatePresence>
                {toast && (
                    <motion.div
                        className="share-toast"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 20 }}
                    >
                        {toast}
                    </motion.div>
                )}
            </AnimatePresence>
        </>
    )
}

function getShareText(type: ShareCardType, data: ShareCardData): string {
    switch (type) {
        case 'chapter':
            return `🎉 أكملت ${data.title || 'فصل جديد'} في كتاب PromptMaster! 🤖`
        case 'achievement':
            return `🏅 حققت إنجاز "${data.title}" في كتاب PromptMaster! 🤖`
        case 'streak':
            return `🔥 سلسلة ${data.subtitle || ''} في كتاب PromptMaster! 🤖`
        case 'weekly':
            return `📊 ملخصي الأسبوعي من كتاب PromptMaster 🤖`
        default:
            return `تعلّمت حاجة جديدة في كتاب PromptMaster! 🤖`
    }
}
