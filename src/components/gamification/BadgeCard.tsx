'use client'

import { motion } from 'framer-motion'

interface Badge {
    id: string
    name: string
    description: string
    icon: string
    rarity: 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary'
    earned?: boolean
    earnedAt?: string
    isFeatured?: boolean
}

interface BadgeCardProps {
    badge: Badge
    size?: 'small' | 'medium' | 'large'
    showDescription?: boolean
    onClick?: () => void
}

const rarityColors: Record<string, { border: string; bg: string; glow: string }> = {
    common: { 
        border: 'rgba(156, 163, 175, 0.5)', 
        bg: 'rgba(156, 163, 175, 0.1)',
        glow: 'rgba(156, 163, 175, 0.3)'
    },
    uncommon: { 
        border: 'rgba(34, 197, 94, 0.5)', 
        bg: 'rgba(34, 197, 94, 0.1)',
        glow: 'rgba(34, 197, 94, 0.3)'
    },
    rare: { 
        border: 'rgba(59, 130, 246, 0.5)', 
        bg: 'rgba(59, 130, 246, 0.1)',
        glow: 'rgba(59, 130, 246, 0.3)'
    },
    epic: { 
        border: 'rgba(168, 85, 247, 0.5)', 
        bg: 'rgba(168, 85, 247, 0.1)',
        glow: 'rgba(168, 85, 247, 0.3)'
    },
    legendary: { 
        border: 'rgba(255, 184, 0, 0.6)', 
        bg: 'rgba(255, 184, 0, 0.15)',
        glow: 'rgba(255, 184, 0, 0.4)'
    }
}

const rarityLabels: Record<string, string> = {
    common: 'عادي',
    uncommon: 'غير شائع',
    rare: 'نادر',
    epic: 'ملحمي',
    legendary: 'أسطوري'
}

export default function BadgeCard({ 
    badge, 
    size = 'medium',
    showDescription = true,
    onClick 
}: BadgeCardProps) {
    const colors = rarityColors[badge.rarity] || rarityColors.common
    
    const sizeClasses = {
        small: 'badge-card-small',
        medium: 'badge-card-medium',
        large: 'badge-card-large'
    }

    return (
        <motion.div 
            className={`badge-card ${sizeClasses[size]} ${!badge.earned ? 'badge-locked' : ''} ${badge.isFeatured ? 'badge-featured' : ''}`}
            style={{
                borderColor: badge.earned ? colors.border : 'rgba(255, 255, 255, 0.1)',
                backgroundColor: badge.earned ? colors.bg : 'rgba(255, 255, 255, 0.02)',
                boxShadow: badge.earned ? `0 0 20px ${colors.glow}` : 'none'
            }}
            whileHover={badge.earned ? { scale: 1.05, y: -5 } : {}}
            whileTap={onClick ? { scale: 0.98 } : {}}
            onClick={onClick}
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ type: 'spring', stiffness: 200 }}
        >
            {/* Featured Star */}
            {badge.isFeatured && (
                <span className="badge-featured-star">⭐</span>
            )}

            {/* Icon */}
            <div className={`badge-icon-wrapper ${!badge.earned ? 'grayscale' : ''}`}>
                <span className="badge-icon">{badge.icon}</span>
                {!badge.earned && (
                    <span className="badge-lock">🔒</span>
                )}
            </div>

            {/* Name */}
            <h4 className="badge-name">{badge.name}</h4>

            {/* Rarity */}
            <span 
                className="badge-rarity"
                style={{ color: badge.earned ? colors.border : 'var(--color-text-muted)' }}
            >
                {rarityLabels[badge.rarity]}
            </span>

            {/* Description */}
            {showDescription && (
                <p className="badge-description">{badge.description}</p>
            )}

            {/* Earned Date */}
            {badge.earned && badge.earnedAt && (
                <span className="badge-earned-date">
                    حصلت عليها {new Date(badge.earnedAt).toLocaleDateString('ar-EG')}
                </span>
            )}
        </motion.div>
    )
}

// مكون عرض مجموعة الشارات
interface BadgesGridProps {
    badges: Badge[]
    title?: string
    showLocked?: boolean
    columns?: number
}

export function BadgesGrid({ 
    badges, 
    title,
    showLocked = true,
    columns = 4 
}: BadgesGridProps) {
    const displayBadges = showLocked 
        ? badges 
        : badges.filter(b => b.earned)

    return (
        <div className="badges-section">
            {title && <h3 className="badges-section-title">{title}</h3>}
            <div 
                className="badges-grid"
                style={{ 
                    gridTemplateColumns: `repeat(${columns}, 1fr)` 
                }}
            >
                {displayBadges.map((badge, index) => (
                    <motion.div
                        key={badge.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.05 }}
                    >
                        <BadgeCard badge={badge} size="small" />
                    </motion.div>
                ))}
            </div>
        </div>
    )
}
