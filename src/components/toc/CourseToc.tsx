'use client'

import Link from 'next/link'
import { useEffect, useRef, useState } from 'react'
import { authSystem } from '@/lib/auth_system'
import { useSubscription } from '@/context/SubscriptionContext'
import { useBottomBarOffset } from '@/hooks/useBottomBarOffset'
import { GUEST_LAST_PAGE_KEY } from '@/lib/onboarding'
import { MONTHLY_PRICE_EGP } from '@/lib/pricing'
import { trackCtaClick } from '@/lib/analytics'
import { BOOK_CHAPTERS, COURSE_EXTRAS, COURSE_LEVELS, bookChapterHref, isReleased, lessonHref } from '@/data/courseOutline'
import { buildToc, lessonsWord, type LevelState, type TocInput, type TocView } from '@/lib/tocProgress'

/**
 * Course TOC: on laptops a metro line across with a sign under each level; on phones the
 * line runs down the side and each level is a card. The robot stands where the learner
 * really is and only hops when they moved forward since their last visit.
 */
const N = COURSE_LEVELS.length
const SPAN = 86                                        // % of the laptop line used by the levels
const pct = (i: number) => 7 + (i / N) * SPAN          // % from the start (right) of the line
const tickPct = (i: number, k: number) => pct(i) + (SPAN / N) * ((k + 1) / (COURSE_LEVELS[i].lessons.length + 1))
const SPOT_KEY = 'pm_toc_spot'
const PAY_HREF = '/payment?plan=monthly'
const releasedCount = COURSE_LEVELS.filter(isReleased).length
const nextLevelsText = COURSE_LEVELS.filter(level => !isReleased(level)).map(level => level.label.replace('المستوى ', '')).join(' و')

/** Before we know who is reading: every level plain, no robot. */
const LOADING: TocView = {
    level: -1, lesson: -1, book: null, done: 0,
    available: COURSE_LEVELS.filter(isReleased).reduce((n, level) => n + level.lessons.length, 0),
    levels: COURSE_LEVELS.map(level => isReleased(level) ? 'todo' : 'soon'),
    lessons: COURSE_LEVELS.map(level => level.lessons.map(() => isReleased(level) ? 'todo' : 'soon')),
}

function Rider() {
    return <span className="ct-rider" aria-hidden="true"><img src="/assets/robot-toc.webp" alt="" width={100} height={100} /></span>
}

function Ring({ value }: { value: number }) {
    const c = 2 * Math.PI * 26
    return (
        <div className="ct-ring" aria-hidden="true">
            <svg viewBox="0 0 64 64">
                <circle cx="32" cy="32" r="26" fill="none" stroke="rgba(255,255,255,.1)" strokeWidth="7" />
                <circle cx="32" cy="32" r="26" fill="none" stroke="#FF6B35" strokeWidth="7" strokeLinecap="round" strokeDasharray={c} strokeDashoffset={c * (1 - value / 100)} />
            </svg>
            <b>{value}٪</b>
        </div>
    )
}

export default function CourseToc() {
    const { hasFeature, isLoading: subscriptionLoading } = useSubscription()
    const [input, setInput] = useState<TocInput | null>(null)
    const [selected, setSelected] = useState(0)
    const [open, setOpen] = useState<Set<number>>(new Set())
    const rootRef = useRef<HTMLDivElement>(null)
    const view = input ? buildToc(input) : LOADING
    const ready = input !== null
    const access = input?.access ?? 'guest'
    const started = access !== 'guest'
    const member = access === 'member'
    const stickyRef = useBottomBarOffset(ready && view.level < N)

    // Who is reading and where they stopped; their level starts open.
    useEffect(() => {
        if (subscriptionLoading) return
        let cancelled = false
        const load = (next: TocInput) => {
            if (cancelled) return
            const here = buildToc(next).level
            setInput(next)
            setSelected(Math.min(here, N - 1))
            setOpen(new Set(here < N ? [here] : []))
        }
        if (!authSystem.getCurrentUserId()) {
            let guestPath: string | null = null
            try { guestPath = localStorage.getItem(GUEST_LAST_PAGE_KEY) } catch { /* storage blocked */ }
            Promise.resolve().then(() => load({ access: 'guest', guestPath }))
        } else {
            const signedIn = hasFeature('reading') ? 'member' : 'registered'
            authSystem.getDetailedProgress()
                .then(progress => load({ access: signedIn, currentPage: progress?.currentPage ?? null, completedChapters: progress?.completedChapters ?? [], completedLessons: progress?.completedLessons }))
                .catch(() => load({ access: signedIn }))
        }
        return () => { cancelled = true }
    }, [subscriptionLoading, hasFeature])

    // The robot: hop from where it stood last visit if the learner moved forward, else a small settle.
    useEffect(() => {
        if (!input || !rootRef.current) return
        const root = rootRef.current
        const { level, lesson, levels } = buildToc(input)
        const atStation = levels[level] !== 'here'
        const spot = `${level}.${lesson}.${atStation ? 1 : 0}`
        let previous: string | null = null
        try { previous = localStorage.getItem(SPOT_KEY); localStorage.setItem(SPOT_KEY, spot) } catch { /* storage blocked */ }
        if (matchMedia('(prefers-reduced-motion: reduce)').matches) return
        const frame = requestAnimationFrame(() => {
            const rider = [...root.querySelectorAll<HTMLElement>('.ct-rider')].find(el => el.getClientRects().length)
            if (!rider) return
            const wide = root.querySelector('.ct-line')?.getClientRects().length
            const anchor = (l: number, k: number, station: boolean) => {
                if (l >= N) return root.querySelector<HTMLElement>(wide ? '[data-anchor="w-end"]' : '[data-anchor="t-end"]')
                const lessonEl = root.querySelector<HTMLElement>(`[data-anchor="${wide ? 'w' : 't'}-${l}-${k}"]`)
                if (!station && lessonEl?.getClientRects().length) return lessonEl
                return root.querySelector<HTMLElement>(`[data-anchor="${wide ? 'ws' : 'ts'}-${l}"]`)
            }
            const [pl, pk, ps] = (previous ?? '').split('.').map(Number)
            const movedForward = previous !== null && previous !== spot && Number.isInteger(pl) && pl * 100 + pk < level * 100 + lesson
            const from = movedForward ? anchor(pl, pk, ps === 1) : null
            const to = anchor(level, lesson, atStation)
            const img = rider.querySelector('img')
            if (from && to) {
                const a = from.getBoundingClientRect(), b = to.getBoundingClientRect()
                const dx = a.left + a.width / 2 - (b.left + b.width / 2), dy = a.top + a.height / 2 - (b.top + b.height / 2)
                const lift = Math.min(70, 34 + Math.abs(dy) * 0.25)
                rider.animate([
                    { transform: `translate(${dx}px, ${dy}px)`, easing: 'cubic-bezier(.2,.7,.4,1)' },
                    { transform: `translate(${dx / 2}px, ${Math.min(dy, 0) - lift}px)`, offset: 0.5, easing: 'cubic-bezier(.6,0,.8,.3)' },
                    { transform: 'translate(0, 0)' },
                ], { duration: 560, delay: 350, fill: 'backwards' }).finished
                    .then(() => img?.animate([{ transform: 'scaleX(-1) scale(1.12,.84)' }, { transform: 'scaleX(-1)' }], { duration: 200, easing: 'ease-out' }))
                    .catch(() => { /* cancelled */ })
            } else {
                img?.animate([
                    { transform: 'scaleX(-1) translateY(-16px)', easing: 'cubic-bezier(.6,0,.8,.3)' },
                    { transform: 'scaleX(-1) translateY(0) scale(1.1,.86)', offset: 0.7 },
                    { transform: 'scaleX(-1)' },
                ], { duration: 320 })
            }
        })
        return () => cancelAnimationFrame(frame)
    }, [input])

    const statusText = (i: number, state: LevelState) => ({
        done: '✓ خلّصته', here: started ? 'إنت هنا' : 'ابدأ هنا · ببلاش', gate: '🔒 بالاشتراك', lock: '🔒 بالاشتراك',
        soon: '⏳ بينزل قريب', waiting: '⏳ بينزل قريب', todo: COURSE_LEVELS[i].free ? 'ببلاش' : '',
    })[state]
    const chip = (i: number, state: LevelState) => {
        const text = ready ? statusText(i, state) : (COURSE_LEVELS[i].free ? 'ببلاش' : isReleased(COURSE_LEVELS[i]) ? '' : '⏳ بينزل قريب')
        return text ? <span className={`ct-chip ${state === 'done' ? 'on' : state === 'here' ? 'here' : ''}`}>{text}</span> : null
    }

    // ---------- the continue card ----------
    const spotLevel = COURSE_LEVELS[Math.min(Math.max(view.level, 0), N - 1)]
    const spotState: LevelState | 'end' = view.level >= N ? 'end' : view.levels[Math.max(view.level, 0)]
    const percent = Math.round(view.done / view.available * 100)
    let kicker = '', title = '', sub = '', cta = '', ctaHref = '/read/intro/1', ring = false
    if (view.book) {
        kicker = `إنت واقف عند: الفصل ${view.book.n} من الكتاب · صفحة ${view.book.page}`
        title = view.book.title
        sub = releasedCount < N ? `لحد ما المستويات ${nextLevelsText} تنزل، فصول الكتاب مفتوحالك.` : 'قراية زيادة من الكتاب، بعد المستويات الخمسة.'
        cta = 'كمّل من مكانك'; ctaHref = view.book.url; ring = true
    } else if (spotState === 'end') {
        title = `خلّصت الـ ${view.available} درس كلهم 🎉`; kicker = 'خلّصت الكورس'
        cta = 'شوف إنجازاتك'; ctaHref = '/achievements'; ring = true
    } else if (spotState === 'waiting') {
        kicker = 'خلّصت كل اللي نزل لحد دلوقتي 👏'; title = `${spotLevel.label} بينزل قريب`
        sub = 'ولحد ما ينزل، فصول الكتاب مفتوحالك.'
        cta = 'افتح فصول الكتاب'; ctaHref = bookChapterHref(BOOK_CHAPTERS[0].n); ring = true
    } else if (spotState === 'gate') {
        kicker = 'خلّصت التمهيد 👏'; title = `الخطوة الجاية: ${spotLevel.label}، ${spotLevel.name}`
        sub = `هتطلع بـ: ${spotLevel.out}`
        cta = 'اشترك وكمّل'; ctaHref = PAY_HREF
    } else if (!started) {
        kicker = 'التمهيد ببلاش ومن غير تسجيل'; title = `${lessonsWord(COURSE_LEVELS[0].lessons.length)} في ربع ساعة`
        sub = `هتطلع بـ: ${COURSE_LEVELS[0].out}`
        cta = view.lesson > 0 ? 'كمّل التمهيد' : 'ابدأ التمهيد'; ctaHref = lessonHref(COURSE_LEVELS[0], Math.max(view.lesson, 0))
    } else {
        const n = spotLevel.lessons.length
        kicker = `إنت واقف عند: ${spotLevel.label} · الدرس ${view.lesson + 1} من ${n}`
        title = spotLevel.lessons[view.lesson]
        sub = `فاضلك ${lessonsWord(n - view.lesson)} وتخلّص ${spotLevel.label}`
        cta = member ? 'كمّل من مكانك' : 'كمّل التمهيد'; ctaHref = lessonHref(spotLevel, view.lesson); ring = member
    }
    const stickyText = spotState === 'here' && member ? `كمّل: ${spotLevel.label} · الدرس ${view.lesson + 1}` : cta

    // ---------- lessons ----------
    const lessonRows = (i: number, phone: boolean) => COURSE_LEVELS[i].lessons.map((title, k) => {
        const state = view.lessons[i][k]
        const tag = ({ done: 'خلّصته', here: started ? 'إنت هنا' : 'ابدأ هنا', lock: '🔒', soon: 'قريب', todo: '' } as const)[state]
        const inner = <>
            <span className="ct-k">{state === 'done' ? '✓' : k + 1}</span>
            <span className="ct-t">{title}</span>
            {tag && <span className="ct-s">{tag}</span>}
        </>
        return (
            <li key={k} className={`ct-lesson ${state}`} data-anchor={phone ? `t-${i}-${k}` : undefined}>
                {state === 'soon'
                    ? <span className="ct-row">{inner}</span>
                    : <Link className="ct-row" href={lessonHref(COURSE_LEVELS[i], k)} aria-current={state === 'here' ? 'step' : undefined}>{inner}</Link>}
                {phone && state === 'here' && <Rider />}
            </li>
        )
    })

    const picked = COURSE_LEVELS[selected], pickedState = view.levels[selected]
    const pickedCurrent = view.level === selected ? view.lesson : 0

    return (
        <div className={`ctoc ${ready ? '' : 'loading'}`} ref={rootRef}>
            <header className="ct-head">
                <h1>فهرس الكورس</h1>
                <p>كل مستوى محطة على الخط، وكل نقطة صغيرة درس. دوس على أي مستوى تشوف دروسه، واضغط على الدرس يفتحلك على طول.</p>
            </header>

            <section className="ct-resume" aria-live="polite" aria-busy={!ready}>
                {ready && <>
                    <div className="ct-r-text">
                        {kicker && <small className="ct-kicker">{kicker}</small>}
                        <div className="ct-info">
                            {ring && <Ring value={spotState === 'end' ? 100 : percent} />}
                            <div><strong>{title}</strong>{sub && <span className="ct-sub">{sub}</span>}</div>
                        </div>
                    </div>
                    <div className="ct-r-acts">
                        <Link className="ct-btn primary" href={ctaHref} onClick={() => trackCtaClick(cta, 'toc_resume')}>{cta} ←</Link>
                        {!member && spotState !== 'gate' && <a className="ct-mini-price" href="#ct-side">والاشتراك {MONTHLY_PRICE_EGP} جنيه في الشهر، شوف بيفتحلك إيه ↓</a>}
                    </div>
                </>}
            </section>

            <div className="ct-legend" aria-hidden="true"><span><i className="d" />خلّصته</span><span><i className="h" />إنت هنا</span><span><i />لسه</span></div>

            {/* laptop: the line across */}
            <div className="ct-line">
                {COURSE_LEVELS.map((level, i) => {
                    const state = view.levels[i], n = level.lessons.length
                    const fill = state === 'done' ? 1 : state === 'here' ? (view.lesson + 1) / (n + 1) : 0
                    return (
                        <div key={level.id}>
                            <div className="ct-track" style={{ insetInlineStart: `${pct(i)}%`, width: `${SPAN / N}%` }}><i style={{ width: `${fill * 100}%` }} /></div>
                            {level.lessons.map((_, k) => {
                                const ls = view.lessons[i][k]
                                return <span key={k} className={`ct-tick ${ls === 'done' || ls === 'here' ? ls : ''}`} data-anchor={`w-${i}-${k}`} style={{ insetInlineStart: `${tickPct(i, k)}%` }} />
                            })}
                            <button type="button" className={`ct-st-w ${state}`} style={{ insetInlineStart: `${pct(i)}%` }} data-anchor={`ws-${i}`}
                                onClick={() => setSelected(i)} aria-label={`${level.label}: ${level.name}`} />
                            <button type="button" className={`ct-sign ${state}`} style={{ insetInlineStart: `${pct(i)}%` }} aria-pressed={selected === i} onClick={() => setSelected(i)}>
                                <span className="ct-bar">{level.icon} {level.label}</span>
                                <b>{level.name}</b>
                                <small>{lessonsWord(n).replace('درس واحد', '1 درس')} · {(ready && statusText(i, state)) || level.time}</small>
                            </button>
                        </div>
                    )
                })}
                <div className="ct-end-w" style={{ insetInlineStart: `${pct(N)}%` }} data-anchor="w-end"><img src="/assets/trophy-toc.webp" alt="" width={86} height={86} /><b>آخر محطة</b></div>
                {ready && view.level >= 0 && (
                    <span className="ct-rider-w" style={{ insetInlineStart: `${view.level >= N ? pct(N) - (SPAN / N) * 0.3 : view.levels[view.level] === 'here' ? tickPct(view.level, view.lesson) : pct(view.level)}%` }}>
                        <Rider />
                    </span>
                )}
            </div>

            <div className="ct-layout">
                <section aria-label="مستويات الكورس">
                    {/* laptop: the level picked on the line */}
                    <section className="ct-panel">
                        <header>
                            <h2>{picked.label}: {picked.name}</h2>
                            {chip(selected, pickedState)}
                            <span className="ct-chip">{lessonsWord(picked.lessons.length).replace('درس واحد', '1 درس')} · {picked.time}</span>
                            <p><b>هتطلع بـ:</b> {picked.out}</p>
                        </header>
                        <ol className="ct-lessons">{lessonRows(selected, false)}</ol>
                        {ready && (pickedState === 'here' || pickedState === 'gate' || pickedState === 'lock' || pickedState === 'soon' || pickedState === 'waiting') && (
                            <footer>
                                {pickedState === 'here' && <Link className="ct-btn primary" href={lessonHref(picked, pickedCurrent)}>{started ? `كمّل: الدرس ${pickedCurrent + 1}` : 'ابدأ التمهيد'} ←</Link>}
                                {(pickedState === 'gate' || pickedState === 'lock') && <>
                                    <Link className="ct-btn primary" href={PAY_HREF} onClick={() => trackCtaClick('اشترك وافتح المستوى', 'toc_panel')}>اشترك وافتح {picked.label} ←</Link>
                                    {!started && <Link className="ct-btn ghost" href="/read/intro/1">جرّب التمهيد ببلاش</Link>}
                                </>}
                                {(pickedState === 'soon' || pickedState === 'waiting') && <span className="ct-note">⏳ {picked.label} بينزل قريب. لحد ما ينزل، فصول الكتاب مفتوحة للمشتركين.</span>}
                            </footer>
                        )}
                    </section>

                    {/* phone: the line down the side */}
                    <ol className="ct-stops">
                        {COURSE_LEVELS.map((level, i) => {
                            const state = view.levels[i], isOpen = open.has(i)
                            return (
                                <li key={level.id} className={`ct-stop ${state} ${isOpen ? 'open' : ''}`}>
                                    <span className="ct-seg" aria-hidden="true" />
                                    <span className="ct-station" aria-hidden="true" data-anchor={`ts-${i}`}>{state === 'done' ? '✓' : i || ''}</span>
                                    {view.level === i && <Rider />}
                                    <div className="ct-card">
                                        <button type="button" className="ct-card-head" aria-expanded={isOpen} aria-controls={`ct-ls-${i}`}
                                            onClick={() => setOpen(prev => { const next = new Set(prev); if (next.has(i)) next.delete(i); else next.add(i); return next })}>
                                            <span className="ct-top"><span>{level.icon} {level.label}</span>{chip(i, state)}</span>
                                            <b className="ct-name">{level.name}</b>
                                            <span className="ct-meta">{lessonsWord(level.lessons.length).replace('درس واحد', '1 درس')} · {level.time}</span>
                                            <span className="ct-out"><b>هتطلع بـ:</b> {level.out}</span>
                                            <span className="ct-chev" aria-hidden="true">▾</span>
                                        </button>
                                        <ol className="ct-lessons" id={`ct-ls-${i}`} hidden={!isOpen}>{lessonRows(i, true)}</ol>
                                    </div>
                                </li>
                            )
                        })}
                        <li className={`ct-stop end ${view.level >= N ? 'here' : ''}`}>
                            <span className="ct-station" aria-hidden="true" data-anchor="t-end"><img src="/assets/trophy-toc.webp" alt="" width={54} height={54} /></span>
                            <div className="ct-end-card">{view.level >= N && <Rider />}<div><b>آخر محطة</b><small>خلّصت الخمس مستويات، والـ AI بقى جزء من طريقة شغلك.</small></div></div>
                        </li>
                    </ol>

                    {BOOK_CHAPTERS.length > 0 && (
                        <section className="ct-book" id="ct-book">
                            <h3>📖 من الكتاب</h3>
                            <p>{releasedCount < N ? `لحد ما المستويات ${nextLevelsText} تنزل، فصول الكتاب مفتوحة ` : 'وزيادة على المستويات الخمسة: فصول من كتاب PromptMaster، مفتوحة '}{member ? 'ليك' : 'للمشتركين'}.</p>
                            <ul>
                                {BOOK_CHAPTERS.map(chapter => (
                                    <li key={chapter.n}><Link href={bookChapterHref(chapter.n)}>الفصل {chapter.n}: {chapter.title}{member ? '' : ' 🔒'}<small>{chapter.note}</small></Link></li>
                                ))}
                            </ul>
                        </section>
                    )}
                </section>

                <aside className="ct-side" id="ct-side">
                    {member ? (
                        <nav className="ct-tools" aria-label="أدواتك">
                            {COURSE_EXTRAS.map(extra => (
                                <Link key={extra.href} href={extra.href}><span aria-hidden="true">{extra.icon}</span><span>{extra.name}<small>{extra.note}</small></span></Link>
                            ))}
                        </nav>
                    ) : (
                        <div className="ct-price">
                            <b>الاشتراك: {MONTHLY_PRICE_EGP} جنيه في الشهر</b>
                            <small>{releasedCount < N ? `بيفتحلك ${COURSE_LEVELS.filter(level => isReleased(level) && !level.free).map(level => level.label).join(' و')} دلوقتي، واللي بعدهم أول ما ينزل` : 'بيفتحلك الخمس مستويات'}، ومعاهم:</small>
                            <ul>
                                {COURSE_EXTRAS.map(extra => <li key={extra.href}>{extra.icon} {extra.name}: {extra.note}</li>)}
                                <li>📖 {releasedCount < N ? 'فصول الكتاب، لحد ما المستويات الجاية تنزل' : 'فصول من كتاب PromptMaster، قراية زيادة'}</li>
                            </ul>
                            <Link className="ct-btn ghost" href="/#pricing" onClick={() => trackCtaClick('شوف الباقات', 'toc_price')}>شوف الباقات</Link>
                        </div>
                    )}
                </aside>
            </div>

            {ready && view.level < N && (
                <div className="ct-sticky" ref={stickyRef}>
                    <Link className="ct-btn primary" href={ctaHref} onClick={() => trackCtaClick(stickyText, 'toc_sticky')}>{stickyText} ←</Link>
                </div>
            )}
        </div>
    )
}
