import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import Navigation from '@/components/Navigation'
import WorkshopBlocks from '@/components/workshops/WorkshopBlocks'
import { workshopBySlug, isOpen } from '@/data/workshopsData'
import { getServerAccess } from '@/lib/server/access'
import '@/styles/workshops.css'

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
    const workshop = workshopBySlug((await params).slug)
    if (!workshop) return {}
    return {
        title: `${workshop.name} — الورش`,
        description: `${workshop.title} هتطلع بـ: ${workshop.outcome}.`,
        // Paid and unfinished workshops are not for search results.
        robots: workshop.free && isOpen(workshop) ? undefined : { index: false },
    }
}

// Free workshops are open to everyone, guests too. A paid one is checked on the server, and its blocks never
// reach a visitor without a subscription (same rule as the levels: src/lib/server/access.ts).
export default async function WorkshopPage({ params }: { params: Promise<{ slug: string }> }) {
    const workshop = workshopBySlug((await params).slug)
    if (!workshop) notFound()
    const open = isOpen(workshop)
    const { hasAccess } = workshop.free || !open ? { hasAccess: workshop.free } : await getServerAccess()

    return (
        <>
            <Navigation />
            <main className="ws-page">
                <header className="ws-head">
                    <span className="ws-kicker">{workshop.icon} ورشة: {workshop.name} · {workshop.free ? 'ببلاش للكل' : 'للمشتركين'}</span>
                    <h1>{workshop.title}</h1>
                    <p>هتطلع بـ: {workshop.outcome}.</p>
                    <p className="ws-meta">
                        {workshop.tool} · حوالي {workshop.minutes} دقيقة
                        {workshop.reviewed && <> · آخر مراجعة: {workshop.reviewed}</>}
                    </p>
                </header>

                {!open && (
                    <div className="ws-lock">
                        <p>⏳ الورشة دي بنجرّبها دلوقتي على حساب مجاني من مصر، وبتنزل أول ما تخلص.</p>
                        <Link className="ws-btn" href="/workshops">شوف الورش المفتوحة</Link>
                    </div>
                )}
                {open && hasAccess && <WorkshopBlocks slug={workshop.slug} blocks={workshop.blocks} />}
                {open && !hasAccess && (
                    <div className="ws-lock">
                        <p>🔒 الورشة دي للمشتركين. والاشتراك بيفتحلك كمان المستويات الخمسة، و«المستر بيصحّح».</p>
                        <Link className="ws-btn" href="/payment">اشترك وافتحها</Link>
                        <Link className="ws-btn ghost" href={`/login?next=/workshops/${workshop.slug}`}>مشترك؟ سجّل دخول</Link>
                    </div>
                )}

                <Link className="ws-back" href="/workshops">← كل الورش</Link>
            </main>
        </>
    )
}
