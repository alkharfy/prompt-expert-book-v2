import type { Metadata } from 'next'
import Link from 'next/link'
import Navigation from '@/components/Navigation'
import { WORKSHOPS, isOpen } from '@/data/workshopsData'
import '@/styles/workshops.css'

export const metadata: Metadata = {
    title: 'الورش',
    description: 'ورش قصيرة من PromptMaster، كل واحدة بنتيجة في إيدك: صورة لشغلك من وصف، وفيديو 8 ثواني، ببلاش للكل. وسكريبت إعلان، وصوت مصري، وصورة بتتكلم، والساب إيجنت، وإعلان كامل للمشتركين.',
}

export default function WorkshopsPage() {
    return (
        <>
            <Navigation />
            <main className="ws-page">
                <header className="ws-head">
                    <span className="ws-kicker">🛠️ الورش</span>
                    <h1>ورشة قصيرة، ونتيجة في إيدك</h1>
                    <p>كل ورشة من ربع ساعة لساعة، وبتطلع منها بحاجة واحدة تستخدمها في شغلك: صورة، أو فيديو، أو سكريبت، أو صوت، أو إعلان كامل.</p>
                    <p>ورش الصور والفيديو <strong>ببلاش للكل</strong>، من غير اشتراك. والباقي للمشتركين. وكل ورشة اتجرّبت على حساب مجاني من مصر، ومكتوب عليها آخر مراجعة، لأن الأدوات دي بتتغيّر كل شهر.</p>
                </header>
                <ul className="ws-list">
                    {WORKSHOPS.map(w => {
                        const open = isOpen(w)
                        const inner = (
                            <>
                                <span className="ws-icon" aria-hidden="true">{w.icon}</span>
                                <span>
                                    <b>{w.name}</b>
                                    <small>هتطلع بـ: {w.outcome}</small>
                                    <span className="ws-chips">
                                        <span className={`ws-chip ${w.free ? 'free' : 'paid'}`}>{w.free ? 'ببلاش للكل' : '🔒 للمشتركين'}</span>
                                        <span className="ws-chip">{w.tool}</span>
                                        <span className="ws-chip">{open ? `حوالي ${w.minutes} دقيقة` : '⏳ قريب'}</span>
                                    </span>
                                </span>
                            </>
                        )
                        return (
                            <li key={w.slug}>
                                {open
                                    ? <Link className="ws-tile" href={`/workshops/${w.slug}`}>{inner}</Link>
                                    : <div className="ws-tile soon">{inner}</div>}
                            </li>
                        )
                    })}
                </ul>
            </main>
        </>
    )
}
