'use client'

import { useState, useEffect } from 'react'

// Kaaba coordinates (Mecca, Saudi Arabia)
const KAABA_LAT = 21.4225
const KAABA_LNG = 39.8262

// Singapore's approximate qibla bearing from the centre of the island
const SG_DEFAULT_BEARING = 293 // ~WNW

function getQiblaBearing(lat: number, lng: number): number {
  const kaabaLat = (KAABA_LAT * Math.PI) / 180
  const kaabaLng = (KAABA_LNG * Math.PI) / 180
  const userLat = (lat * Math.PI) / 180
  const userLng = (lng * Math.PI) / 180
  const dLng = kaabaLng - userLng
  const x = Math.sin(dLng) * Math.cos(kaabaLat)
  const y =
    Math.cos(userLat) * Math.sin(kaabaLat) -
    Math.sin(userLat) * Math.cos(kaabaLat) * Math.cos(dLng)
  return ((Math.atan2(x, y) * 180) / Math.PI + 360) % 360
}

function bearingToCardinal(deg: number): string {
  const dirs = ['N', 'NNE', 'NE', 'ENE', 'E', 'ESE', 'SE', 'SSE', 'S', 'SSW', 'SW', 'WSW', 'W', 'WNW', 'NW', 'NNW']
  return dirs[Math.round(deg / 22.5) % 16]
}

export function QiblaCompass() {
  const [bearing, setBearing] = useState<number>(SG_DEFAULT_BEARING)
  const [compassBearing, setCompassBearing] = useState<number | null>(null)
  const [locating, setLocating] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [hasLocation, setHasLocation] = useState(false)

  // Try geolocation to refine bearing
  function requestLocation() {
    if (!navigator.geolocation) {
      setError('Geolocation not supported on this device.')
      return
    }
    setLocating(true)
    setError(null)
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const b = getQiblaBearing(pos.coords.latitude, pos.coords.longitude)
        setBearing(b)
        setHasLocation(true)
        setLocating(false)
      },
      () => {
        setError('Could not get your location. Showing approximate bearing for Singapore.')
        setBearing(SG_DEFAULT_BEARING)
        setLocating(false)
      },
      { timeout: 8000 }
    )
  }

  // Mobile: listen to device compass and adjust arrow
  useEffect(() => {
    function handleOrientation(e: DeviceOrientationEvent) {
      if (e.alpha !== null) {
        setCompassBearing(e.alpha)
      }
    }
    if (typeof DeviceOrientationEvent !== 'undefined') {
      window.addEventListener('deviceorientationabsolute', handleOrientation as EventListener, true)
      window.addEventListener('deviceorientation', handleOrientation as EventListener, true)
    }
    return () => {
      window.removeEventListener('deviceorientationabsolute', handleOrientation as EventListener, true)
      window.removeEventListener('deviceorientation', handleOrientation as EventListener, true)
    }
  }, [])

  // Rotation = qibla bearing - device compass heading
  const arrowRotation = compassBearing !== null ? bearing - compassBearing : bearing

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5 text-center">
      <h3 className="font-bold text-charcoal text-sm mb-1">Qibla Direction</h3>
      <p className="text-charcoal/40 text-xs mb-4">
        {hasLocation
          ? 'Based on your location'
          : 'Approximate for Singapore'}
      </p>

      {/* SVG Compass */}
      <div className="relative w-32 h-32 mx-auto mb-4">
        {/* Compass ring */}
        <svg viewBox="0 0 128 128" className="w-full h-full">
          {/* Outer ring */}
          <circle cx="64" cy="64" r="60" fill="none" stroke="#e5e7eb" strokeWidth="4" />
          {/* Cardinal marks */}
          {['N', 'E', 'S', 'W'].map((dir, i) => {
            const angle = i * 90 - 90
            const rad = (angle * Math.PI) / 180
            const x = 64 + 52 * Math.cos(rad)
            const y = 64 + 52 * Math.sin(rad)
            return (
              <text key={dir} x={x} y={y} textAnchor="middle" dominantBaseline="middle" fontSize="10" fill="#9ca3af" fontWeight="600">
                {dir}
              </text>
            )
          })}
          {/* Qibla arrow */}
          <g transform={`rotate(${arrowRotation}, 64, 64)`}>
            {/* Arrow pointing up = qibla direction */}
            <polygon points="64,16 70,64 64,56 58,64" fill="#047857" opacity="0.9" />
            <polygon points="64,112 70,64 64,72 58,64" fill="#d1d5db" opacity="0.6" />
          </g>
          {/* Ka'aba icon in center */}
          <circle cx="64" cy="64" r="10" fill="#0f231d" />
          <rect x="59" y="59" width="10" height="10" fill="#D4A017" rx="1" />
        </svg>
      </div>

      <p className="text-2xl font-extrabold text-primary mb-0.5">
        {Math.round(bearing)}°
      </p>
      <p className="text-sm text-charcoal/50 mb-4">
        {bearingToCardinal(bearing)} — toward Mecca
      </p>

      {error && (
        <p className="text-xs text-amber-600 bg-amber-50 rounded-lg px-3 py-2 mb-3">{error}</p>
      )}

      {!hasLocation && (
        <button
          onClick={requestLocation}
          disabled={locating}
          className="text-xs text-primary font-medium border border-primary/30 rounded-lg px-3 py-1.5 hover:bg-primary/5 transition-colors disabled:opacity-50"
        >
          {locating ? 'Locating...' : 'Use my location'}
        </button>
      )}
    </div>
  )
}
