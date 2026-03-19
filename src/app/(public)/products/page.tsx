import type { Metadata } from 'next'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { ListingCard } from '@/components/listings/ListingCard'
import { ISR_REVALIDATE, HalalStatus } from '@/config'
import type { ListingCardProps } from '@/components/listings/ListingCard'

export const revalidate = ISR_REVALIDATE.LONG_TAIL

interface Props {
  searchParams: Promise<{ category?: string; q?: string; page?: string }>
}

export async function generateMetadata({ searchParams }: Props): Promise<Metadata> {
  const { category } = await searchParams

  const title = category
    ? `Halal ${category.charAt(0).toUpperCase() + category.slice(1)} Products Singapore | HumbleHalal`
    : 'Halal Products Singapore — Food, Cosmetics & More | HumbleHalal'

  const description = `Browse MUIS-certified halal products${category ? ` in the ${category} category` : ''} available in Singapore. Food, cosmetics, supplements, and everyday essentials.`

  return {
    title,
    description,
    openGraph: { title, description },
  }
}

const PAGE_SIZE = 24

const CATEGORY_LABELS: Record<string, string> = {
  food: 'Food & Beverages',
  cosmetics: 'Cosmetics & Skincare',
  supplements: 'Supplements & Vitamins',
  household: 'Household Products',
  fashion: 'Modest Fashion',
  baby: 'Baby & Kids',
  snacks: 'Snacks & Confectionery',
  frozen: 'Frozen & Ready Meals',
  condiments: 'Condiments & Sauces',
  beverages: 'Beverages',
}

export default async function HalalProductsPage({ searchParams }: Props) {
  const { category, q, page: pageStr } = await searchParams
  const page = Math.max(1, parseInt(pageStr ?? '1', 10))
  const offset = (page - 1) * PAGE_SIZE

  const supabase = await createClient()

  let query = (supabase as any)
    .from('listings')
    .select(
      'id, slug, name, vertical, area, address, halal_status, avg_rating, review_count, photos, featured',
      { count: 'exact' }
    )
    .eq('vertical', 'products')
    .eq('status', 'active')
    .order('featured', { ascending: false })
    .order('avg_rating', { ascending: false })
    .range(offset, offset + PAGE_SIZE - 1)

  if (category) query = query.eq('listing_category', category)
  if (q) query = query.ilike('name', `%${q}%`)

  const { data: rows, count } = await query

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
    is_featured: r.featured ?? false,
  }))

  const totalPages = Math.ceil((count ?? 0) / PAGE_SIZE)

  const heading = category
    ? `Halal ${CATEGORY_LABELS[category] ?? category} in Singapore`
    : 'Halal Products in Singapore'

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      {/* Header */}
      <header className="mb-8">
        <nav className="text-xs text-charcoal/40 mb-3 flex items-center gap-1">
          <Link href="/" className="hover:text-primary">Home</Link>
          <span>/</span>
          <span className="text-charcoal">Halal Products</span>
        </nav>
        <h1 className="text-3xl font-extrabold text-charcoal font-sans mb-2">{heading}</h1>
        <p className="text-charcoal/50 text-sm">{count ?? 0} halal products found</p>
      </header>

      {/* Category tabs */}
      <div className="flex flex-wrap gap-2 mb-8 border-b border-gray-100 pb-4">
        <Link
          href="/products"
          className={`text-sm font-medium px-3 py-1 rounded-full ${!category ? 'text-primary font-bold' : 'text-charcoal/60 hover:text-primary'}`}
        >
          All
        </Link>
        {Object.entries(CATEGORY_LABELS).map(([val, label]) => (
          <Link
            key={val}
            href={`/products?category=${val}`}
            className={`text-sm font-medium px-3 py-1 rounded-full transition-colors ${
              category === val ? 'text-primary font-bold' : 'text-charcoal/60 hover:text-primary'
            }`}
          >
            {label}
          </Link>
        ))}
      </div>

      {/* Listings grid */}
      {listings.length > 0 ? (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5 mb-10">
            {listings.map((l) => (
              <ListingCard key={l.id} {...l} />
            ))}
          </div>

          {totalPages > 1 && (
            <nav className="flex justify-center gap-2" aria-label="Pagination">
              {page > 1 && (
                <Link
                  href={`/products?page=${page - 1}${category ? `&category=${category}` : ''}`}
                  className="px-4 py-2 rounded-lg border border-gray-200 text-sm hover:border-primary transition-colors"
                >
                  ← Prev
                </Link>
              )}
              <span className="px-4 py-2 text-sm text-charcoal/60">Page {page} of {totalPages}</span>
              {page < totalPages && (
                <Link
                  href={`/products?page=${page + 1}${category ? `&category=${category}` : ''}`}
                  className="px-4 py-2 rounded-lg border border-gray-200 text-sm hover:border-primary transition-colors"
                >
                  Next →
                </Link>
              )}
            </nav>
          )}
        </>
      ) : (
        <div className="text-center py-20">
          <span className="material-symbols-outlined text-5xl text-charcoal/20 block mb-4">inventory_2</span>
          <p className="text-charcoal/50 font-medium">No products found.</p>
          <p className="text-charcoal/40 text-sm mt-1">Try a different category.</p>
          <Link href="/products" className="text-primary text-sm hover:underline mt-4 block">Clear filters</Link>
        </div>
      )}

      {/* Cross-links */}
      <section className="mt-16 border-t border-gray-100 pt-10">
        <h2 className="text-lg font-bold text-charcoal mb-4">Browse by Category</h2>
        <div className="flex flex-wrap gap-2">
          {Object.entries(CATEGORY_LABELS).map(([val, label]) => (
            <Link key={val} href={`/products?category=${val}`} className="text-sm text-primary hover:underline">
              Halal {label.toLowerCase()} Singapore
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
            name: heading,
            numberOfItems: listings.length,
            itemListElement: listings.map((l, i) => ({
              '@type': 'ListItem',
              position: i + 1,
              name: l.name,
              url: `https://humblehalal.sg/restaurant/${l.slug}`,
            })),
          }),
        }}
      />
    </div>
  )
}
