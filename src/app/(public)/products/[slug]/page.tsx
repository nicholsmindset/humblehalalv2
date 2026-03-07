import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { ListingCard } from '@/components/listings/ListingCard'
import { ISR_REVALIDATE, HalalStatus } from '@/config'
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

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const meta = PRODUCT_META[slug]
  if (!meta) return { title: 'Not Found' }

  return {
    title: `${meta.label} Singapore — Halal Certified | HumbleHalal`,
    description: meta.description,
    alternates: { canonical: `/products/${slug}` },
  }
}

const PAGE_SIZE = 24

export default async function ProductSlugPage({ params }: Props) {
  const { slug } = await params
  const meta = PRODUCT_META[slug]
  if (!meta) notFound()

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
    .contains('categories' as any, [meta.category])
    .order('featured', { ascending: false })
    .order('avg_rating', { ascending: false })
    .range(0, PAGE_SIZE - 1)

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

  const otherProducts = Object.entries(PRODUCT_META).filter(([s]) => s !== slug)

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-xs text-charcoal/50 mb-6">
        <Link href="/" className="hover:text-primary">Home</Link>
        <span>›</span>
        <Link href="/products" className="hover:text-primary">Halal Products</Link>
        <span>›</span>
        <span className="text-charcoal font-medium">{meta.label}</span>
      </nav>

      {/* Header */}
      <header className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <span className="material-symbols-outlined text-3xl text-primary">{meta.icon}</span>
          <h1 className="text-3xl font-extrabold text-charcoal font-sans">{meta.label}</h1>
        </div>
        <p className="text-charcoal/60 max-w-2xl">{meta.description}</p>
        <p className="text-charcoal/40 text-sm mt-2">{count ?? 0} products found</p>
      </header>

      {/* Listings */}
      {listings.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5 mb-10">
          {listings.map((l) => <ListingCard key={l.id} {...l} />)}
        </div>
      ) : (
        <div className="text-center py-20">
          <span className="material-symbols-outlined text-5xl text-charcoal/20 block mb-4">inventory_2</span>
          <p className="text-charcoal/50 font-medium">No {meta.label.toLowerCase()} listings yet.</p>
          <Link href="/products" className="text-primary text-sm hover:underline mt-4 block">
            Browse all halal products →
          </Link>
        </div>
      )}

      {/* Cross-links */}
      <section className="mt-14 border-t border-gray-100 pt-8">
        <h2 className="text-base font-bold text-charcoal mb-4">Other Halal Product Categories</h2>
        <div className="flex flex-wrap gap-2">
          {otherProducts.map(([s, m]) => (
            <Link key={s} href={`/products/${s}`} className="text-sm text-primary hover:underline">
              {m.label}
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
            name: `${meta.label} Singapore`,
            description: meta.description,
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
