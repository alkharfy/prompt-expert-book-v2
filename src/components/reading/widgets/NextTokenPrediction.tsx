'use client'

/**
 * NextTokenPrediction — أنيميشن تفاعلي يشرح "إزاي النموذج يتوقّع الكلمة التالية"
 *
 * جوهر الفصل الأول: النموذج مش "بيفكر" — بيحسب احتمالات لكل كلمة ممكنة،
 * ويختار الأعلى. هنا بنوريه بيحصل قدام عين القارئ:
 *   1. الجملة تتكتب حرف حرف: "القهوة السعودية تُقدم مع..."
 *   2. تتجمّد، ويطلع شريط احتمالات حي (التمر 78% / الحلويات 15% / الماء 5% / غير ذلك 2%)
 *   3. النموذج "يختار" الأعلى (التمر) ويضيفها للجملة.
 *
 * مبني بالكامل بـ framer-motion (موجود في المشروع) — RTL مثالي، نص عربي حقيقي،
 * يحترم prefers-reduced-motion، وخفيف (صفر اعتمادات جديدة).
 */

import { useState, useEffect, useRef, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useReducedMotion } from '@/hooks/useReducedMotion'

const PREFIX = 'القهوة السعودية تُقدم مع'
const WINNER = 'التمر'

type Candidate = { word: string; prob: number; winner?: boolean }
const CANDIDATES: Candidate[] = [
    { word: 'التمر', prob: 78, winner: true },
    { word: 'الحلويات', prob: 15 },
    { word: 'الماء', prob: 5 },
    { word: 'غير ذلك', prob: 2 },
]

// مراحل العرض
type Phase = 'typing' | 'thinking' | 'revealing' | 'picking' | 'done'

const ORANGE = '#FF6B35'
const GOLD = '#FFB800'

export default function NextTokenPrediction() {
    const prefersReduced = useReducedMotion()
    const [phase, setPhase] = useState<Phase>('typing')
    const [typed, setTyped] = useState('')
    const [picked, setPicked] = useState(false)
    const timers = useRef<ReturnType<typeof setTimeout>[]>([])
    const wrap = useRef<HTMLDivElement>(null)

    const clearTimers = useCallback(() => {
        timers.current.forEach(clearTimeout)
        timers.current = []
    }, [])

    const run = useCallback(() => {
        clearTimers()
        const t = timers.current

        if (prefersReduced) {
            // نسخة بدون حركة: نعرض كل شيء فوراً
            setTyped(PREFIX + '...')
            setPhase('revealing')
            setPicked(true)
            setPhase('done')
            return
        }

        setTyped('')
        setPicked(false)
        setPhase('typing')

        // 1) كتابة الجملة حرف حرف
        const full = PREFIX + '...'
        for (let i = 1; i <= full.length; i++) {
            t.push(setTimeout(() => setTyped(full.slice(0, i)), i * 55))
        }
        const afterTyping = full.length * 55 + 350

        // 2) النموذج "يفكر"
        t.push(setTimeout(() => setPhase('thinking'), afterTyping))
        // 3) إظهار شريط الاحتمالات
        t.push(setTimeout(() => setPhase('revealing'), afterTyping + 700))
        // 4) اختيار الأعلى
        t.push(setTimeout(() => { setPhase('picking'); setPicked(true) }, afterTyping + 2600))
        // 5) خلص
        t.push(setTimeout(() => setPhase('done'), afterTyping + 3400))
    }, [prefersReduced, clearTimers])

    // ابدأ لما العنصر يدخل الشاشة (مرة واحدة)، أو فوراً لو reduced-motion
    useEffect(() => {
        if (prefersReduced) { run(); return clearTimers }
        const el = wrap.current
        if (!el) return
        let started = false
        const io = new IntersectionObserver(
            (entries) => {
                if (entries[0]?.isIntersecting && !started) {
                    started = true
                    run()
                }
            },
            { threshold: 0.35 }
        )
        io.observe(el)
        return () => { io.disconnect(); clearTimers() }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [prefersReduced])

    const showBars = phase === 'revealing' || phase === 'picking' || phase === 'done'

    return (
        <div
            ref={wrap}
            dir="rtl"
            style={{
                position: 'relative',
                margin: '16px 0',
                padding: '22px 20px 24px',
                borderRadius: '18px',
                background: 'linear-gradient(160deg, rgba(20,12,8,0.95) 0%, rgba(8,5,5,0.98) 100%)',
                border: `1px solid ${ORANGE}33`,
                boxShadow: '0 12px 40px rgba(0,0,0,0.55)',
                overflow: 'hidden',
                fontFamily: "'Cairo', 'Tajawal', sans-serif",
            }}
        >
            {/* وهج خلفي خفيف */}
            <div
                aria-hidden
                style={{
                    position: 'absolute', inset: 0,
                    background: `radial-gradient(120% 80% at 80% 0%, ${ORANGE}14 0%, transparent 60%)`,
                    pointerEvents: 'none',
                }}
            />

            {/* العنوان الصغير */}
            <div style={{
                display: 'flex', alignItems: 'center', gap: '8px',
                fontSize: '0.8rem', color: `${GOLD}cc`, marginBottom: '14px',
                fontWeight: 700, letterSpacing: '0.2px',
            }}>
                <span style={{ fontSize: '1.05rem' }}>🎯</span>
                شوف بنفسك: إزاي النموذج يختار الكلمة التالية
            </div>

            {/* الجملة اللي بتتكتب */}
            <div style={{
                fontSize: 'clamp(1.05rem, 2.6vw, 1.45rem)',
                fontWeight: 800,
                color: '#fff',
                lineHeight: 1.7,
                minHeight: '2.4em',
                textShadow: '0 2px 10px rgba(0,0,0,0.6)',
            }}>
                <span>{typed}</span>
                {/* مؤشر الكتابة */}
                {!prefersReduced && (phase === 'typing' || phase === 'thinking') && (
                    <motion.span
                        animate={{ opacity: [1, 0.15, 1] }}
                        transition={{ duration: 0.8, repeat: Infinity }}
                        style={{ color: ORANGE, marginInlineStart: 2 }}
                    >▌</motion.span>
                )}
                {/* الكلمة المختارة بتنضاف للجملة */}
                <AnimatePresence>
                    {picked && (
                        <motion.span
                            initial={prefersReduced ? false : { opacity: 0, y: -14, scale: 0.6 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            transition={{ type: 'spring', stiffness: 260, damping: 18 }}
                            style={{
                                color: GOLD,
                                marginInlineStart: '0.35em',
                                textShadow: `0 0 18px ${GOLD}80`,
                                fontWeight: 900,
                            }}
                        >
                            {WINNER}
                        </motion.span>
                    )}
                </AnimatePresence>
            </div>

            {/* حالة "بيفكر" */}
            <AnimatePresence>
                {phase === 'thinking' && !prefersReduced && (
                    <motion.div
                        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        style={{
                            display: 'flex', alignItems: 'center', gap: '8px',
                            color: `${ORANGE}cc`, fontSize: '0.85rem', marginTop: '6px', fontWeight: 600,
                        }}
                    >
                        النموذج بيحسب الاحتمالات
                        {[0, 1, 2].map((i) => (
                            <motion.span key={i}
                                animate={{ opacity: [0.2, 1, 0.2] }}
                                transition={{ duration: 0.9, repeat: Infinity, delay: i * 0.18 }}
                                style={{ color: ORANGE }}
                            >●</motion.span>
                        ))}
                    </motion.div>
                )}
            </AnimatePresence>

            {/* شريط الاحتمالات */}
            <AnimatePresence>
                {showBars && (
                    <motion.div
                        initial={prefersReduced ? false : { opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        transition={{ duration: 0.4 }}
                        style={{ marginTop: '18px', display: 'flex', flexDirection: 'column', gap: '10px' }}
                    >
                        {CANDIDATES.map((c, i) => {
                            const isWinner = !!c.winner
                            const dimmed = picked && !isWinner
                            return (
                                <div key={c.word} style={{ opacity: dimmed ? 0.4 : 1, transition: 'opacity 0.5s' }}>
                                    <div style={{
                                        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                                        marginBottom: '5px', fontSize: '0.92rem', fontWeight: 700,
                                        color: isWinner ? GOLD : '#e8e0d8',
                                    }}>
                                        <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                            {isWinner && picked && <span>👑</span>}
                                            {c.word}
                                        </span>
                                        <motion.span
                                            initial={prefersReduced ? false : { opacity: 0 }}
                                            animate={{ opacity: 1 }}
                                            transition={{ delay: prefersReduced ? 0 : 0.25 + i * 0.12 }}
                                            style={{ color: isWinner ? GOLD : `${ORANGE}cc`, fontVariantNumeric: 'tabular-nums' }}
                                        >
                                            {c.prob}%
                                        </motion.span>
                                    </div>
                                    <div style={{
                                        height: '12px', borderRadius: '8px',
                                        background: 'rgba(255,255,255,0.06)', overflow: 'hidden',
                                        border: '1px solid rgba(255,255,255,0.05)',
                                    }}>
                                        <motion.div
                                            initial={prefersReduced ? { width: `${c.prob}%` } : { width: 0 }}
                                            animate={{ width: `${c.prob}%` }}
                                            transition={prefersReduced ? { duration: 0 } : { duration: 0.9, delay: 0.15 + i * 0.12, ease: 'easeOut' }}
                                            style={{
                                                height: '100%', borderRadius: '8px',
                                                background: isWinner
                                                    ? `linear-gradient(90deg, ${ORANGE}, ${GOLD})`
                                                    : `linear-gradient(90deg, ${ORANGE}66, ${ORANGE}aa)`,
                                                boxShadow: isWinner && picked ? `0 0 16px ${GOLD}66` : 'none',
                                            }}
                                        />
                                    </div>
                                </div>
                            )
                        })}
                    </motion.div>
                )}
            </AnimatePresence>

            {/* الخلاصة + زر إعادة */}
            <AnimatePresence>
                {phase === 'done' && (
                    <motion.div
                        initial={prefersReduced ? false : { opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 }}
                        style={{
                            marginTop: '18px', display: 'flex', flexWrap: 'wrap', gap: '12px',
                            alignItems: 'center', justifyContent: 'space-between',
                        }}
                    >
                        <span style={{
                            fontSize: '0.88rem', color: '#cfc6bd', fontWeight: 600, lineHeight: 1.6,
                        }}>
                            ✨ اختار <b style={{ color: GOLD }}>{WINNER}</b> لأنها الأعلى احتمالاً — مش لأنه &quot;عارف&quot;، بل لأنه حَسَب.
                        </span>
                        {!prefersReduced && (
                            <button
                                onClick={run}
                                style={{
                                    background: 'transparent', color: ORANGE,
                                    border: `1px solid ${ORANGE}66`, borderRadius: '10px',
                                    padding: '7px 14px', fontSize: '0.82rem', fontWeight: 700,
                                    cursor: 'pointer', fontFamily: 'inherit', whiteSpace: 'nowrap',
                                }}
                            >
                                ↺ شغّلها تاني
                            </button>
                        )}
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    )
}
