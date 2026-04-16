import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import { MuisBadge } from '@/components/ui/MuisBadge'
import { HalalStatus, HALAL_STATUS_LABELS, ISR_REVALIDATE, SITE_URL } from '@/config'
import { ListingActions } from '@/components/listings/ListingActions'
import { ReviewForm } from '@/components/reviews/ReviewForm'
import { ReviewsList } from '@/components/reviews/ReviewsList'
import { ListingMap } from '@/components/maps/ListingMap'
import { ShareButtons } from '@/components/ui/ShareButtons'

export const revalidate = ISR_REVALIDATE.HIGH_TRAFFIC

const DAYS_ORDER = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday']

const DELIVERY_URLS: Record<string, string> = {
  grabfood: 'https://food.grab.com/sg/en/',
  'grab food': 'https://food.grab.com/sg/en/',
  grab: 'https://food.grab.com/sg/en/',
  foodpanda: 'https://www.foodpanda.sg/',
  deliveroo: 'https://deliveroo.com.sg/',
}

function OperatingHoursTable({ hours }: { hours: Record<string, string> }) {
  const today = new Date().toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase()
  return (
    <div className="space-y-1.5">
      {DAYS_ORDER.map((day) => {
        const val = hours[day]
        const isToday = day === today
        return (
          <div
            key={day}
            className={`flex justify-between text-sm rounded px-2 py-1 ${isToday ? 'bg-primary/5 font-semibold' : ''}`}
          >
            <span className={`capitalize ${isToday ? 'text-primary' : 'text-charcoal/70'}`}>{day}</span>
            <span className={isToday ? 'text-primary' : 'text-charcoal/50'}>
              {val ?? 'Not listed'}
            </span>
          </div>
        )
      })}
    </div>
  )
}

interface Props {
  params: Promise<{ slug: string }>
}

// ── Metadata ───────────────────────────────────────────────────
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const supabase = await createClient()

  const { data: listing } = (await supabase
    .from('listings')
    .select('name, area, description, halal_status')
    .eq('slug', slug)
    .eq('status', 'active')
    .single()) as any

  if (!listing) return { title: 'Listing Not Found' }

  const halalLabel = HALAL_STATUS_LABELS[listing.halal_status as HalalStatus]

  return {
    title: `${listing.name} — Halal Restaurant in ${listing.area}, Singapore`,
    description:
      listing.description?.slice(0, 155) ??
      `${listing.name} is a ${halalLabel} halal restaurant in ${listing.area}, Singapore. Find directions, menu, and reviews on HumbleHalal.`,
  }
}

// ── Page ───────────────────────────────────────────────────────
export default async function RestaurantPage({ params }: Props) {
  const { slug } = await params
  const supabase = await createClient()

  const { data: listing } = (await supabase
    .from('listings')
    .select(`
      id, name, slug, area, address, phone, website, email,
      description, halal_status, muis_cert_no, muis_expiry,
      photos, avg_rating, review_count, price_range,
      categories, operating_hours, social_links, location,
      listings_food (
        cuisine_types, menu_url, price_range, delivery_platforms, operating_hours
      )
    `)
    .eq('slug', slug)
    .eq('status', 'active')
    .single()) as any

  if (!listing) notFound()

  const food = Array.isArray(listing.listings_food)
    ? listing.listings_food[0]
    : listing.listings_food

  // Extract lat/lng from PostGIS GeoJSON: { type: 'Point', coordinates: [lng, lat] }
  const coords = listing.location?.coordinates as [number, number] | undefined
  const mapLng = coords?.[0]
  const mapLat = coords?.[1]

  const PRICE_LABELS: Record<number, string> = { 1: '$', 2: '$$', 3: '$$$', 4: '$$$$' }
  const halalLabel = HALAL_STATUS_LABELS[listing.halal_status as HalalStatus]
  const isMuis = listing.halal_status === HalalStatus.MuisCertified

  // Check if current user is logged in for review form
  const { data: { user } } = await supabase.auth.getUser()

  return (
    <article className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      {/* Breadcrumb */}
      <nav className="text-sm text-charcoal/50 mb-6" aria-label="Breadcrumb">
        <a href="/halal-food" className="hover:text-primary">Halal Food</a>
        <span className="mx-2">›</span>
        <a href={`/halal-food?area=${listing.area.toLowerCase().replace(/\s+/g, '-')}`} className="hover:text-primary capitalize">
          {listing.area}
        </a>
        <span className="mx-2">›</span>
        <span className="text-charcoal">{listing.name}</span>
      </nav>

      {/* Header */}
      <header className="mb-8">
        <div className="flex flex-wrap items-start gap-3 mb-3">
          <h1 className="text-3xl font-extrabold text-charcoal font-sans flex-1">{listing.name}</h1>
          {isMuis && <MuisBadge />}
        </div>

        <div className="flex flex-wrap gap-4 text-sm text-charcoal/60">
          {/* Rating */}
          {listing.review_count > 0 && (
            <span className="flex items-center gap-1">
              <span className="material-symbols-outlined text-accent text-base">star</span>
              <strong className="text-charcoal">{Number(listing.avg_rating).toFixed(1)}</strong>
              <span>({listing.review_count} reviews)</span>
            </span>
          )}

          {/* Price */}
          {food?.price_range && (
            <span>{PRICE_LABELS[food.price_range] ?? ''}</span>
          )}

          {/* Cuisines */}
          {food?.cuisine_types?.length && (
            <span className="capitalize">{(food.cuisine_types as string[]).join(' · ')}</span>
          )}

          {/* Halal status */}
          <span className={isMuis ? 'text-primary font-semibold' : ''}>
            {halalLabel}
          </span>
        </div>
      </header>

      {/* Photos */}
      {listing.photos && listing.photos.length > 0 && (
        <div className="grid grid-cols-3 gap-2 rounded-xl overflow-hidden mb-8 h-56">
          {listing.photos.slice(0, 3).map((url: string, i: number) => (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              key={i}
              src={url}
              alt={`${listing.name} photo ${i + 1}`}
              className={`object-cover w-full h-full ${i === 0 ? 'col-span-2 row-span-2' : ''}`}
            />
          ))}
        </div>
      )}

      <div className="grid md:grid-cols-3 gap-8">
        {/* Main content */}
        <div className="md:col-span-2 space-y-8">
          {/* Description */}
          {listing.description && (
            <section>
              <h2 className="text-lg font-bold text-charcoal mb-3">About</h2>
              <p className="text-charcoal/70 leading-relaxed">{listing.description}</p>
            </section>
          )}

          {/* Operating hours */}
          {(food?.operating_hours || listing.operating_hours) && (
            <section>
              <h2 className="text-lg font-bold text-charcoal mb-3">Operating Hours</h2>
              <OperatingHoursTable hours={food?.operating_hours ?? listing.operating_hours} />
            </section>
          )}

          {/* Delivery platforms */}
          {food?.delivery_platforms && (food.delivery_platforms as string[]).length > 0 && (
            <section>
              <h2 className="text-lg font-bold text-charcoal mb-3">Order Online</h2>
              <div className="flex flex-wrap gap-2">
                {(food.delivery_platforms as string[]).map((p: string) => {
                  const platformUrl = DELIVERY_URLS[p.toLowerCase()]
                  const inner = (
                    <span className="bg-warm-white border border-gray-200 rounded-full px-3 py-1.5 text-sm capitalize inline-flex items-center gap-1.5 hover:border-primary hover:text-primary transition-colors">
                      <span className="material-symbols-outlined text-base">delivery_dining</span>
                      {p}
                    </span>
                  )
                  return platformUrl ? (
                    <a key={p} href={platformUrl} target="_blank" rel="noopener noreferrer">
                      {inner}
                    </a>
                  ) : (
                    <span key={p}>{inner}</span>
                  )
                })}
              </div>
            </section>
          )}

          {/* MUIS info */}
          {isMuis && listing.muis_cert_no && (
            <section className="bg-emerald-50 border border-primary/20 rounded-xl p-4">
              <div className="flex items-center gap-2 mb-1">
                <span className="material-symbols-outlined text-primary">verified</span>
                <h2 className="font-bold text-primary">MUIS Certified</h2>
              </div>
              <p className="text-sm text-charcoal/70">
                Cert No: <strong>{listing.muis_cert_no}</strong>
                {listing.muis_expiry && (
                  <> · Valid until <strong>{new Date(listing.muis_expiry).toLocaleDateString('en-SG')}</strong></>
                )}
              </p>
              <p className="text-xs text-charcoal/50 mt-1">
                Always verify current certification status with MUIS directly.
              </p>
            </section>
          )}

          {/* Share buttons */}
          <ShareButtons
            url={`${SITE_URL}/restaurant/${listing.slug}`}
            title={`${listing.name} — Halal in ${listing.area}, Singapore`}
          />
        </div>

        {/* Sidebar / actions */}
        <aside className="space-y-4">
          <ListingActions
            listing={{
              id: listing.id,
              name: listing.name,
              area: listing.area,
              address: listing.address ?? '',
              phone: listing.phone ?? undefined,
              website: listing.website ?? undefined,
              menu_url: food?.menu_url as string | undefined,
              cuisine_type: (food?.cuisine_types as string[] | undefined)?.[0],
            }}
          />
        </aside>
      </div>

      {/* ── Map ─────────────────────────────────────────────────── */}
      {mapLat != null && mapLng != null && (
        <section className="mt-8">
          <h2 className="text-lg font-bold text-charcoal mb-3">Location</h2>
          <ListingMap
            lat={mapLat}
            lng={mapLng}
            name={listing.name}
            address={listing.address ?? undefined}
            className="h-64"
          />
        </section>
      )}

      {/* ── Reviews ─────────────────────────────────────────────── */}
      <section className="mt-12 pt-10 border-t border-gray-100">
        <h2 className="text-xl font-bold text-charcoal mb-6">
          Reviews
          {listing.review_count > 0 && (
            <span className="text-charcoal/40 font-normal text-base ml-2">
              ({listing.review_count})
            </span>
          )}
        </h2>
        <div className="grid md:grid-cols-2 gap-6">
          <ReviewForm
            listingId={listing.id}
            listingName={listing.name}
            isLoggedIn={!!user}
          />
          <ReviewsList listingId={listing.id} />
        </div>
      </section>

      {/* JSON-LD */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'Restaurant',
            name: listing.name,
            address: {
              '@type': 'PostalAddress',
              streetAddress: listing.address,
              addressLocality: listing.area,
              addressCountry: 'SG',
            },
            telephone: listing.phone,
            url: listing.website,
            servesCuisine: food?.cuisine_types,
            ...(listing.review_count > 0 && {
              aggregateRating: {
                '@type': 'AggregateRating',
                ratingValue: listing.avg_rating,
                reviewCount: listing.review_count,
                bestRating: 5,
              },
            }),
          }),
        }}
      />
    </article>
  )
}
