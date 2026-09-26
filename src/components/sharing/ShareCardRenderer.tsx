'use client'

import { type ShareCardData, type ShareCardType } from './ShareCardPreview'
import { SITE_DOMAIN } from '@/lib/config'
import '@/styles/sharing.css'

// =====================================================
// ShareCardRenderer — يبني البطاقة كـ React component
// يُستخدم في التصدير كصورة (html2canvas) + OG preview
// =====================================================

interface ShareCardRendererProps {
    type: ShareCardType
    data: ShareCardData
    size?: 'small' | 'medium' | 'large'
}

const TYPE_CONFIG: Record<ShareCardType, { gradient: string; accent: string }> = {
    chapter: { gradient: 'linear-gradient(135deg, #1a0a00 0%, #0a0a0a 50%, #0a1a0a 100%)', accent: '#FF6B35' },
    achievement: { gradient: 'linear-gradient(135deg, #1a1500 0%, #0a0a0a 50%, #1a0a1a 100%)', accent: '#FFD700' },
    streak: { gradient: 'linear-gradient(135deg, #1a0500 0%, #0a0a0a 50%, #1a0000 100%)', accent: '#FF4500' },
    weekly: { gradient: 'linear-gradient(135deg, #001a1a 0%, #0a0a0a 50%, #0a0a1a 100%)', accent: '#00D4AA' },
}

export default function ShareCardRenderer({ type, data, size = 'medium' }: ShareCardRendererProps) {
    const config = TYPE_CONFIG[type] || TYPE_CONFIG.chapter
    const sizeScale = size === 'small' ? 0.7 : size === 'large' ? 1.3 : 1

    return (
        <div
            id="share-card-render"
            className="share-card-renderer"
            style={{
                background: config.gradient,
                border: `2px solid ${config.accent}30`,
                borderRadius: `${16 * sizeScale}px`,
                padding: `${32 * sizeScale}px ${24 * sizeScale}px`,
                width: `${400 * sizeScale}px`,
                textAlign: 'center',
                position: 'relative',
                overflow: 'hidden',
                direction: 'rtl',
            }}
        >
            {/* Glow effect */}
            <div
                style={{
                    position: 'absolute',
                    top: '-50%',
                    left: '-50%',
                    width: '200%',
                    height: '200%',
                    background: `radial-gradient(circle at 50% 30%, ${config.accent}10 0%, transparent 50%)`,
                    pointerEvents: 'none',
                }}
            />

            {/* Brand */}
            <div style={{
                fontSize: `${14 * sizeScale}px`,
                color: '#666',
                marginBottom: `${16 * sizeScale}px`,
                position: 'relative',
            }}>
                🤖 PromptMaster
            </div>

            {/* Icon */}
            {data.icon && (
                <div style={{
                    fontSize: `${48 * sizeScale}px`,
                    marginBottom: `${8 * sizeScale}px`,
                    position: 'relative',
                }}>
                    {data.icon}
                </div>
            )}

            {/* Title */}
            {data.title && (
                <h3 style={{
                    fontSize: `${22 * sizeScale}px`,
                    fontWeight: 'bold',
                    color: config.accent,
                    margin: `0 0 ${8 * sizeScale}px`,
                    position: 'relative',
                }}>
                    {data.title}
                </h3>
            )}

            {/* Subtitle */}
            {data.subtitle && (
                <p style={{
                    fontSize: `${15 * sizeScale}px`,
                    color: '#bbb',
                    margin: `0 0 ${16 * sizeScale}px`,
                    lineHeight: 1.5,
                    position: 'relative',
                }}>
                    {data.subtitle}
                </p>
            )}

            {/* Stats */}
            {data.stats && data.stats.length > 0 && (
                <div style={{
                    display: 'flex',
                    justifyContent: 'center',
                    gap: `${20 * sizeScale}px`,
                    marginTop: `${12 * sizeScale}px`,
                    position: 'relative',
                }}>
                    {data.stats.map((stat, i) => (
                        <div key={i} style={{ textAlign: 'center' }}>
                            <div style={{
                                fontSize: `${20 * sizeScale}px`,
                                fontWeight: 'bold',
                                color: '#fff',
                            }}>
                                {stat.value}
                            </div>
                            <div style={{
                                fontSize: `${11 * sizeScale}px`,
                                color: '#888',
                                marginTop: '2px',
                            }}>
                                {stat.label}
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Footer */}
            <div style={{
                marginTop: `${20 * sizeScale}px`,
                paddingTop: `${12 * sizeScale}px`,
                borderTop: '1px solid rgba(255,255,255,0.08)',
                fontSize: `${11 * sizeScale}px`,
                color: '#555',
                position: 'relative',
            }}>
                PromptMaster — {SITE_DOMAIN}
            </div>
        </div>
    )
}

export { type ShareCardRendererProps }
