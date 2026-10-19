import Link from 'next/link'
import type { Metadata } from 'next'

// Replaces Next.js's default English 404 ("This page could not be found.").
export const metadata: Metadata = {
    title: 'الصفحة دي مش موجودة',
    robots: { index: false },
}

export default function NotFound() {
    return (
        <div style={{
            minHeight: '60vh',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '2rem',
            textAlign: 'center',
            direction: 'rtl',
        }}>
            <p style={{ fontSize: '3rem', fontWeight: 700, color: '#FF6B35', margin: 0 }}>404</p>
            <h1 style={{ fontSize: '1.5rem', margin: '0.5rem 0 1rem' }}>
                الصفحة دي مش موجودة
            </h1>
            <p style={{ color: '#888', marginBottom: '1.5rem' }}>
                ممكن الرابط يكون غلط، أو الصفحة اتنقلت. ارجع للرئيسية أو للفهرس.
            </p>
            <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', justifyContent: 'center' }}>
                <Link href="/" style={{
                    padding: '0.75rem 2rem',
                    backgroundColor: '#FF6B35',
                    color: '#fff',
                    borderRadius: '8px',
                    textDecoration: 'none',
                    fontSize: '1rem',
                }}>
                    الرئيسية
                </Link>
                <Link href="/toc" style={{
                    padding: '0.75rem 2rem',
                    border: '1px solid #FF6B35',
                    color: '#FF6B35',
                    borderRadius: '8px',
                    textDecoration: 'none',
                    fontSize: '1rem',
                }}>
                    فهرس الكورس
                </Link>
            </div>
        </div>
    )
}
