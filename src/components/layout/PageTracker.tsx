'use client'

import { Suspense } from 'react'
import { usePageTracking } from '@/hooks/usePageTracking'

function Tracker() {
  usePageTracking()
  return null
}

/**
 * Drop this into the root layout to auto-track every page view.
 * Wrapped in Suspense because useSearchParams() needs it.
 */
export function PageTracker() {
  return (
    <Suspense fallback={null}>
      <Tracker />
    </Suspense>
  )
}
