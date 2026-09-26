'use client'

import { SITE_DOMAIN } from '@/lib/config'
import '@/styles/sharing.css'

export type ShareCardType = 'chapter' | 'weekly' | 'achievement' | 'streak'

interface ShareCardData {
    type: ShareCardType
    title?: string
    subtitle?: string
    icon?: string
    stats?: { label: string; value: string | number }[]
}

interface ShareCardPreviewProps {
    data: ShareCardData
}

export default function ShareCardPreview({ data }: ShareCardPreviewProps) {
    return (
        <div className="share-card-preview" id="share-card-render">
            <div className="share-card-brand">🤖 PromptMaster</div>
            {data.icon && <div style={{ fontSize: '40px', margin: '8px 0' }}>{data.icon}</div>}
            {data.title && <h3 className="share-card-title">{data.title}</h3>}
            {data.subtitle && <p className="share-card-subtitle">{data.subtitle}</p>}
            {data.stats && data.stats.length > 0 && (
                <div className="share-card-stats">
                    {data.stats.map((stat, i) => (
                        <div key={i} className="share-card-stat">
                            <span className="share-card-stat-value">{stat.value}</span>
                            <span className="share-card-stat-label">{stat.label}</span>
                        </div>
                    ))}
                </div>
            )}
            <div className="share-card-footer">PromptMaster — {SITE_DOMAIN}</div>
        </div>
    )
}

export { type ShareCardData }
