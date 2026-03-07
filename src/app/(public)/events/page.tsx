import type { Metadata } from 'next'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { ISR_REVALIDATE } from '@/config'
import { BreadcrumbSchema } from '@/components/seo/BreadcrumbSchema'

export const revalidate = ISR_REVALIDATE.HIGH_TRAFFIC

interface Props {
  searchParams: Promise<{ type?: string; area?: string; page?: string }>
}

export async function generateMetadata({ searchParams }: Props): Promise<Metadata> {
  const { type, area } = await searchParams
  const parts = ['Halal Events']
  if (type) parts.push(type.charAt(0).toUpperCase() + type.slice(1))
  parts.push('Singapore')
  if (area) parts.push(`in ${area.replace(/-/g, ' ')}`)
  return {
    title: `${parts.join(' ')} | HumbleHalal`,
    description: `Discover ${type ?? 'halal'} events${area ? ` in ${area.replace(/-/g, ' ')}` : ' across Singapore'}. Muslim community events, bazaars, talks, and more.`,
  }
}

const PAGE_SIZE = 24

const EVENT_TYPE_LABELS: Record<string, string> = {
  bazaar: 'Bazaar',
  talk: 'Talk & Lecture',
  class: 'Class & Workshop',
  networking: 'Networking',
  fundraiser: 'Fundraiser',
  sports: 'Sports',
  community: 'Community',
  food: 'Food & Dining',
  arts: 'Arts & Culture',
  children: 'Children & Family',
}

export default async function EventsPage({ searchParams }: Props) {
  const { type, area, page: pageStr } = await searchParams
  const page = Math.max(1, parseInt(pageStr ?? '1', 10))
  const offset = (page - 1) * PAGE_SIZE

  const supabase = await createClient()

  let query = supabase
    .from('events')
    .select('id, slug, title, area, venue, starts_at, ends_at, price_type, images, organiser', { count: 'exact' })
    .eq('status', 'active')
    .gte('ends_at', new Date().toISOString())
    .order('starts_at', { ascending: true })
    .range(offset, offset + PAGE_SIZE - 1)

  if (area) query = query.eq('area', area)
  if (type) query = query.eq('category', type)

  const { data: events, count } = (await query) as any
  const totalPages = Math.ceil((count ?? 0) / PAGE_SIZE)

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <header className="mb-8">
        <h1 className="text-3xl font-extrabold text-charcoal font-sans mb-2">
          Halal Events in Singapore
        </h1>
        <p className="text-charcoal/50 text-sm">{count ?? 0} upcoming events</p>
      </header>

      {/* Type filter tabs */}
      <div className="flex flex-wrap gap-2 mb-8 border-b border-gray-100 pb-4">
        <Link
          href={`/events${area ? `?area=${area}` : ''}`}
          className={`text-sm font-medium px-3 py-1 rounded-full ${!type ? 'text-primary font-bold' : 'text-charcoal/60 hover:text-primary'}`}
        >
          All
        </Link>
        {Object.entries(EVENT_TYPE_LABELS).map(([val, label]) => (
          <Link
            key={val}
            href={`/events?type=${val}${area ? `&area=${area}` : ''}`}
            className={`text-sm font-medium px-3 py-1 rounded-full transition-colors ${type === val ? 'text-primary font-bold' : 'text-charcoal/60 hover:text-primary'}`}
          >
            {label}
          </Link>
        ))}
      </div>

      {/* Grid */}
      {!events || events.length === 0 ? (
        <div className="text-center py-20">
          <span className="material-symbols-outlined text-5xl text-charcoal/20 block mb-4">event_busy</span>
          <p className="text-charcoal/50 font-medium">No upcoming events found.</p>
          <Link href="/events" className="text-primary text-sm hover:underline mt-3 block">Clear filters</Link>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 mb-10">
            {events.map((evt: any) => {
              const start = new Date(evt.starts_at)
              const dateStr = start.toLocaleDateString('en-SG', { weekday: 'short', month: 'short', day: 'numeric' })
              const timeStr = start.toLocaleTimeString('en-SG', { hour: '2-digit', minute: '2-digit' })

              return (
                <Link
                  key={evt.id}
                  href={`/events/${evt.slug}`}
                  className="group bg-white rounded-xl border border-gray-200 hover:shadow-lg hover:-translate-y-1 transition-all overflow-hidden flex flex-col"
                >
                  {/* Image or date block */}
                  <div className="relative h-40 overflow-hidden">
                    {evt.images?.[0] ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={evt.images[0]} alt={evt.title} className="object-cover w-full h-full group-hover:scale-105 transition-transform duration-300" />
                    ) : (
                      <div className="w-full h-full bg-amber-50 flex flex-col items-center justify-center">
                        <span className="text-accent text-3xl font-extrabold">{start.getDate()}</span>
                        <span className="text-accent/70 text-sm uppercase tracking-wide">
                          {start.toLocaleDateString('en-SG', { month: 'short' })}
                        </span>
                      </div>
                    )}
                    {evt.price_type === 'free' && (
                      <span className="absolute top-2 right-2 bg-primary text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
                        FREE
                      </span>
                    )}
                  </div>

                  <div className="p-4 flex flex-col gap-2 flex-1">
                    <h2 className="font-bold text-charcoal text-sm leading-snug line-clamp-2">{evt.title}</h2>
                    <div className="flex items-center gap-1 text-xs text-charcoal/50">
                      <span className="material-symbols-outlined text-sm">schedule</span>
                      <span>{dateStr} · {timeStr}</span>
                    </div>
                    {evt.venue && (
                      <div className="flex items-center gap-1 text-xs text-charcoal/50">
                        <span className="material-symbols-outlined text-sm">location_on</span>
                        <span className="line-clamp-1">{evt.venue}</span>
                      </div>
                    )}
                    {evt.organiser && (
                      <p className="text-charcoal/40 text-xs mt-auto">by {evt.organiser}</p>
                    )}
                  </div>
                </Link>
              )
            })}
          </div>

          {totalPages > 1 && (
            <nav className="flex justify-center gap-2" aria-label="Pagination">
              {page > 1 && (
                <Link href={`/events?page=${page - 1}${type ? `&type=${type}` : ''}`} className="px-4 py-2 rounded-lg border border-gray-200 text-sm hover:border-primary transition-colors">
                  ← Prev
                </Link>
              )}
              <span className="px-4 py-2 text-sm text-charcoal/60">Page {page} of {totalPages}</span>
              {page < totalPages && (
                <Link href={`/events?page=${page + 1}${type ? `&type=${type}` : ''}`} className="px-4 py-2 rounded-lg border border-gray-200 text-sm hover:border-primary transition-colors">
                  Next →
                </Link>
              )}
            </nav>
          )}
        </>
      )}

      <BreadcrumbSchema items={[
        { name: 'Home', href: '/' },
        { name: 'Events' },
      ]} />

      {/* JSON-LD */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'ItemList',
            name: 'Halal Events in Singapore',
            numberOfItems: events?.length ?? 0,
            itemListElement: (events ?? []).map((evt: any, i: number) => ({
              '@type': 'ListItem',
              position: i + 1,
              name: evt.title,
              url: `https://humblehalal.sg/events/${evt.slug}`,
            })),
          }),
        }}
      />
    </div>
  )
}
