'use client'

import type { Expression } from './guideScenarios'

interface RobotFaceProps {
    expression: Expression
    /** 0–1, how open the mouth is (0 = resting expression mouth). */
    level: number
    blinking: boolean
}

// Coordinates are in robot-new.png pixel space (1024×1024, before the mirror flip).
const L = { x: 515, y: 290 }
const R = { x: 636, y: 290 }
const M = { x: 574, y: 338 }

function happyEye(x: number, y: number) {
    return <path d={`M ${x - 24} ${y + 8} Q ${x} ${y - 20} ${x + 24} ${y + 8}`} className="pm-face-stroke" />
}

function roundEye(x: number, y: number, r: number, blinking: boolean) {
    return <ellipse cx={x} cy={y} rx={r} ry={blinking ? 2 : r * 1.15} className="pm-face-fill" />
}

function eyes(expression: Expression, blinking: boolean) {
    switch (expression) {
        case 'happy':
            return <>{happyEye(L.x, L.y)}{happyEye(R.x, R.y)}</>
        case 'wink':
            return <>{roundEye(L.x, L.y, 12, blinking)}{happyEye(R.x, R.y)}</>
        case 'curious':
            return (
                <>
                    {roundEye(L.x, L.y + 2, 11, blinking)}
                    {roundEye(R.x, R.y + 2, 13, blinking)}
                    <path d={`M ${L.x - 20} ${L.y - 24} L ${L.x + 18} ${L.y - 20}`} className="pm-face-stroke thin" />
                    <path d={`M ${R.x - 20} ${R.y - 30} Q ${R.x} ${R.y - 42} ${R.x + 20} ${R.y - 32}`} className="pm-face-stroke thin" />
                </>
            )
        case 'surprised':
            return (
                <>
                    {roundEye(L.x, L.y, 15, blinking)}
                    {roundEye(R.x, R.y, 15, blinking)}
                    <path d={`M ${L.x - 18} ${L.y - 34} Q ${L.x} ${L.y - 44} ${L.x + 18} ${L.y - 34}`} className="pm-face-stroke thin" />
                    <path d={`M ${R.x - 18} ${R.y - 34} Q ${R.x} ${R.y - 44} ${R.x + 18} ${R.y - 34}`} className="pm-face-stroke thin" />
                </>
            )
        case 'annoyed':
            return (
                <>
                    {roundEye(L.x, L.y + 4, 11, blinking)}
                    {roundEye(R.x, R.y + 4, 11, blinking)}
                    <path d={`M ${L.x - 22} ${L.y - 22} L ${L.x + 20} ${L.y - 12}`} className="pm-face-stroke thin" />
                    <path d={`M ${R.x - 20} ${R.y - 12} L ${R.x + 22} ${R.y - 22}`} className="pm-face-stroke thin" />
                </>
            )
    }
}

function mouth(expression: Expression, level: number) {
    const talking = level > 0.08
    if (expression === 'surprised') {
        return <ellipse cx={M.x} cy={M.y + 4} rx={9 + level * 5} ry={talking ? 8 + level * 12 : 9} className="pm-face-fill" />
    }
    if (expression === 'annoyed') {
        return talking
            ? <ellipse cx={M.x} cy={M.y + 6} rx={18} ry={3 + level * 9} className="pm-face-fill" />
            : <path d={`M ${M.x - 20} ${M.y + 10} Q ${M.x} ${M.y} ${M.x + 20} ${M.y + 10}`} className="pm-face-stroke" />
    }
    if (!talking) {
        return expression === 'curious'
            ? <path d={`M ${M.x - 18} ${M.y + 6} Q ${M.x} ${M.y + 12} ${M.x + 20} ${M.y}`} className="pm-face-stroke" />
            : <path d={`M ${M.x - 30} ${M.y} Q ${M.x} ${M.y + 26} ${M.x + 30} ${M.y}`} className="pm-face-stroke" />
    }
    const half = 28 - level * 5
    const depth = 10 + level * 30
    return <path d={`M ${M.x - half} ${M.y - 2} Q ${M.x} ${M.y - 2 + depth * 2} ${M.x + half} ${M.y - 2} Z`} className="pm-face-fill" />
}

export default function RobotFace({ expression, level, blinking }: RobotFaceProps) {
    return (
        <svg viewBox="0 0 1024 1024" className="pm-face" aria-hidden="true">
            <defs>
                <filter id="pm-screen-feather" x="-20%" y="-20%" width="140%" height="140%">
                    <feGaussianBlur stdDeviation="5" />
                </filter>
                <filter id="pm-face-glow" x="-50%" y="-50%" width="200%" height="200%">
                    <feGaussianBlur stdDeviation="5" result="blur" />
                    <feMerge>
                        <feMergeNode in="blur" />
                        <feMergeNode in="SourceGraphic" />
                    </feMerge>
                </filter>
                <pattern id="pm-led" width="4" height="4" patternUnits="userSpaceOnUse">
                    <rect width="4" height="4" fill="transparent" />
                    <rect width="1" height="4" fill="rgba(0,0,0,0.35)" />
                    <rect width="4" height="1" fill="rgba(0,0,0,0.35)" />
                </pattern>
                <linearGradient id="pm-screen-grad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0" stopColor="#1a120d" />
                    <stop offset="1" stopColor="#0b0705" />
                </linearGradient>
            </defs>

            {/* Paint over the face baked into the image */}
            <rect x="484" y="238" width="206" height="124" rx="30" fill="url(#pm-screen-grad)" filter="url(#pm-screen-feather)" />

            <g filter="url(#pm-face-glow)">
                {eyes(expression, blinking)}
                {mouth(expression, level)}
            </g>
            <rect x="484" y="238" width="206" height="124" rx="30" fill="url(#pm-led)" />

            <style>{`
                .pm-face-fill { fill: #ffb547; }
                .pm-face-stroke { fill: none; stroke: #ffb547; stroke-width: 12; stroke-linecap: round; }
                .pm-face-stroke.thin { stroke-width: 6; }
            `}</style>
        </svg>
    )
}
