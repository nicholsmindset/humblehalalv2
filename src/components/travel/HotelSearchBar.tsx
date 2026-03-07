'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'

interface Place {
  placeId: string
  name: string
  description: string
}

interface Props {
  defaultDestination?: string
  defaultCheckin?: string
  defaultCheckout?: string
  defaultGuests?: number
}

export function HotelSearchBar({
  defaultDestination = '',
  defaultCheckin = '',
  defaultCheckout = '',
  defaultGuests = 2,
}: Props) {
  const router = useRouter()
  const [destination, setDestination] = useState(defaultDestination)
  const [checkin, setCheckin] = useState(defaultCheckin)
  const [checkout, setCheckout] = useState(defaultCheckout)
  const [guests, setGuests] = useState(defaultGuests)
  const [places, setPlaces] = useState<Place[]>([])
  const [showSuggestions, setShowSuggestions] = useState(false)
  const debounceRef = useRef<NodeJS.Timeout | null>(null)

  // Default dates: tomorrow + 3 nights (only on mount when no defaults provided)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    if (!checkin) {
      const tomorrow = new Date()
      tomorrow.setDate(tomorrow.getDate() + 1)
      setCheckin(tomorrow.toISOString().slice(0, 10))
    }
    if (!checkout) {
      const checkout3 = new Date()
      checkout3.setDate(checkout3.getDate() + 4)
      setCheckout(checkout3.toISOString().slice(0, 10))
    }
  }, []) // intentionally empty — only run on mount to set defaults

  // Autocomplete
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current)
    if (destination.length < 2) { setPlaces([]); return }

    debounceRef.current = setTimeout(async () => {
      try {
        const res = await fetch(`/api/travel/autocomplete?q=${encodeURIComponent(destination)}`)
        const data = await res.json()
        setPlaces(data.places ?? [])
        setShowSuggestions(true)
      } catch {
        setPlaces([])
      }
    }, 300)
  }, [destination])

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    if (!destination || !checkin || !checkout) return
    const params = new URLSearchParams({
      dest: destination,
      checkin,
      checkout,
      guests: String(guests),
    })
    router.push(`/travel/hotels?${params.toString()}`)
  }

  const selectPlace = (place: Place) => {
    setDestination(place.name)
    setPlaces([])
    setShowSuggestions(false)
  }

  return (
    <form onSubmit={handleSearch} className="relative">
      <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-4 flex flex-col sm:flex-row gap-3">
        {/* Destination */}
        <div className="flex-1 relative">
          <label className="block text-xs font-bold text-charcoal/50 mb-1 uppercase tracking-wide">Destination</label>
          <div className="relative">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-primary text-lg">travel_explore</span>
            <input
              type="text"
              value={destination}
              onChange={(e) => setDestination(e.target.value)}
              onFocus={() => places.length > 0 && setShowSuggestions(true)}
              onBlur={() => setTimeout(() => setShowSuggestions(false), 150)}
              placeholder="Tokyo, Dubai, Istanbul…"
              required
              className="w-full pl-9 pr-3 py-2.5 text-sm text-charcoal border border-gray-200 rounded-xl focus:outline-none focus:border-primary placeholder:text-charcoal/30"
            />
          </div>
          {showSuggestions && places.length > 0 && (
            <ul className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-xl shadow-lg z-50 overflow-hidden">
              {places.map((p) => (
                <li key={p.placeId}>
                  <button
                    type="button"
                    onMouseDown={() => selectPlace(p)}
                    className="w-full text-left px-4 py-2.5 text-sm hover:bg-emerald-50 transition-colors"
                  >
                    <p className="font-semibold text-charcoal">{p.name}</p>
                    {p.description && (
                      <p className="text-xs text-charcoal/50 truncate">{p.description}</p>
                    )}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Check-in */}
        <div className="sm:w-36">
          <label className="block text-xs font-bold text-charcoal/50 mb-1 uppercase tracking-wide">Check-in</label>
          <input
            type="date"
            value={checkin}
            onChange={(e) => setCheckin(e.target.value)}
            min={new Date().toISOString().slice(0, 10)}
            required
            className="w-full px-3 py-2.5 text-sm text-charcoal border border-gray-200 rounded-xl focus:outline-none focus:border-primary"
          />
        </div>

        {/* Check-out */}
        <div className="sm:w-36">
          <label className="block text-xs font-bold text-charcoal/50 mb-1 uppercase tracking-wide">Check-out</label>
          <input
            type="date"
            value={checkout}
            onChange={(e) => setCheckout(e.target.value)}
            min={checkin || new Date().toISOString().slice(0, 10)}
            required
            className="w-full px-3 py-2.5 text-sm text-charcoal border border-gray-200 rounded-xl focus:outline-none focus:border-primary"
          />
        </div>

        {/* Guests */}
        <div className="sm:w-24">
          <label className="block text-xs font-bold text-charcoal/50 mb-1 uppercase tracking-wide">Guests</label>
          <select
            value={guests}
            onChange={(e) => setGuests(parseInt(e.target.value))}
            className="w-full px-3 py-2.5 text-sm text-charcoal border border-gray-200 rounded-xl focus:outline-none focus:border-primary bg-white"
          >
            {[1, 2, 3, 4, 5, 6].map((n) => (
              <option key={n} value={n}>{n} {n === 1 ? 'guest' : 'guests'}</option>
            ))}
          </select>
        </div>

        {/* Search button */}
        <div className="flex items-end">
          <button
            type="submit"
            className="w-full sm:w-auto bg-primary text-white px-6 py-2.5 rounded-xl text-sm font-bold hover:bg-primary/90 transition-colors flex items-center gap-2 justify-center"
          >
            <span className="material-symbols-outlined text-sm">search</span>
            Search
          </button>
        </div>
      </div>
    </form>
  )
}
