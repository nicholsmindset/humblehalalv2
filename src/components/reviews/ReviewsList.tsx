import { createClient } from '@/lib/supabase/server'

interface Props {
  listingId: string
}

export async function ReviewsList({ listingId }: Props) {
  const supabase = await createClient()

  const { data: reviews } = (await supabase
    .from('reviews')
    .select(`
      id, rating, title, body, created_at,
      user_profiles ( display_name )
    `)
    .eq('listing_id', listingId)
    .eq('status', 'active')
    .order('created_at', { ascending: false })
    .limit(20)) as any

  if (!reviews || reviews.length === 0) {
    return (
      <div className="text-center py-8 text-charcoal/40 text-sm">
        No reviews yet. Be the first to review!
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {reviews.map((review: any) => {
        const profile = Array.isArray(review.user_profiles)
          ? review.user_profiles[0]
          : review.user_profiles
        const displayName = profile?.display_name ?? 'Anonymous'
        const date = new Date(review.created_at).toLocaleDateString('en-SG', {
          year: 'numeric', month: 'short', day: 'numeric',
        })

        return (
          <div key={review.id} className="bg-white border border-gray-200 rounded-xl p-5">
            <div className="flex items-start justify-between gap-3 mb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                  <span className="material-symbols-outlined text-primary text-sm">person</span>
                </div>
                <div>
                  <p className="text-sm font-medium text-charcoal">{displayName}</p>
                  <p className="text-xs text-charcoal/40">{date}</p>
                </div>
              </div>
              {/* Stars */}
              <div className="flex gap-0.5 shrink-0">
                {Array.from({ length: 5 }).map((_, i) => (
                  <span
                    key={i}
                    className={`material-symbols-outlined text-sm ${
                      i < review.rating ? 'text-accent' : 'text-gray-200'
                    }`}
                    style={{ fontVariationSettings: i < review.rating ? "'FILL' 1" : "'FILL' 0" }}
                  >
                    star
                  </span>
                ))}
              </div>
            </div>

            {review.title && (
              <p className="font-semibold text-charcoal text-sm mb-1">{review.title}</p>
            )}
            <p className="text-charcoal/70 text-sm leading-relaxed">{review.body}</p>
          </div>
        )
      })}
    </div>
  )
}
