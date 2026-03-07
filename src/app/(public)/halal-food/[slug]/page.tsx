import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { ListingCard } from '@/components/listings/ListingCard'
import { ISR_REVALIDATE, HalalStatus, SingaporeArea, CuisineType } from '@/config'
import type { ListingCardProps } from '@/components/listings/ListingCard'

export const revalidate = ISR_REVALIDATE.LONG_TAIL

interface Props {
  params: Promise<{ slug: string }>
}

const CUISINE_LABELS: Record<string, string> = {
  malay: 'Malay', indian: 'Indian', chinese: 'Chinese', korean: 'Korean',
  japanese: 'Japanese', turkish: 'Turkish', 'middle-eastern': 'Middle Eastern',
  western: 'Western', mediterranean: 'Mediterranean', thai: 'Thai',
  indonesian: 'Indonesian', pakistani: 'Pakistani', bangladeshi: 'Bangladeshi',
  vietnamese: 'Vietnamese', mexican: 'Mexican', italian: 'Italian',
  fusion: 'Fusion', buffet: 'Buffet', seafood: 'Seafood',
  dessert: 'Dessert', cafe: 'Café', bakery: 'Bakery',
  'fast-food': 'Fast Food', mamak: 'Mamak',
}

const AREA_LABELS: Record<string, string> = {
  tampines: 'Tampines', 'jurong-east': 'Jurong East', 'jurong-west': 'Jurong West',
  woodlands: 'Woodlands', yishun: 'Yishun', sengkang: 'Sengkang',
  punggol: 'Punggol', bedok: 'Bedok', hougang: 'Hougang',
  'bukit-timah': 'Bukit Timah', orchard: 'Orchard', bugis: 'Bugis',
  'arab-street': 'Arab Street', 'marina-bay': 'Marina Bay',
  'geylang-serangoon': 'Geylang / Serangoon', 'pasir-ris': 'Pasir Ris',
  clementi: 'Clementi', queenstown: 'Queenstown', bishan: 'Bishan',
  'toa-payoh': 'Toa Payoh', sembawang: 'Sembawang',
  'choa-chu-kang': 'Choa Chu Kang', 'ang-mo-kio': 'Ang Mo Kio',
  'boon-lay': 'Boon Lay', jurong: 'Jurong', city: 'City Area',
}

function parseSlug(slug: string): { cuisine: string; area: string } | null {
  const areas = Object.values(SingaporeArea) as string[]
  const cuisines = Object.values(CuisineType) as string[]

  for (const area of areas.sort((a, b) => b.length - a.length)) {
    if (slug.endsWith(`-${area}`)) {
      const cuisine = slug.slice(0, slug.length - area.length - 1)
      if (cuisines.includes(cuisine)) {
        return { cuisine, area }
      }
    }
  }
  return null
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const parsed = parseSlug(slug)
  if (!parsed) return { title: 'Not Found' }

  const cuisineLabel = CUISINE_LABELS[parsed.cuisine] ?? parsed.cuisine
  const areaLabel = AREA_LABELS[parsed.area] ?? parsed.area

  return {
    title: `${cuisineLabel} Halal Restaurants in ${areaLabel}, Singapore | HumbleHalal`,
    description: `Discover the best ${cuisineLabel} halal restaurants in ${areaLabel}, Singapore. MUIS-certified listings with reviews, menus, and directions on HumbleHalal.`,
    alternates: { canonical: `/halal-food/${slug}` },
  }
}

const PAGE_SIZE = 24

export default async function HalalFoodSlugPage({ params }: Props) {
  const { slug } = await params
  const parsed = parseSlug(slug)
  if (!parsed) notFound()

  const { cuisine, area } = parsed
  const cuisineLabel = CUISINE_LABELS[cuisine] ?? cuisine
  const areaLabel = AREA_LABELS[area] ?? area

  const supabase = await createClient()
  const { data: rows, count } = await supabase
    .from('listings')
    .select(
      `id, slug, name, vertical, area, address, halal_status,
       avg_rating, review_count, photos, featured,
       listings_food ( cuisine_types, price_range )`,
      { count: 'exact' }
    )
    .eq('vertical', 'food')
    .eq('status', 'active')
    .eq('area', area)
    .contains('listings_food.cuisine_types' as any, [cuisine])
    .order('featured', { ascending: false })
    .order('avg_rating', { ascending: false })
    .range(0, PAGE_SIZE - 1)

  const listings: ListingCardProps[] = ((rows ?? []) as any[]).map((r) => {
    const food = Array.isArray(r.listings_food) ? r.listings_food[0] : r.listings_food
    return {
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
      cuisine_types: food?.cuisine_types as string[] | undefined,
      price_range: food?.price_range ?? null,
      is_featured: r.featured ?? false,
    }
  })

  // Related pSEO links — other cuisines in same area
  const relatedCuisines = Object.entries(CUISINE_LABELS)
    .filter(([c]) => c !== cuisine)
    .slice(0, 8)

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-xs text-charcoal/50 mb-6">
        <Link href="/" className="hover:text-primary">Home</Link>
        <span>›</span>
        <Link href="/halal-food" className="hover:text-primary">Halal Food</Link>
        <span>›</span>
        <span className="text-charcoal font-medium">{cuisineLabel} in {areaLabel}</span>
      </nav>

      {/* Header */}
      <header className="mb-8">
        <h1 className="text-3xl font-extrabold text-charcoal font-sans mb-2">
          {cuisineLabel} Halal Restaurants in {areaLabel}
        </h1>
        <p className="text-charcoal/50 text-sm">
          {count ?? 0} halal {cuisineLabel.toLowerCase()} restaurants in {areaLabel}, Singapore
        </p>
      </header>

      {/* Listing grid */}
      {listings.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5 mb-10">
          {listings.map((l) => <ListingCard key={l.id} {...l} />)}
        </div>
      ) : (
        <div className="text-center py-20">
          <span className="material-symbols-outlined text-5xl text-charcoal/20 block mb-4">search_off</span>
          <p className="text-charcoal/50 font-medium">No {cuisineLabel} halal restaurants found in {areaLabel}.</p>
          <Link href="/halal-food" className="text-primary text-sm hover:underline mt-4 block">
            Browse all halal food →
          </Link>
        </div>
      )}

      {/* Related pSEO links */}
      <section className="mt-14 border-t border-gray-100 pt-8">
        <h2 className="text-base font-bold text-charcoal mb-4">Other Halal Cuisine in {areaLabel}</h2>
        <div className="flex flex-wrap gap-2">
          {relatedCuisines.map(([c, label]) => (
            <Link
              key={c}
              href={`/halal-food/${c}-${area}`}
              className="text-sm text-primary hover:underline"
            >
              {label} in {areaLabel}
            </Link>
          ))}
        </div>
      </section>

      <section className="mt-8">
        <h2 className="text-base font-bold text-charcoal mb-4">{cuisineLabel} Halal in Other Areas</h2>
        <div className="flex flex-wrap gap-2">
          {Object.entries(AREA_LABELS)
            .filter(([a]) => a !== area)
            .slice(0, 8)
            .map(([a, label]) => (
              <Link
                key={a}
                href={`/halal-food/${cuisine}-${a}`}
                className="text-sm text-primary hover:underline"
              >
                {cuisineLabel} in {label}
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
            name: `${cuisineLabel} Halal Restaurants in ${areaLabel}`,
            description: `Top ${cuisineLabel} halal restaurants in ${areaLabel}, Singapore`,
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
