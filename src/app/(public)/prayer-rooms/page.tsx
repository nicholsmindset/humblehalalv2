import type { Metadata } from 'next'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { ISR_REVALIDATE, SingaporeArea } from '@/config'
import { NearbyFinder } from '@/components/mosques/NearbyFinder'

export const revalidate = ISR_REVALIDATE.LONG_TAIL

interface Props {
  searchParams: Promise<{ area?: string; page?: string; venue?: string }>
}

export async function generateMetadata({ searchParams }: Props): Promise<Metadata> {
  const { area, venue } = await searchParams
  if (venue) {
    const venueName = venue.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())
    return {
      title: `Prayer Rooms at ${venueName} — Singapore | HumbleHalal`,
      description: `Find Muslim prayer rooms, wudhu facilities, and Muslim-friendly amenities at ${venueName}, Singapore.`,
    }
  }
  const loc = area ? `${area.replace(/-/g, ' ')} Singapore` : 'Singapore'
  return {
    title: `Prayer Rooms in ${loc.charAt(0).toUpperCase() + loc.slice(1)} | HumbleHalal`,
    description: `Find Muslim prayer rooms and surau in ${loc}. Locations with wudhu facilities, gender-separated spaces, and opening hours.`,
  }
}

const PAGE_SIZE = 24

export default async function PrayerRoomsPage({ searchParams }: Props) {
  const { area, page: pageStr, venue } = await searchParams
  const page = Math.max(1, parseInt(pageStr ?? '1', 10))
  const offset = (page - 1) * PAGE_SIZE
  const supabase = await createClient()

  let query = (supabase as any)
    .from('prayer_rooms')
    .select('id, slug, name, location_name, area, floor_level, gender_separated, wudu_available', { count: 'exact' })
    .order('name', { ascending: true })
    .range(offset, offset + PAGE_SIZE - 1)

  if (area) query = query.eq('area', area)
  if (venue) query = query.ilike('location_name', `%${venue.replace(/-/g, ' ')}%`)

  const { data: rows, count } = (await query) as any
  const rooms = (rows ?? []) as any[]
  const totalPages = Math.ceil((count ?? 0) / PAGE_SIZE)

  // Derive venue display name for heading
  const venueDisplayName = venue
    ? venue.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())
    : null

  function buildHref(params: Record<string, string | undefined>) {
    const p = new URLSearchParams()
    Object.entries({ area, venue, ...params }).forEach(([k, v]) => { if (v) p.set(k, v) })
    const qs = p.toString()
    return `/prayer-rooms${qs ? `?${qs}` : ''}`
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <header className="mb-8">
        <nav className="text-sm text-charcoal/50 mb-3">
          <Link href="/" className="hover:text-primary">Home</Link>
          <span className="mx-2">›</span>
          {venue ? (
            <>
              <Link href="/malls" className="hover:text-primary">Muslim-Friendly Malls</Link>
              <span className="mx-2">›</span>
              <span className="text-charcoal capitalize">{venueDisplayName}</span>
            </>
          ) : (
            <span className="text-charcoal">Prayer Rooms</span>
          )}
        </nav>
        {venueDisplayName ? (
          <>
            <h1 className="text-3xl font-extrabold text-charcoal font-sans mb-1">
              Prayer Rooms at {venueDisplayName}
            </h1>
            {rooms[0]?.area && (
              <p className="text-charcoal/50 text-sm capitalize">
                {rooms[0].area.replace(/-/g, ' ')}, Singapore
              </p>
            )}
          </>
        ) : (
          <>
            <h1 className="text-3xl font-extrabold text-charcoal font-sans mb-2">
              Prayer Rooms in {area ? <span className="capitalize">{area.replace(/-/g, ' ')}</span> : 'Singapore'}
            </h1>
            <p className="text-charcoal/50 text-sm">
              {(count ?? 0).toLocaleString()} prayer room{(count ?? 0) !== 1 ? 's' : ''} listed
            </p>
          </>
        )}
      </header>

      {/* NearbyFinder — only shown on the main listing (not venue-specific) */}
      {!venue && <NearbyFinder />}

      {/* Area filter — hidden in venue mode */}
      {!venue && (
        <div className="flex flex-wrap gap-2 mb-8">
          <Link
            href="/prayer-rooms"
            className={`text-xs font-medium px-3 py-1 rounded-full border transition-colors ${
              !area ? 'border-primary text-primary bg-primary/5' : 'border-gray-200 text-charcoal/60 hover:border-primary/50'
            }`}
          >
            All areas
          </Link>
          {Object.values(SingaporeArea).slice(0, 16).map((a) => (
            <Link
              key={a}
              href={buildHref({ area: a, page: undefined })}
              className={`text-xs font-medium px-3 py-1 rounded-full border transition-colors capitalize ${
                area === a ? 'border-primary text-primary bg-primary/5' : 'border-gray-200 text-charcoal/60 hover:border-primary/50'
              }`}
            >
              {a.replace(/-/g, ' ')}
            </Link>
          ))}
        </div>
      )}

      {/* Link to prayer times */}
      <div className="bg-primary/5 border border-primary/20 rounded-xl p-4 flex items-center gap-3 mb-8">
        <span className="material-symbols-outlined text-primary text-2xl">schedule</span>
        <div className="flex-1">
          <p className="text-charcoal font-medium text-sm">Looking for prayer times?</p>
          <p className="text-charcoal/50 text-xs">View today&apos;s prayer times for Singapore based on MUIS.</p>
        </div>
        <Link href="/prayer-times/singapore" className="text-primary text-sm font-bold hover:underline shrink-0">
          View times →
        </Link>
      </div>

      {/* Grid */}
      {rooms.length === 0 ? (
        <div className="text-center py-20">
          <span className="material-symbols-outlined text-5xl text-charcoal/20 block mb-4">mosque</span>
          <p className="text-charcoal/50 font-medium">No prayer rooms listed yet.</p>
          {area && (
            <Link href="/prayer-rooms" className="text-primary text-sm hover:underline mt-2 block">Show all areas</Link>
          )}
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 mb-10">
            {rooms.map((room: any) => (
              <Link
                key={room.id}
                href={`/prayer-rooms/${room.slug}`}
                className="group bg-white rounded-xl border border-gray-200 hover:shadow-lg hover:-translate-y-1 transition-all p-5"
              >
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                    <span className="material-symbols-outlined text-primary text-xl">mosque</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <h2 className="font-bold text-charcoal text-sm leading-snug group-hover:text-primary transition-colors">
                      {room.name}
                    </h2>
                    {room.location_name && (
                      <p className="text-charcoal/50 text-xs mt-0.5 truncate">{room.location_name}</p>
                    )}
                    {room.floor_level && (
                      <p className="text-charcoal/40 text-xs">{room.floor_level}</p>
                    )}
                  </div>
                </div>

                <div className="flex flex-wrap gap-2 mt-3">
                  {room.area && (
                    <span className="text-[10px] font-medium text-charcoal/50 bg-gray-100 px-2 py-0.5 rounded-full capitalize">
                      {room.area.replace(/-/g, ' ')}
                    </span>
                  )}
                  {room.wudu_available && (
                    <span className="text-[10px] font-bold text-primary bg-primary/10 px-2 py-0.5 rounded-full flex items-center gap-1">
                      <span className="material-symbols-outlined text-[10px]">water_drop</span>
                      Wudhu
                    </span>
                  )}
                  {room.gender_separated && (
                    <span className="text-[10px] font-bold text-primary bg-primary/10 px-2 py-0.5 rounded-full">
                      M/F separated
                    </span>
                  )}
                </div>
              </Link>
            ))}
          </div>

          {totalPages > 1 && (
            <nav className="flex justify-center gap-2" aria-label="Pagination">
              {page > 1 && (
                <Link href={buildHref({ page: String(page - 1) })} className="px-4 py-2 rounded-lg border border-gray-200 text-sm hover:border-primary transition-colors">
                  ← Prev
                </Link>
              )}
              <span className="px-4 py-2 text-sm text-charcoal/60">Page {page} of {totalPages}</span>
              {page < totalPages && (
                <Link href={buildHref({ page: String(page + 1) })} className="px-4 py-2 rounded-lg border border-gray-200 text-sm hover:border-primary transition-colors">
                  Next →
                </Link>
              )}
            </nav>
          )}
        </>
      )}

      {/* JSON-LD */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'ItemList',
            name: `Prayer Rooms in ${area ? area.replace(/-/g, ' ') : 'Singapore'}`,
            numberOfItems: rooms.length,
            itemListElement: rooms.map((r: any, i: number) => ({
              '@type': 'ListItem',
              position: i + 1,
              name: r.name,
              url: `https://humblehalal.sg/prayer-rooms/${r.slug}`,
            })),
          }),
        }}
      />
    </div>
  )
}
