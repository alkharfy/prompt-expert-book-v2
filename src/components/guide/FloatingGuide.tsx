'use client'

import Link from 'next/link'
import { useCallback, useEffect, useRef, useState } from 'react'
import { authSystem } from '@/lib/auth_system'
import { trackCtaClick } from '@/lib/analytics'
import RobotFace from './RobotFace'
import { GUIDE_SCENARIOS, lineAt, mouthLevel, type Expression, type GuideScenario } from './guideScenarios'

type Phase = 'waiting' | 'playing' | 'done' | 'idle'

const HEARD_KEY = 'pm-guide-heard'
const SOUND_KEY = 'pm-guide-sound'
const SESSION_KEY = 'pm-guide-played'

function readStorage(store: 'local' | 'session', key: string): string | null {
    try {
        return (store === 'local' ? localStorage : sessionStorage).getItem(key)
    } catch {
        return null
    }
}

function writeStorage(store: 'local' | 'session', key: string, value: string) {
    try {
        (store === 'local' ? localStorage : sessionStorage).setItem(key, value)
    } catch {
        /* private mode — the guide still works, it just may repeat */
    }
}

/** Random scenario the visitor hasn't heard yet; starts a new round once all are heard. */
function pickScenario(): number {
    let heard: string[] = []
    try {
        heard = JSON.parse(readStorage('local', HEARD_KEY) || '[]')
    } catch { /* ignore */ }
    let pool = GUIDE_SCENARIOS.map((s, i) => ({ s, i })).filter(({ s }) => !heard.includes(s.id))
    if (pool.length === 0) {
        const last = heard[heard.length - 1]
        pool = GUIDE_SCENARIOS.map((s, i) => ({ s, i })).filter(({ s }) => s.id !== last)
        writeStorage('local', HEARD_KEY, '[]')
    }
    return pool[Math.floor(Math.random() * pool.length)].i
}

function markHeard(id: string) {
    let heard: string[] = []
    try {
        heard = JSON.parse(readStorage('local', HEARD_KEY) || '[]')
    } catch { /* ignore */ }
    if (!heard.includes(id)) writeStorage('local', HEARD_KEY, JSON.stringify([...heard, id]))
}

const clamp = (v: number, a: number, b: number) => Math.min(b, Math.max(a, v))
const lerp = (a: number, b: number, t: number) => a + (b - a) * t

export default function FloatingGuide() {
    const [enabled, setEnabled] = useState(false)
    const [phase, setPhase] = useState<Phase>('waiting')
    const [scenarioIdx, setScenarioIdx] = useState(0)
    const [lineIdx, setLineIdx] = useState(0)
    const [level, setLevel] = useState(0)
    const [blinking, setBlinking] = useState(false)
    const [soundOn, setSoundOn] = useState(false)
    const [bubbleOpen, setBubbleOpen] = useState(false)
    const [bubbleMode, setBubbleMode] = useState<'hero' | 'dock'>('dock')
    const [airborne, setAirborne] = useState(false)

    const audioRef = useRef<HTMLAudioElement | null>(null)
    const fallbackStartRef = useRef<number | null>(null)
    const robotBoxRef = useRef<HTMLDivElement>(null)
    const robotBodyRef = useRef<HTMLDivElement>(null)
    const bubbleRef = useRef<HTMLDivElement>(null)
    const phaseRef = useRef<Phase>('waiting')
    const scenarioRef = useRef<GuideScenario>(GUIDE_SCENARIOS[0])
    const lineRef = useRef(0)
    const levelRef = useRef(0)
    const doneTimerRef = useRef<number | null>(null)
    /** First talk of the session waits until the robot lands in the corner. */
    const pendingStartRef = useRef(false)
    const startRef = useRef<() => void>(() => {})

    useEffect(() => {
        phaseRef.current = phase
        scenarioRef.current = GUIDE_SCENARIOS[scenarioIdx]
    }, [phase, scenarioIdx])
    const scenario = GUIDE_SCENARIOS[scenarioIdx]
    const line = scenario.lines[lineIdx]
    const talking = phase === 'playing'
    const expression: Expression = airborne && !talking
        ? 'surprised'
        : talking || phase === 'done' ? line.expression : 'happy'

    // Guests only
    useEffect(() => {
        if (authSystem.getCurrentUserId()) return
        setEnabled(true)
        setSoundOn(readStorage('local', SOUND_KEY) === 'on')
    }, [])

    const stopAudio = useCallback(() => {
        const a = audioRef.current
        if (a) {
            a.pause()
            a.src = ''
        }
        audioRef.current = null
        fallbackStartRef.current = null
    }, [])

    const finish = useCallback((id: string) => {
        markHeard(id)
        setPhase('done')
        setLevel(0)
        doneTimerRef.current = window.setTimeout(() => {
            setBubbleOpen(false)
            setPhase('idle')
        }, 12000)
    }, [])

    const play = useCallback((idx: number, withSound: boolean) => {
        stopAudio()
        if (doneTimerRef.current) window.clearTimeout(doneTimerRef.current)
        const s = GUIDE_SCENARIOS[idx]
        setScenarioIdx(idx)
        setLineIdx(0)
        lineRef.current = 0
        setBubbleOpen(true)
        setPhase('playing')
        writeStorage('session', SESSION_KEY, '1')

        const audio = new Audio(s.audio)
        audio.preload = 'auto'
        audio.muted = !withSound
        audioRef.current = audio
        audio.addEventListener('ended', () => finish(s.id))
        audio.play().catch(() => {
            // Sound blocked until the visitor interacts: run silently with captions
            audio.muted = true
            setSoundOn(false)
            audio.play().catch(() => {
                audioRef.current = null
                fallbackStartRef.current = performance.now()
            })
        })
    }, [stopAudio, finish])

    // First visit in this session: talk once the robot has flown to the corner
    useEffect(() => {
        if (!enabled) return
        const idx = pickScenario()
        if (readStorage('session', SESSION_KEY)) {
            setScenarioIdx(idx)
            setPhase('idle')
            return
        }
        pendingStartRef.current = true
        startRef.current = () => {
            pendingStartRef.current = false
            play(idx, readStorage('local', SOUND_KEY) === 'on')
        }
        // Big screens have room for the bubble under the hero robot, so don't wait forever for a scroll
        const timer = window.setTimeout(() => {
            if (pendingStartRef.current && window.innerWidth >= 1024) startRef.current()
        }, 6000)
        return () => window.clearTimeout(timer)
    }, [enabled, play])

    useEffect(() => () => {
        stopAudio()
        if (doneTimerRef.current) window.clearTimeout(doneTimerRef.current)
        document.documentElement.classList.remove('pm-guide-on')
    }, [stopAudio])

    // Blinking
    useEffect(() => {
        if (!enabled) return
        let timer: number
        const loop = () => {
            timer = window.setTimeout(() => {
                setBlinking(true)
                window.setTimeout(() => setBlinking(false), 130)
                loop()
            }, 2500 + Math.random() * 3000)
        }
        loop()
        return () => window.clearTimeout(timer)
    }, [enabled])

    // Animation loop: speech clock, position along the page, body motion
    useEffect(() => {
        if (!enabled) return
        const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
        let raf = 0
        // Spring state for the hero → corner flight (0 = hero, 1 = corner)
        let p = 0
        let pv = 0
        let pTarget = 0
        let air = false
        // One robot on the page: the hero one hands over to this one
        document.documentElement.classList.add('pm-guide-on')
        let lastY = window.scrollY
        let lastT = performance.now()
        let tilt = 0
        let smoothLevel = 0
        let mode: 'hero' | 'dock' = 'dock'

        const tick = (now: number) => {
            const dt = Math.max(1, now - lastT)
            lastT = now
            const vw = window.innerWidth
            const vh = window.innerHeight
            const scrollY = window.scrollY

            // --- speech clock
            let target = 0
            if (phaseRef.current === 'playing') {
                const s = scenarioRef.current
                const a = audioRef.current
                const t = a && !a.paused
                    ? a.currentTime
                    : fallbackStartRef.current !== null ? (now - fallbackStartRef.current) / 1000 : 0
                target = mouthLevel(s, t)
                const li = lineAt(s, t)
                if (li !== lineRef.current) {
                    lineRef.current = li
                    setLineIdx(li)
                }
                if (fallbackStartRef.current !== null && t > s.duration + 0.3) {
                    fallbackStartRef.current = null
                    finish(s.id)
                }
            }
            smoothLevel = lerp(smoothLevel, target, 0.45)
            if (Math.abs(smoothLevel - levelRef.current) > 0.03 || (target === 0 && levelRef.current !== 0 && smoothLevel < 0.05)) {
                levelRef.current = smoothLevel < 0.05 ? 0 : smoothLevel
                setLevel(levelRef.current)
            }

            // --- where the robot sits
            const small = vw < 640
            const dockSize = small ? 92 : vw < 1024 ? 120 : 150
            const dockRight = small ? 10 : 24
            const dockBottom = vw < 768 ? 84 : 24
            const dockX = vw - dockRight - dockSize
            const dockY = vh - dockBottom - dockSize

            const hero = document.querySelector<HTMLElement>('.hero-image-container')
            const heroRobot = hero?.querySelector<HTMLElement>('.robot-container')
            let start: { cx: number; cy: number; size: number } | null = null
            if (hero && heroRobot) {
                const r = heroRobot.getBoundingClientRect()
                const c = hero.getBoundingClientRect()
                // On phones the hero box clips the robot, so fit inside what's visible
                const visibleH = Math.min(r.height, c.height)
                // Below the first screen (phones): skip the hero spot and wait in the corner
                if (r.width > 0 && visibleH > 0 && r.top + scrollY < vh * 0.8) {
                    start = {
                        cx: r.left + r.width / 2,
                        cy: Math.max(r.top, c.top) + visibleH / 2,
                        size: Math.min(r.width, visibleH) * 0.92,
                    }
                }
            }

            if (!start || scrollY > 40) pTarget = 1
            else if (scrollY < 12) pTarget = 0
            const sdt = Math.min(dt, 50) / 1000
            if (reduceMotion) {
                p = pTarget
                pv = 0
            } else {
                pv += (28 * (pTarget - p) - 7.5 * pv) * sdt
                p += pv * sdt
            }
            const pp = clamp(p, 0, 1)

            let x = dockX
            let y = dockY
            let size = dockSize
            if (start) {
                // Curved flight: swing sideways first, then dive into the corner
                const dcx = dockX + dockSize / 2
                const dcy = dockY + dockSize / 2
                const u = 1 - pp
                const cx = u * u * start.cx + 2 * u * pp * dcx + pp * pp * dcx
                const cy = u * u * start.cy + 2 * u * pp * start.cy + pp * pp * dcy
                // Raw p (not clamped) so the landing overshoot reads as a little bounce
                size = Math.max(dockSize * 0.8, lerp(start.size, dockSize, p))
                x = cx - size / 2
                y = cy - size / 2
            }

            const nowAir = pp > 0.06 && pp < 0.94
            if (nowAir !== air) {
                air = nowAir
                setAirborne(air)
            }
            if (pendingStartRef.current && pp > 0.95 && scrollY > 40) startRef.current()
            robotBoxRef.current?.classList.toggle('docked', pp > 0.5)

            // --- body motion
            const velocity = (scrollY - lastY) / dt
            lastY = scrollY
            const lean = phaseRef.current !== 'idle' && scenarioRef.current.lines[lineRef.current]?.cta ? -7 : 0
            const tiltTarget = reduceMotion ? 0 : clamp(velocity * 6, -10, 10) + lean
            tilt = lerp(tilt, tiltTarget, 0.08)
            const flightTilt = reduceMotion ? 0 : clamp(pv * 10, -20, 20)
            const stretch = reduceMotion ? 1 : 1 + Math.min(Math.abs(pv) * 0.04, 0.12)
            const bob = reduceMotion ? 0 : Math.sin(now / 650) * 6 * (size / 150)
            const pulse = 1 + smoothLevel * 0.025

            const box = robotBoxRef.current
            if (box) {
                box.style.transform = `translate3d(${x}px, ${y}px, 0)`
                box.style.width = `${size}px`
                box.style.height = `${size}px`
            }
            const body = robotBodyRef.current
            if (body) body.style.transform = `translateY(${bob}px) rotate(${tilt + flightTilt}deg) scale(${pulse / Math.sqrt(stretch)}, ${pulse * stretch})`

            // --- speech bubble
            const nextMode: 'hero' | 'dock' = pp < 0.5 ? 'hero' : 'dock'
            if (nextMode !== mode) {
                mode = nextMode
                setBubbleMode(mode)
            }
            const bubble = bubbleRef.current
            if (bubble) {
                const bw = Math.min(small ? vw - 20 : 340, vw - 20)
                bubble.style.width = `${bw}px`
                let bx: number
                let by: number
                let anchorBottom: boolean
                if (mode === 'hero') {
                    bx = x + size / 2 - bw / 2
                    by = y + size * 0.88
                    anchorBottom = false
                } else if (vw < 1024) {
                    bx = vw - dockRight - bw
                    by = dockY - 6
                    anchorBottom = true
                } else {
                    bx = dockX - bw - 6
                    by = dockY + dockSize * 0.7
                    anchorBottom = true
                }
                bubble.style.transform = `translate3d(${clamp(bx, 10, vw - bw - 10)}px, ${by}px, 0) translateY(${anchorBottom ? '-100%' : '0'})`
                // Hide while flying, and above the fold on narrow screens where it would cover the headline
                const hidden = (pp > 0.2 && pp < 0.8) || (mode === 'hero' && vw < 1024)
                bubble.style.opacity = hidden ? '0' : '1'
                bubble.style.pointerEvents = hidden ? 'none' : ''
            }

            raf = requestAnimationFrame(tick)
        }
        raf = requestAnimationFrame(tick)
        return () => cancelAnimationFrame(raf)
    }, [enabled, finish])

    if (!enabled) return null

    const toggleSound = () => {
        const a = audioRef.current
        if (phase === 'playing' && soundOn && a) {
            a.muted = true
            setSoundOn(false)
            writeStorage('local', SOUND_KEY, 'off')
            return
        }
        // Turning sound on restarts the scenario from its start, with sound
        setSoundOn(true)
        writeStorage('local', SOUND_KEY, 'on')
        play(scenarioIdx, true)
    }

    const close = () => {
        stopAudio()
        if (phase === 'playing') markHeard(scenario.id)
        if (doneTimerRef.current) window.clearTimeout(doneTimerRef.current)
        setBubbleOpen(false)
        setPhase('idle')
        setLevel(0)
    }

    const onRobotClick = () => {
        if (phase === 'playing' || phase === 'done') {
            setBubbleOpen(o => !o)
            return
        }
        play(pickScenario(), soundOn)
    }

    const showCta = (phase === 'playing' && line.cta) || phase === 'done'

    return (
        <>
            <div ref={robotBoxRef} className="pm-guide-robot">
                <button
                    type="button"
                    className="pm-guide-hit"
                    onClick={onRobotClick}
                    aria-label={phase === 'idle' ? 'اسمع المستر' : 'إظهار أو إخفاء كلام المستر'}
                >
                    <div ref={robotBodyRef} className="pm-guide-body">
                        <div className="pm-guide-flip">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img src="/assets/robot-new.png" alt="" draggable={false} />
                            <RobotFace expression={expression} level={level} blinking={blinking} />
                        </div>
                    </div>
                </button>
                {phase === 'idle' && <span className="pm-guide-badge" aria-hidden="true">▶</span>}
            </div>

            <div
                ref={bubbleRef}
                className={`pm-guide-bubble ${bubbleOpen ? 'open' : ''} mode-${bubbleMode}`}
                role="status"
                aria-live="polite"
                dir="rtl"
            >
                <div className="pm-guide-bubble-top">
                    <span className="pm-guide-name">المستر</span>
                    <div className="pm-guide-controls">
                        <button type="button" onClick={toggleSound} className={`pm-guide-sound ${soundOn && phase === 'playing' ? 'on' : ''}`}>
                            {soundOn && phase === 'playing' ? '🔇 اكتم' : '🔊 اسمعني'}
                        </button>
                        <button type="button" onClick={close} className="pm-guide-close" aria-label="اقفل">✕</button>
                    </div>
                </div>

                <p className="pm-guide-text">{line.text}</p>

                {line.card && (
                    <div className="pm-guide-card">
                        {line.card.bad && <div className="bad"><span>✗</span>{line.card.bad}</div>}
                        {line.card.good && <div className="good"><span>✓</span>{line.card.good}</div>}
                        {line.card.note && <div className="note"><span>!</span>{line.card.note}</div>}
                    </div>
                )}

                {showCta && (
                    <Link
                        href="/read/intro/1"
                        className="pm-guide-cta"
                        onClick={() => trackCtaClick('ابدأ التمهيد', `floating_guide_${scenario.id}`)}
                    >
                        ابدأ التمهيد — ببلاش ومن غير تسجيل
                    </Link>
                )}
            </div>

            <style jsx global>{`
                html.pm-guide-on .hero-image-container .robot-container {
                    opacity: 0 !important;
                    transition: opacity 0.4s;
                }
                @media (max-width: 768px) {
                    /* On phones the hero robot sits under the buttons; drop its empty box */
                    html.pm-guide-on .hero-image-container { display: none; }
                }
                .pm-guide-robot {
                    position: fixed;
                    top: 0;
                    left: 0;
                    z-index: 60;
                    will-change: transform;
                }
                .pm-guide-hit {
                    all: unset;
                    display: block;
                    width: 100%;
                    height: 100%;
                    cursor: pointer;
                }
                .pm-guide-hit:focus-visible {
                    outline: 2px solid #ff8c42;
                    outline-offset: 4px;
                    border-radius: 50%;
                }
                .pm-guide-body {
                    width: 100%;
                    height: 100%;
                    transform-origin: 50% 85%;
                    filter: drop-shadow(0 10px 24px rgba(255, 107, 53, 0.25));
                }
                .pm-guide-flip {
                    position: relative;
                    width: 100%;
                    height: 100%;
                    transform: scaleX(-1);
                }
                .pm-guide-flip img,
                .pm-guide-flip .pm-face {
                    position: absolute;
                    inset: 0;
                    width: 100%;
                    height: 100%;
                    user-select: none;
                    pointer-events: none;
                }
                .pm-guide-robot:not(.docked) .pm-guide-badge {
                    display: none;
                }
                .pm-guide-badge {
                    position: absolute;
                    top: 12%;
                    left: 8%;
                    width: 26px;
                    height: 26px;
                    border-radius: 50%;
                    background: #ff6b35;
                    color: #fff;
                    font-size: 11px;
                    display: grid;
                    place-items: center;
                    box-shadow: 0 0 0 4px rgba(255, 107, 53, 0.25);
                    pointer-events: none;
                    animation: pmBadge 2s ease-in-out infinite;
                }
                @keyframes pmBadge {
                    0%, 100% { box-shadow: 0 0 0 3px rgba(255, 107, 53, 0.25); }
                    50% { box-shadow: 0 0 0 8px rgba(255, 107, 53, 0.08); }
                }
                .pm-guide-bubble {
                    position: fixed;
                    top: 0;
                    left: 0;
                    z-index: 61;
                    padding: 14px 16px 16px;
                    border-radius: 18px;
                    background: rgba(20, 14, 10, 0.94);
                    border: 1px solid rgba(255, 140, 66, 0.35);
                    box-shadow: 0 18px 40px rgba(0, 0, 0, 0.45), 0 0 0 1px rgba(0, 0, 0, 0.3);
                    backdrop-filter: blur(10px);
                    color: rgba(255, 255, 255, 0.92);
                    visibility: hidden;
                    pointer-events: none;
                    transition: opacity 0.25s;
                }
                .pm-guide-bubble.open {
                    visibility: visible;
                    pointer-events: auto;
                }
                .pm-guide-bubble-top {
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                    gap: 8px;
                    margin-bottom: 8px;
                }
                .pm-guide-name {
                    font-size: 0.78rem;
                    font-weight: 700;
                    color: #ff8c42;
                }
                .pm-guide-controls {
                    display: flex;
                    gap: 6px;
                }
                .pm-guide-sound,
                .pm-guide-close {
                    border: 1px solid rgba(255, 255, 255, 0.15);
                    background: rgba(255, 255, 255, 0.06);
                    color: #fff;
                    border-radius: 999px;
                    font-size: 0.75rem;
                    padding: 4px 10px;
                    cursor: pointer;
                    font-family: inherit;
                }
                .pm-guide-sound:not(.on) {
                    background: #ff6b35;
                    border-color: #ff6b35;
                    font-weight: 700;
                }
                .pm-guide-close {
                    padding: 4px 9px;
                }
                .pm-guide-text {
                    margin: 0;
                    font-size: 0.95rem;
                    line-height: 1.75;
                }
                .pm-guide-card {
                    margin-top: 10px;
                    display: flex;
                    flex-direction: column;
                    gap: 6px;
                    font-size: 0.82rem;
                    line-height: 1.6;
                }
                .pm-guide-card > div {
                    display: flex;
                    gap: 8px;
                    padding: 7px 10px;
                    border-radius: 10px;
                }
                .pm-guide-card span {
                    font-weight: 800;
                    flex-shrink: 0;
                }
                .pm-guide-card .bad { background: rgba(239, 68, 68, 0.12); color: #fca5a5; }
                .pm-guide-card .good { background: rgba(34, 197, 94, 0.12); color: #bbf7d0; }
                .pm-guide-card .note { background: rgba(250, 204, 21, 0.12); color: #fde68a; }
                .pm-guide-cta {
                    display: block;
                    margin-top: 12px;
                    padding: 10px 14px;
                    text-align: center;
                    border-radius: 12px;
                    background: linear-gradient(135deg, #ff6b35, #ff8c42);
                    color: #fff;
                    font-weight: 800;
                    font-size: 0.92rem;
                    text-decoration: none;
                    animation: pmCta 1.8s ease-in-out infinite;
                }
                @keyframes pmCta {
                    0%, 100% { box-shadow: 0 0 0 0 rgba(255, 107, 53, 0.45); }
                    50% { box-shadow: 0 0 18px 4px rgba(255, 107, 53, 0.25); }
                }
                @media (max-width: 640px) {
                    .pm-guide-bubble { padding: 12px 13px 13px; }
                    .pm-guide-text { font-size: 0.88rem; line-height: 1.65; }
                    /* Keep the bubble short on phones so it doesn't bury the hero buttons */
                    .pm-guide-card { display: none; }
                    .pm-guide-cta { margin-top: 8px; padding: 8px 12px; font-size: 0.85rem; }
                }
                @media (prefers-reduced-motion: reduce) {
                    .pm-guide-cta, .pm-guide-badge { animation: none; }
                }
            `}</style>
        </>
    )
}
