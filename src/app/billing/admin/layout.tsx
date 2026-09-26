'use client'

/**
 * Admin Panel Layout
 *
 * تخطيط لوحة الإدارة مع sidebar وحماية الوصول.
 * يتحقق من صلاحية الأدمن عبر API يستخدم service_role لتجاوز RLS.
 *
 * @module app/admin/layout
 */

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function AdminLayout({ children }: { children: React.ReactNode }) {
    const router = useRouter()
    const [isAdmin, setIsAdmin] = useState<boolean | null>(null)
    const [currentPath, setCurrentPath] = useState(() => {
        if (typeof window !== 'undefined') return window.location.pathname
        return ''
    })

    useEffect(() => {
        const checkAdminAccess = async () => {
            try {
                // التحقق من صلاحية الأدمن عبر API (يستخدم service_role + ebook_user_id cookie)
                const response = await fetch('/api/admin/check-access')
                const data = await response.json()

                if (!data.isAdmin) {
                    console.warn('Admin check failed:', data.reason)
                    if (data.reason === 'no_user') {
                        router.push('/login?next=/billing/admin')
                    } else {
                        router.push('/')
                    }
                    return
                }

                setIsAdmin(true)
            } catch (error) {
                console.error('Admin access check failed:', error)
                router.push('/')
            }
        }

        checkAdminAccess()
    }, [router])

    if (isAdmin === null) {
        return (
            <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                minHeight: '100vh',
                backgroundColor: '#0a0a1a',
                color: '#e5e7eb',
                fontFamily: 'var(--font-cairo)',
            }}>
                <div style={{ textAlign: 'center' }}>
                    <div style={{
                        width: '48px',
                        height: '48px',
                        border: '3px solid rgba(139, 92, 246, 0.2)',
                        borderTopColor: '#8b5cf6',
                        borderRadius: '50%',
                        animation: 'spin 0.8s linear infinite',
                        margin: '0 auto 1rem',
                    }} />
                    <p style={{ color: '#9ca3af', fontSize: '1rem' }}>جاري التحقق من الصلاحيات...</p>
                    <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
                </div>
            </div>
        )
    }

    if (!isAdmin) {
        return null
    }

    const navItems = [
        { href: '/billing/admin/dashboard', label: 'لوحة التحكم', icon: '📊' },
        { href: '/billing/admin/plans', label: 'إدارة الباقات', icon: '📦' },
        { href: '/billing/admin/promos', label: 'أكواد الخصم', icon: '🏷️' },
        { href: '/billing/admin/subscriptions', label: 'الاشتراكات', icon: '💳' },
        { href: '/billing/admin/testimonials', label: 'شهادات العملاء', icon: '⭐' },
        { href: '/billing/admin/site-stats', label: 'إحصائيات الموقع', icon: '📈' },
        { href: '/billing/admin/chat', label: 'إحصائيات الشات', icon: '💬' },
    ]

    return (
        <div style={{ display: 'flex', minHeight: '100vh', fontFamily: 'var(--font-cairo)', direction: 'rtl' }}>
            {/* Sidebar */}
            <aside
                style={{
                    width: '260px',
                    background: 'linear-gradient(180deg, #0f0a2e 0%, #1a1040 50%, #0f0a2e 100%)',
                    color: '#fff',
                    padding: '0',
                    borderLeft: '1px solid rgba(139, 92, 246, 0.15)',
                    display: 'flex',
                    flexDirection: 'column',
                    position: 'sticky',
                    top: 0,
                    height: '100vh',
                    overflowY: 'auto',
                }}
            >
                {/* Header */}
                <div style={{
                    padding: '1.5rem 1.25rem',
                    borderBottom: '1px solid rgba(139, 92, 246, 0.12)',
                }}>
                    <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.75rem',
                        marginBottom: '0.25rem',
                    }}>
                        <div style={{
                            width: '40px',
                            height: '40px',
                            borderRadius: '10px',
                            background: 'linear-gradient(135deg, #8b5cf6 0%, #6d28d9 100%)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: '1.25rem',
                        }}>🛠️</div>
                        <div>
                            <h2 style={{ fontSize: '1.1rem', fontWeight: 700, margin: 0, letterSpacing: '-0.01em' }}>
                                لوحة الإدارة
                            </h2>
                            <p style={{ fontSize: '0.75rem', color: '#8b5cf6', margin: 0 }}>PromptMaster</p>
                        </div>
                    </div>
                </div>

                {/* Navigation */}
                <nav style={{ padding: '1rem 0.75rem', flex: 1 }}>
                    <p style={{ fontSize: '0.7rem', fontWeight: 600, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.05em', padding: '0 0.5rem', marginBottom: '0.5rem' }}>القائمة الرئيسية</p>
                    {navItems.map((item) => {
                        const isActive = currentPath === item.href || currentPath.startsWith(item.href + '/')
                        return (
                            <Link
                                key={item.href}
                                href={item.href}
                                onClick={() => setCurrentPath(item.href)}
                                style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '0.75rem',
                                    padding: '0.7rem 0.85rem',
                                    marginBottom: '0.25rem',
                                    borderRadius: '10px',
                                    backgroundColor: isActive
                                        ? 'rgba(139, 92, 246, 0.15)'
                                        : 'transparent',
                                    color: isActive ? '#c4b5fd' : '#9ca3af',
                                    textDecoration: 'none',
                                    transition: 'all 0.2s ease',
                                    fontSize: '0.9rem',
                                    fontWeight: isActive ? 600 : 400,
                                    borderRight: isActive ? '3px solid #8b5cf6' : '3px solid transparent',
                                }}
                                onMouseEnter={(e) => {
                                    if (!isActive) {
                                        e.currentTarget.style.backgroundColor = 'rgba(139, 92, 246, 0.08)'
                                        e.currentTarget.style.color = '#d1d5db'
                                    }
                                }}
                                onMouseLeave={(e) => {
                                    if (!isActive) {
                                        e.currentTarget.style.backgroundColor = 'transparent'
                                        e.currentTarget.style.color = '#9ca3af'
                                    }
                                }}
                            >
                                <span style={{ fontSize: '1.15rem', width: '24px', textAlign: 'center' }}>{item.icon}</span>
                                <span>{item.label}</span>
                            </Link>
                        )
                    })}
                </nav>

                {/* Footer */}
                <div style={{
                    padding: '1rem 1.25rem',
                    borderTop: '1px solid rgba(139, 92, 246, 0.12)',
                }}>
                    <Link
                        href="/"
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.5rem',
                            color: '#8b5cf6',
                            textDecoration: 'none',
                            fontSize: '0.85rem',
                            padding: '0.5rem 0.5rem',
                            borderRadius: '8px',
                            transition: 'all 0.2s',
                        }}
                        onMouseEnter={(e) => {
                            e.currentTarget.style.backgroundColor = 'rgba(139, 92, 246, 0.1)'
                        }}
                        onMouseLeave={(e) => {
                            e.currentTarget.style.backgroundColor = 'transparent'
                        }}
                    >
                        <span>→</span>
                        <span>العودة للموقع</span>
                    </Link>
                </div>
            </aside>

            {/* Main Content */}
            <main
                style={{
                    flex: 1,
                    padding: '2rem 2.5rem',
                    backgroundColor: '#0a0a1a',
                    color: '#e5e7eb',
                    overflowY: 'auto',
                    minHeight: '100vh',
                }}
            >
                {children}
            </main>
        </div>
    )
}
