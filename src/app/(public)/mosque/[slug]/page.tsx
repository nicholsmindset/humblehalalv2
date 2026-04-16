import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import { ISR_REVALIDATE, SITE_URL } from '@/config'
import { getSingaporePrayerTimes, getNextPrayer } from '@/lib/prayer-times'
import { QiblaCompass } from '@/components/mosques/QiblaCompass'
import { NearbyFinder } from '@/components/mosques/NearbyFinder'

export const revalidate = ISR_REVALIDATE.LONG_TAIL

interface Props {
  params: Promise<{ slug: string }>
}

const FACILITY_LABELS: Record<string, { label: string; icon: string }> = {
  parking:              { label: 'Parking',            icon: 'local_parking' },
  wudu:                 { label: 'Wudhu Facilities',   icon: 'water_drop' },
  wheelchair:           { label: 'Wheelchair Access',  icon: 'accessible' },
  library:              { label: 'Islamic Library',    icon: 'menu_book' },
  madrasah:             { label: 'Madrasah',           icon: 'school' },
  kindergarten:         { label: 'Kindergarten',       icon: 'child_care' },
  childcare:            { label: 'Childcare',          icon: 'family_restroom' },
  prayer_room:          { label: 'Prayer Room',        icon: 'mosque' },
  separate_womens_area: { label: "Women's Prayer Area", icon: 'group' },
  ablution_area:        { label: 'Ablution Area',      icon: 'water_drop' },
}

const PRAYER_DISPLAY = [
  { key: 'Fajr',    label: 'Fajr',    icon: 'dark_mode' },
  { key: 'Dhuhr',   label: 'Dhuhr',   icon: 'light_mode' },
  { key: 'Asr',     label: 'Asr',     icon: 'wb_cloudy' },
  { key: 'Maghrib', label: 'Maghrib', icon: 'bedtime' },
  { key: 'Isha',    label: 'Isha',    icon: 'nightlight' },
] as const

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
    title: `${mosque.name} — Mosque in ${mosque.area?.replace(/-/g, ' ')}, Singapore | HumbleHalal`,
    description: `${mosque.name} is a mosque in ${mosque.area?.replace(/-/g, ' ')}, Singapore. Find prayer times, facilities, Jumu\'ah schedule, and directions.`,
  }
}

export default async function MosqueDetailPage({ params }: Props) {
  const { slug } = await params
  const supabase = await createClient()

  const [mosqueResult, prayerTimes] = await Promise.all([
    (supabase as any)
      .from('mosques')
      .select('*')
      .eq('slug', slug)
      .single(),
    getSingaporePrayerTimes(),
  ])

  const mosque = mosqueResult.data
  if (!mosque) notFound()

  const nextPrayer = prayerTimes ? getNextPrayer(prayerTimes) : null
  const mapsQuery = encodeURIComponent(`${mosque.name} ${mosque.address} Singapore`)

  const jummahTimes: { prayer: string; time: string }[] = mosque.jummah_times ?? []

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
          {mosque.capacity && (
            <span className="flex items-center gap-1">
              <span className="material-symbols-outlined text-base">groups</span>
              {mosque.capacity.toLocaleString()} capacity
            </span>
          )}
        </div>
      </header>

      <div className="grid md:grid-cols-3 gap-8">
        {/* ── Main content ── */}
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
                {(mosque.facilities as string[]).map((f) => {
                  const meta = FACILITY_LABELS[f]
                  return meta ? (
                    <span
                      key={f}
                      className="inline-flex items-center gap-1.5 bg-emerald-50 text-primary text-sm px-3 py-1.5 rounded-full"
                    >
                      <span className="material-symbols-outlined text-sm">{meta.icon}</span>
                      {meta.label}
                    </span>
                  ) : (
                    <span
                      key={f}
                      className="bg-gray-100 text-charcoal/60 text-sm px-3 py-1.5 rounded-full capitalize"
                    >
                      {f.replace(/_/g, ' ')}
                    </span>
                  )
                })}
              </div>
            </section>
          )}

          {/* Jumu'ah / Friday prayer */}
          {jummahTimes.length > 0 && (
            <section className="bg-primary/5 border border-primary/20 rounded-xl p-5">
              <h2 className="text-base font-bold text-charcoal mb-3 flex items-center gap-2">
                <span className="material-symbols-outlined text-primary">mosque</span>
                Friday Jumu&apos;ah
              </h2>
              <div className="space-y-2">
                {jummahTimes.map((j, i) => (
                  <div key={i} className="flex justify-between text-sm">
                    <span className="text-charcoal/70 font-medium">{j.prayer}</span>
                    <span className="text-primary font-bold">{j.time}</span>
                  </div>
                ))}
              </div>
              {mosque.friday_khutbah_time && (
                <p className="text-charcoal/50 text-xs mt-2">
                  <span className="material-symbols-outlined text-xs align-middle mr-1">schedule</span>
                  Khutbah at {mosque.friday_khutbah_time}
                </p>
              )}
            </section>
          )}

          {/* Programmes */}
          {mosque.programmes && Array.isArray(mosque.programmes) && mosque.programmes.length > 0 && (
            <section>
              <h2 className="text-lg font-bold text-charcoal mb-3">Programmes & Classes</h2>
              <div className="space-y-2">
                {(mosque.programmes as { name: string; schedule?: string; description?: string }[]).map((prog, i) => (
                  <div key={i} className="bg-white border border-gray-200 rounded-xl p-4">
                    <p className="font-bold text-charcoal text-sm">{prog.name}</p>
                    {prog.schedule && <p className="text-charcoal/50 text-xs mt-0.5">{prog.schedule}</p>}
                    {prog.description && <p className="text-charcoal/60 text-sm mt-1">{prog.description}</p>}
                  </div>
                ))}
              </div>
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

          {/* Contact */}
          {mosque.phone && (
            <section>
              <h2 className="text-lg font-bold text-charcoal mb-3">Contact</h2>
              <a href={`tel:${mosque.phone}`} className="text-primary hover:underline flex items-center gap-2">
                <span className="material-symbols-outlined text-base">call</span>
                {mosque.phone}
              </a>
              {mosque.website && (
                <a
                  href={mosque.website}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary hover:underline flex items-center gap-2 mt-2"
                >
                  <span className="material-symbols-outlined text-base">language</span>
                  Official website
                </a>
              )}
            </section>
          )}
        </div>

        {/* ── Sidebar ── */}
        <aside className="space-y-4">
          {/* Directions + prayer times links */}
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
          </div>

          {/* Today's prayer times */}
          {prayerTimes && (
            <div className="bg-white rounded-xl border border-gray-200 p-5">
              <h3 className="font-bold text-charcoal text-sm mb-3 flex items-center gap-1">
                <span className="material-symbols-outlined text-primary text-base">schedule</span>
                Today&apos;s Prayer Times
              </h3>
              <div className="space-y-2">
                {PRAYER_DISPLAY.map(({ key, label, icon }) => {
                  const time = prayerTimes[key]
                  const isNext = key === nextPrayer
                  return (
                    <div
                      key={key}
                      className={`flex justify-between items-center text-sm rounded px-2 py-1 ${
                        isNext ? 'bg-primary/10 font-semibold' : ''
                      }`}
                    >
                      <div className="flex items-center gap-1.5">
                        <span className={`material-symbols-outlined text-sm ${isNext ? 'text-primary' : 'text-charcoal/30'}`}>
                          {icon}
                        </span>
                        <span className={isNext ? 'text-primary' : 'text-charcoal/70'}>{label}</span>
                        {isNext && (
                          <span className="text-[9px] font-bold text-primary bg-primary/10 px-1.5 py-0.5 rounded-full">NEXT</span>
                        )}
                      </div>
                      <span className={`tabular-nums font-bold ${isNext ? 'text-primary' : 'text-charcoal'}`}>
                        {time}
                      </span>
                    </div>
                  )
                })}
              </div>
              {jummahTimes.length > 0 && (
                <div className="border-t border-gray-100 mt-3 pt-3">
                  <p className="text-xs text-charcoal/50 mb-1">Jumu&apos;ah</p>
                  {jummahTimes.slice(0, 2).map((j, i) => (
                    <div key={i} className="flex justify-between text-sm">
                      <span className="text-charcoal/60 text-xs">{j.prayer}</span>
                      <span className="text-primary font-bold text-xs">{j.time}</span>
                    </div>
                  ))}
                </div>
              )}
              <a
                href="/prayer-times/singapore"
                className="flex items-center gap-1 text-primary text-xs font-medium hover:underline mt-3"
              >
                Full prayer timetable →
              </a>
            </div>
          )}

          {/* Qibla compass */}
          <QiblaCompass />
        </aside>
      </div>

      {/* Nearby finder */}
      <div className="mt-12 pt-8 border-t border-gray-100">
        <h2 className="text-lg font-bold text-charcoal mb-4">Find Mosques & Prayer Rooms Near You</h2>
        <NearbyFinder />
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
            url: mosque.website ?? `${SITE_URL}/mosque/${mosque.slug}`,
          }),
        }}
      />
    </article>
  )
}
