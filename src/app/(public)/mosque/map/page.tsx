import type { Metadata } from 'next'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { ISR_REVALIDATE, SingaporeArea } from '@/config'

export const revalidate = ISR_REVALIDATE.LONG_TAIL

export const metadata: Metadata = {
  title: 'Mosque Map — All Mosques in Singapore | HumbleHalal',
  description: 'Interactive map of all 70+ mosques in Singapore. Find MUIS mosques near any area, view facilities, and get directions.',
}

export default async function MosqueMapPage() {
  const supabase = await createClient()
  const { data: mosques } = (await (supabase as any)
    .from('mosques')
    .select('id, name, slug, area, address, lat, lng')
    .order('name', { ascending: true })) as any

  const count = mosques?.length ?? 0

  // Build a static Google Maps embed with multiple markers
  // We'll link to Google Maps search for mosques in Singapore
  const staticMapUrl = `https://www.google.com/maps/embed/v1/search?key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}&q=mosque+Singapore&zoom=11`

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-extrabold text-charcoal font-sans mb-1">
            Mosque Map — Singapore
          </h1>
          <p className="text-charcoal/50 text-sm">{count} mosques across Singapore</p>
        </div>
        <Link
          href="/mosque"
          className="flex items-center gap-2 text-primary text-sm font-medium border border-primary/30 rounded-lg px-3 py-2 hover:bg-primary/5 transition-colors"
        >
          <span className="material-symbols-outlined text-base">list</span>
          List View
        </Link>
      </div>

      {/* Map */}
      <div className="rounded-2xl overflow-hidden border border-gray-200 shadow-sm mb-8 h-[500px] sm:h-[600px]">
        <iframe
          src={staticMapUrl}
          width="100%"
          height="100%"
          style={{ border: 0 }}
          allowFullScreen
          loading="lazy"
          referrerPolicy="no-referrer-when-downgrade"
          title="Singapore mosque map"
        />
      </div>

      {/* Mosque list by area */}
      <section>
        <h2 className="text-xl font-bold text-charcoal mb-5">Browse Mosques by Area</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
          {Object.values(SingaporeArea).map((area) => {
            const areaLabel = area.replace(/-/g, ' ')
            const areaCount = (mosques ?? []).filter((m: any) => m.area === area).length
            if (areaCount === 0) return null
            return (
              <Link
                key={area}
                href={`/mosque?area=${area}`}
                className="flex items-center justify-between bg-white rounded-xl border border-gray-200 px-4 py-3 hover:border-primary hover:shadow-sm transition-all"
              >
                <div>
                  <p className="font-medium text-charcoal text-sm capitalize">{areaLabel}</p>
                  <p className="text-charcoal/40 text-xs">{areaCount} mosque{areaCount !== 1 ? 's' : ''}</p>
                </div>
                <span className="material-symbols-outlined text-charcoal/30 text-base">chevron_right</span>
              </Link>
            )
          })}
        </div>
      </section>

      {/* Individual mosque links for SEO */}
      {mosques && mosques.length > 0 && (
        <section className="mt-10 pt-8 border-t border-gray-100">
          <h2 className="text-lg font-bold text-charcoal mb-4">All Mosques in Singapore</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
            {mosques.map((m: any) => (
              <Link
                key={m.id}
                href={`/mosque/${m.slug}`}
                className="flex items-center gap-3 text-sm hover:text-primary text-charcoal/70 transition-colors"
              >
                <span className="material-symbols-outlined text-primary text-base shrink-0">mosque</span>
                <span className="line-clamp-1">{m.name}</span>
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
            '@type': 'ItemList',
            name: 'Mosques in Singapore',
            numberOfItems: count,
            itemListElement: (mosques ?? []).slice(0, 20).map((m: any, i: number) => ({
              '@type': 'ListItem',
              position: i + 1,
              name: m.name,
              url: `https://humblehalal.sg/mosque/${m.slug}`,
            })),
          }),
        }}
      />
    </div>
  )
}
