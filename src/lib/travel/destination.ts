// Shared destination → country code resolver used by search API and checkout flow

// Country-level names → ISO code (destination IS the country, skip cityName)
export const COUNTRY_NAMES: Record<string, string> = {
  singapore: 'SG', malaysia: 'MY', indonesia: 'ID', japan: 'JP',
  thailand: 'TH', turkey: 'TR', morocco: 'MA', france: 'FR',
  'united kingdom': 'GB', 'united arab emirates': 'AE', 'saudi arabia': 'SA',
  egypt: 'EG', jordan: 'JO', qatar: 'QA', bahrain: 'BH', oman: 'OM',
  'south korea': 'KR', india: 'IN', australia: 'AU', maldives: 'MV',
  pakistan: 'PK', 'sri lanka': 'LK', spain: 'ES', italy: 'IT',
  germany: 'DE', netherlands: 'NL', portugal: 'PT', greece: 'GR',
}

// City → country code mapping (destination is a city, pass as cityName)
export const CITY_TO_COUNTRY: Record<string, string> = {
  tokyo: 'JP', osaka: 'JP', kyoto: 'JP', fukuoka: 'JP',
  'kuala lumpur': 'MY', penang: 'MY', langkawi: 'MY', 'johor bahru': 'MY',
  jakarta: 'ID', bali: 'ID', yogyakarta: 'ID', bandung: 'ID',
  bangkok: 'TH', phuket: 'TH', 'chiang mai': 'TH', pattaya: 'TH',
  dubai: 'AE', 'abu dhabi': 'AE', sharjah: 'AE',
  istanbul: 'TR', antalya: 'TR', cappadocia: 'TR',
  london: 'GB', manchester: 'GB', edinburgh: 'GB',
  paris: 'FR', nice: 'FR', lyon: 'FR',
  marrakech: 'MA', casablanca: 'MA', fez: 'MA',
  cairo: 'EG', luxor: 'EG', sharm: 'EG',
  jeddah: 'SA', riyadh: 'SA', makkah: 'SA', medina: 'SA', mecca: 'SA',
  doha: 'QA', amman: 'JO', muscat: 'OM', manama: 'BH',
  mumbai: 'IN', delhi: 'IN', seoul: 'KR', busan: 'KR',
  sydney: 'AU', melbourne: 'AU', male: 'MV',
  rome: 'IT', milan: 'IT', barcelona: 'ES', madrid: 'ES',
  amsterdam: 'NL', berlin: 'DE', lisbon: 'PT', athens: 'GR',
  colombo: 'LK', lahore: 'PK', karachi: 'PK',
}

export function resolveDestination(destination: string): {
  countryCode: string
  isCountryLevel: boolean
  cityName: string | null
} {
  const lower = destination.toLowerCase().trim()

  // Check if it's a country name
  if (COUNTRY_NAMES[lower]) {
    return { countryCode: COUNTRY_NAMES[lower], isCountryLevel: true, cityName: null }
  }

  // Check if it's a known city — use properly capitalised name for LiteAPI
  if (CITY_TO_COUNTRY[lower]) {
    // Capitalise first letter of each word for LiteAPI compatibility
    const properCityName = lower.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')
    return { countryCode: CITY_TO_COUNTRY[lower], isCountryLevel: false, cityName: properCityName }
  }

  // Partial match on country names (e.g. "uae" → AE)
  for (const [name, code] of Object.entries(COUNTRY_NAMES)) {
    if (lower.includes(name) || name.includes(lower)) {
      return { countryCode: code, isCountryLevel: true, cityName: null }
    }
  }

  // Partial match on city names
  for (const [city, code] of Object.entries(CITY_TO_COUNTRY)) {
    if (lower.includes(city) || city.includes(lower)) {
      const properCityName = city.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')
      return { countryCode: code, isCountryLevel: false, cityName: properCityName }
    }
  }

  // Fallback: treat as city name in Singapore
  return { countryCode: 'SG', isCountryLevel: false, cityName: destination }
}
