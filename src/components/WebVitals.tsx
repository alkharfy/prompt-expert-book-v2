'use client'

import { useReportWebVitals } from 'next/web-vitals'
import { reportWebVitals } from '@/lib/analytics'

export default function WebVitals() {
  useReportWebVitals((metric) => {
    reportWebVitals(metric)
  })

  return null
}
