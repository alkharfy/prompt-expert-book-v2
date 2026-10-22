'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import Navigation from '@/components/Navigation'
import LiveCountdown from '@/components/live/LiveCountdown'
import { SUPPORT_WHATSAPP_DISPLAY, supportWhatsAppUrl } from '@/lib/config'
import { sessionHoursLabel } from '@/lib/live'
import '@/styles/live.css'

interface LiveState {
    loggedIn: boolean
    /** Their latest seat — may be a cohort that already started. */
    seat: { cohortId: string; dates: string; startsAt: string; running: boolean } | null
}

export default function LiveWelcomePage() {
    const [state, setState] = useState<LiveState | null>(null)
    const [error, setError] = useState(false)

    useEffect(() => {
        fetch('/api/live/status', { cache: 'no-store' })
            .then(r => r.ok ? r.json() : Promise.reject(r.status))
            .then(setState)
            .catch(() => setError(true))
    }, [])

    const seat = state?.seat
    const ended = !!seat && !seat.running && new Date(seat.startsAt).getTime() <= Date.now()
    const support = (
        <a href={supportWhatsAppUrl('السلام عليكم، أنا محجوز في تحدّي الـ٣ أيام وعندي سؤال')} target="_blank" rel="noopener noreferrer" dir="ltr">{SUPPORT_WHATSAPP_DISPLAY}</a>
    )

    return (
        <>
            <Navigation />
            <main className="live-page live-checkout">
                {!state && !error && <p className="live-sub">ثانية واحدة…</p>}

                {error && (
                    <section className="live-hero">
                        <h2>مقدرناش نحمّل حجزك</h2>
                        <p className="live-sub">حدّث الصفحة. ولو المشكلة فضلت كلّمنا واتساب على {support}</p>
                    </section>
                )}

                {seat && ended && (
                    <section className="live-hero">
                        <span className="live-kicker">✓ حضرت دفعة {seat.dates}</span>
                        <h2>التحدّي بتاعك خلص</h2>
                        <p className="live-sub">التسجيلات والملفات الجاهزة لسه معاك، ترجعلها وقت ما تحب. ولو مش لاقيها كلّمنا واتساب على {support}</p>
                        <p className="live-sub live-help"><Link href="/live" className="live-link">الدفعة الجاية</Link></p>
                    </section>
                )}

                {seat && !ended && (
                    <section className="live-hero">
                        <span className="live-kicker">✓ مكانك محجوز</span>
                        <h2>أهلًا بيك في تحدّي الـ٣ أيام</h2>
                        <p className="live-sub">الدفعة {seat.dates}، {sessionHoursLabel()} بتوقيت القاهرة.</p>
                        {seat.running ? (
                            <p className="live-sub"><b>التحدّي شغّال دلوقتي.</b> رابط اللايف على الواتساب بتاعك.</p>
                        ) : (
                            <div className="live-hero-count">
                                <small>باقي على أول يوم</small>
                                <LiveCountdown target={seat.startsAt} />
                            </div>
                        )}
                        <ol className="live-days live-next">
                            <li><h3>هيوصلك على الواتساب</h3><p>رابط اللايف وجروب المتابعة، قبل أول يوم.</p></li>
                            <li><h3>جهّز قبل أول يوم</h3><p>اشتراك Claude Pro شغّال على جهازك، ومهمة واحدة بتتكرر في شغلك وعايز تخلص منها.</p></li>
                            <li><h3>محتاج حاجة؟</h3><p>كلّمنا واتساب على{' '}{support}</p></li>
                        </ol>
                    </section>
                )}

                {state && !seat && (
                    <section className="live-hero">
                        <h2>مش لاقيين حجزك</h2>
                        <p className="live-sub">
                            {state.loggedIn
                                ? 'لو لسه دافع، استنى دقيقة وحدّث الصفحة. ولو المشكلة فضلت كلّمنا واتساب.'
                                : 'سجّل دخول بالحساب اللي حجزت بيه.'}
                        </p>
                        {!state.loggedIn && <Link href={`/login?next=${encodeURIComponent('/live/welcome')}`} className="live-cta"><b>سجّل دخول</b></Link>}
                        <p className="live-sub live-help"><Link href="/live" className="live-link">تفاصيل التحدّي</Link></p>
                    </section>
                )}
            </main>
        </>
    )
}
