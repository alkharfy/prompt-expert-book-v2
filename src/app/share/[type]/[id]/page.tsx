import { Metadata } from 'next'
import Link from 'next/link'
import { SITE_URL, SITE_DOMAIN } from '@/lib/config'
import '@/styles/sharing.css'

interface SharePageProps {
    params: Promise<{ type: string; id: string }>
}

export async function generateMetadata({ params }: SharePageProps): Promise<Metadata> {
    const { type, id } = await params
    const title = decodeURIComponent(id)
    const descriptions: Record<string, string> = {
        chapter: `🎉 أكملت "${title}" في كتاب PromptMaster!`,
        achievement: `🏅 حققت إنجاز "${title}" في كتاب PromptMaster!`,
        streak: `🔥 سلسلة ${title} في كتاب PromptMaster!`,
        weekly: `📊 ملخصي الأسبوعي من كتاب PromptMaster`,
    }

    const ogImageUrl = `${SITE_URL}/api/share/og/${type}?title=${encodeURIComponent(title)}`

    return {
        title: `PromptMaster — ${title}`,
        description: descriptions[type] || 'كتاب PromptMaster — تعلم البرومبت بأسلوب عملي!',
        openGraph: {
            title: `PromptMaster — ${title}`,
            description: descriptions[type] || 'تعلم البرومبت بأسلوب عملي!',
            siteName: 'PromptMaster',
            type: 'website',
            images: [{ url: ogImageUrl, width: 1200, height: 630, alt: title }],
        },
        twitter: {
            card: 'summary_large_image',
            title: `PromptMaster — ${title}`,
            description: descriptions[type] || 'تعلم البرومبت بأسلوب عملي!',
            images: [ogImageUrl],
        },
    }
}

export default async function SharePage({ params }: SharePageProps) {
    const { type, id } = await params
    const title = decodeURIComponent(id)

    const typeIcons: Record<string, string> = {
        chapter: '📖',
        achievement: '🏅',
        streak: '🔥',
        weekly: '📊',
    }

    const typeLabels: Record<string, string> = {
        chapter: 'أكمل فصل',
        achievement: 'حقق إنجاز',
        streak: 'سلسلة قراءة',
        weekly: 'ملخص أسبوعي',
    }

    return (
        <div className="share-page" dir="rtl">
            {/* Share Card */}
            <div className="share-card-preview">
                <div className="share-card-brand">🤖 PromptMaster</div>
                <div style={{ fontSize: '48px', margin: '16px 0' }}>{typeIcons[type] || '🏆'}</div>
                <h2 className="share-card-title">{typeLabels[type] || 'إنجاز جديد'}</h2>
                <p className="share-card-subtitle">{title}</p>
                <div className="share-card-footer">PromptMaster — {SITE_DOMAIN}</div>
            </div>

            {/* CTA */}
            <div className="share-page-cta">
                <h3>🚀 ابدأ رحلتك أنت كمان!</h3>
                <p>تعلّم إزاي تستخدم الذكاء الاصطناعي باحترافية مع كتاب PromptMaster</p>
                <Link href="/" className="share-page-cta-btn">
                    ابدأ دلوقتي مجاناً
                </Link>
            </div>
        </div>
    )
}
