import type { Metadata } from 'next'
import Link from 'next/link'
import Navigation from '@/components/Navigation'
import LiveCountdown from '@/components/live/LiveCountdown'
import { arabicDigits, cairoDayLabel, cohortDatesLabel, livePricing, sessionHoursLabel } from '@/lib/live'
import {
    LIVE_COMPARE, LIVE_DAYS_PLAN, LIVE_FAQ, LIVE_FINAL, LIVE_HERO, LIVE_INCLUDES, LIVE_OBJECTIONS, LIVE_PRESENTER, LIVE_WHY,
} from '@/data/liveData'
import '@/styles/live.css'

// The price and the cohort move on fixed Cairo dates; re-render every minute so the page
// never shows an old price for long (checkout always charges the live price anyway).
export const revalidate = 60

export const metadata: Metadata = {
    title: 'تحدّي ٣ أيام لايف',
    description: 'تحدّي لايف ٣ أيام مع د. خليفة الخارفي: اعمل فريق موظفين على Claude يخلّص شغلك المتكرر، ويشتغل لوحده حتى وجهازك مقفول.',
}

const CHECKOUT_HREF = '/live/checkout'

function Cta({ small = false }: { small?: boolean }) {
    return (
        <Link href={CHECKOUT_HREF} className={`live-cta${small ? ' small' : ''}`}>
            <b>احجز مكانك في الدفعة الجاية</b>
            {!small && <small>ادفع بالفيزا أو بمحفظة الموبايل</small>}
        </Link>
    )
}

export default function LivePage() {
    const { cohort, phase, phaseEndsAt, next } = livePricing()
    const dates = cohortDatesLabel(cohort)
    const price = arabicDigits(phase.price)
    const target = cohort.startsAt.toISOString()
    const ladder = next
        ? `السعر ده لحد ${cairoDayLabel(new Date(phaseEndsAt!.getTime() - 1))}، وبعدها ${arabicDigits(next.price)} جنيه.`
        : 'ده آخر سعر للدفعة دي، والحجز بيقفل أول ما اليوم الأول يبدأ.'
    const priceTag = (
        <div>
            <span className="live-chip">{phase.label}</span>
            <p className="live-price-num"><b>{price}</b> جنيه</p>
            <p className="live-price-note">{ladder}</p>
        </div>
    )

    return (
        <>
            <Navigation />
            <div className="live-bar">
                <span className="live-bar-dot" aria-hidden="true" />
                <span className="live-bar-title">تحدّي لايف ٣ أيام <em>{dates}</em></span>
                <LiveCountdown target={target} compact />
                <Cta small />
            </div>

            <main className="live-page">
                <section className="live-hero">
                    <span className="live-kicker">{LIVE_HERO.kicker} · {dates}</span>
                    <h1>
                        {LIVE_HERO.title[0]} <span>{LIVE_HERO.title[1]}</span> {LIVE_HERO.title[2]}
                    </h1>
                    <p>{LIVE_HERO.sub}</p>
                    <div className="live-hero-count">
                        <small>باقي على أول يوم</small>
                        <LiveCountdown target={target} />
                    </div>
                </section>

                <section className="live-price" aria-label="السعر">
                    {priceTag}
                    <Cta />
                </section>

                <section className="live-section">
                    <h2>{LIVE_COMPARE.title} <span>{LIVE_COMPARE.accent}</span></h2>
                    <p className="live-sub">{LIVE_COMPARE.note}</p>
                    <div className="live-compare">
                        {[LIVE_COMPARE.without, LIVE_COMPARE.with].map((side, i) => (
                            <div key={side.head} className={`live-side ${i ? 'yes' : 'no'}`}>
                                <h3>{side.head}</h3>
                                <small>{side.tag}</small>
                                <ul>
                                    {side.items.map(item => <li key={item}>{item}</li>)}
                                </ul>
                            </div>
                        ))}
                    </div>
                </section>

                <section className="live-strip">
                    <p>ابدأ دلوقتي بـ <b>{price} جنيه</b>. {ladder}</p>
                    <Cta small />
                </section>

                <section className="live-section">
                    <h2>{LIVE_WHY.title}</h2>
                    <p className="live-sub">{LIVE_WHY.sub}</p>
                    <ol className="live-cards">
                        {LIVE_WHY.cards.map(c => (
                            <li key={c.title}><h3>{c.title}</h3><p>{c.text}</p></li>
                        ))}
                    </ol>
                </section>

                <section className="live-section">
                    <h2>خطة الـ٣ أيام</h2>
                    <p className="live-sub">ساعتين كل يوم، {sessionHoursLabel()} بتوقيت القاهرة.</p>
                    <ol className="live-days">
                        {LIVE_DAYS_PLAN.map((d, i) => (
                            <li key={d.title}>
                                <span className="live-day-date">اليوم {arabicDigits(i + 1)} · {cairoDayLabel(cohort.sessions[i])}</span>
                                <h3>{d.title}</h3>
                                <p>{d.text}</p>
                                <p className="live-day-out"><b>هتطلع بـ:</b> {d.outcome}</p>
                            </li>
                        ))}
                    </ol>
                </section>

                <section className="live-section">
                    <h2>هتاخد إيه؟</h2>
                    <ul className="live-includes">
                        {LIVE_INCLUDES.map(x => <li key={x.title}><b>{x.title}</b><span>{x.text}</span></li>)}
                    </ul>
                    <div className="live-price center">
                        {priceTag}
                        <Cta />
                    </div>
                </section>

                <section className="live-section">
                    <h2>يمكن بتقول لنفسك دلوقتي…</h2>
                    <div className="live-qa">
                        {LIVE_OBJECTIONS.map(o => (
                            <div key={o.q}><h3>«{o.q}»</h3><p>{o.a}</p></div>
                        ))}
                    </div>
                </section>

                <section className="live-section live-presenter">
                    <span className="live-kicker">مقدّم التحدّي</span>
                    <h2>{LIVE_PRESENTER.name}</h2>
                    <p className="live-sub">{LIVE_PRESENTER.role}</p>
                    {LIVE_PRESENTER.bio.map(line => <p key={line}>{line}</p>)}
                </section>

                <section className="live-section live-final">
                    <h2>{LIVE_FINAL.title}</h2>
                    <p className="live-sub">{LIVE_FINAL.text} الدفعة الجاية {dates}، بـ {price} جنيه دلوقتي.</p>
                    <Cta />
                </section>

                <section className="live-section">
                    <h2>أسئلة بتتسأل كتير</h2>
                    <div className="live-faq">
                        {LIVE_FAQ.map(f => (
                            <details key={f.q}><summary>{f.q}</summary><p>{f.a}</p></details>
                        ))}
                    </div>
                </section>
            </main>
        </>
    )
}
