import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import { MuisBadge } from '@/components/ui/MuisBadge'
import { HalalStatus, HALAL_STATUS_LABELS, ISR_REVALIDATE } from '@/config'
import { ReviewForm } from '@/components/reviews/ReviewForm'
import { ReviewsList } from '@/components/reviews/ReviewsList'

export const revalidate = ISR_REVALIDATE.LONG_TAIL

interface Props { params: Promise<{ slug: string }> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const supabase = await createClient()
  const { data: listing } = await supabase.from('listings').select('name, description').eq('slug', slug).eq('status', 'active').single()
  if (!listing) return { title: 'Product Not Found | HumbleHalal' }
  return {
    title: `${listing.name} — Halal Product Review | HumbleHalal`,
    description: listing.description?.slice(0, 155) ?? `${listing.name} — halal-certified product review on HumbleHalal Singapore.`,
  }
}

export default async function ProductDetailPage({ params }: Props) {
  const { slug } = await params
  const supabase = await createClient()

  const { data: listing } = (await supabase
    .from('listings')
    .select(`
      id, name, slug, area, address, description, halal_status, photos, avg_rating, review_count, website,
      listings_products ( product_category, brand, price_min, price_max, where_to_buy, ingredients )
    `)
    .eq('slug', slug)
    .eq('status', 'active')
    .single()) as any

  if (!listing) notFound()

  const product = Array.isArray(listing.listings_products) ? listing.listings_products[0] : listing.listings_products
  const halalLabel = HALAL_STATUS_LABELS[listing.halal_status as HalalStatus]
  const isMuis = listing.halal_status === HalalStatus.MuisCertified
  const { data: { user } } = await supabase.auth.getUser()

  return (
    <article className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <nav className="text-sm text-charcoal/50 mb-6" aria-label="Breadcrumb">
        <a href="/products" className="hover:text-primary">Products</a>
        <span className="mx-2">›</span>
        <span className="text-charcoal">{listing.name}</span>
      </nav>

      <header className="mb-8">
        <div className="flex flex-wrap items-start gap-3 mb-3">
          <h1 className="text-3xl font-extrabold text-charcoal font-sans flex-1">{listing.name}</h1>
          {isMuis && <MuisBadge />}
        </div>
        <div className="flex flex-wrap gap-4 text-sm text-charcoal/60">
          {product?.brand && <span className="font-medium text-charcoal">{product.brand}</span>}
          {listing.review_count > 0 && (
            <span className="flex items-center gap-1">
              <span className="material-symbols-outlined text-accent text-base">star</span>
              <strong className="text-charcoal">{Number(listing.avg_rating).toFixed(1)}</strong>
              <span>({listing.review_count} reviews)</span>
            </span>
          )}
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

      <div className="space-y-8">
        {listing.description && (
          <section>
            <h2 className="text-lg font-bold text-charcoal mb-3">About This Product</h2>
            <p className="text-charcoal/70 leading-relaxed">{listing.description}</p>
          </section>
        )}

        {product && (
          <section className="bg-warm-white border border-gray-200 rounded-xl p-5">
            <h2 className="text-lg font-bold text-charcoal mb-3">Product Details</h2>
            <dl className="grid grid-cols-2 gap-4 text-sm">
              {product.product_category && <div><dt className="text-charcoal/50">Category</dt><dd className="font-medium capitalize">{product.product_category.replace(/-/g, ' ')}</dd></div>}
              {product.brand && <div><dt className="text-charcoal/50">Brand</dt><dd className="font-medium">{product.brand}</dd></div>}
              {product.price_min && <div><dt className="text-charcoal/50">Price</dt><dd className="font-medium">${product.price_min}{product.price_max ? ` — $${product.price_max}` : '+'}</dd></div>}
              {product.where_to_buy?.length > 0 && <div><dt className="text-charcoal/50">Where to Buy</dt><dd className="font-medium">{product.where_to_buy.join(', ')}</dd></div>}
            </dl>
          </section>
        )}

        {listing.website && (
          <a href={listing.website} target="_blank" rel="noopener noreferrer" className="inline-block bg-accent text-charcoal rounded-lg font-bold px-6 py-3 hover:bg-accent/90 transition-colors">
            Buy Now →
          </a>
        )}
      </div>

      <section className="mt-12 pt-10 border-t border-gray-100">
        <h2 className="text-xl font-bold text-charcoal mb-6">Reviews {listing.review_count > 0 && <span className="text-charcoal/40 font-normal text-base ml-2">({listing.review_count})</span>}</h2>
        <div className="grid md:grid-cols-2 gap-6">
          <ReviewForm listingId={listing.id} listingName={listing.name} isLoggedIn={!!user} />
          <ReviewsList listingId={listing.id} />
        </div>
      </section>

      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify({
        '@context': 'https://schema.org', '@type': 'Product', name: listing.name,
        brand: product?.brand ? { '@type': 'Brand', name: product.brand } : undefined,
        ...(listing.review_count > 0 && { aggregateRating: { '@type': 'AggregateRating', ratingValue: listing.avg_rating, reviewCount: listing.review_count, bestRating: 5 } }),
        ...(product?.price_min && { offers: { '@type': 'Offer', priceCurrency: 'SGD', price: product.price_min } }),
      }) }} />
    </article>
  )
}
