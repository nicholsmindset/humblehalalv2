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
  maxOccupancy?: number | null
}

interface RoomSelectorProps {
  hotelId: string
  hotelName: string
  city: string
  rates: Rate[]
  checkin: string
  checkout: string
  guests: number
}

function cancellationLabel(policies: any[] | undefined): { text: string; free: boolean } {
  if (!policies || policies.length === 0) return { text: 'Check policy', free: false }
  const infos = policies[0]?.cancelPolicyInfos ?? policies[0]?.policies ?? []
  const hasFree = infos.some((p: any) =>
    (p.policy ?? p.type ?? '').toLowerCase().includes('free')
  )
  if (hasFree) return { text: 'Free cancellation', free: true }
  const nonRef = infos.some((p: any) =>
    (p.policy ?? p.type ?? '').toLowerCase().includes('non')
  )
  if (nonRef) return { text: 'Non-refundable', free: false }
  return { text: 'Flexible', free: true }
}

export function RoomSelector({ hotelId, hotelName, city, rates, checkin, checkout, guests }: RoomSelectorProps) {
  const nights = (checkin && checkout)
    ? Math.max(1, Math.round((new Date(checkout).getTime() - new Date(checkin).getTime()) / 86400000))
    : 1

  // Deduplicate by offerId only — keep all distinct offers, sort by price
  const uniqueRates = Array.from(
    new Map(rates.map((r) => [r.offerId, r])).values()
  )
    .sort((a, b) => {
      const pa = Number(a.retailRate?.total?.[0]?.amount ?? Infinity)
      const pb = Number(b.retailRate?.total?.[0]?.amount ?? Infinity)
      return pa - pb
    })
    .slice(0, 10)

  const [selectedOfferId, setSelectedOfferId] = useState<string | null>(
    uniqueRates[0]?.offerId ?? null
  )

  const selectedRate = uniqueRates.find((r) => r.offerId === selectedOfferId)
  const selectedTotal = selectedRate
    ? Number(selectedRate.retailRate?.total?.[0]?.amount ?? 0)
    : 0
  const selectedCurrency = selectedRate?.retailRate?.total?.[0]?.currency ?? 'SGD'

  const checkoutUrl = selectedOfferId
    ? `/travel/hotels/${hotelId}/checkout?` +
      `offerId=${encodeURIComponent(selectedOfferId)}` +
      `&checkin=${encodeURIComponent(checkin)}` +
      `&checkout=${encodeURIComponent(checkout)}` +
      `&guests=${guests}` +
      `&hotelName=${encodeURIComponent(hotelName)}` +
      `&city=${encodeURIComponent(city)}` +
      `&amount=${selectedTotal}` +
      `&currency=${encodeURIComponent(selectedCurrency)}` +
      `&roomName=${encodeURIComponent(selectedRate?.name ?? '')}`
    : null

  return (
    <div className="space-y-3">
      <h3 className="font-semibold text-charcoal text-sm">Available rooms</h3>
      {uniqueRates.length === 0 && (
        <p className="text-sm text-charcoal/50 py-2">No rooms available for these dates.</p>
      )}
      {uniqueRates.map((rate) => {
        const price = rate.retailRate?.total?.[0]
        const totalAmount = price ? Number(price.amount) : null
        const perNight = totalAmount !== null ? Math.round(totalAmount / nights) : null
        const isSelected = selectedOfferId === rate.offerId
        const cancel = cancellationLabel(rate.cancellationPolicies)

        return (
          <button
            key={rate.offerId}
            type="button"
            onClick={() => setSelectedOfferId(rate.offerId)}
            aria-pressed={isSelected}
            className={cn(
              'w-full text-left p-3 rounded-xl border transition-all',
              isSelected
                ? 'border-primary bg-primary/5 ring-1 ring-primary'
                : 'border-gray-200 hover:border-primary/50'
            )}
          >
            <div className="font-semibold text-sm text-charcoal leading-tight">{rate.name}</div>
            {rate.boardName && (
              <div className="text-xs text-charcoal/50 mt-0.5">{rate.boardName}</div>
            )}
            <div className="flex items-end justify-between mt-2 gap-2">
              <div>
                <span className={cn('text-xs px-1.5 py-0.5 rounded font-medium', cancel.free ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-600')}>
                  {cancel.text}
                </span>
              </div>
              <div className="text-right flex-shrink-0">
                {perNight !== null ? (
                  <>
                    <div className="text-primary font-bold text-sm">
                      {price?.currency} {perNight.toLocaleString()}<span className="text-xs font-normal text-charcoal/40">/night</span>
                    </div>
                    {nights > 1 && (
                      <div className="text-xs text-charcoal/40">
                        {price?.currency} {totalAmount?.toLocaleString()} total
                      </div>
                    )}
                  </>
                ) : (
                  <div className="text-xs text-charcoal/40">Price on request</div>
                )}
              </div>
            </div>
          </button>
        )
      })}

      {checkoutUrl ? (
        <Link
          href={checkoutUrl}
          className="block w-full text-center bg-accent text-charcoal font-bold py-3.5 rounded-xl hover:bg-accent/90 transition-colors mt-2 text-sm"
        >
          Book now
        </Link>
      ) : (
        <button
          disabled
          className="block w-full text-center bg-gray-100 text-gray-400 font-bold py-3.5 rounded-xl cursor-not-allowed mt-2 text-sm"
        >
          Select a room
        </button>
      )}
    </div>
  )
}
