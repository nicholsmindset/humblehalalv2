import type { Metadata } from 'next'
import Image from 'next/image'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'Saved Places | HumbleHalal',
  robots: { index: false },
}

export default async function SavedPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login?next=/dashboard/saved')

  const { data: saved } = await (supabase as any)
    .from('saved_listings')
    .select('id, listing_id, created_at, listings(id, name, slug, vertical, area, halal_status, photos, rating_avg, rating_count)')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  return (
    <main className="min-h-screen bg-warm-white py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <Link href="/dashboard" className="text-primary text-sm hover:underline mb-6 inline-block">← Dashboard</Link>
        <h1 className="text-2xl font-extrabold text-charcoal mb-6">Saved Places</h1>

        {!saved || saved.length === 0 ? (
          <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
            <span className="material-symbols-outlined text-4xl text-charcoal/30 block mb-3">bookmark</span>
            <p className="font-bold text-charcoal/60">No saved places yet</p>
            <p className="text-charcoal/40 text-sm mt-1">Tap the bookmark icon on any listing to save it here.</p>
            <Link href="/halal-food" className="mt-4 inline-block bg-primary text-white font-bold px-4 py-2 rounded-lg text-sm hover:bg-primary/90 transition-colors">
              Browse Listings
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {saved.map((item: any) => {
              const listing = item.listings
              if (!listing) return null
              return (
                <div key={item.id} className="bg-white rounded-xl border border-gray-200 hover:shadow-md transition-all overflow-hidden">
                  <div className="relative h-36 bg-gray-100 overflow-hidden">
                    {listing.photos?.[0] ? (
                      <Image src={listing.photos[0]} alt={listing.name} fill className="object-cover" unoptimized />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-emerald-50">
                        <span className="material-symbols-outlined text-3xl text-primary">restaurant</span>
                      </div>
                    )}
                  </div>
                  <div className="p-4">
                    <div className="flex items-start justify-between gap-2">
                      <Link href={`/restaurant/${listing.slug}`} className="font-bold text-charcoal hover:text-primary transition-colors text-sm">
                        {listing.name}
                      </Link>
                      {listing.halal_status === 'muis_certified' && (
                        <span className="shrink-0 bg-primary text-white text-xs font-bold px-2 py-0.5 rounded-full">MUIS</span>
                      )}
                    </div>
                    <p className="text-charcoal/50 text-xs mt-1 capitalize">{listing.area?.replace(/-/g, ' ')}</p>
                    {listing.rating_avg && (
                      <p className="text-charcoal/60 text-xs mt-1">⭐ {Number(listing.rating_avg).toFixed(1)}</p>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </main>
  )
}
