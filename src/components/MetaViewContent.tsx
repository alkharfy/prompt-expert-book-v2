'use client'

import { useEffect } from 'react'
import { trackViewContent } from '@/lib/meta-pixel'
import { trackViewItem, trackFunnelStep } from '@/lib/analytics'

/**
 * Invisible client component that fires a Meta Pixel ViewContent event
 * and GA4 view_item event on mount. Drop it into any Server Component
 * page that needs the event.
 */
export default function MetaViewContent() {
  useEffect(() => {
    trackViewContent()
    trackViewItem()
    trackFunnelStep('landing_page', 1)
  }, [])

  return null
}
