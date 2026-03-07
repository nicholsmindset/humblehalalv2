'use client'

import { useState, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'

// Skyscanner affiliate URL builder
function buildSkyscannerUrl(params: {
  origin: string
  destination: string
  departDate: string
  returnDate: string
  adults: string
}) {
  const { origin, destination, departDate, returnDate, adults } = params
  // Format dates: YYMMDD for Skyscanner
  const fmtDate = (d: string) => d.replace(/-/g, '').slice(2)
  const dep = fmtDate(departDate)
  const ret = fmtDate(returnDate)
  const base = returnDate
    ? `https://www.skyscanner.com.sg/transport/flights/${origin}/${destination}/${dep}/${ret}/`
    : `https://www.skyscanner.com.sg/transport/flights/${origin}/${destination}/${dep}/`
  const qs = new URLSearchParams({
    adultsv2: adults || '1',
    ref: 'humblehalal',
    utm_source: 'humblehalal',
    utm_medium: 'referral',
    utm_campaign: 'flight_search',
  })
  return `${base}?${qs.toString()}`
}

function FlightsContent() {
  const searchParams = useSearchParams()

  const [origin, setOrigin]           = useState(searchParams.get('from') ?? 'SIN')
  const [destination, setDestination] = useState(searchParams.get('to') ?? '')
  const [departDate, setDepartDate]   = useState(searchParams.get('depart') ?? '')
  const [returnDate, setReturnDate]   = useState(searchParams.get('return') ?? '')
  const [adults, setAdults]           = useState(searchParams.get('adults') ?? '1')
  const [tripType, setTripType]       = useState<'return' | 'oneway'>('return')

  function handleSearch(e: React.FormEvent) {
    e.preventDefault()
    // Track the affiliate click (fire-and-forget)
    fetch('/api/track', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        event_type: 'click_flight_affiliate',
        page_url: '/travel/flights',
        search_term: `${origin}-${destination}`,
        source_channel: 'travel',
      }),
    }).catch(() => {})

    const url = buildSkyscannerUrl({
      origin,
      destination,
      departDate,
      returnDate: tripType === 'return' ? returnDate : '',
      adults,
    })
    window.open(url, '_blank', 'noopener,noreferrer')
  }

  // Today + 1 month for default dates
  const today = new Date()
  const minDate = today.toISOString().split('T')[0]

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 py-10">
      {/* Header */}
      <div className="mb-8 text-center">
        <div className="inline-flex items-center justify-center w-14 h-14 bg-primary/10 rounded-2xl mb-4">
          <span className="material-symbols-outlined text-3xl text-primary">flight</span>
        </div>
        <h1 className="text-2xl font-extrabold text-charcoal">Search Halal-Friendly Flights</h1>
        <p className="text-charcoal/60 text-sm mt-2 max-w-md mx-auto">
          Compare flights from Singapore and worldwide via Skyscanner.
          Book your flights, then find Muslim-friendly hotels with us.
        </p>
      </div>

      {/* Flight search form */}
      <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
        {/* Trip type toggle */}
        <div className="flex gap-2 mb-5">
          {(['return', 'oneway'] as const).map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setTripType(t)}
              className={`px-4 py-1.5 rounded-full text-sm font-semibold transition-colors ${
                tripType === t
                  ? 'bg-primary text-white'
                  : 'bg-gray-100 text-charcoal/60 hover:bg-gray-200'
              }`}
            >
              {t === 'return' ? 'Return' : 'One-way'}
            </button>
          ))}
        </div>

        <form onSubmit={handleSearch} className="space-y-4">
          {/* Origin / Destination */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-charcoal/50 mb-1">From</label>
              <input
                type="text"
                value={origin}
                onChange={(e) => setOrigin(e.target.value.toUpperCase())}
                placeholder="SIN"
                maxLength={3}
                required
                className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm font-mono font-bold text-charcoal focus:outline-none focus:border-primary uppercase"
              />
              <p className="text-xs text-charcoal/30 mt-0.5 ml-1">IATA code, e.g. SIN</p>
            </div>
            <div>
              <label className="block text-xs font-semibold text-charcoal/50 mb-1">To</label>
              <input
                type="text"
                value={destination}
                onChange={(e) => setDestination(e.target.value.toUpperCase())}
                placeholder="DXB"
                maxLength={3}
                required
                className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm font-mono font-bold text-charcoal focus:outline-none focus:border-primary uppercase"
              />
              <p className="text-xs text-charcoal/30 mt-0.5 ml-1">e.g. DXB, IST, KUL</p>
            </div>
          </div>

          {/* Dates */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-charcoal/50 mb-1">Depart</label>
              <input
                type="date"
                value={departDate}
                onChange={(e) => setDepartDate(e.target.value)}
                min={minDate}
                required
                className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm text-charcoal focus:outline-none focus:border-primary"
              />
            </div>
            {tripType === 'return' && (
              <div>
                <label className="block text-xs font-semibold text-charcoal/50 mb-1">Return</label>
                <input
                  type="date"
                  value={returnDate}
                  onChange={(e) => setReturnDate(e.target.value)}
                  min={departDate || minDate}
                  required={tripType === 'return'}
                  className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm text-charcoal focus:outline-none focus:border-primary"
                />
              </div>
            )}
          </div>

          {/* Passengers */}
          <div className="w-1/2">
            <label className="block text-xs font-semibold text-charcoal/50 mb-1">Passengers</label>
            <select
              value={adults}
              onChange={(e) => setAdults(e.target.value)}
              className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm text-charcoal focus:outline-none focus:border-primary bg-white"
            >
              {[1, 2, 3, 4, 5, 6, 7, 8].map((n) => (
                <option key={n} value={n}>{n} adult{n !== 1 ? 's' : ''}</option>
              ))}
            </select>
          </div>

          <button
            type="submit"
            className="w-full bg-primary text-white font-bold py-3 rounded-xl hover:bg-primary/90 transition-colors flex items-center justify-center gap-2"
          >
            <span className="material-symbols-outlined text-lg">flight_takeoff</span>
            Search flights on Skyscanner
          </button>

          <p className="text-xs text-charcoal/40 text-center">
            Opens Skyscanner in a new tab. HumbleHalal may earn a commission on completed bookings.
          </p>
        </form>
      </div>

      {/* Popular destinations */}
      <div className="mt-8">
        <h2 className="font-bold text-charcoal text-sm mb-3">Popular halal-friendly destinations</h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { city: 'Dubai', code: 'DXB', emoji: '🕌' },
            { city: 'Istanbul', code: 'IST', emoji: '🏛️' },
            { city: 'Kuala Lumpur', code: 'KUL', emoji: '🌴' },
            { city: 'Maldives', code: 'MLE', emoji: '🏝️' },
            { city: 'Medina', code: 'MED', emoji: '☪️' },
            { city: 'Marrakech', code: 'RAK', emoji: '🌅' },
            { city: 'Amman', code: 'AMM', emoji: '🏜️' },
            { city: 'Tokyo', code: 'TYO', emoji: '🗼' },
          ].map((dest) => (
            <button
              key={dest.code}
              type="button"
              onClick={() => setDestination(dest.code)}
              className={`text-left p-3 rounded-xl border transition-colors ${
                destination === dest.code
                  ? 'border-primary bg-primary/5'
                  : 'border-gray-200 bg-white hover:border-primary/40'
              }`}
            >
              <span className="text-lg block mb-0.5">{dest.emoji}</span>
              <p className="text-xs font-bold text-charcoal">{dest.city}</p>
              <p className="text-xs text-charcoal/40 font-mono">{dest.code}</p>
            </button>
          ))}
        </div>
      </div>

      {/* Cross-sell: hotels */}
      <div className="mt-8 bg-emerald-50 border border-emerald-200 rounded-2xl p-5 flex items-center gap-4">
        <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center shrink-0">
          <span className="material-symbols-outlined text-white text-xl">hotel</span>
        </div>
        <div className="flex-1">
          <p className="font-bold text-charcoal text-sm">Also need a hotel?</p>
          <p className="text-xs text-charcoal/60 mt-0.5">
            Book Muslim-friendly hotels with mosque proximity, halal food ratings and prayer room badges.
          </p>
        </div>
        <Link
          href="/travel/hotels"
          className="shrink-0 bg-primary text-white text-xs font-bold px-4 py-2 rounded-xl hover:bg-primary/90 transition-colors"
        >
          Search hotels
        </Link>
      </div>
    </div>
  )
}

export default function FlightsPage() {
  return (
    <Suspense fallback={
      <div className="max-w-2xl mx-auto px-4 py-16 text-center text-charcoal/40">
        <span className="material-symbols-outlined text-4xl block mb-2 animate-pulse">flight</span>
        <p>Loading flights…</p>
      </div>
    }>
      <FlightsContent />
    </Suspense>
  )
}
