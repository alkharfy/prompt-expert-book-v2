'use client'

import { useEffect } from 'react'

/**
 * On phones the floating buttons (chat, daily missions, notes, back to top) sit on the
 * lesson text. They step aside while the reader scrolls down and come back on a scroll
 * up, at the top and at the end of the page. The hiding itself is CSS (base.css, ≤768px).
 */
export default function FabsAutoHide() {
    useEffect(() => {
        const root = document.documentElement
        let lastY = window.scrollY
        let queued = false

        const update = () => {
            queued = false
            const y = window.scrollY
            const atEnd = window.innerHeight + y >= root.scrollHeight - 80
            const delta = y - lastY
            if (Math.abs(delta) < 8 && !atEnd && y > 80) return
            root.classList.toggle('pm-fabs-away', delta > 0 && y > 80 && !atEnd)
            lastY = y
        }
        const onScroll = () => {
            if (queued) return
            queued = true
            requestAnimationFrame(update)
        }

        window.addEventListener('scroll', onScroll, { passive: true })
        return () => {
            window.removeEventListener('scroll', onScroll)
            root.classList.remove('pm-fabs-away')
        }
    }, [])

    return null
}
