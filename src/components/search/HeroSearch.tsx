'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'

const AREA_PILLS = [
  { label: 'Orchard', value: 'orchard' },
  { label: 'Tampines', value: 'tampines' },
  { label: 'Jurong East', value: 'jurong-east' },
  { label: 'Woodlands', value: 'woodlands' },
  { label: 'Bedok', value: 'bedok' },
  { label: 'Ang Mo Kio', value: 'ang-mo-kio' },
  { label: 'Bishan', value: 'bishan' },
  { label: 'Bugis', value: 'bugis' },
]

export function HeroSearch() {
  const router = useRouter()
  const [query, setQuery] = useState('')

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const q = query.trim()
    if (q) router.push(`/search?q=${encodeURIComponent(q)}`)
  }

  function handleAreaPill(area: string) {
    router.push(`/halal-food?area=${area}`)
  }

  return (
    <div className="w-full max-w-xl mx-auto">
      {/* Search bar */}
      <form onSubmit={handleSubmit} className="relative mb-4">
        <div className="frosted-glass rounded-xl flex items-center gap-2 px-4 py-3">
          <span className="material-symbols-outlined text-white/60 shrink-0">search</span>
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search halal restaurants, mosques, events..."
            className="flex-1 bg-transparent text-white placeholder-white/40 text-sm outline-none"
            aria-label="Search HumbleHalal"
          />
          <button
            type="submit"
            className="bg-accent text-charcoal text-xs font-bold px-3 py-1.5 rounded-lg hover:bg-accent/90 transition-colors shrink-0"
          >
            Search
          </button>
        </div>
      </form>

      {/* Area pills */}
      <div className="flex flex-wrap justify-center gap-2">
        {AREA_PILLS.map((pill) => (
          <button
            key={pill.value}
            type="button"
            onClick={() => handleAreaPill(pill.value)}
            className="bg-white/10 text-white/70 border border-white/10 text-xs font-medium px-3 py-1.5 rounded-full hover:bg-white/20 hover:text-white transition-colors"
          >
            {pill.label}
          </button>
        ))}
      </div>
    </div>
  )
}
