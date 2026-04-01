import type { Metadata } from 'next'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'My Reviews | HumbleHalal',
  robots: { index: false },
}

export default async function MyReviewsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login?next=/dashboard/reviews')

  const { data: reviews } = await (supabase as any)
    .from('reviews')
    .select('id, rating, title, body, status, created_at, listing_id, listings(name, slug, vertical)')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  const STATUS_STYLES: Record<string, string> = {
    pending:  'bg-amber-50 text-amber-700',
    approved: 'bg-emerald-50 text-emerald-700',
    rejected: 'bg-red-50 text-red-700',
  }

  return (
    <main className="min-h-screen bg-warm-white py-8">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        <Link href="/dashboard" className="text-primary text-sm hover:underline mb-6 inline-block">← Dashboard</Link>
        <h1 className="text-2xl font-extrabold text-charcoal mb-6">My Reviews</h1>

        {!reviews || reviews.length === 0 ? (
          <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
            <span className="material-symbols-outlined text-4xl text-charcoal/30 block mb-3">rate_review</span>
            <p className="font-bold text-charcoal/60">No reviews yet</p>
            <p className="text-charcoal/40 text-sm mt-1">Find a listing and share your experience.</p>
            <Link href="/halal-food" className="mt-4 inline-block bg-primary text-white font-bold px-4 py-2 rounded-lg text-sm hover:bg-primary/90 transition-colors">
              Browse Listings
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {reviews.map((review: any) => (
              <div key={review.id} className="bg-white rounded-xl border border-gray-200 p-5">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <Link
                      href={`/restaurant/${review.listings?.slug}`}
                      className="font-bold text-charcoal hover:text-primary transition-colors"
                    >
                      {review.listings?.name ?? 'Unknown Listing'}
                    </Link>
                    {review.title && (
                      <p className="text-charcoal/80 text-sm font-medium mt-0.5">{review.title}</p>
                    )}
                    <p className="text-charcoal/60 text-sm mt-1 line-clamp-2">{review.body}</p>
                    <p className="text-charcoal/40 text-xs mt-2">
                      {new Date(review.created_at).toLocaleDateString('en-SG', { year: 'numeric', month: 'short', day: 'numeric' })}
                    </p>
                  </div>
                  <div className="flex flex-col items-end gap-2 shrink-0">
                    <div className="flex items-center gap-0.5">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <span key={i} className={`material-symbols-outlined text-sm ${i < review.rating ? 'text-accent' : 'text-gray-300'}`}>
                          star
                        </span>
                      ))}
                    </div>
                    <span className={`text-xs font-bold px-2 py-0.5 rounded-full capitalize ${STATUS_STYLES[review.status] ?? 'bg-gray-50 text-gray-600'}`}>
                      {review.status}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  )
}
