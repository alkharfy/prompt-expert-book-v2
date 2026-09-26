'use client'

import { useEffect, useRef, useCallback } from 'react'
import { usePathname } from 'next/navigation'

interface Particle {
    x: number
    y: number
    baseX: number
    baseY: number
    size: number
    opacity: number
    speed: number
    phase: number
    amplitudeY: number
    amplitudeX: number
}

export default function BackgroundParticles() {
    const canvasRef = useRef<HTMLCanvasElement>(null)
    const animationRef = useRef<number>(0)
    const particlesRef = useRef<Particle[]>([])
    const pathname = usePathname()
    const isHome = pathname === '/'
    // PERFORMANCE: Skip particles on reading pages where smooth scrolling matters
    const isReadingPage = pathname?.startsWith('/read')

    const initParticles = useCallback((width: number, height: number) => {
        const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
        if (prefersReducedMotion || isReadingPage) {
            particlesRef.current = []
            return
        }

        const isMobile = width < 768
        const count = isHome
            ? (isMobile ? 20 : 50)
            : (isMobile ? 40 : 80)

        const particles: Particle[] = []
        for (let i = 0; i < count; i++) {
            particles.push({
                x: Math.random() * width,
                y: Math.random() * height,
                baseX: Math.random() * width,
                baseY: Math.random() * height,
                size: 2 + Math.random() * 3,
                opacity: 0.3 + Math.random() * 0.4,
                speed: 0.0003 + Math.random() * 0.0005,
                phase: Math.random() * Math.PI * 2,
                amplitudeY: 60 + Math.random() * 80,
                amplitudeX: 15 + Math.random() * 20,
            })
        }
        particlesRef.current = particles
    }, [isHome, isReadingPage])

    useEffect(() => {
        const canvas = canvasRef.current
        if (!canvas) return

        const ctx = canvas.getContext('2d')
        if (!ctx) return

        const resize = () => {
            canvas.width = window.innerWidth
            canvas.height = window.innerHeight
            initParticles(canvas.width, canvas.height)
        }

        resize()

        // Reduced-motion (or otherwise empty): don't burn a 60fps rAF clearing an empty canvas.
        if (particlesRef.current.length === 0) {
            window.addEventListener('resize', resize)
            return () => window.removeEventListener('resize', resize)
        }

        let lastTime = 0
        const draw = (time: number) => {
            const dt = time - lastTime
            lastTime = time

            ctx.clearRect(0, 0, canvas.width, canvas.height)

            for (const p of particlesRef.current) {
                p.phase += p.speed * dt
                p.x = p.baseX + Math.sin(p.phase * 0.7) * p.amplitudeX
                p.y = p.baseY + Math.sin(p.phase) * p.amplitudeY
                const currentOpacity = p.opacity * (0.7 + 0.3 * Math.sin(p.phase * 1.3))

                // Draw glow
                const gradient = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.size * 4)
                gradient.addColorStop(0, `rgba(255, 107, 53, ${currentOpacity * 0.6})`)
                gradient.addColorStop(1, 'rgba(255, 107, 53, 0)')
                ctx.fillStyle = gradient
                ctx.beginPath()
                ctx.arc(p.x, p.y, p.size * 4, 0, Math.PI * 2)
                ctx.fill()

                // Draw core
                ctx.fillStyle = `rgba(255, 107, 53, ${currentOpacity})`
                ctx.beginPath()
                ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2)
                ctx.fill()
            }

            animationRef.current = requestAnimationFrame(draw)
        }

        animationRef.current = requestAnimationFrame(draw)

        // Pause the animation loop while the tab is hidden (saves battery/CPU).
        const onVisibility = () => {
            cancelAnimationFrame(animationRef.current)
            if (!document.hidden) {
                lastTime = 0
                animationRef.current = requestAnimationFrame(draw)
            }
        }

        window.addEventListener('resize', resize)
        document.addEventListener('visibilitychange', onVisibility)
        return () => {
            cancelAnimationFrame(animationRef.current)
            window.removeEventListener('resize', resize)
            document.removeEventListener('visibilitychange', onVisibility)
        }
    }, [initParticles])

    // Don't render canvas at all on reading pages
    if (isReadingPage) return null

    return (
        <canvas
            ref={canvasRef}
            style={{
                position: 'fixed',
                top: 0,
                left: 0,
                width: '100%',
                height: '100%',
                pointerEvents: 'none',
                zIndex: -3,
            }}
        />
    )
}
