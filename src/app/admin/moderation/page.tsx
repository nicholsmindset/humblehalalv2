import type { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import ModerationActions from './ModerationActions'

export const metadata: Metadata = { title: 'Moderation Queue | HumbleHalal Admin' }
export const dynamic = 'force-dynamic'

export default async function ModerationPage() {
  const supabase = await createClient()

  const [{ data: pendingReviews }, { data: pendingClassifieds }] = (await Promise.all([
    supabase
      .from('reviews')
      .select('id, rating, title, body, created_at, listing_id, listings(name, slug)')
      .eq('status', 'pending')
      .order('created_at', { ascending: false })
      .limit(50),
    supabase
      .from('classifieds')
      .select('id, title, description, category, price, area, created_at')
      .eq('status', 'pending')
      .order('created_at', { ascending: false })
      .limit(30),
  ])) as any[]

  const reviews = (pendingReviews ?? []) as any[]
  const classifieds = (pendingClassifieds ?? []) as any[]
  const total = reviews.length + classifieds.length

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-extrabold text-white">Moderation Queue</h1>
        <p className="text-white/40 text-sm mt-1">
          {total === 0
            ? 'All clear — nothing pending.'
            : `${total} item${total !== 1 ? 's' : ''} awaiting review`}
        </p>
      </div>

      {/* ── Reviews ─────────────────────────────────────────── */}
      <section>
        <h2 className="text-white/60 text-xs font-bold uppercase tracking-widest mb-4">
          Reviews ({reviews.length})
        </h2>

        {reviews.length === 0 ? (
          <EmptyState icon="check_circle" message="No pending reviews" />
        ) : (
          <div className="space-y-3">
            {reviews.map((r: any) => (
              <div key={r.id} className="bg-white/5 border border-white/10 rounded-xl p-5">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-3 mb-2">
                      {/* Stars */}
                      <div className="flex gap-0.5">
                        {Array.from({ length: 5 }).map((_, i) => (
                          <span
                            key={i}
                            className={`material-symbols-outlined text-sm ${i < r.rating ? 'text-accent' : 'text-white/20'}`}
                            style={i < r.rating ? { fontVariationSettings: "'FILL' 1" } : undefined}
                          >
                            star
                          </span>
                        ))}
                      </div>
                      {r.title && (
                        <span className="text-white font-medium text-sm">{r.title}</span>
                      )}
                      <span className="text-white/40 text-xs ml-auto">
                        {new Date(r.created_at).toLocaleDateString('en-SG')}
                      </span>
                    </div>
                    <p className="text-white/70 text-sm leading-relaxed mb-2 line-clamp-3">{r.body}</p>
                    {r.listings && (
                      <p className="text-white/40 text-xs">
                        <span className="material-symbols-outlined text-xs align-text-bottom mr-1">store</span>
                        {r.listings.name}
                      </p>
                    )}
                  </div>
                  <ModerationActions id={r.id} contentType="review" />
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* ── Classifieds ──────────────────────────────────────── */}
      <section>
        <h2 className="text-white/60 text-xs font-bold uppercase tracking-widest mb-4">
          Classifieds ({classifieds.length})
        </h2>

        {classifieds.length === 0 ? (
          <EmptyState icon="check_circle" message="No pending classifieds" />
        ) : (
          <div className="space-y-3">
            {classifieds.map((c: any) => (
              <div key={c.id} className="bg-white/5 border border-white/10 rounded-xl p-5">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-3 mb-1">
                      <span className="text-white font-medium text-sm">{c.title}</span>
                      {c.category && (
                        <span className="text-white/40 text-xs capitalize">{c.category}</span>
                      )}
                      {c.price != null && (
                        <span className="text-accent text-xs font-bold">
                          S${Number(c.price).toFixed(2)}
                        </span>
                      )}
                      <span className="text-white/40 text-xs ml-auto">
                        {new Date(c.created_at).toLocaleDateString('en-SG')}
                      </span>
                    </div>
                    {c.description && (
                      <p className="text-white/60 text-sm line-clamp-2 mb-1">{c.description}</p>
                    )}
                    {c.area && (
                      <p className="text-white/40 text-xs capitalize">
                        <span className="material-symbols-outlined text-xs align-text-bottom mr-1">location_on</span>
                        {c.area.replace(/-/g, ' ')}
                      </p>
                    )}
                  </div>
                  <ModerationActions id={c.id} contentType="classified" />
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  )
}

function EmptyState({ icon, message }: { icon: string; message: string }) {
  return (
    <div className="bg-white/5 border border-white/10 rounded-xl p-8 text-center">
      <span className="material-symbols-outlined text-3xl text-white/20 block mb-2">{icon}</span>
      <p className="text-white/40 text-sm">{message}</p>
    </div>
  )
}
