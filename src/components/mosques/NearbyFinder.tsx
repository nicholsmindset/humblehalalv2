'use client'

import { useState } from 'react'
import Link from 'next/link'

interface NearbyMosque {
  id: string
  name: string
  slug: string
  area: string
  address: string
  wheelchair_accessible: boolean
  distance_m: number
}

interface NearbyPrayerRoom {
  id: string
  name: string
  slug: string
  location_name: string
  area: string
  wudu_available: boolean
  gender_separated: boolean
  floor_level: string
  distance_m: number
}

const RADIUS_OPTIONS = [
  { label: '1km', value: 1000 },
  { label: '3km', value: 3000 },
  { label: '5km', value: 5000 },
]

function formatDistance(m: number): string {
  if (m < 1000) return `${Math.round(m)}m`
  return `${(m / 1000).toFixed(1)}km`
}

export function NearbyFinder() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [radius, setRadius] = useState(3000)
  const [mosques, setMosques] = useState<NearbyMosque[]>([])
  const [prayerRooms, setPrayerRooms] = useState<NearbyPrayerRoom[]>([])
  const [searched, setSearched] = useState(false)

  function findNearby() {
    if (!navigator.geolocation) {
      setError('Geolocation is not supported by your browser.')
      return
    }
    setLoading(true)
    setError(null)

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        try {
          const { latitude, longitude } = pos.coords
          const res = await fetch(
            `/api/mosques/nearby?lat=${latitude}&lng=${longitude}&radius=${radius}`
          )
          if (!res.ok) throw new Error('Failed to fetch nearby places')
          const data = await res.json()
          setMosques(data.mosques ?? [])
          setPrayerRooms(data.prayerRooms ?? [])
          setSearched(true)
        } catch {
          setError('Could not load nearby results. Please try again.')
        } finally {
          setLoading(false)
        }
      },
      () => {
        setError('Location permission denied. Please allow location access to use this feature.')
        setLoading(false)
      },
      { timeout: 10000 }
    )
  }

  return (
    <div className="bg-primary/5 border border-primary/20 rounded-xl p-5 mb-8">
      <div className="flex items-center gap-2 mb-3">
        <span className="material-symbols-outlined text-primary">near_me</span>
        <h2 className="font-bold text-charcoal text-base">Find Near Me</h2>
      </div>

      <div className="flex flex-wrap items-center gap-3 mb-4">
        {/* Radius selector */}
        <div className="flex gap-1">
          {RADIUS_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => setRadius(opt.value)}
              className={`text-xs font-medium px-3 py-1.5 rounded-full border transition-colors ${
                radius === opt.value
                  ? 'bg-primary text-white border-primary'
                  : 'bg-white text-charcoal border-gray-200 hover:border-primary'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>

        <button
          type="button"
          onClick={findNearby}
          disabled={loading}
          className="flex items-center gap-2 bg-primary text-white text-sm font-bold px-4 py-2 rounded-xl hover:bg-primary/90 transition-colors disabled:opacity-50"
        >
          <span className="material-symbols-outlined text-base">
            {loading ? 'sync' : 'my_location'}
          </span>
          {loading ? 'Locating...' : 'Use my location'}
        </button>
      </div>

      {error && (
        <p className="text-sm text-amber-700 bg-amber-50 rounded-lg px-3 py-2 mb-4">{error}</p>
      )}

      {searched && !loading && (
        <div className="space-y-6">
          {/* Nearby mosques */}
          {mosques.length > 0 && (
            <div>
              <h3 className="font-bold text-charcoal text-sm mb-2 flex items-center gap-1">
                <span className="material-symbols-outlined text-primary text-base">mosque</span>
                Nearby Mosques ({mosques.length})
              </h3>
              <div className="space-y-2">
                {mosques.map((m) => (
                  <Link
                    key={m.id}
                    href={`/mosque/${m.slug}`}
                    className="flex items-center justify-between bg-white rounded-lg border border-gray-200 px-4 py-3 hover:border-primary hover:shadow-sm transition-all"
                  >
                    <div className="min-w-0">
                      <p className="font-medium text-charcoal text-sm line-clamp-1">{m.name}</p>
                      <p className="text-charcoal/40 text-xs capitalize">{m.area?.replace(/-/g, ' ')}</p>
                    </div>
                    <span className="text-primary font-bold text-xs shrink-0 ml-3">
                      {formatDistance(m.distance_m)}
                    </span>
                  </Link>
                ))}
              </div>
            </div>
          )}

          {/* Nearby prayer rooms */}
          {prayerRooms.length > 0 && (
            <div>
              <h3 className="font-bold text-charcoal text-sm mb-2 flex items-center gap-1">
                <span className="material-symbols-outlined text-primary text-base">room_preferences</span>
                Nearby Prayer Rooms ({prayerRooms.length})
              </h3>
              <div className="space-y-2">
                {prayerRooms.map((r) => (
                  <Link
                    key={r.id}
                    href={`/prayer-rooms/${r.slug}`}
                    className="flex items-center justify-between bg-white rounded-lg border border-gray-200 px-4 py-3 hover:border-primary hover:shadow-sm transition-all"
                  >
                    <div className="min-w-0">
                      <p className="font-medium text-charcoal text-sm line-clamp-1">{r.name}</p>
                      <div className="flex items-center gap-2 mt-0.5">
                        {r.wudu_available && (
                          <span className="text-[10px] text-primary">Wudhu ✓</span>
                        )}
                        {r.floor_level && (
                          <span className="text-[10px] text-charcoal/40">{r.floor_level}</span>
                        )}
                      </div>
                    </div>
                    <span className="text-primary font-bold text-xs shrink-0 ml-3">
                      {formatDistance(r.distance_m)}
                    </span>
                  </Link>
                ))}
              </div>
            </div>
          )}

          {mosques.length === 0 && prayerRooms.length === 0 && (
            <p className="text-charcoal/50 text-sm text-center py-4">
              No mosques or prayer rooms found within {radius / 1000}km. Try a larger radius.
            </p>
          )}
        </div>
      )}
    </div>
  )
}
