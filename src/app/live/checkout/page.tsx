'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import Navigation from '@/components/Navigation'
import { PAYMENT_METHODS_TEXT, SUPPORT_WHATSAPP_DISPLAY, supportWhatsAppUrl } from '@/lib/config'
import { arabicDigits, sessionHoursLabel } from '@/lib/live'
import '@/styles/live.css'

interface LiveState {
    loggedIn: boolean
    enrolled: boolean
    dates: string
    price: number
    phase: string
}

const NEXT = encodeURIComponent('/live/checkout')

export default function LiveCheckoutPage() {
    const [state, setState] = useState<LiveState | null>(null)
    const [whatsapp, setWhatsapp] = useState('')
    const [error, setError] = useState('')
    const [busy, setBusy] = useState(false)

    useEffect(() => {
        fetch('/api/live/status', { cache: 'no-store' })
            .then(r => r.ok ? r.json() : Promise.reject(r.status))
            .then(setState)
            .catch(() => setError('مقدرناش نحمّل البيانات. حدّث الصفحة.'))
    }, [])

    async function pay(e: React.FormEvent) {
        e.preventDefault()
        setError('')
        setBusy(true)
        try {
            const res = await fetch('/api/live/checkout', {
                method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ whatsapp }),
            })
            const data = await res.json()
            if (data.success && data.sessionUrl) {
                window.location.href = data.sessionUrl
                return
            }
            if (data.enrolled) setState(s => s && { ...s, enrolled: true })
            setError(data.error || 'حصل خطأ، جرّب تاني')
        } catch {
            setError('حصل خطأ في الاتصال، جرّب تاني')
        }
        setBusy(false)
    }

    return (
        <>
            <Navigation />
            <main className="live-page live-checkout">
                <span className="live-kicker">تحدّي ٣ أيام لايف</span>
                <h2>احجز مكانك</h2>
                {!state && !error && <p className="live-sub">ثانية واحدة…</p>}

                {state && (
                    <div className="live-price center">
                        <div>
                            <p className="live-sub">الدفعة الجاية {state.dates}، {sessionHoursLabel()} بتوقيت القاهرة</p>
                            <span className="live-chip">{state.phase}</span>
                            <p className="live-price-num"><b>{arabicDigits(state.price)}</b> جنيه</p>
                        </div>

                        {state.enrolled ? (
                            <div className="live-done">
                                <p>✓ انت محجوز في الدفعة دي.</p>
                                <Link href="/live/welcome" className="live-cta"><b>صفحة التحدّي</b></Link>
                            </div>
                        ) : !state.loggedIn ? (
                            <div className="live-done">
                                <p>علشان نحجزلك، محتاجين حساب على الموقع. لو عندك حساب ادخل بيه.</p>
                                <Link href={`/register?next=${NEXT}`} className="live-cta"><b>اعمل حساب في دقيقة</b></Link>
                                <Link href={`/login?next=${NEXT}`} className="live-link">عندي حساب، سجّل دخول</Link>
                            </div>
                        ) : (
                            <form className="live-form" onSubmit={pay}>
                                <label htmlFor="live-wa">رقم الواتساب</label>
                                <input id="live-wa" type="tel" inputMode="tel" dir="ltr" autoComplete="tel" required
                                    placeholder="01012345678" value={whatsapp} onChange={e => setWhatsapp(e.target.value)} />
                                <small>عليه هيوصلك رابط اللايف وجروب المتابعة.</small>
                                <button type="submit" className="live-cta" disabled={busy}>
                                    <b>{busy ? 'بنفتح صفحة الدفع…' : `ادفع ${arabicDigits(state.price)} جنيه`}</b>
                                    <small>{PAYMENT_METHODS_TEXT}</small>
                                </button>
                            </form>
                        )}
                    </div>
                )}

                {error && <p className="live-error" role="alert">{error}</p>}

                <p className="live-sub live-help">
                    وقفت في الدفع؟ كلّمنا واتساب على{' '}
                    <a href={supportWhatsAppUrl('السلام عليكم، عايز أحجز في تحدّي الـ٣ أيام')} target="_blank" rel="noopener noreferrer" dir="ltr">{SUPPORT_WHATSAPP_DISPLAY}</a>
                </p>
                <p className="live-sub"><Link href="/live" className="live-link">ارجع لتفاصيل التحدّي</Link></p>
            </main>
        </>
    )
}
