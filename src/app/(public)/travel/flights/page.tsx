import type { Metadata } from 'next'
import { Suspense } from 'react'
import FlightsContent from './FlightsContent'

export const metadata: Metadata = {
  title: 'Halal-Friendly Flights from Singapore | HumbleHalal',
  description: 'Search and compare flights from Singapore to halal-friendly destinations worldwide. Find the best fares to Dubai, Istanbul, Mecca, Kuala Lumpur and more.',
  openGraph: {
    title: 'Halal-Friendly Flights from Singapore | HumbleHalal',
    description: 'Search and compare flights from Singapore to halal-friendly destinations worldwide. Find the best fares to Dubai, Istanbul, Mecca, Kuala Lumpur and more.',
  },
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
