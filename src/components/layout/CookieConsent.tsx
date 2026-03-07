'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'

function setCookieConsentCookie(value: 'all' | 'essential') {
  const expires = new Date()
  expires.setFullYear(expires.getFullYear() + 1)
  document.cookie = `cookie_consent=${value}; expires=${expires.toUTCString()}; path=/; SameSite=Lax`
}

export function CookieConsent() {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const match = document.cookie.match(/cookie_consent=(\w+)/)
    if (!match) setVisible(true)
  }, [])

  function accept() {
    setCookieConsentCookie('all')
    setVisible(false)
    // Notify AnalyticsProvider to load optional trackers
    window.dispatchEvent(new CustomEvent('cookie_consent_update', { detail: 'all' }))
  }

  function essential() {
    setCookieConsentCookie('essential')
    setVisible(false)
    window.dispatchEvent(new CustomEvent('cookie_consent_update', { detail: 'essential' }))
  }

  if (!visible) return null

  return (
    <div className="fixed bottom-0 inset-x-0 z-50 bg-charcoal text-white shadow-2xl">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex flex-col sm:flex-row items-start sm:items-center gap-4">
        <p className="text-sm text-white/80 flex-1">
          We use essential cookies for site functionality and optional analytics cookies to improve
          your experience.
        </p>
        <div className="flex items-center gap-3 shrink-0">
          <Link
            href="/cookies"
            className="text-accent underline text-sm whitespace-nowrap hover:text-accent/80"
          >
            Learn More →
          </Link>
          <button
            onClick={essential}
            className="text-sm border border-white/30 text-white px-4 py-2 rounded-lg hover:border-white/60 transition-colors whitespace-nowrap"
          >
            Essential Only
          </button>
          <button
            onClick={accept}
            className="text-sm bg-accent text-charcoal font-bold px-4 py-2 rounded-lg hover:bg-accent/90 transition-colors whitespace-nowrap"
          >
            Accept All
          </button>
        </div>
      </div>
    </div>
  )
}

// Small button rendered in the footer to reopen preferences
export function CookiePreferencesButton() {
  function reopen() {
    // Clear the cookie so the banner reappears on next load
    document.cookie = 'cookie_consent=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;'
    window.location.reload()
  }

  return (
    <button
      onClick={reopen}
      className="text-white/40 hover:text-accent transition-colors text-xs flex items-center gap-1"
      aria-label="Manage cookie preferences"
    >
      <span className="material-symbols-outlined text-sm">cookie</span>
      Cookie preferences
    </button>
  )
}
