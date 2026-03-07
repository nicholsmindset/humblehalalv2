'use client'

import { useEffect } from 'react'

declare global {
  interface Window {
    dataLayer: unknown[]
    gtag: (...args: unknown[]) => void
  }
}

function loadGA4(measurementId: string) {
  if (document.getElementById('ga4-script')) return
  const script = document.createElement('script')
  script.id = 'ga4-script'
  script.src = `https://www.googletagmanager.com/gtag/js?id=${measurementId}`
  script.async = true
  document.head.appendChild(script)
  window.dataLayer = window.dataLayer || []
  window.gtag = function gtag() {
    // eslint-disable-next-line prefer-rest-params
    window.dataLayer.push(arguments)
  }
  window.gtag('js', new Date())
  window.gtag('config', measurementId)
}

async function loadPostHog(key: string, host: string) {
  const posthog = (await import('posthog-js')).default
  if (!posthog.__loaded) {
    posthog.init(key, { api_host: host, capture_pageview: true })
  }
}

function initAnalytics() {
  const measurementId = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID
  const posthogKey = process.env.NEXT_PUBLIC_POSTHOG_KEY
  const posthogHost = process.env.NEXT_PUBLIC_POSTHOG_HOST || 'https://app.posthog.com'

  if (measurementId) loadGA4(measurementId)
  if (posthogKey) loadPostHog(posthogKey, posthogHost)
}

export function AnalyticsProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    // Check existing consent on mount
    const match = document.cookie.match(/cookie_consent=(\w+)/)
    if (match?.[1] === 'all') {
      initAnalytics()
    }

    // Listen for consent updates from the banner
    function handleConsentUpdate(e: Event) {
      const detail = (e as CustomEvent<string>).detail
      if (detail === 'all') {
        initAnalytics()
      }
    }
    window.addEventListener('cookie_consent_update', handleConsentUpdate)
    return () => window.removeEventListener('cookie_consent_update', handleConsentUpdate)
  }, [])

  return <>{children}</>
}
