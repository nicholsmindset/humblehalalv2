'use client'

import { useState } from 'react'
import Link from 'next/link'
import { cn } from '@/lib/utils'

interface Rate {
  offerId: string
  name: string
  boardName?: string
  retailRate?: {
    total?: Array<{ amount: string | number; currency: string }>
  }
  cancellationPolicies?: any[]
}

interface RoomSelectorProps {
  hotelId: string
  rates: Rate[]
  checkin: string
  checkout: string
  guests: number
}

export function RoomSelector({ hotelId, rates, checkin, checkout, guests }: RoomSelectorProps) {
  const [selectedOfferId, setSelectedOfferId] = useState<string | null>(
    rates[0]?.offerId ?? null
  )

  const checkoutUrl = selectedOfferId
    ? `/travel/hotels/${hotelId}/checkout?offerId=${encodeURIComponent(selectedOfferId)}&checkin=${checkin}&checkout=${checkout}&guests=${guests}`
    : null

  return (
    <div className="space-y-3">
      <h3 className="font-semibold text-charcoal">Select Room</h3>
      {rates.length === 0 && (
        <p className="text-sm text-gray-500">No rooms available for these dates.</p>
      )}
      {rates.map((rate) => {
        const price = rate.retailRate?.total?.[0]
        const isSelected = selectedOfferId === rate.offerId
        return (
          <button
            key={rate.offerId}
            onClick={() => setSelectedOfferId(rate.offerId)}
            className={cn(
              'w-full text-left p-3 rounded-lg border transition-all',
              isSelected
                ? 'border-primary bg-primary/5 ring-1 ring-primary'
                : 'border-gray-200 hover:border-primary/50'
            )}
          >
            <div className="font-medium text-sm text-charcoal">{rate.name}</div>
            {rate.boardName && (
              <div className="text-xs text-gray-500 mt-0.5">{rate.boardName}</div>
            )}
            {price ? (
              <div className="text-primary font-semibold mt-1 text-sm">
                {price.currency} {Number(price.amount).toFixed(0)}/night
              </div>
            ) : (
              <div className="text-gray-400 text-xs mt-1">Price on request</div>
            )}
          </button>
        )
      })}
      {checkoutUrl ? (
        <Link
          href={checkoutUrl}
          className="block w-full text-center bg-accent text-charcoal font-bold py-3 rounded-lg hover:bg-accent/90 transition-colors mt-4"
        >
          Book Now
        </Link>
      ) : (
        <button
          disabled
          className="block w-full text-center bg-gray-200 text-gray-400 font-bold py-3 rounded-lg cursor-not-allowed mt-4"
        >
          Select a Room
        </button>
      )}
    </div>
  )
}
