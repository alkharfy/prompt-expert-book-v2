'use client'

import { useState, useEffect, Suspense, useCallback } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Navigation from '@/components/Navigation'
import { trackPurchase } from '@/lib/meta-pixel'
import { trackPurchase as trackGA4Purchase, trackPaymentCompleted, trackPaymentFailed, trackFunnelStep, trackGoogleAdsConversion } from '@/lib/analytics'
import '@/app/auth.css'
import '../payment.css'

function CallbackContent() {
    const router = useRouter()
    const searchParams = useSearchParams()
    // Kashier may send different param names depending on redirect method.
    // Check all known variations.
    const paymentStatus = searchParams.get('paymentStatus') || searchParams.get('status')
    const sessionId = searchParams.get('sessionId') || searchParams.get('kashierSessionId')
    const merchantOrderId = searchParams.get('merchantOrderId') || searchParams.get('orderId')
    const transactionId = searchParams.get('transactionId')

    const [status, setStatus] = useState<'loading' | 'success' | 'failed'>('loading')
    const [error, setError] = useState('')

    const verifyPayment = useCallback(async () => {
        // إذا كاشير أرسل حالة الفشل مباشرة
        if (paymentStatus === 'FAILED' || paymentStatus === 'failed') {
            setStatus('failed')
            setError('تم إلغاء عملية الدفع أو فشلت')
            trackPaymentFailed('unknown', 'kashier_redirect_failed')
            return
        }

        // Retry mechanism: Kashier may not have updated the payment status yet
        // when the user is redirected back. Try up to 4 times with delays.
        const MAX_RETRIES = 4
        const RETRY_DELAYS = [0, 3000, 5000, 8000] // 0s, 3s, 5s, 8s

        for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
            if (attempt > 0) {
                await new Promise(resolve => setTimeout(resolve, RETRY_DELAYS[attempt]))
            }

            try {
                const response = await fetch('/api/payment/process-callback', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        paymentStatus,
                        sessionId,
                        merchantOrderId,
                        transactionId,
                    })
                })

                const data = await response.json()

                if (data.success) {
                    const paidAmount = typeof data.amount === 'number' ? data.amount : undefined
                    const paidPlan = data.planId || 'book'
                    const paidOrder = data.orderId || merchantOrderId || sessionId || undefined
                    trackPurchase(paidAmount, paidOrder)
                    trackGA4Purchase(paidAmount, paidOrder)
                    trackPaymentCompleted(paidPlan, paidAmount ?? 0)
                    trackGoogleAdsConversion(paidAmount ?? 0, paidOrder)
                    trackFunnelStep('purchase_complete', 6)
                    setStatus('success')
                    setTimeout(() => {
                        window.location.href = '/toc'
                    }, 2500)
                    return
                }

                // If last attempt via process-callback, try the activate endpoint
                // (webhook may have already processed the payment)
                if (attempt === MAX_RETRIES - 1) {
                    try {
                        const activateRes = await fetch('/api/payment/activate', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({})
                        })
                        const activateData = await activateRes.json()
                        if (activateData.success && activateData.hasPaid) {
                            const paidAmount = typeof activateData.amount === 'number' ? activateData.amount : undefined
                            const paidPlan = activateData.planId || 'book'
                            const paidOrder = activateData.orderId || merchantOrderId || sessionId || undefined
                            trackPurchase(paidAmount, paidOrder)
                            trackGA4Purchase(paidAmount, paidOrder)
                            trackPaymentCompleted(paidPlan, paidAmount ?? 0)
                            trackGoogleAdsConversion(paidAmount ?? 0, paidOrder)
                            trackFunnelStep('purchase_complete', 6)
                            setStatus('success')
                            setTimeout(() => {
                                window.location.href = '/toc'
                            }, 2500)
                            return
                        }
                    } catch { /* activate also failed */ }

                    setStatus('failed')
                    setError(data.error || 'لم يتم التحقق من الدفع — يرجى الانتظار دقيقة والضغط على إعادة التحقق')
                }
            } catch {
                if (attempt === MAX_RETRIES - 1) {
                    // Last resort: try activate endpoint
                    try {
                        const activateRes = await fetch('/api/payment/activate', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({})
                        })
                        const activateData = await activateRes.json()
                        if (activateData.success && activateData.hasPaid) {
                            const paidAmount = typeof activateData.amount === 'number' ? activateData.amount : undefined
                            const paidPlan = activateData.planId || 'book'
                            const paidOrder = activateData.orderId || merchantOrderId || sessionId || undefined
                            trackPurchase(paidAmount, paidOrder)
                            trackGA4Purchase(paidAmount, paidOrder)
                            trackPaymentCompleted(paidPlan, paidAmount ?? 0)
                            trackGoogleAdsConversion(paidAmount ?? 0, paidOrder)
                            trackFunnelStep('purchase_complete', 6)
                            setStatus('success')
                            setTimeout(() => {
                                window.location.href = '/toc'
                            }, 2500)
                            return
                        }
                    } catch { /* ignore */ }

                    setStatus('failed')
                    setError('حدث خطأ في التحقق من الدفع')
                }
            }
        }
    }, [paymentStatus, sessionId, merchantOrderId, transactionId])

    useEffect(() => {
        verifyPayment()
    }, [verifyPayment])

    const handleRetry = () => {
        // Try verification again instead of going back to payment
        setStatus('loading')
        setError('')
        verifyPayment()
    }

    const handleBackToPayment = () => {
        router.push('/payment')
    }

    return (
        <main className="auth-container">
            <Navigation />

            <div className="callback-card">
                {status === 'loading' && (
                    <div className="callback-status">
                        <div className="callback-spinner">
                            <div className="spinner-ring"></div>
                        </div>
                        <h2 className="callback-title">جاري التحقق من الدفع...</h2>
                        <p className="callback-text">يرجى الانتظار بينما نتحقق من حالة عملية الدفع</p>
                    </div>
                )}

                {status === 'success' && (
                    <div className="callback-status">
                        <div className="callback-icon success">
                            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                                <polyline points="22 4 12 14.01 9 11.01"></polyline>
                            </svg>
                        </div>
                        <h2 className="callback-title success-text">تم الدفع وتفعيل حسابك بنجاح! 🎉</h2>
                        <p className="callback-text">
                            سيتم تحويلك الآن لصفحة الفهرس لبدء القراءة...
                        </p>
                        <div className="callback-redirect-bar">
                            <div className="redirect-progress"></div>
                        </div>
                    </div>
                )}

                {status === 'failed' && (
                    <div className="callback-status">
                        <div className="callback-icon failed">
                            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <circle cx="12" cy="12" r="10"></circle>
                                <line x1="15" y1="9" x2="9" y2="15"></line>
                                <line x1="9" y1="9" x2="15" y2="15"></line>
                            </svg>
                        </div>
                        <h2 className="callback-title failed-text">لم يتم تأكيد الدفع</h2>
                        <p className="callback-text">{error}</p>
                        <div className="callback-actions">
                            <button className="payment-btn" onClick={handleRetry}>
                                إعادة التحقق
                            </button>
                            <button
                                className="callback-btn-secondary"
                                onClick={handleBackToPayment}
                            >
                                إعادة الدفع
                            </button>
                            <button
                                className="callback-btn-secondary"
                                onClick={() => router.push('/')}
                            >
                                العودة للرئيسية
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </main>
    )
}

export default function PaymentCallbackPage() {
    return (
        <Suspense fallback={<div className="auth-container"><div className="auth-loader"></div></div>}>
            <CallbackContent />
        </Suspense>
    )
}
