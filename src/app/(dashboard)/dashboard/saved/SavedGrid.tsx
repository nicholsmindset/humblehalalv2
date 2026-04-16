'use client'

import { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import type { SavedItem } from './page'

export function SavedGrid({ initialItems }: { initialItems: SavedItem[] }) {
  const [items, setItems] = useState(initialItems)

  const handleUnsave = async (id: string) => {
    try {
      const res = await fetch('/api/listings/save', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ saved_id: id }),
      })
      if (res.ok) {
        setItems((prev) => prev.filter((item) => item.id !== id))
      }
    } catch {
      // silently fail — item stays in list
    }
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      {items.map((item) => (
        <div
          key={item.id}
          className="bg-white rounded-xl border border-gray-200 hover:shadow-lg hover:-translate-y-1 transition-all overflow-hidden flex flex-col"
        >
          <div className="relative h-40 bg-gray-100">
            {item.listing.photos?.[0] ? (
              <Image
                src={item.listing.photos[0]}
                alt={item.listing.name}
                fill
                className="object-cover"
                sizes="(max-width: 640px) 100vw, 50vw"
              />
            ) : (
              <div className="flex items-center justify-center h-full">
                <span className="material-symbols-outlined text-4xl text-charcoal/20">store</span>
              </div>
            )}
            <button
              onClick={() => handleUnsave(item.id)}
              className="absolute top-2 right-2 p-1.5 bg-white/90 rounded-full hover:bg-white shadow-sm"
              title="Remove from saved"
            >
              <span className="material-symbols-outlined text-lg text-primary" style={{ fontVariationSettings: "'FILL' 1" }}>
                bookmark
              </span>
            </button>
          </div>
          <div className="p-4 flex-1">
            <Link
              href={`/restaurant/${item.listing.slug}`}
              className="font-extrabold text-charcoal hover:text-primary transition-colors line-clamp-1"
            >
              {item.listing.name}
            </Link>
            <div className="mt-1 flex items-center gap-2 text-sm text-charcoal/60">
              {item.listing.area && <span>{item.listing.area}</span>}
              {item.listing.rating_avg != null && (
                <>
                  {item.listing.area && <span>·</span>}
                  <span className="flex items-center gap-0.5">
                    <span className="material-symbols-outlined text-sm text-accent" style={{ fontVariationSettings: "'FILL' 1" }}>star</span>
                    {item.listing.rating_avg.toFixed(1)}
                  </span>
                </>
              )}
            </div>
            {item.listing.halal_status === 'muis_certified' && (
              <span className="mt-2 inline-block bg-primary text-white text-xs font-bold px-3 py-1 rounded-full">
                MUIS Certified
              </span>
            )}
          </div>
        </div>
      ))}
    </div>
  )
}
