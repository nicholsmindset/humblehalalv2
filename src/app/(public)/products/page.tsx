import type { Metadata } from 'next'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { ListingCard } from '@/components/listings/ListingCard'
import { ISR_REVALIDATE, HalalStatus } from '@/config'
import type { ListingCardProps } from '@/components/listings/ListingCard'

export const revalidate = ISR_REVALIDATE.HIGH_TRAFFIC

export const metadata: Metadata = {
  title: 'Halal Products Singapore — Food, Cosmetics, Fashion & More | HumbleHalal',
  description: 'Browse MUIS-certified halal products in Singapore. Shop halal meat, groceries, cosmetics, supplements, fashion, and more from trusted Muslim brands.',
  alternates: { canonical: '/products' },
}

const PRODUCT_CATEGORIES = [
  { slug: 'halal-meat', label: 'Halal Meat & Poultry', icon: 'egg_alt' },
  { slug: 'halal-groceries', label: 'Halal Groceries', icon: 'local_grocery_store' },
  { slug: 'halal-cosmetics', label: 'Halal Cosmetics', icon: 'spa' },
  { slug: 'halal-supplements', label: 'Halal Supplements', icon: 'medication' },
  { slug: 'halal-fashion', label: 'Muslim Fashion', icon: 'checkroom' },
  { slug: 'halal-snacks', label: 'Halal Snacks', icon: 'cookie' },
]

export default async function ProductsPage() {
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
    .order('featured', { ascending: false })
    .order('avg_rating', { ascending: false })
    .range(0, 23)

  const listings: ListingCardProps[] = ((rows ?? []) as any[]).map((r) => ({
    id: r.id,
    slug: r.slug,
    name: r.name,
    vertical: r.vertical,
    area: r.area,
    address: r.address ?? '',
    halal_status: r.halal_status as HalalStatus,
    avg_rating: Number(r.avg_rating ?? 0),
    review_count: r.review_count ?? 0,
    photos: r.photos as string[] | undefined,
    category: r.categories?.[0],
    is_featured: r.featured ?? false,
  }))

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <header className="mb-10">
        <h1 className="text-4xl font-extrabold text-charcoal font-sans mb-3">
          Halal Products in Singapore
        </h1>
        <p className="text-charcoal/60 max-w-2xl">
          Discover {count ?? 0}+ MUIS-certified and halal-verified products — from food and groceries
          to cosmetics, fashion, and wellness supplements.
        </p>
      </header>

      {/* Category grid */}
      <section className="mb-10">
        <h2 className="text-sm font-bold text-charcoal/50 uppercase tracking-wider mb-4">Browse by Category</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {PRODUCT_CATEGORIES.map(({ slug, label, icon }) => (
            <Link
              key={slug}
              href={`/products/${slug}`}
              className="flex flex-col items-center gap-2 p-4 bg-white rounded-xl border border-gray-200 hover:border-primary hover:shadow-md transition-all text-center"
            >
              <span className="material-symbols-outlined text-3xl text-primary">{icon}</span>
              <span className="text-xs font-semibold text-charcoal leading-tight">{label}</span>
            </Link>
          ))}
        </div>
      </section>

      {/* Featured products */}
      <section>
        <h2 className="text-xl font-bold text-charcoal mb-5">Featured Halal Products</h2>
        {listings.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {listings.map((l) => <ListingCard key={l.id} {...l} />)}
          </div>
        ) : (
          <div className="text-center py-16 text-charcoal/40">
            <span className="material-symbols-outlined text-5xl block mb-3">inventory_2</span>
            <p>Product listings coming soon.</p>
          </div>
        )}
      </section>

      {/* pSEO cross-links */}
      <section className="mt-14 border-t border-gray-100 pt-8">
        <h2 className="text-base font-bold text-charcoal mb-4">Popular Halal Product Categories</h2>
        <div className="flex flex-wrap gap-2">
          {PRODUCT_CATEGORIES.map(({ slug, label }) => (
            <Link key={slug} href={`/products/${slug}`} className="text-sm text-primary hover:underline">
              {label} Singapore
            </Link>
          ))}
        </div>
      </section>

      {/* JSON-LD */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'ItemList',
            name: 'Halal Products Singapore',
            numberOfItems: listings.length,
            itemListElement: listings.map((l, i) => ({
              '@type': 'ListItem',
              position: i + 1,
              name: l.name,
              url: `https://humblehalal.sg/products/${l.slug}`,
            })),
          }),
        }}
      />
    </div>
  )
}
