import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import { MuisBadge } from '@/components/ui/MuisBadge'
import { HalalStatus, HALAL_STATUS_LABELS, ISR_REVALIDATE } from '@/config'
import { ListingActions } from '@/components/listings/ListingActions'
import { ReviewForm } from '@/components/reviews/ReviewForm'
import { ReviewsList } from '@/components/reviews/ReviewsList'

export const revalidate = ISR_REVALIDATE.LONG_TAIL

interface Props { params: Promise<{ slug: string }> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const supabase = await createClient()
  const { data: listing } = await supabase.from('listings').select('name, area, description').eq('slug', slug).eq('status', 'active').single()
  if (!listing) return { title: 'Caterer Not Found | HumbleHalal' }
  return {
    title: `${listing.name} — Halal Catering in ${listing.area} | HumbleHalal`,
    description: listing.description?.slice(0, 155) ?? `${listing.name} offers halal catering in ${listing.area}, Singapore. View menus, pricing, and reviews.`,
  }
}

export default async function CateringDetailPage({ params }: Props) {
  const { slug } = await params
  const supabase = await createClient()

  const { data: listing } = (await supabase
    .from('listings')
    .select(`
      id, name, slug, area, address, phone, website, email,
      description, halal_status, photos, avg_rating, review_count,
      listings_catering ( catering_types, min_pax, max_pax, price_per_pax_min, price_per_pax_max, delivery_areas, sample_menu_url )
    `)
    .eq('slug', slug)
    .eq('status', 'active')
    .single()) as any

  if (!listing) notFound()

  const catering = Array.isArray(listing.listings_catering) ? listing.listings_catering[0] : listing.listings_catering
  const halalLabel = HALAL_STATUS_LABELS[listing.halal_status as HalalStatus]
  const isMuis = listing.halal_status === HalalStatus.MuisCertified
  const { data: { user } } = await supabase.auth.getUser()

  return (
    <article className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <nav className="text-sm text-charcoal/50 mb-6" aria-label="Breadcrumb">
        <a href="/catering" className="hover:text-primary">Catering</a>
        <span className="mx-2">›</span>
        <span className="text-charcoal">{listing.name}</span>
      </nav>

      <header className="mb-8">
        <div className="flex flex-wrap items-start gap-3 mb-3">
          <h1 className="text-3xl font-extrabold text-charcoal font-sans flex-1">{listing.name}</h1>
          {isMuis && <MuisBadge />}
        </div>
        <div className="flex flex-wrap gap-4 text-sm text-charcoal/60">
          {listing.review_count > 0 && (
            <span className="flex items-center gap-1">
              <span className="material-symbols-outlined text-accent text-base">star</span>
              <strong className="text-charcoal">{Number(listing.avg_rating).toFixed(1)}</strong>
              <span>({listing.review_count} reviews)</span>
            </span>
          )}
          <span>{listing.area}</span>
          <span className={isMuis ? 'text-primary font-semibold' : ''}>{halalLabel}</span>
        </div>
      </header>

      {listing.photos?.length > 0 && (
        <div className="grid grid-cols-3 gap-2 rounded-xl overflow-hidden mb-8 h-56">
          {listing.photos.slice(0, 3).map((url: string, i: number) => (
            // eslint-disable-next-line @next/next/no-img-element
            <img key={i} src={url} alt={`${listing.name} photo ${i + 1}`} className={`object-cover w-full h-full ${i === 0 ? 'col-span-2 row-span-2' : ''}`} />
          ))}
        </div>
      )}

      <div className="grid md:grid-cols-3 gap-8">
        <div className="md:col-span-2 space-y-8">
          {listing.description && (
            <section>
              <h2 className="text-lg font-bold text-charcoal mb-3">About</h2>
              <p className="text-charcoal/70 leading-relaxed">{listing.description}</p>
            </section>
          )}

          {/* Catering details */}
          {catering && (
            <section className="bg-warm-white border border-gray-200 rounded-xl p-5">
              <h2 className="text-lg font-bold text-charcoal mb-3">Catering Details</h2>
              <dl className="grid grid-cols-2 gap-4 text-sm">
                {catering.catering_types?.length > 0 && (
                  <div>
                    <dt className="text-charcoal/50">Types</dt>
                    <dd className="font-medium capitalize">{catering.catering_types.join(', ')}</dd>
                  </div>
                )}
                {(catering.min_pax || catering.max_pax) && (
                  <div>
                    <dt className="text-charcoal/50">Capacity</dt>
                    <dd className="font-medium">{catering.min_pax ?? '?'} — {catering.max_pax ?? '?'} pax</dd>
                  </div>
                )}
                {catering.price_per_pax_min && (
                  <div>
                    <dt className="text-charcoal/50">Price</dt>
                    <dd className="font-medium">
                      From ${catering.price_per_pax_min}/pax
                      {catering.price_per_pax_max && ` to $${catering.price_per_pax_max}/pax`}
                    </dd>
                  </div>
                )}
                {catering.delivery_areas?.length > 0 && (
                  <div>
                    <dt className="text-charcoal/50">Delivery Areas</dt>
                    <dd className="font-medium capitalize">{catering.delivery_areas.join(', ')}</dd>
                  </div>
                )}
              </dl>
              {catering.sample_menu_url && (
                <a href={catering.sample_menu_url} target="_blank" rel="noopener noreferrer" className="inline-block mt-4 text-primary text-sm font-medium hover:underline">
                  View Sample Menu →
                </a>
              )}
            </section>
          )}
        </div>

        <aside className="space-y-4">
          <ListingActions listing={{ id: listing.id, name: listing.name, area: listing.area, address: listing.address ?? '', phone: listing.phone ?? undefined, website: listing.website ?? undefined }} />
        </aside>
      </div>

      <section className="mt-12 pt-10 border-t border-gray-100">
        <h2 className="text-xl font-bold text-charcoal mb-6">Reviews {listing.review_count > 0 && <span className="text-charcoal/40 font-normal text-base ml-2">({listing.review_count})</span>}</h2>
        <div className="grid md:grid-cols-2 gap-6">
          <ReviewForm listingId={listing.id} listingName={listing.name} isLoggedIn={!!user} />
          <ReviewsList listingId={listing.id} />
        </div>
      </section>

      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify({
        '@context': 'https://schema.org', '@type': 'FoodEstablishment',
        name: listing.name,
        address: { '@type': 'PostalAddress', streetAddress: listing.address, addressLocality: listing.area, addressCountry: 'SG' },
        telephone: listing.phone, url: listing.website,
        ...(listing.review_count > 0 && { aggregateRating: { '@type': 'AggregateRating', ratingValue: listing.avg_rating, reviewCount: listing.review_count, bestRating: 5 } }),
      }) }} />
    </article>
  )
}
