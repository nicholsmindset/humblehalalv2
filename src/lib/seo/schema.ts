import { SITE_URL, SITE_NAME } from '@/config'

// ── Types ─────────────────────────────────────────────────────────────────────
interface Address {
  streetAddress?: string
  addressLocality?: string
  addressRegion?: string
  postalCode?: string
  addressCountry?: string
}

interface GeoCoord {
  lat: number
  lng: number
}

interface OpeningHours {
  dayOfWeek: string[]
  opens: string
  closes: string
}

export interface ListingSchemaParams {
  name: string
  description?: string
  url: string
  image?: string
  address?: Address
  geo?: GeoCoord
  telephone?: string
  priceRange?: string
  cuisine?: string
  openingHours?: OpeningHours[]
  rating?: { value: number; count: number }
  halalCertified?: boolean
}

export interface EventSchemaParams {
  name: string
  description?: string
  url: string
  image?: string
  startDate: string
  endDate?: string
  location?: { name: string; address?: Address }
  organizer?: string
  offers?: { price: number; currency?: string; availability?: string }
}

export interface BreadcrumbItem {
  name: string
  url: string
}

export interface FAQItem {
  question: string
  answer: string
}

// ── LocalBusiness (generic) ───────────────────────────────────────────────────
export function generateLocalBusinessSchema(params: ListingSchemaParams): object {
  return {
    '@context': 'https://schema.org',
    '@type': 'LocalBusiness',
    name: params.name,
    ...(params.description && { description: params.description }),
    url: params.url,
    ...(params.image && { image: params.image }),
    ...(params.telephone && { telephone: params.telephone }),
    ...(params.priceRange && { priceRange: params.priceRange }),
    ...(params.address && {
      address: {
        '@type': 'PostalAddress',
        ...params.address,
        addressLocality: params.address.addressLocality ?? 'Singapore',
        addressCountry: params.address.addressCountry ?? 'SG',
      },
    }),
    ...(params.geo && {
      geo: {
        '@type': 'GeoCoordinates',
        latitude: params.geo.lat,
        longitude: params.geo.lng,
      },
    }),
    ...(params.openingHours && {
      openingHoursSpecification: params.openingHours.map((h) => ({
        '@type': 'OpeningHoursSpecification',
        dayOfWeek: h.dayOfWeek,
        opens: h.opens,
        closes: h.closes,
      })),
    }),
    ...(params.rating && {
      aggregateRating: {
        '@type': 'AggregateRating',
        ratingValue: params.rating.value,
        reviewCount: params.rating.count,
        bestRating: 5,
        worstRating: 1,
      },
    }),
  }
}

// ── Restaurant ────────────────────────────────────────────────────────────────
export function generateRestaurantSchema(params: ListingSchemaParams): object {
  return {
    ...generateLocalBusinessSchema(params),
    '@type': 'Restaurant',
    ...(params.cuisine && { servesCuisine: params.cuisine }),
    hasMenu: `${params.url}#menu`,
  }
}

// ── Mosque / Place of worship ─────────────────────────────────────────────────
export function generateMosqueSchema(params: ListingSchemaParams): object {
  return {
    ...generateLocalBusinessSchema(params),
    '@type': 'PlaceOfWorship',
  }
}

// ── Event ─────────────────────────────────────────────────────────────────────
export function generateEventSchema(params: EventSchemaParams): object {
  return {
    '@context': 'https://schema.org',
    '@type': 'Event',
    name: params.name,
    ...(params.description && { description: params.description }),
    url: params.url,
    ...(params.image && { image: params.image }),
    startDate: params.startDate,
    ...(params.endDate && { endDate: params.endDate }),
    eventStatus: 'https://schema.org/EventScheduled',
    eventAttendanceMode: 'https://schema.org/OfflineEventAttendanceMode',
    ...(params.location && {
      location: {
        '@type': 'Place',
        name: params.location.name,
        ...(params.location.address && {
          address: {
            '@type': 'PostalAddress',
            ...params.location.address,
            addressLocality: params.location.address.addressLocality ?? 'Singapore',
            addressCountry: 'SG',
          },
        }),
      },
    }),
    ...(params.organizer && {
      organizer: { '@type': 'Organization', name: params.organizer },
    }),
    ...(params.offers && {
      offers: {
        '@type': 'Offer',
        price: params.offers.price,
        priceCurrency: params.offers.currency ?? 'SGD',
        availability: params.offers.availability ?? 'https://schema.org/InStock',
        url: params.url,
      },
    }),
  }
}

// ── Product ───────────────────────────────────────────────────────────────────
export function generateProductSchema(params: {
  name: string
  description?: string
  url: string
  image?: string
  price?: number
  currency?: string
  availability?: string
  brand?: string
  rating?: { value: number; count: number }
}): object {
  return {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: params.name,
    ...(params.description && { description: params.description }),
    url: params.url,
    ...(params.image && { image: params.image }),
    ...(params.brand && { brand: { '@type': 'Brand', name: params.brand } }),
    ...(params.price !== undefined && {
      offers: {
        '@type': 'Offer',
        price: params.price,
        priceCurrency: params.currency ?? 'SGD',
        availability: params.availability ?? 'https://schema.org/InStock',
      },
    }),
    ...(params.rating && {
      aggregateRating: {
        '@type': 'AggregateRating',
        ratingValue: params.rating.value,
        reviewCount: params.rating.count,
        bestRating: 5,
      },
    }),
  }
}

// ── BreadcrumbList ────────────────────────────────────────────────────────────
export function generateBreadcrumbSchema(items: BreadcrumbItem[]): object {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, idx) => ({
      '@type': 'ListItem',
      position: idx + 1,
      name: item.name,
      item: item.url.startsWith('http') ? item.url : `${SITE_URL}${item.url}`,
    })),
  }
}

// ── FAQPage ───────────────────────────────────────────────────────────────────
export function generateFAQSchema(faqs: FAQItem[]): object {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqs.map((faq) => ({
      '@type': 'Question',
      name: faq.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: faq.answer,
      },
    })),
  }
}

// ── WebSite (for homepage) ────────────────────────────────────────────────────
export function generateWebSiteSchema(): object {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: SITE_NAME,
    url: SITE_URL,
    description: "Singapore's trusted halal directory. Find MUIS-certified restaurants, Muslim businesses, mosques, events, classifieds and more.",
    potentialAction: {
      '@type': 'SearchAction',
      target: {
        '@type': 'EntryPoint',
        urlTemplate: `${SITE_URL}/search?q={search_term_string}`,
      },
      'query-input': 'required name=search_term_string',
    },
  }
}

// ── Serialise to <script> tag string ─────────────────────────────────────────
export function schemaToScriptTag(schema: object | object[]): string {
  const schemas = Array.isArray(schema) ? schema : [schema]
  return schemas
    .map((s) => `<script type="application/ld+json">${JSON.stringify(s)}</script>`)
    .join('\n')
}
