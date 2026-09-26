'use client'

import { useState, useEffect, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import Navigation from '@/components/Navigation'
import '@/app/auth.css'

function UnsubscribeContent() {
    const searchParams = useSearchParams()
    const token = searchParams.get('token')
    const type = searchParams.get('type') || 'all'

    const [status, setStatus] = useState<'loading' | 'confirm' | 'done' | 'error'>('confirm')
    const [message, setMessage] = useState('')
    const [processing, setProcessing] = useState(false)

    // Auto-process if coming from email link
    useEffect(() => {
        if (!token) {
            setStatus('error')
            setMessage('رابط غير صالح')
        }
    }, [token])

    const handleUnsubscribe = async (unsubType: string) => {
        if (!token) return
        setProcessing(true)
        try {
            const res = await fetch('/api/email/unsubscribe', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ token, type: unsubType }),
            })
            const data = await res.json()
            if (data.ok) {
                setStatus('done')
                setMessage(data.message)
            } else {
                setStatus('error')
                setMessage(data.error || 'حدث خطأ')
            }
        } catch {
            setStatus('error')
            setMessage('حدث خطأ في الاتصال')
        }
        setProcessing(false)
    }

    const typeLabels: Record<string, string> = {
        all: 'كل الإيميلات',
        streak: 'تذكيرات الـ Streak',
        missions: 'تذكيرات المهام اليومية',
        recap: 'الملخص الأسبوعي',
        milestone: 'إيميلات التهنئة',
        upgrade: 'رسائل الترقية',
        cart_recovery: 'تذكير إكمال الاشتراك',
    }

    return (
        <main className="auth-container">
            <Navigation />
            <div style={{
                maxWidth: '500px',
                margin: '60px auto',
                padding: '0 20px',
                textAlign: 'center',
            }}>
                {status === 'confirm' && (
                    <div style={{
                        background: '#111',
                        border: '1px solid rgba(255,107,53,0.2)',
                        borderRadius: '16px',
                        padding: '40px 30px',
                    }}>
                        <div style={{ fontSize: '64px', marginBottom: '20px' }}>😢</div>
                        <h1 style={{ color: '#FF6B35', fontSize: '24px', marginBottom: '12px' }}>
                            هل أنت متأكد؟
                        </h1>
                        <p style={{ color: '#aaa', fontSize: '15px', lineHeight: '1.7', marginBottom: '24px' }}>
                            {type === 'all'
                                ? 'هل تريد إلغاء كل الإيميلات؟ مش هنقدر نفكّرك بإنجازاتك وتقدمك 😔'
                                : `هل تريد إلغاء ${typeLabels[type] || type}؟`}
                        </p>

                        {/* Main unsubscribe button */}
                        <button
                            onClick={() => handleUnsubscribe(type)}
                            disabled={processing}
                            style={{
                                background: 'rgba(255,59,48,0.15)',
                                color: '#ff3b30',
                                border: '1px solid rgba(255,59,48,0.3)',
                                borderRadius: '10px',
                                padding: '12px 24px',
                                fontSize: '15px',
                                cursor: processing ? 'not-allowed' : 'pointer',
                                marginBottom: '16px',
                                width: '100%',
                            }}
                        >
                            {processing ? 'جاري المعالجة...' : `إلغاء ${typeLabels[type] || type}`}
                        </button>

                        {/* Alternative: reduce frequency */}
                        {type === 'all' && (
                            <>
                                <div style={{
                                    color: '#888',
                                    fontSize: '13px',
                                    margin: '16px 0',
                                }}>
                                    أو يمكنك تقليل عدد الإيميلات بدلاً من إلغائها:
                                </div>
                                <button
                                    onClick={() => handleUnsubscribe('reduce')}
                                    disabled={processing}
                                    style={{
                                        background: 'rgba(255,107,53,0.15)',
                                        color: '#FF6B35',
                                        border: '1px solid rgba(255,107,53,0.3)',
                                        borderRadius: '10px',
                                        padding: '12px 24px',
                                        fontSize: '15px',
                                        cursor: processing ? 'not-allowed' : 'pointer',
                                        width: '100%',
                                        marginBottom: '12px',
                                    }}
                                >
                                    📉 قلل إلى مرة واحدة أسبوعياً
                                </button>

                                {/* Specific types */}
                                <div style={{
                                    color: '#888',
                                    fontSize: '13px',
                                    margin: '16px 0',
                                }}>
                                    أو ألغِ نوع معين فقط:
                                </div>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                    {['streak', 'missions', 'recap', 'milestone'].map(t => (
                                        <button
                                            key={t}
                                            onClick={() => handleUnsubscribe(t)}
                                            disabled={processing}
                                            style={{
                                                background: 'transparent',
                                                color: '#aaa',
                                                border: '1px solid rgba(255,255,255,0.1)',
                                                borderRadius: '8px',
                                                padding: '10px 16px',
                                                fontSize: '14px',
                                                cursor: processing ? 'not-allowed' : 'pointer',
                                            }}
                                        >
                                            إلغاء {typeLabels[t]} فقط
                                        </button>
                                    ))}
                                </div>
                            </>
                        )}
                    </div>
                )}

                {status === 'done' && (
                    <div style={{
                        background: '#111',
                        border: '1px solid rgba(52,199,89,0.3)',
                        borderRadius: '16px',
                        padding: '40px 30px',
                    }}>
                        <div style={{ fontSize: '64px', marginBottom: '20px' }}>✅</div>
                        <h1 style={{ color: '#34c759', fontSize: '24px', marginBottom: '12px' }}>
                            تم بنجاح
                        </h1>
                        <p style={{ color: '#aaa', fontSize: '15px', lineHeight: '1.7' }}>
                            {message}
                        </p>
                        <p style={{ color: '#666', fontSize: '13px', marginTop: '16px' }}>
                            يمكنك إعادة تفعيل الإيميلات من <a href="/profile" style={{ color: '#FF6B35' }}>صفحة الملف الشخصي</a>
                        </p>
                    </div>
                )}

                {status === 'error' && (
                    <div style={{
                        background: '#111',
                        border: '1px solid rgba(255,59,48,0.3)',
                        borderRadius: '16px',
                        padding: '40px 30px',
                    }}>
                        <div style={{ fontSize: '64px', marginBottom: '20px' }}>❌</div>
                        <h1 style={{ color: '#ff3b30', fontSize: '24px', marginBottom: '12px' }}>
                            خطأ
                        </h1>
                        <p style={{ color: '#aaa', fontSize: '15px' }}>{message}</p>
                    </div>
                )}
            </div>
        </main>
    )
}

export default function UnsubscribePage() {
    return (
        <Suspense fallback={
            <main className="auth-container">
                <Navigation />
                <div style={{ maxWidth: '500px', margin: '60px auto', padding: '0 20px', textAlign: 'center', color: '#aaa' }}>
                    جاري التحميل...
                </div>
            </main>
        }>
            <UnsubscribeContent />
        </Suspense>
    )
}
