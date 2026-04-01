'use client'

import React from 'react'

interface UpgradeButtonProps {
  listingId: string
  tier: string
  tierName: string
}

export function UpgradeButton({ listingId, tier, tierName }: UpgradeButtonProps) {
  const [loading, setLoading] = React.useState(false)

  async function handleUpgrade() {
    setLoading(true)
    try {
      const res = await fetch('/api/listings/upgrade', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ listingId, tier }),
      })
      const data = await res.json()
      if (data.url) {
        window.location.href = data.url
      } else {
        alert(data.error ?? 'Something went wrong')
        setLoading(false)
      }
    } catch {
      alert('Something went wrong. Please try again.')
      setLoading(false)
    }
  }

  return (
    <button
      onClick={handleUpgrade}
      disabled={loading}
      className="mt-6 w-full bg-primary text-white font-bold py-3 px-4 rounded-xl text-sm hover:bg-primary/90 transition-colors disabled:opacity-60"
    >
      {loading ? 'Redirecting to checkout...' : `Get ${tierName}`}
    </button>
  )
}
