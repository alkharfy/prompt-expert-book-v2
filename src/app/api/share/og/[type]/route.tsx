import { ImageResponse } from 'next/og'
import { NextRequest } from 'next/server'
import { SITE_DOMAIN } from '@/lib/config'

// =====================================================
// OG Image Generation — /api/share/og/[type]
// Dynamic Open Graph images for social sharing
// Uses @vercel/og (Satori) built into Next.js
// =====================================================

export const runtime = 'edge'

const BRAND_COLOR = '#FF6B35'
const BG_COLOR = '#0a0a0a'
const CARD_BG = '#111111'

function getTypeConfig(type: string) {
    switch (type) {
        case 'chapter':
            return { icon: '📖', defaultTitle: 'أكملت فصل جديد!', color: '#FF6B35' }
        case 'achievement':
            return { icon: '🏅', defaultTitle: 'إنجاز جديد!', color: '#FFD700' }
        case 'streak':
            return { icon: '🔥', defaultTitle: 'سلسلة مستمرة!', color: '#FF4500' }
        case 'weekly':
            return { icon: '📊', defaultTitle: 'ملخص أسبوعي', color: '#00D4AA' }
        default:
            return { icon: '🤖', defaultTitle: 'PromptMaster', color: '#FF6B35' }
    }
}

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ type: string }> }
) {
    try {
        const { type } = await params
        const { searchParams } = request.nextUrl

        // تقييد طول المعاملات لمنع DoS
        const limitParam = (val: string | null, maxLen: number): string =>
            (val || '').substring(0, maxLen)

        const title = limitParam(searchParams.get('title'), 100) || getTypeConfig(type).defaultTitle
        const subtitle = limitParam(searchParams.get('subtitle'), 150)
        const user = limitParam(searchParams.get('user'), 50)
        const stat1 = limitParam(searchParams.get('stat1'), 50)
        const stat2 = limitParam(searchParams.get('stat2'), 50)
        const stat3 = limitParam(searchParams.get('stat3'), 50)

        const config = getTypeConfig(type)

        return new ImageResponse(
            (
                <div
                    style={{
                        width: '1200px',
                        height: '630px',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        backgroundColor: BG_COLOR,
                        fontFamily: 'sans-serif',
                        direction: 'rtl',
                        position: 'relative',
                    }}
                >
                    {/* Background gradient */}
                    <div
                        style={{
                            position: 'absolute',
                            top: 0,
                            left: 0,
                            right: 0,
                            bottom: 0,
                            background: `radial-gradient(ellipse at top, ${config.color}15 0%, transparent 60%)`,
                            display: 'flex',
                        }}
                    />

                    {/* Card */}
                    <div
                        style={{
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            justifyContent: 'center',
                            backgroundColor: CARD_BG,
                            border: `2px solid ${config.color}40`,
                            borderRadius: '24px',
                            padding: '48px 64px',
                            maxWidth: '900px',
                            width: '85%',
                            position: 'relative',
                        }}
                    >
                        {/* Brand header */}
                        <div
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '12px',
                                marginBottom: '24px',
                                fontSize: '24px',
                                color: '#888',
                            }}
                        >
                            <span>🤖</span>
                            <span>PromptMaster</span>
                        </div>

                        {/* Icon */}
                        <div style={{ fontSize: '72px', marginBottom: '16px', display: 'flex' }}>
                            {config.icon}
                        </div>

                        {/* Title */}
                        <div
                            style={{
                                fontSize: '42px',
                                fontWeight: 'bold',
                                color: config.color,
                                textAlign: 'center',
                                marginBottom: '12px',
                                display: 'flex',
                            }}
                        >
                            {title}
                        </div>

                        {/* Subtitle */}
                        {subtitle && (
                            <div
                                style={{
                                    fontSize: '28px',
                                    color: '#ccc',
                                    textAlign: 'center',
                                    marginBottom: '24px',
                                    display: 'flex',
                                }}
                            >
                                {subtitle}
                            </div>
                        )}

                        {/* Stats row */}
                        {(stat1 || stat2 || stat3) && (
                            <div
                                style={{
                                    display: 'flex',
                                    gap: '40px',
                                    marginTop: '16px',
                                    fontSize: '22px',
                                    color: '#aaa',
                                }}
                            >
                                {stat1 && <span style={{ display: 'flex' }}>{stat1}</span>}
                                {stat2 && <span style={{ display: 'flex' }}>{stat2}</span>}
                                {stat3 && <span style={{ display: 'flex' }}>{stat3}</span>}
                            </div>
                        )}

                        {/* User name */}
                        {user && (
                            <div
                                style={{
                                    marginTop: '24px',
                                    fontSize: '20px',
                                    color: '#666',
                                    display: 'flex',
                                }}
                            >
                                — {user}
                            </div>
                        )}
                    </div>

                    {/* Footer */}
                    <div
                        style={{
                            position: 'absolute',
                            bottom: '24px',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px',
                            fontSize: '18px',
                            color: '#555',
                        }}
                    >
                        <span style={{ color: BRAND_COLOR, display: 'flex' }}>{SITE_DOMAIN}</span>
                        <span>—</span>
                        <span>احترف هندسة البرومبت</span>
                    </div>
                </div>
            ),
            {
                width: 1200,
                height: 630,
            }
        )
    } catch (error) {
        console.error('OG Image generation error:', error)
        return new Response('Error generating image', { status: 500 })
    }
}
