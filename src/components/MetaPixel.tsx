'use client'

import { useEffect, useRef } from 'react'
import { usePathname, useSearchParams } from 'next/navigation'

/**
 * MetaPixel — Client component that fires PageView on SPA route changes.
 * The base pixel script is loaded via an inline <script> in layout.tsx <head>.
 * This component only handles subsequent client-side navigations.
 */
export default function MetaPixel() {
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const isFirstRender = useRef(true)

  useEffect(() => {
    // Skip the first render — the inline script in <head> already fired PageView
    if (isFirstRender.current) {
      isFirstRender.current = false
      return
    }
    // Fire PageView on every subsequent SPA navigation
    if (typeof window !== 'undefined' && typeof window.fbq === 'function') {
      window.fbq('track', 'PageView')
    }
  }, [pathname, searchParams])

  return null
}
