'use client'

import { useEffect, useRef } from 'react'

const activeBars = new Map<HTMLElement, number>()

function updatePageOffset() {
  const height = Math.max(0, ...activeBars.values())
  document.documentElement.style.setProperty('--bottom-bar-height', `${height}px`)
}

/** يحجز مساحة للشريط الظاهر ويُبعد الأزرار العائمة عن أهداف الشراء. */
export function useBottomBarOffset(active: boolean) {
  const barRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const bar = barRef.current
    if (!active || !bar) return

    const measure = () => {
      const height = getComputedStyle(bar).display === 'none' ? 0 : bar.getBoundingClientRect().height
      activeBars.set(bar, Math.ceil(height))
      updatePageOffset()
    }

    measure()
    const observer = new ResizeObserver(measure)
    observer.observe(bar)
    window.addEventListener('resize', measure)

    return () => {
      observer.disconnect()
      window.removeEventListener('resize', measure)
      activeBars.delete(bar)
      updatePageOffset()
    }
  }, [active])

  return barRef
}
