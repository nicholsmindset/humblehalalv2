import type { Metadata } from 'next'
import Link from 'next/link'

// Revalidate every hour — prayer times change daily
export const revalidate = 3600

export const metadata: Metadata = {
  title: 'Prayer Times Singapore Today | HumbleHalal',
  description: 'Today\'s Islamic prayer times in Singapore (Fajr, Dhuhr, Asr, Maghrib, Isha) based on MUIS calculation. Accurate Singapore Muslim prayer schedule.',
}

interface AladhanTiming {
  Fajr: string
  Sunrise: string
  Dhuhr: string
  Asr: string
  Maghrib: string
  Isha: string
  Imsak: string
  Midnight: string
}

interface AladhanResponse {
  data: {
    timings: AladhanTiming
    date: { readable: string; timestamp: string }
    meta: { method: { name: string } }
  }
}

const PRAYER_INFO: { key: keyof AladhanTiming; label: string; arabic: string; desc: string; icon: string }[] = [
  { key: 'Fajr',    label: 'Fajr',    arabic: 'الفجر',   desc: 'Dawn prayer', icon: 'dark_mode' },
  { key: 'Sunrise', label: 'Sunrise', arabic: 'الشروق',  desc: 'Sun rises',   icon: 'wb_sunny' },
  { key: 'Dhuhr',   label: 'Dhuhr',   arabic: 'الظهر',   desc: 'Midday prayer', icon: 'light_mode' },
  { key: 'Asr',     label: 'Asr',     arabic: 'العصر',   desc: 'Afternoon prayer', icon: 'wb_cloudy' },
  { key: 'Maghrib', label: 'Maghrib', arabic: 'المغرب',  desc: 'Sunset prayer', icon: 'bedtime' },
  { key: 'Isha',    label: 'Isha',    arabic: 'العشاء',  desc: 'Night prayer', icon: 'nightlight' },
]

async function fetchPrayerTimes(): Promise<AladhanResponse['data'] | null> {
  try {
    const today = new Date()
    const dd = String(today.getDate()).padStart(2, '0')
    const mm = String(today.getMonth() + 1).padStart(2, '0')
    const yyyy = today.getFullYear()

    const res = await fetch(
      `https://api.aladhan.com/v1/timingsByCity/${dd}-${mm}-${yyyy}?city=Singapore&country=SG&method=11`,
      { next: { revalidate: 3600 } }
    )
    if (!res.ok) return null
    const json: AladhanResponse = await res.json()
    return json.data
  } catch {
    return null
  }
}

export default async function PrayerTimesSingaporePage() {
  const data = await fetchPrayerTimes()
  const today = new Date()
  const dateStr = today.toLocaleDateString('en-SG', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
  })

  // Determine next prayer
  const nowMins = today.getHours() * 60 + today.getMinutes()
  let nextPrayer: string | null = null
  if (data) {
    for (const p of ['Fajr', 'Dhuhr', 'Asr', 'Maghrib', 'Isha'] as (keyof AladhanTiming)[]) {
      const [h, m] = data.timings[p].split(':').map(Number)
      if (h * 60 + m > nowMins) { nextPrayer = p; break }
    }
  }

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      {/* Breadcrumb */}
      <nav className="text-sm text-charcoal/50 mb-6">
        <Link href="/" className="hover:text-primary">Home</Link>
        <span className="mx-2">›</span>
        <span className="text-charcoal">Prayer Times Singapore</span>
      </nav>

      {/* Header */}
      <header className="mb-8">
        <h1 className="text-3xl font-extrabold text-charcoal font-sans mb-2">
          Prayer Times Singapore
        </h1>
        <p className="text-charcoal/50">{dateStr}</p>
        {data && (
          <p className="text-charcoal/30 text-xs mt-1">
            Calculation: {data.meta.method.name}
          </p>
        )}
      </header>

      {/* Prayer times card */}
      {data ? (
        <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm mb-8">
          {PRAYER_INFO.map((p, i) => {
            const time = data.timings[p.key]
            const isNext = p.key === nextPrayer
            const isSunrise = p.key === 'Sunrise'

            return (
              <div
                key={p.key}
                className={`flex items-center px-6 py-4 ${i < PRAYER_INFO.length - 1 ? 'border-b border-gray-100' : ''} ${
                  isNext ? 'bg-primary/5' : ''
                }`}
              >
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 mr-4 ${
                  isSunrise ? 'bg-amber-50' : isNext ? 'bg-primary/15' : 'bg-gray-50'
                }`}>
                  <span className={`material-symbols-outlined text-xl ${
                    isSunrise ? 'text-amber-500' : isNext ? 'text-primary' : 'text-charcoal/30'
                  }`}>
                    {p.icon}
                  </span>
                </div>

                <div className="flex-1">
                  <div className="flex items-baseline gap-2">
                    <span className={`font-bold text-base ${isNext ? 'text-primary' : 'text-charcoal'}`}>
                      {p.label}
                    </span>
                    <span className="text-charcoal/40 text-sm font-arabic">{p.arabic}</span>
                    {isNext && (
                      <span className="text-[10px] font-bold text-primary bg-primary/10 px-2 py-0.5 rounded-full ml-1">
                        Next
                      </span>
                    )}
                  </div>
                  <p className="text-charcoal/40 text-xs">{p.desc}</p>
                </div>

                <span className={`text-xl font-extrabold tabular-nums ${
                  isSunrise ? 'text-amber-500' : isNext ? 'text-primary' : 'text-charcoal'
                }`}>
                  {time}
                </span>
              </div>
            )
          })}
        </div>
      ) : (
        <div className="bg-gray-50 rounded-2xl p-8 text-center mb-8">
          <span className="material-symbols-outlined text-4xl text-charcoal/30 block mb-3">cloud_off</span>
          <p className="text-charcoal/60 font-medium">Prayer times unavailable</p>
          <p className="text-charcoal/40 text-sm mt-1">
            Please visit{' '}
            <a href="https://www.muis.gov.sg" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
              MUIS.gov.sg
            </a>{' '}
            for official prayer times.
          </p>
        </div>
      )}

      {/* Imsak note */}
      {data && (
        <p className="text-charcoal/40 text-sm text-center mb-8">
          Imsak (end of sahur): <strong className="text-charcoal/60">{data.timings.Imsak}</strong>
        </p>
      )}

      {/* Info box */}
      <div className="bg-primary/5 border border-primary/20 rounded-xl p-5 space-y-2 mb-8">
        <h2 className="font-bold text-charcoal text-sm">About Singapore Prayer Times</h2>
        <p className="text-charcoal/60 text-sm leading-relaxed">
          Prayer times in Singapore are determined by the Majlis Ugama Islam Singapura (MUIS).
          Times are based on astronomical calculations for Singapore&apos;s coordinates
          (1.3521° N, 103.8198° E). Slight variations may occur — always refer to the official
          MUIS calendar for confirmation.
        </p>
        <a
          href="https://www.muis.gov.sg/Prayer-Timetable"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1 text-primary text-sm font-medium hover:underline mt-2"
        >
          Official MUIS prayer timetable
          <span className="material-symbols-outlined text-sm">open_in_new</span>
        </a>
      </div>

      {/* Related links */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Link
          href="/mosque"
          className="flex items-center gap-3 bg-white border border-gray-200 rounded-xl p-4 hover:shadow-md transition-shadow"
        >
          <span className="material-symbols-outlined text-2xl text-primary">mosque</span>
          <div>
            <p className="font-medium text-charcoal text-sm">Find a Mosque</p>
            <p className="text-charcoal/40 text-xs">Mosques near you in Singapore</p>
          </div>
        </Link>
        <Link
          href="/prayer-rooms"
          className="flex items-center gap-3 bg-white border border-gray-200 rounded-xl p-4 hover:shadow-md transition-shadow"
        >
          <span className="material-symbols-outlined text-2xl text-primary">room_preferences</span>
          <div>
            <p className="font-medium text-charcoal text-sm">Prayer Rooms</p>
            <p className="text-charcoal/40 text-xs">Surau in malls and offices</p>
          </div>
        </Link>
      </div>

      {/* JSON-LD */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'WebPage',
            name: 'Prayer Times Singapore Today',
            description: metadata.description,
            url: 'https://humblehalal.sg/prayer-times/singapore',
            about: {
              '@type': 'Event',
              name: 'Daily Islamic Prayer Times Singapore',
              location: {
                '@type': 'Place',
                name: 'Singapore',
                address: { '@type': 'PostalAddress', addressCountry: 'SG' },
              },
            },
          }),
        }}
      />
    </div>
  )
}
