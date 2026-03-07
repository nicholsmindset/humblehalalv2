import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { ListingCard } from '@/components/listings/ListingCard'
import { ListingActions } from '@/components/listings/ListingActions'
import { ReviewForm } from '@/components/reviews/ReviewForm'
import { ReviewsList } from '@/components/reviews/ReviewsList'
import { MuisBadge } from '@/components/ui/MuisBadge'
import { ISR_REVALIDATE, HalalStatus, HALAL_STATUS_LABELS } from '@/config'
import type { ListingCardProps } from '@/components/listings/ListingCard'

export const revalidate = ISR_REVALIDATE.LONG_TAIL

interface Props {
  params: Promise<{ slug: string }>
}

const PRODUCT_META: Record<string, { label: string; description: string; icon: string; category: string }> = {
  'halal-meat': {
    label: 'Halal Meat & Poultry',
    description: 'MUIS-certified halal meat, poultry, and seafood suppliers in Singapore. Find fresh and frozen halal options.',
    icon: 'egg_alt',
    category: 'meat',
  },
  'halal-groceries': {
    label: 'Halal Groceries',
    description: 'Shop halal-certified groceries and pantry staples in Singapore. Trusted brands with MUIS certification.',
    icon: 'local_grocery_store',
    category: 'grocery',
  },
  'halal-cosmetics': {
    label: 'Halal Cosmetics & Beauty',
    description: 'Halal-certified cosmetics, skincare, and beauty products in Singapore. No alcohol, no pork-derived ingredients.',
    icon: 'spa',
    category: 'cosmetics',
  },
  'halal-supplements': {
    label: 'Halal Supplements & Wellness',
    description: 'Halal-certified vitamins, supplements, and wellness products in Singapore. Verified halal status.',
    icon: 'medication',
    category: 'supplements',
  },
  'halal-fashion': {
    label: 'Muslim Fashion & Modest Wear',
    description: 'Shop Muslim-owned fashion brands in Singapore. Modest wear, baju kurung, tudung, and Islamic clothing.',
    icon: 'checkroom',
    category: 'fashion',
  },
  'halal-snacks': {
    label: 'Halal Snacks & Confectionery',
    description: 'MUIS-certified halal snacks, kuih, confectionery, and treats from Muslim-owned brands in Singapore.',
    icon: 'cookie',
    category: 'snacks',
  },
}

export function generateStaticParams() {
  return Object.keys(PRODUCT_META).map((slug) => ({ slug }))
}

// ── Metadata ──────────────────────────────────────────────────────────────────
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const meta = PRODUCT_META[slug]
  if (meta) {
    return {
      title: `${meta.label} Singapore — Halal Certified | HumbleHalal`,
      description: meta.description,
      alternates: { canonical: `/products/${slug}` },
    }
  }

  const supabase = await createClient()
  const { data: listing } = (await supabase
    .from('listings')
    .select('name, area, description')
    .eq('slug', slug)
    .eq('vertical', 'products')
    .eq('status', 'active')
    .single()) as any

  if (!listing) return { title: 'Not Found' }
  return {
    title: `${listing.name} — Halal Product in Singapore | HumbleHalal`,
    description: listing.description?.slice(0, 155) ??
      `${listing.name} is a halal-certified product available in Singapore. Find details and reviews on HumbleHalal.`,
  }
}

const PAGE_SIZE = 24

// ── Page ──────────────────────────────────────────────────────────────────────
export default async function ProductSlugPage({ params }: Props) {
  const { slug } = await params
  const categoryMeta = PRODUCT_META[slug]

  // ── Branch A: pSEO category page ────────────────────────────────────────────
  if (categoryMeta) {
    const supabase = await createClient()
    const { data: rows, count } = await supabase
      .from('listings')
      .select(
        `id, slug, name, vertical, area, address, halal_status,
         avg_rating, review_count, photos, featured, categories`,
        { count: 'exact' }
      )
      .eq('vertical', 'products')
      .eq('status', 'active')
      .contains('categories' as any, [categoryMeta.category])
      .order('featured', { ascending: false })
      .order('avg_rating', { ascending: false })
      .range(0, PAGE_SIZE - 1)

    const listings: ListingCardProps[] = ((rows ?? []) as any[]).map((r) => ({
      id: r.id, slug: r.slug, name: r.name, vertical: r.vertical,
      area: r.area, address: r.address ?? '',
      halal_status: r.halal_status as HalalStatus,
      avg_rating: Number(r.avg_rating ?? 0),
      review_count: r.review_count ?? 0,
      photos: r.photos as string[] | undefined,
      category: r.categories?.[0],
      is_featured: r.featured ?? false,
    }))

    const otherProducts = Object.entries(PRODUCT_META).filter(([s]) => s !== slug)

    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <nav className="flex items-center gap-2 text-xs text-charcoal/50 mb-6">
          <Link href="/" className="hover:text-primary">Home</Link>
          <span>›</span>
          <Link href="/products" className="hover:text-primary">Halal Products</Link>
          <span>›</span>
          <span className="text-charcoal font-medium">{categoryMeta.label}</span>
        </nav>

        <header className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <span className="material-symbols-outlined text-3xl text-primary">{categoryMeta.icon}</span>
            <h1 className="text-3xl font-extrabold text-charcoal font-sans">{categoryMeta.label}</h1>
          </div>
          <p className="text-charcoal/60 max-w-2xl">{categoryMeta.description}</p>
          <p className="text-charcoal/40 text-sm mt-2">{count ?? 0} products found</p>
        </header>

        {listings.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5 mb-10">
            {listings.map((l) => <ListingCard key={l.id} {...l} />)}
          </div>
        ) : (
          <div className="text-center py-20">
            <span className="material-symbols-outlined text-5xl text-charcoal/20 block mb-4">inventory_2</span>
            <p className="text-charcoal/50 font-medium">No {categoryMeta.label.toLowerCase()} listings yet.</p>
            <Link href="/products" className="text-primary text-sm hover:underline mt-4 block">Browse all halal products →</Link>
          </div>
        )}

        <section className="mt-14 border-t border-gray-100 pt-8">
          <h2 className="text-base font-bold text-charcoal mb-4">Other Halal Product Categories</h2>
          <div className="flex flex-wrap gap-2">
            {otherProducts.map(([s, m]) => (
              <Link key={s} href={`/products/${s}`} className="text-sm text-primary hover:underline">{m.label}</Link>
            ))}
          </div>
        </section>

        <script type="application/ld+json" dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org', '@type': 'ItemList',
            name: `${categoryMeta.label} Singapore`, description: categoryMeta.description,
            numberOfItems: listings.length,
            itemListElement: listings.map((l, i) => ({
              '@type': 'ListItem', position: i + 1, name: l.name,
              url: `https://humblehalal.sg/products/${l.slug}`,
            })),
          }),
        }} />
      </div>
    )
  }

  // ── Branch B: Individual product detail page ─────────────────────────────────
  const supabase = await createClient()

  const { data: listing } = (await supabase
    .from('listings')
    .select(`
      id, name, slug, area, address, phone, website, email,
      description, halal_status, muis_cert_no, muis_expiry,
      photos, avg_rating, review_count, categories
    `)
    .eq('slug', slug)
    .eq('vertical', 'products')
    .eq('status', 'active')
    .single()) as any

  if (!listing) notFound()

  const isMuis = listing.halal_status === HalalStatus.MuisCertified
  const halalLabel = HALAL_STATUS_LABELS[listing.halal_status as HalalStatus]
  const { data: { user } } = await supabase.auth.getUser()

  return (
    <article className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <nav className="text-sm text-charcoal/50 mb-6">
        <Link href="/products" className="hover:text-primary">Halal Products</Link>
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
          <span className={isMuis ? 'text-primary font-semibold' : ''}>{halalLabel}</span>
          {listing.categories?.length > 0 && (
            <span className="capitalize">{(listing.categories as string[]).join(' · ')}</span>
          )}
        </div>
      </header>

      {listing.photos?.length > 0 && (
        <div className="grid grid-cols-3 gap-2 rounded-xl overflow-hidden mb-8 h-56">
          {(listing.photos as string[]).slice(0, 3).map((url: string, i: number) => (
            // eslint-disable-next-line @next/next/no-img-element
            <img key={i} src={url} alt={`${listing.name} photo ${i + 1}`}
              className={`object-cover w-full h-full ${i === 0 ? 'col-span-2' : ''}`} />
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
            </section>
          )}
        </div>

        <aside>
          <ListingActions listing={{
            id: listing.id, name: listing.name, area: listing.area ?? 'Singapore',
            address: listing.address ?? '', phone: listing.phone ?? undefined,
            website: listing.website ?? undefined,
          }} />
        </aside>
      </div>

      <section className="mt-12 pt-10 border-t border-gray-100">
        <h2 className="text-xl font-bold text-charcoal mb-6">
          Reviews {listing.review_count > 0 && <span className="text-charcoal/40 font-normal text-base ml-2">({listing.review_count})</span>}
        </h2>
        <div className="grid md:grid-cols-2 gap-6">
          <ReviewForm listingId={listing.id} listingName={listing.name} isLoggedIn={!!user} />
          <ReviewsList listingId={listing.id} />
        </div>
      </section>

      <script type="application/ld+json" dangerouslySetInnerHTML={{
        __html: JSON.stringify({
          '@context': 'https://schema.org', '@type': 'Product',
          name: listing.name, description: listing.description,
          ...(listing.review_count > 0 && {
            aggregateRating: { '@type': 'AggregateRating', ratingValue: listing.avg_rating, reviewCount: listing.review_count, bestRating: 5 },
          }),
        }),
      }} />
    </article>
  )
}
