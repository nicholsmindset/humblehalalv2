/**
 * Shared prayer times utility — fetches today's Singapore prayer times
 * from the Aladhan API. Used by prayer-times/singapore page and mosque
 * detail sidebar.
 */

export interface PrayerTimes {
  Fajr: string
  Sunrise: string
  Dhuhr: string
  Asr: string
  Maghrib: string
  Isha: string
  Imsak: string
  date: string
  method: string
}

export async function getSingaporePrayerTimes(): Promise<PrayerTimes | null> {
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

    const json = await res.json()
    const timings = json?.data?.timings
    if (!timings) return null

    return {
      Fajr:    timings.Fajr,
      Sunrise: timings.Sunrise,
      Dhuhr:   timings.Dhuhr,
      Asr:     timings.Asr,
      Maghrib: timings.Maghrib,
      Isha:    timings.Isha,
      Imsak:   timings.Imsak,
      date:    json.data.date?.readable ?? '',
      method:  json.data.meta?.method?.name ?? '',
    }
  } catch {
    return null
  }
}

/**
 * Determines the next prayer name given current time.
 */
export function getNextPrayer(times: PrayerTimes): string | null {
  const now = new Date()
  const nowMins = now.getHours() * 60 + now.getMinutes()
  const prayers = ['Fajr', 'Dhuhr', 'Asr', 'Maghrib', 'Isha'] as const
  for (const p of prayers) {
    const [h, m] = times[p].split(':').map(Number)
    if (h * 60 + m > nowMins) return p
  }
  return null
}
