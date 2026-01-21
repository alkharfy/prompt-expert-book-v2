'use client'

import { motion } from 'framer-motion'
import React from 'react'

const GlowFilter = ({ id }: { id: string }) => (
    <defs>
        <filter id={id} x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur in="SourceGraphic" stdDeviation="8" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
        </filter>
        <linearGradient id="orangeGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#FF6B35" />
            <stop offset="100%" stopColor="#FFB800" />
        </linearGradient>
    </defs>
)

export const MagicWand = () => (
    <div className="w-16 h-16 relative">
        <svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-[0_0_15px_rgba(255,107,53,0.6)]">
            <GlowFilter id="wandGlow" />
            <motion.path
                d="M30 70 L70 30"
                stroke="url(#orangeGradient)"
                strokeWidth="6"
                strokeLinecap="round"
                initial={{ pathLength: 0 }}
                animate={{ pathLength: 1 }}
                transition={{ duration: 1.5 }}
            />
            <motion.path
                d="M70 30 L75 25"
                stroke="#fff"
                strokeWidth="4"
                strokeLinecap="round"
                animate={{ opacity: [0.5, 1, 0.5] }}
                transition={{ duration: 2, repeat: Infinity }}
            />
            {/* Sparkles */}
            {[...Array(5)].map((_, i) => (
                <motion.circle
                    key={i}
                    cx={70 + Math.random() * 20 - 10}
                    cy={30 + Math.random() * 20 - 10}
                    r="1.5"
                    fill="#FF9F1C"
                    animate={{
                        opacity: [0, 1, 0],
                        scale: [0, 1.5, 0],
                        y: [0, -20]
                    }}
                    transition={{
                        duration: 1 + Math.random(),
                        repeat: Infinity,
                        delay: i * 0.4
                    }}
                />
            ))}
        </svg>
    </div>
)

export const DigitalBrain = () => (
    <div className="w-16 h-16 relative">
        <svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-[0_0_15px_rgba(255,107,53,0.6)]">
            <GlowFilter id="brainGlow" />
            {/* Nodes */}
            <circle cx="50" cy="50" r="4" fill="url(#orangeGradient)" filter="url(#brainGlow)" />
            {[...Array(6)].map((_, i) => {
                const angle = (i * 60 * Math.PI) / 180
                const x = 50 + Math.cos(angle) * 30
                const y = 50 + Math.sin(angle) * 30
                return (
                    <React.Fragment key={i}>
                        <motion.line
                            x1="50" y1="50" x2={x} y2={y}
                            stroke="#FF6B35"
                            strokeWidth="1"
                            strokeOpacity="0.4"
                            animate={{ strokeOpacity: [0.2, 0.6, 0.2] }}
                            transition={{ duration: 2, repeat: Infinity, delay: i * 0.3 }}
                        />
                        <motion.circle
                            cx={x} cy={y} r="3"
                            fill="#FF9F1C"
                            animate={{ scale: [1, 1.3, 1] }}
                            transition={{ duration: 2, repeat: Infinity, delay: i * 0.3 }}
                        />
                    </React.Fragment>
                )
            })}
        </svg>
    </div>
)

export const CodeBrackets = () => (
    <div className="w-16 h-16 relative">
        <svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-[0_0_15px_rgba(255,107,53,0.5)]">
            <GlowFilter id="codeGlow" />
            <motion.text
                x="10" y="70"
                fontSize="60"
                fontFamily="monospace"
                fontWeight="bold"
                fill="url(#orangeGradient)"
                animate={{ rotateY: [0, 20, 0] }}
                transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
            >
                {'{'}
            </motion.text>
            <motion.text
                x="60" y="70"
                fontSize="60"
                fontFamily="monospace"
                fontWeight="bold"
                fill="url(#orangeGradient)"
                animate={{ rotateY: [0, -20, 0] }}
                transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
            >
                {'}'}
            </motion.text>
        </svg>
    </div>
)

export const SmartBulb = () => (
    <div className="w-16 h-16 relative">
        <svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-[0_0_20px_rgba(255,107,53,0.7)]">
            <GlowFilter id="bulbGlow" />
            {/* Bulb Shape */}
            <path
                d="M50 20 C35 20 25 35 25 50 C25 65 35 70 40 80 L60 80 C65 70 75 65 75 50 C75 35 65 20 50 20"
                fill="none"
                stroke="url(#orangeGradient)"
                strokeWidth="4"
            />
            {/* Filament */}
            <motion.path
                d="M40 50 L50 40 L60 50 L50 60 Z"
                fill="#FF9F1C"
                animate={{ opacity: [0.3, 1, 0.3], filter: ["blur(0px)", "blur(2px)", "blur(0px)"] }}
                transition={{ duration: 1.5, repeat: Infinity }}
            />
            {/* Base */}
            <rect x="42" y="82" width="16" height="4" fill="#666" rx="1" />
            <rect x="44" y="88" width="12" height="4" fill="#666" rx="1" />
        </svg>
    </div>
)

export const PenIcon = () => (
    <div className="w-16 h-16 relative">
        <svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-[0_0_15px_rgba(255,107,53,0.6)]">
            <GlowFilter id="penGlow" />
            <motion.path
                d="M20 80 L35 85 L85 35 L70 20 Z"
                fill="none"
                stroke="url(#orangeGradient)"
                strokeWidth="4"
                strokeLinejoin="round"
            />
            <motion.path
                d="M70 20 L85 35"
                stroke="#FFB800"
                strokeWidth="6"
                strokeLinecap="round"
                animate={{ opacity: [0.6, 1, 0.6] }}
            />
            <motion.path
                d="M20 80 L35 85"
                stroke="#FFB800"
                strokeWidth="2"
            />
        </svg>
    </div>
)

export const UICardIcon = () => (
    <div className="w-20 h-16 relative">
        <svg viewBox="0 0 120 100" className="w-full h-full drop-shadow-[0_0_15px_rgba(255,107,53,0.5)]">
            <GlowFilter id="uiGlow" />
            <rect x="10" y="20" width="100" height="60" rx="4" fill="none" stroke="url(#orangeGradient)" strokeWidth="3" />
            <rect x="20" y="35" width="20" height="20" rx="2" fill="#FFB800" opacity="0.6" />
            <rect x="45" y="35" width="55" height="4" rx="2" fill="url(#orangeGradient)" opacity="0.4" />
            <rect x="45" y="45" width="40" height="4" rx="2" fill="url(#orangeGradient)" opacity="0.4" />
            <motion.circle cx="100" cy="30" r="3" fill="#FFB800" animate={{ scale: [1, 1.5, 1] }} transition={{ repeat: Infinity, duration: 2 }} />
        </svg>
    </div>
)

export const FlowchartIcon = () => (
    <div className="w-16 h-16 relative">
        <svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-[0_0_15px_rgba(255,107,53,0.5)]">
            <GlowFilter id="flowGlow" />
            <rect x="40" y="10" width="20" height="20" rx="2" fill="none" stroke="url(#orangeGradient)" strokeWidth="2" />
            <rect x="15" y="60" width="20" height="20" rx="2" fill="none" stroke="url(#orangeGradient)" strokeWidth="2" />
            <rect x="65" y="60" width="20" height="20" rx="2" fill="none" stroke="url(#orangeGradient)" strokeWidth="2" />
            <path d="M50 30 V45 H25 V60 M50 45 H75 V60" fill="none" stroke="#FFB800" strokeWidth="2" strokeDasharray="4 2" />
            <motion.circle r="2" fill="#FFB800">
                <animateMotion path="M50 30 V45 H25 V60" dur="3s" repeatCount="indefinite" />
            </motion.circle>
        </svg>
    </div>
)

export const SitemapIcon = () => (
    <div className="w-16 h-16 relative">
        <svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-[0_0_15px_rgba(255,107,53,0.5)]">
            <GlowFilter id="siteGlow" />
            <rect x="10" y="10" width="80" height="80" rx="4" fill="none" stroke="url(#orangeGradient)" strokeWidth="2" opacity="0.3" />
            <line x1="10" y1="40" x2="90" y2="40" stroke="url(#orangeGradient)" strokeWidth="1" />
            <line x1="10" y1="70" x2="90" y2="70" stroke="url(#orangeGradient)" strokeWidth="1" />
            <line x1="40" y1="10" x2="40" y2="90" stroke="url(#orangeGradient)" strokeWidth="1" />
            <line x1="70" y1="10" x2="70" y2="90" stroke="url(#orangeGradient)" strokeWidth="1" />
            <motion.rect x="42" y="12" width="26" height="26" fill="#FFB800" opacity="0.4" animate={{ opacity: [0.2, 0.5, 0.2] }} transition={{ repeat: Infinity, duration: 3 }} />
        </svg>
    </div>
)

export const CheckmarkIcon = () => (
    <div className="w-16 h-16 relative">
        <svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-[0_0_20px_rgba(255,184,0,0.6)]">
            <GlowFilter id="checkGlow" />
            <motion.path
                d="M20 50 L40 70 L80 30"
                fill="none"
                stroke="#FFB800"
                strokeWidth="8"
                strokeLinecap="round"
                strokeLinejoin="round"
                initial={{ pathLength: 0 }}
                animate={{ pathLength: 1 }}
                transition={{ duration: 1 }}
            />
            <circle cx="50" cy="50" r="45" fill="none" stroke="url(#orangeGradient)" strokeWidth="2" opacity="0.4" />
        </svg>
    </div>
)

export const DatabaseIcon = () => (
    <div className="w-16 h-16 relative">
        <svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-[0_0_15px_rgba(255,107,53,0.5)]">
            <GlowFilter id="dbGlow" />
            <ellipse cx="50" cy="25" rx="30" ry="10" fill="none" stroke="url(#orangeGradient)" strokeWidth="3" />
            <path d="M20 25 V75 C20 85 80 85 80 75 V25" fill="none" stroke="url(#orangeGradient)" strokeWidth="3" />
            <path d="M20 50 C20 60 80 60 80 50" fill="none" stroke="url(#orangeGradient)" strokeWidth="2" opacity="0.6" />
            <motion.ellipse cx="50" cy="25" rx="15" ry="5" fill="#FFB800" animate={{ opacity: [0.3, 0.8, 0.3] }} transition={{ repeat: Infinity, duration: 2 }} />
        </svg>
    </div>
)
