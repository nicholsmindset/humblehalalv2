import type { Metadata } from 'next'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { SavedGrid } from './SavedGrid'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'Saved Places | HumbleHalal',
  robots: { index: false },
}

export type SavedItem = {
  id: string
  listing_id: string
  created_at: string
  listing: {
    id: string
    name: string
    slug: string
    vertical: string
    area: string | null
    halal_status: string | null
    photos: string[] | null
    rating_avg: number | null
  }
}

export default async function SavedPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login?next=/dashboard/saved')

  const { data: raw } = await (supabase as any)
    .from('saved_listings')
    .select('id, listing_id, created_at, listings(id, name, slug, vertical, area, halal_status, photos, rating_avg)')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  // Normalise the Supabase join shape (listings → listing)
  const saved: SavedItem[] = ((raw as any[]) ?? [])
    .filter((item: any) => item.listings != null)
    .map((item: any) => ({
      id: item.id,
      listing_id: item.listing_id,
      created_at: item.created_at,
      listing: item.listings,
    }))

  return (
    <main className="min-h-screen bg-warm-white py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <Link
          href="/dashboard"
          className="text-primary text-sm hover:underline mb-6 inline-flex items-center gap-1"
        >
          <span className="material-symbols-outlined text-sm">arrow_back</span>
          Dashboard
        </Link>
        <h1 className="text-2xl font-extrabold text-charcoal mb-6">Saved Places</h1>

        {saved.length === 0 ? (
          <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
            <span className="material-symbols-outlined text-4xl text-charcoal/30 block mb-3">bookmark</span>
            <p className="font-bold text-charcoal/60">No saved places yet.</p>
            <p className="text-charcoal/40 text-sm mt-1">
              Tap the bookmark icon on any listing to save it.
            </p>
            <Link
              href="/halal-food"
              className="mt-4 inline-block bg-primary text-white font-bold px-4 py-2 rounded-lg text-sm hover:bg-primary/90 transition-colors"
            >
              Browse Listings
            </Link>
          </div>
        ) : (
          <SavedGrid initialItems={saved} />
        )}
      </div>
    </main>
  )
}
