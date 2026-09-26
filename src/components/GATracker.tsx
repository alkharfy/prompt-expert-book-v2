'use client'

import { useEffect, useRef } from 'react'
import { usePathname, useSearchParams } from 'next/navigation'
import { trackPageview } from '@/lib/analytics'

/**
 * GATracker — fires GA4 page_view on SPA route changes.
 * The base gtag script is loaded inline in layout.tsx <head>.
 * This component handles subsequent client-side navigations.
 */
export default function GATracker() {
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const isFirstRender = useRef(true)

  useEffect(() => {
    // Skip the first render — the inline script already fired page_view
    if (isFirstRender.current) {
      isFirstRender.current = false
      return
    }
    const url = pathname + (searchParams?.toString() ? `?${searchParams.toString()}` : '')
    trackPageview(url)
  }, [pathname, searchParams])

  return null
}
