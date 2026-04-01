import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import { ISR_REVALIDATE } from '@/config'

export const revalidate = ISR_REVALIDATE.LONG_TAIL

interface Props {
  params: Promise<{ slug: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const supabase = await createClient()
  const { data: mosque } = (await supabase
    .from('mosques')
    .select('name, area, address')
    .eq('slug', slug)
    .single()) as any

  if (!mosque) return { title: 'Mosque Not Found' }

  return {
    title: `${mosque.name} — Mosque in ${mosque.area}, Singapore | HumbleHalal`,
    description: `${mosque.name} is a mosque in ${mosque.area?.replace(/-/g, ' ')}, Singapore. Find prayer times, facilities, and directions.`,
  }
}

export default async function MosqueDetailPage({ params }: Props) {
  const { slug } = await params
  const supabase = await createClient()

  const { data: mosque } = (await supabase
    .from('mosques')
    .select('*')
    .eq('slug', slug)
    .single()) as any

  if (!mosque) notFound()

  const mapsQuery = encodeURIComponent(`${mosque.name} ${mosque.address} Singapore`)

  return (
    <article className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      {/* Breadcrumb */}
      <nav className="text-sm text-charcoal/50 mb-6" aria-label="Breadcrumb">
        <a href="/mosque" className="hover:text-primary">Mosques</a>
        <span className="mx-2">›</span>
        <a href={`/mosque?area=${mosque.area}`} className="hover:text-primary capitalize">
          {mosque.area?.replace(/-/g, ' ')}
        </a>
        <span className="mx-2">›</span>
        <span className="text-charcoal">{mosque.name}</span>
      </nav>

      {/* Photos */}
      {mosque.photos && mosque.photos.length > 0 && (
        <div className="grid grid-cols-3 gap-2 rounded-xl overflow-hidden mb-8 h-56">
          {mosque.photos.slice(0, 3).map((url: string, i: number) => (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              key={i}
              src={url}
              alt={`${mosque.name} photo ${i + 1}`}
              className={`object-cover w-full h-full ${i === 0 ? 'col-span-2' : ''}`}
            />
          ))}
        </div>
      )}

      <header className="mb-8">
        <h1 className="text-3xl font-extrabold text-charcoal font-sans mb-3">{mosque.name}</h1>
        <div className="flex flex-wrap gap-4 text-sm text-charcoal/60">
          <span className="flex items-center gap-1">
            <span className="material-symbols-outlined text-base">location_on</span>
            <span className="capitalize">{mosque.area?.replace(/-/g, ' ')}, Singapore</span>
          </span>
          {mosque.wheelchair_accessible && (
            <span className="flex items-center gap-1">
              <span className="material-symbols-outlined text-base">accessible</span>
              Wheelchair accessible
            </span>
          )}
          {mosque.prayer_room_available && (
            <span className="flex items-center gap-1">
              <span className="material-symbols-outlined text-base">wc</span>
              Prayer room available
            </span>
          )}
        </div>
      </header>

      <div className="grid md:grid-cols-3 gap-8">
        <div className="md:col-span-2 space-y-8">
          {/* Address */}
          <section>
            <h2 className="text-lg font-bold text-charcoal mb-3">Address</h2>
            <p className="text-charcoal/70">{mosque.address}</p>
            {mosque.postal_code && (
              <p className="text-charcoal/50 text-sm">Singapore {mosque.postal_code}</p>
            )}
          </section>

          {/* Facilities */}
          {mosque.facilities && mosque.facilities.length > 0 && (
            <section>
              <h2 className="text-lg font-bold text-charcoal mb-3">Facilities</h2>
              <div className="flex flex-wrap gap-2">
                {(mosque.facilities as string[]).map((f) => (
                  <span
                    key={f}
                    className="bg-emerald-50 text-primary text-sm px-3 py-1 rounded-full capitalize"
                  >
                    {f.replace(/_/g, ' ')}
                  </span>
                ))}
              </div>
            </section>
          )}

          {/* Friday Khutbah */}
          {mosque.friday_khutbah_time && (
            <section>
              <h2 className="text-lg font-bold text-charcoal mb-3">Friday Prayer</h2>
              <p className="text-charcoal/70">
                <span className="material-symbols-outlined text-base align-middle mr-1 text-primary">schedule</span>
                Khutbah at {mosque.friday_khutbah_time}
              </p>
            </section>
          )}

          {/* Location map */}
          {(mosque.address || mosque.name) && (
            <section>
              <h2 className="text-lg font-bold text-charcoal mb-3">Location</h2>
              <div className="h-64 rounded-xl overflow-hidden border border-gray-200">
                <iframe
                  src={`https://www.google.com/maps/embed/v1/place?key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}&q=${encodeURIComponent(mosque.address ?? `${mosque.name} mosque Singapore`)}`}
                  width="100%"
                  height="100%"
                  style={{ border: 0 }}
                  allowFullScreen
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                />
              </div>
              <a
                href={`https://www.google.com/maps/search/?api=1&query=${mapsQuery}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary text-sm hover:underline mt-2 inline-block"
              >
                Open in Google Maps →
              </a>
            </section>
          )}

          {/* Phone */}
          {mosque.phone && (
            <section>
              <h2 className="text-lg font-bold text-charcoal mb-3">Contact</h2>
              <a href={`tel:${mosque.phone}`} className="text-primary hover:underline flex items-center gap-2">
                <span className="material-symbols-outlined text-base">call</span>
                {mosque.phone}
              </a>
            </section>
          )}
        </div>

        {/* Sidebar */}
        <aside className="space-y-4">
          <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-3">
            <div className="flex gap-2 text-sm text-charcoal/70">
              <span className="material-symbols-outlined text-charcoal/40 shrink-0">location_on</span>
              <span>{mosque.address}, Singapore</span>
            </div>
            <a
              href={`https://www.google.com/maps/search/?api=1&query=${mapsQuery}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 w-full border border-primary text-primary rounded-lg px-4 py-2.5 text-sm font-bold hover:bg-primary/5 transition-colors"
            >
              <span className="material-symbols-outlined text-base">directions</span>
              Get Directions
            </a>
            <a
              href="/prayer-times/singapore"
              className="flex items-center justify-center gap-2 w-full border border-gray-200 text-charcoal rounded-lg px-4 py-2.5 text-sm font-medium hover:border-primary transition-colors"
            >
              <span className="material-symbols-outlined text-base">schedule</span>
              Prayer Times
            </a>
          </div>
        </aside>
      </div>

      {/* JSON-LD */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'MosqueOrTemple',
            name: mosque.name,
            address: {
              '@type': 'PostalAddress',
              streetAddress: mosque.address,
              addressLocality: mosque.area,
              postalCode: mosque.postal_code,
              addressCountry: 'SG',
            },
            telephone: mosque.phone,
            url: `https://humblehalal.sg/mosque/${mosque.slug}`,
          }),
        }}
      />
    </article>
  )
}
