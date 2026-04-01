import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { ISR_REVALIDATE } from '@/config'
import { ContactReveal } from './ContactReveal'

export const revalidate = ISR_REVALIDATE.HIGH_TRAFFIC

interface Props {
  params: Promise<{ slug: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const supabase = await createClient()
  const { data: item } = (await (supabase as any)
    .from('classifieds')
    .select('title, category, area, price, currency')
    .eq('slug', slug)
    .single()) as any

  if (!item) return { title: 'Listing Not Found' }

  const priceStr = item.price != null ? ` — ${item.currency ?? 'SGD'} ${Number(item.price).toLocaleString()}` : ''
  return {
    title: `${item.title}${priceStr} | HumbleHalal Classifieds`,
    description: `${item.title}${item.area ? ` in ${item.area.replace(/-/g, ' ')}` : ''}, Singapore. Find more Muslim-friendly classifieds on HumbleHalal.`,
  }
}

const CONDITION_LABELS: Record<string, string> = {
  new:        'Brand New',
  like_new:   'Like New',
  good:       'Good',
  fair:       'Fair',
  for_parts:  'For Parts',
}

export default async function ClassifiedDetailPage({ params }: Props) {
  const { slug } = await params
  const supabase = await createClient()

  const { data: item } = (await (supabase as any)
    .from('classifieds')
    .select('*')
    .eq('slug', slug)
    .eq('status', 'active')
    .single()) as any

  if (!item) notFound()

  // Related listings in same category
  const { data: related } = (await (supabase as any)
    .from('classifieds')
    .select('id, slug, title, price, currency, images, area')
    .eq('status', 'active')
    .eq('category', item.category)
    .neq('id', item.id)
    .limit(4)) as any

  const isExpired = item.expires_at && new Date(item.expires_at) < new Date()

  return (
    <article className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      {/* Breadcrumb */}
      <nav className="text-sm text-charcoal/50 mb-6">
        <Link href="/classifieds" className="hover:text-primary">Classifieds</Link>
        <span className="mx-2">›</span>
        {item.category && (
          <>
            <Link href={`/classifieds?category=${item.category}`} className="hover:text-primary capitalize">
              {item.category}
            </Link>
            <span className="mx-2">›</span>
          </>
        )}
        <span className="text-charcoal line-clamp-1">{item.title}</span>
      </nav>

      <div className="grid md:grid-cols-3 gap-8">
        {/* Main content */}
        <div className="md:col-span-2 space-y-6">
          {/* Images */}
          {item.images?.length > 0 && (
            <div className={`grid gap-2 ${item.images.length > 1 ? 'grid-cols-2' : 'grid-cols-1'}`}>
              {item.images.slice(0, 4).map((src: string, i: number) => (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  key={i}
                  src={src}
                  alt={`${item.title} — photo ${i + 1}`}
                  className={`w-full object-cover rounded-xl ${i === 0 && item.images.length > 1 ? 'col-span-2 h-64' : 'h-40'}`}
                />
              ))}
            </div>
          )}

          <header>
            {isExpired && (
              <span className="inline-block bg-gray-100 text-charcoal/50 text-xs font-medium px-3 py-1 rounded-full mb-3">
                Expired
              </span>
            )}
            <h1 className="text-2xl font-extrabold text-charcoal font-sans">{item.title}</h1>
            <div className="flex flex-wrap gap-3 mt-2 text-sm text-charcoal/60">
              {item.area && (
                <span className="flex items-center gap-1 capitalize">
                  <span className="material-symbols-outlined text-base">location_on</span>
                  {item.area.replace(/-/g, ' ')}, Singapore
                </span>
              )}
              <span className="flex items-center gap-1">
                <span className="material-symbols-outlined text-base">schedule</span>
                Posted {new Date(item.created_at).toLocaleDateString('en-SG', { day: 'numeric', month: 'long', year: 'numeric' })}
              </span>
            </div>
          </header>

          {item.description && (
            <section>
              <h2 className="text-lg font-bold text-charcoal mb-2">Description</h2>
              <p className="text-charcoal/70 leading-relaxed whitespace-pre-line">{item.description}</p>
            </section>
          )}

          {/* Details grid */}
          <section className="grid grid-cols-2 gap-3">
            {item.category && (
              <div className="bg-gray-50 rounded-xl p-4">
                <p className="text-xs text-charcoal/40 uppercase tracking-wide mb-1">Category</p>
                <p className="text-sm text-charcoal font-medium capitalize">{item.category}</p>
              </div>
            )}
            {item.condition && (
              <div className="bg-gray-50 rounded-xl p-4">
                <p className="text-xs text-charcoal/40 uppercase tracking-wide mb-1">Condition</p>
                <p className="text-sm text-charcoal font-medium">{CONDITION_LABELS[item.condition] ?? item.condition}</p>
              </div>
            )}
            {item.expires_at && (
              <div className="bg-gray-50 rounded-xl p-4">
                <p className="text-xs text-charcoal/40 uppercase tracking-wide mb-1">Listing expires</p>
                <p className="text-sm text-charcoal font-medium">
                  {new Date(item.expires_at).toLocaleDateString('en-SG')}
                </p>
              </div>
            )}
          </section>
        </div>

        {/* Sidebar */}
        <aside className="space-y-4">
          <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-4">
            {item.price != null && (
              <div>
                <p className="text-xs text-charcoal/40 uppercase tracking-wide font-medium mb-1">Asking Price</p>
                <p className="text-3xl font-extrabold text-accent">
                  {item.currency ?? 'SGD'} {Number(item.price).toLocaleString()}
                </p>
              </div>
            )}

            {!isExpired && item.contact_method && item.contact_value && (
              <div className="space-y-2">
                <p className="text-xs text-charcoal/40 uppercase tracking-wide font-medium">Contact Seller</p>
                <ContactReveal
                  contactMethod={item.contact_method}
                  contactValue={item.contact_value}
                  itemTitle={item.title}
                />
              </div>
            )}

            {isExpired && (
              <p className="text-sm text-charcoal/50 bg-gray-50 rounded-lg px-4 py-3">
                This listing has expired.
              </p>
            )}

            <Link
              href="/classifieds"
              className="flex items-center gap-2 text-charcoal/50 text-sm hover:text-primary transition-colors"
            >
              <span className="material-symbols-outlined text-sm">arrow_back</span>
              Back to classifieds
            </Link>
          </div>
        </aside>
      </div>

      {/* Related listings */}
      {related && related.length > 0 && (
        <section className="mt-12">
          <h2 className="text-lg font-bold text-charcoal mb-4">Similar Listings</h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {(related as any[]).map((r) => (
              <Link
                key={r.id}
                href={`/classifieds/${r.slug}`}
                className="group bg-white rounded-xl border border-gray-200 hover:shadow-md transition-all overflow-hidden"
              >
                <div className="h-28 overflow-hidden bg-gray-50">
                  {r.images?.[0] ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={r.images[0]} alt={r.title} className="object-cover w-full h-full group-hover:scale-105 transition-transform" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <span className="material-symbols-outlined text-2xl text-charcoal/20">sell</span>
                    </div>
                  )}
                </div>
                <div className="p-2.5">
                  <p className="text-xs font-medium text-charcoal line-clamp-2">{r.title}</p>
                  {r.price != null && (
                    <p className="text-accent font-bold text-sm mt-1">
                      {r.currency ?? 'SGD'} {Number(r.price).toLocaleString()}
                    </p>
                  )}
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* JSON-LD */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'Product',
            name: item.title,
            description: item.description,
            image: item.images ?? [],
            offers: item.price != null ? {
              '@type': 'Offer',
              price: item.price,
              priceCurrency: item.currency ?? 'SGD',
              availability: isExpired
                ? 'https://schema.org/SoldOut'
                : 'https://schema.org/InStock',
              itemCondition: item.condition === 'new'
                ? 'https://schema.org/NewCondition'
                : 'https://schema.org/UsedCondition',
            } : undefined,
            url: `https://humblehalal.sg/classifieds/${item.slug}`,
          }),
        }}
      />
    </article>
  )
}
