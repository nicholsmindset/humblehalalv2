import type { Metadata } from 'next'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { ISR_REVALIDATE, SingaporeArea } from '@/config'

export const revalidate = ISR_REVALIDATE.LONG_TAIL

export const metadata: Metadata = {
  title: 'Muslim-Friendly Malls in Singapore — Prayer Rooms & Halal Food | HumbleHalal',
  description: 'Find Muslim-friendly shopping malls in Singapore with prayer rooms (surau), wudhu facilities, and halal food. Covers 20+ major malls across Singapore.',
}

interface MallGroup {
  location_name: string
  area: string
  room_count: number
  has_wudu: boolean
  has_gender_separated: boolean
  floor_levels: string[]
}

export default async function MallsPage({
  searchParams,
}: {
  searchParams: Promise<{ area?: string }>
}) {
  const { area } = await searchParams
  const supabase = await createClient()
  const db = supabase as any

  // Fetch prayer rooms grouped by location_name for malls
  let query = db
    .from('prayer_rooms')
    .select('location_name, area, wudu_available, gender_separated, floor_level, slug')
    .eq('venue_type', 'mall')
    .order('location_name', { ascending: true })

  if (area) query = query.eq('area', area)

  const { data: rooms } = await query

  // Group by location_name
  const mallMap = new Map<string, MallGroup>()
  for (const room of rooms ?? []) {
    const key = room.location_name
    if (!mallMap.has(key)) {
      mallMap.set(key, {
        location_name: room.location_name,
        area: room.area,
        room_count: 0,
        has_wudu: false,
        has_gender_separated: false,
        floor_levels: [],
      })
    }
    const mall = mallMap.get(key)!
    mall.room_count++
    if (room.wudu_available) mall.has_wudu = true
    if (room.gender_separated) mall.has_gender_separated = true
    if (room.floor_level && !mall.floor_levels.includes(room.floor_level)) {
      mall.floor_levels.push(room.floor_level)
    }
  }

  const malls = Array.from(mallMap.values())

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      {/* Hero */}
      <header className="mb-10">
        <div className="inline-flex items-center gap-1.5 bg-primary/10 text-primary text-xs font-bold px-3 py-1.5 rounded-full mb-3">
          <span className="material-symbols-outlined text-sm">shopping_bag</span>
          Muslim-Friendly Shopping
        </div>
        <h1 className="text-3xl font-extrabold text-charcoal font-sans mb-2">
          Muslim-Friendly Malls in Singapore
        </h1>
        <p className="text-charcoal/50 max-w-xl">
          Shopping malls across Singapore with prayer rooms (surau), wudhu facilities, and halal dining options.
        </p>
      </header>

      {/* Area filter */}
      <div className="flex flex-wrap gap-2 mb-8">
        <Link
          href="/malls"
          className={`rounded-full px-3 py-1.5 text-xs font-medium border transition-colors ${
            !area ? 'bg-primary text-white border-primary' : 'bg-white text-charcoal border-gray-200 hover:border-primary'
          }`}
        >
          All Areas
        </Link>
        {Object.values(SingaporeArea).filter((a) =>
          (rooms ?? []).some((r: any) => r.area === a)
        ).map((a) => (
          <Link
            key={a}
            href={`/malls?area=${a}`}
            className={`rounded-full px-3 py-1.5 text-xs font-medium border transition-colors capitalize ${
              area === a
                ? 'bg-primary text-white border-primary'
                : 'bg-white text-charcoal border-gray-200 hover:border-primary'
            }`}
          >
            {a.replace(/-/g, ' ')}
          </Link>
        ))}
      </div>

      {/* Mall grid */}
      {malls.length === 0 ? (
        <div className="text-center py-20">
          <span className="material-symbols-outlined text-5xl text-charcoal/20 block mb-4">shopping_bag</span>
          <p className="text-charcoal/50 font-medium">No malls found for this area.</p>
          <Link href="/malls" className="text-primary text-sm hover:underline mt-3 block">View all malls</Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 mb-12">
          {malls.map((mall) => (
            <Link
              key={mall.location_name}
              href={`/prayer-rooms?venue=${encodeURIComponent(mall.location_name.toLowerCase().replace(/\s+/g, '-'))}`}
              className="group bg-white rounded-xl border border-gray-200 hover:shadow-lg hover:-translate-y-1 transition-all p-5"
            >
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center shrink-0">
                  <span className="material-symbols-outlined text-primary text-2xl">shopping_bag</span>
                </div>
                <div className="flex-1 min-w-0">
                  <h2 className="font-bold text-charcoal text-sm leading-snug group-hover:text-primary transition-colors line-clamp-2">
                    {mall.location_name}
                  </h2>
                  <div className="flex items-center gap-1 mt-1">
                    <span className="material-symbols-outlined text-charcoal/40 text-xs">location_on</span>
                    <span className="text-charcoal/50 text-xs capitalize">{mall.area?.replace(/-/g, ' ')}</span>
                  </div>
                </div>
              </div>

              <div className="flex flex-wrap gap-2 mt-4">
                {mall.has_wudu && (
                  <span className="inline-flex items-center gap-1 text-[10px] bg-primary/10 text-primary font-medium px-2 py-0.5 rounded-full">
                    <span className="material-symbols-outlined text-[10px]">water_drop</span>
                    Wudhu
                  </span>
                )}
                {mall.has_gender_separated && (
                  <span className="inline-flex items-center gap-1 text-[10px] bg-primary/10 text-primary font-medium px-2 py-0.5 rounded-full">
                    <span className="material-symbols-outlined text-[10px]">group</span>
                    Gender separated
                  </span>
                )}
                {mall.floor_levels.length > 0 && (
                  <span className="text-[10px] bg-gray-100 text-charcoal/50 px-2 py-0.5 rounded-full">
                    {mall.floor_levels.join(', ')}
                  </span>
                )}
              </div>

              <p className="text-charcoal/40 text-xs mt-3">
                View prayer room details →
              </p>
            </Link>
          ))}
        </div>
      )}

      {/* pSEO cross-links */}
      <section className="border-t border-gray-100 pt-8">
        <h2 className="text-lg font-bold text-charcoal mb-4">Prayer Rooms by Area</h2>
        <div className="flex flex-wrap gap-2">
          {Object.values(SingaporeArea).map((a) => (
            <Link
              key={a}
              href={`/prayer-rooms?area=${a}`}
              className="text-sm text-primary hover:underline capitalize"
            >
              Prayer rooms in {a.replace(/-/g, ' ')}
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
            name: 'Muslim-Friendly Malls in Singapore',
            numberOfItems: malls.length,
            itemListElement: malls.map((m, i) => ({
              '@type': 'ListItem',
              position: i + 1,
              name: m.location_name,
            })),
          }),
        }}
      />
    </div>
  )
}
