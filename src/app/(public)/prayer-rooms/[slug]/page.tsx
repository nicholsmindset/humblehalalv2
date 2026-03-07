import type { Metadata } from 'next'
import Image from 'next/image'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { ISR_REVALIDATE, SITE_URL } from '@/config'

export const revalidate = ISR_REVALIDATE.STATIC

interface Props {
  params: Promise<{ slug: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const supabase = await createClient()
  const { data } = await (supabase as any)
    .from('prayer_rooms')
    .select('name, location_name, area')
    .eq('slug', slug)
    .single()
  if (!data) return { title: 'Prayer Room | HumbleHalal' }
  const loc = data.location_name ?? data.area ?? 'Singapore'
  return {
    title: `${data.name} — Prayer Room at ${loc} | HumbleHalal`,
    description: `Prayer room at ${loc} in Singapore. Check facilities, opening hours, wudhu availability, and gender separation.`,
  }
}

export default async function PrayerRoomDetailPage({ params }: Props) {
  const { slug } = await params
  const supabase = await createClient()

  const { data: room } = (await (supabase as any)
    .from('prayer_rooms')
    .select('*')
    .eq('slug', slug)
    .single()) as any

  if (!room) notFound()

  const hours: Record<string, string> = room.opening_hours ?? {}
  const DAYS = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday']

  const facilities: { label: string; available: boolean; icon: string }[] = [
    { label: 'Wudhu facilities', available: !!room.wudu_available, icon: 'water_drop' },
    { label: 'Gender separated', available: !!room.gender_separated, icon: 'group' },
  ]

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      {/* Breadcrumb */}
      <nav className="text-sm text-charcoal/50 mb-6">
        <Link href="/" className="hover:text-primary">Home</Link>
        <span className="mx-2">›</span>
        <Link href="/prayer-rooms" className="hover:text-primary">Prayer Rooms</Link>
        {room.area && (
          <>
            <span className="mx-2">›</span>
            <Link
              href={`/prayer-rooms?area=${room.area}`}
              className="hover:text-primary capitalize"
            >
              {room.area.replace(/-/g, ' ')}
            </Link>
          </>
        )}
        <span className="mx-2">›</span>
        <span className="text-charcoal">{room.name}</span>
      </nav>

      {/* Header */}
      <header className="mb-6">
        <div className="flex items-start gap-3 mb-2">
          <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center shrink-0">
            <span className="material-symbols-outlined text-primary text-2xl">room_preferences</span>
          </div>
          <div>
            <h1 className="text-2xl font-extrabold text-charcoal font-sans leading-tight">
              {room.name}
            </h1>
            {room.location_name && (
              <p className="text-charcoal/60 text-sm mt-0.5">{room.location_name}</p>
            )}
          </div>
        </div>

        {/* Quick facility badges */}
        <div className="flex flex-wrap gap-2 mt-3">
          {room.wudu_available && (
            <span className="inline-flex items-center gap-1 text-xs bg-primary/10 text-primary font-medium px-3 py-1 rounded-full">
              <span className="material-symbols-outlined text-xs">water_drop</span>
              Wudhu available
            </span>
          )}
          {room.gender_separated && (
            <span className="inline-flex items-center gap-1 text-xs bg-primary/10 text-primary font-medium px-3 py-1 rounded-full">
              <span className="material-symbols-outlined text-xs">group</span>
              Gender separated
            </span>
          )}
          {room.area && (
            <span className="text-xs bg-gray-100 text-charcoal/60 px-3 py-1 rounded-full capitalize">
              {room.area.replace(/-/g, ' ')}
            </span>
          )}
        </div>
      </header>

      <div className="grid md:grid-cols-3 gap-6">
        {/* Main content */}
        <div className="md:col-span-2 space-y-5">
          {/* Location */}
          <div className="bg-white border border-gray-200 rounded-xl p-5">
            <h2 className="font-bold text-charcoal text-sm mb-3 flex items-center gap-2">
              <span className="material-symbols-outlined text-primary text-base">location_on</span>
              Location
            </h2>
            <div className="space-y-1.5 text-sm">
              {room.address && (
                <p className="text-charcoal/70">{room.address}</p>
              )}
              {room.floor_level && (
                <p className="text-charcoal/50">
                  <span className="font-medium text-charcoal">Floor / Level:</span>{' '}
                  {room.floor_level}
                </p>
              )}
              {room.area && (
                <p className="text-charcoal/50 capitalize">
                  <span className="font-medium text-charcoal">Area:</span>{' '}
                  {room.area.replace(/-/g, ' ')}
                </p>
              )}
            </div>
          </div>

          {/* Facilities */}
          <div className="bg-white border border-gray-200 rounded-xl p-5">
            <h2 className="font-bold text-charcoal text-sm mb-3 flex items-center gap-2">
              <span className="material-symbols-outlined text-primary text-base">check_circle</span>
              Facilities
            </h2>
            <div className="grid grid-cols-2 gap-3">
              {facilities.map((f) => (
                <div key={f.label} className="flex items-center gap-2">
                  <span
                    className={`material-symbols-outlined text-base ${
                      f.available ? 'text-primary' : 'text-gray-300'
                    }`}
                  >
                    {f.available ? 'check_circle' : 'cancel'}
                  </span>
                  <span
                    className={`text-sm ${f.available ? 'text-charcoal' : 'text-charcoal/30'}`}
                  >
                    {f.label}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Opening hours */}
          {Object.keys(hours).length > 0 && (
            <div className="bg-white border border-gray-200 rounded-xl p-5">
              <h2 className="font-bold text-charcoal text-sm mb-3 flex items-center gap-2">
                <span className="material-symbols-outlined text-primary text-base">schedule</span>
                Opening Hours
              </h2>
              <div className="space-y-1.5">
                {DAYS.map((day) => {
                  const val = hours[day]
                  return (
                    <div key={day} className="flex justify-between text-sm">
                      <span className="capitalize text-charcoal/70 font-medium">{day}</span>
                      <span className="text-charcoal/50">
                        {val ?? 'Not listed'}
                      </span>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {/* Images */}
          {Array.isArray(room.images) && room.images.length > 0 && (
            <div className="bg-white border border-gray-200 rounded-xl p-5">
              <h2 className="font-bold text-charcoal text-sm mb-3">Photos</h2>
              <div className="grid grid-cols-2 gap-3">
                {room.images.slice(0, 4).map((img: string, i: number) => (
                  <Image
                    key={i}
                    src={img}
                    alt={`${room.name} photo ${i + 1}`}
                    width={400}
                    height={144}
                    className="rounded-lg w-full h-36 object-cover"
                  />
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          {/* Quick info card */}
          <div className="bg-primary/5 border border-primary/20 rounded-xl p-5">
            <h3 className="font-bold text-charcoal text-sm mb-3">Quick Info</h3>
            <div className="space-y-2 text-sm">
              <div className="flex items-center gap-2 text-charcoal/60">
                <span className="material-symbols-outlined text-primary text-base">room_preferences</span>
                <span>Prayer room / Surau</span>
              </div>
              {room.location_name && (
                <div className="flex items-center gap-2 text-charcoal/60">
                  <span className="material-symbols-outlined text-primary text-base">apartment</span>
                  <span>{room.location_name}</span>
                </div>
              )}
              {room.floor_level && (
                <div className="flex items-center gap-2 text-charcoal/60">
                  <span className="material-symbols-outlined text-primary text-base">elevator</span>
                  <span>{room.floor_level}</span>
                </div>
              )}
            </div>

            {room.address && (
              <a
                href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(room.address)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-4 flex items-center justify-center gap-2 w-full bg-primary text-white rounded-lg py-2.5 text-sm font-bold hover:bg-primary/90 transition-colors"
              >
                <span className="material-symbols-outlined text-base">directions</span>
                Get Directions
              </a>
            )}
          </div>

          {/* Prayer times link */}
          <Link
            href="/prayer-times/singapore"
            className="flex items-center gap-3 bg-white border border-gray-200 rounded-xl p-4 hover:shadow-md transition-shadow"
          >
            <span className="material-symbols-outlined text-2xl text-primary">schedule</span>
            <div>
              <p className="font-medium text-charcoal text-sm">Prayer Times</p>
              <p className="text-charcoal/40 text-xs">Today&apos;s Singapore schedule</p>
            </div>
          </Link>

          {/* Mosques nearby link */}
          <Link
            href={`/mosque${room.area ? `?area=${room.area}` : ''}`}
            className="flex items-center gap-3 bg-white border border-gray-200 rounded-xl p-4 hover:shadow-md transition-shadow"
          >
            <span className="material-symbols-outlined text-2xl text-primary">mosque</span>
            <div>
              <p className="font-medium text-charcoal text-sm">Nearby Mosques</p>
              <p className="text-charcoal/40 text-xs capitalize">
                {room.area ? room.area.replace(/-/g, ' ') : 'Singapore'}
              </p>
            </div>
          </Link>

          {/* Suggest edit */}
          <div className="bg-gray-50 rounded-xl p-4 text-center">
            <p className="text-xs text-charcoal/40 mb-2">Is this information outdated?</p>
            <a
              href={`mailto:hello@humblehalal.sg?subject=Update: ${encodeURIComponent(room.name)}`}
              className="text-xs text-primary font-medium hover:underline"
            >
              Suggest a correction →
            </a>
          </div>
        </div>
      </div>

      {/* JSON-LD */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'LocalBusiness',
            name: room.name,
            description: `Prayer room at ${room.location_name ?? room.area ?? 'Singapore'}`,
            url: `${SITE_URL}/prayer-rooms/${room.slug}`,
            address: room.address
              ? {
                  '@type': 'PostalAddress',
                  streetAddress: room.address,
                  addressCountry: 'SG',
                }
              : undefined,
            amenityFeature: [
              room.wudu_available && { '@type': 'LocationFeatureSpecification', name: 'Wudhu Facilities', value: true },
              room.gender_separated && { '@type': 'LocationFeatureSpecification', name: 'Gender Separated', value: true },
            ].filter(Boolean),
          }),
        }}
      />
    </div>
  )
}
