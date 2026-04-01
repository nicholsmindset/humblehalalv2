import { describe, it, expect } from 'vitest'
import {
  generateLocalBusinessSchema,
  generateRestaurantSchema,
  generateEventSchema,
  generateBreadcrumbSchema,
  generateFAQSchema,
  generateProductSchema,
  generateWebSiteSchema,
  schemaToScriptTag,
} from '@/lib/seo/schema'

const baseParams = {
  name: 'Warung Halal SG',
  url: 'https://humblehalal.sg/restaurant/warung-halal-sg',
  description: 'Authentic halal Malay cuisine',
}

describe('generateLocalBusinessSchema', () => {
  it('always includes @context and @type', () => {
    const schema = generateLocalBusinessSchema(baseParams) as any
    expect(schema['@context']).toBe('https://schema.org')
    expect(schema['@type']).toBe('LocalBusiness')
  })

  it('includes name and url', () => {
    const schema = generateLocalBusinessSchema(baseParams) as any
    expect(schema.name).toBe(baseParams.name)
    expect(schema.url).toBe(baseParams.url)
  })

  it('includes description when provided', () => {
    const schema = generateLocalBusinessSchema(baseParams) as any
    expect(schema.description).toBe(baseParams.description)
  })

  it('omits optional fields when not provided', () => {
    const schema = generateLocalBusinessSchema({ name: 'Test', url: 'https://test.com' }) as any
    expect(schema.description).toBeUndefined()
    expect(schema.telephone).toBeUndefined()
    expect(schema.address).toBeUndefined()
  })

  it('includes PostalAddress with SG defaults', () => {
    const schema = generateLocalBusinessSchema({
      ...baseParams,
      address: { streetAddress: '1 Arab Street' },
    }) as any
    expect(schema.address['@type']).toBe('PostalAddress')
    expect(schema.address.addressCountry).toBe('SG')
    expect(schema.address.addressLocality).toBe('Singapore')
    expect(schema.address.streetAddress).toBe('1 Arab Street')
  })

  it('includes GeoCoordinates when geo provided', () => {
    const schema = generateLocalBusinessSchema({
      ...baseParams,
      geo: { lat: 1.3521, lng: 103.8198 },
    }) as any
    expect(schema.geo['@type']).toBe('GeoCoordinates')
    expect(schema.geo.latitude).toBe(1.3521)
    expect(schema.geo.longitude).toBe(103.8198)
  })

  it('includes aggregateRating when rating provided', () => {
    const schema = generateLocalBusinessSchema({
      ...baseParams,
      rating: { value: 4.5, count: 120 },
    }) as any
    expect(schema.aggregateRating['@type']).toBe('AggregateRating')
    expect(schema.aggregateRating.ratingValue).toBe(4.5)
    expect(schema.aggregateRating.reviewCount).toBe(120)
    expect(schema.aggregateRating.bestRating).toBe(5)
  })
})

describe('generateRestaurantSchema', () => {
  it('has @type Restaurant', () => {
    const schema = generateRestaurantSchema(baseParams) as any
    expect(schema['@type']).toBe('Restaurant')
  })

  it('includes servesCuisine when cuisine provided', () => {
    const schema = generateRestaurantSchema({ ...baseParams, cuisine: 'Malay' }) as any
    expect(schema.servesCuisine).toBe('Malay')
  })

  it('always includes hasMenu link', () => {
    const schema = generateRestaurantSchema(baseParams) as any
    expect(schema.hasMenu).toContain('#menu')
  })
})

describe('generateEventSchema', () => {
  const eventParams = {
    name: 'Ramadan Bazaar 2025',
    url: 'https://humblehalal.sg/events/ramadan-bazaar-2025',
    startDate: '2025-03-01T18:00:00+08:00',
  }

  it('has @type Event and required fields', () => {
    const schema = generateEventSchema(eventParams) as any
    expect(schema['@context']).toBe('https://schema.org')
    expect(schema['@type']).toBe('Event')
    expect(schema.name).toBe(eventParams.name)
    expect(schema.startDate).toBe(eventParams.startDate)
  })

  it('includes eventStatus and attendanceMode', () => {
    const schema = generateEventSchema(eventParams) as any
    expect(schema.eventStatus).toBe('https://schema.org/EventScheduled')
    expect(schema.eventAttendanceMode).toBe('https://schema.org/OfflineEventAttendanceMode')
  })

  it('includes offers with SGD currency default', () => {
    const schema = generateEventSchema({
      ...eventParams,
      offers: { price: 10 },
    }) as any
    expect(schema.offers['@type']).toBe('Offer')
    expect(schema.offers.price).toBe(10)
    expect(schema.offers.priceCurrency).toBe('SGD')
  })

  it('includes location with PostalAddress', () => {
    const schema = generateEventSchema({
      ...eventParams,
      location: { name: 'Bazaar SG', address: { streetAddress: '20 Geylang Rd' } },
    }) as any
    expect(schema.location['@type']).toBe('Place')
    expect(schema.location.name).toBe('Bazaar SG')
    expect(schema.location.address.addressCountry).toBe('SG')
  })
})

describe('generateBreadcrumbSchema', () => {
  it('generates correct BreadcrumbList structure', () => {
    const schema = generateBreadcrumbSchema([
      { name: 'Home', url: 'https://humblehalal.sg' },
      { name: 'Halal Food', url: '/halal-food' },
      { name: 'Malay', url: '/halal-food/malay' },
    ]) as any

    expect(schema['@type']).toBe('BreadcrumbList')
    expect(schema.itemListElement).toHaveLength(3)
    expect(schema.itemListElement[0].position).toBe(1)
    expect(schema.itemListElement[1].position).toBe(2)
    expect(schema.itemListElement[2].position).toBe(3)
  })

  it('preserves absolute URLs unchanged', () => {
    const schema = generateBreadcrumbSchema([
      { name: 'Home', url: 'https://humblehalal.sg' },
    ]) as any
    expect(schema.itemListElement[0].item).toBe('https://humblehalal.sg')
  })

  it('prepends SITE_URL to relative paths', () => {
    const schema = generateBreadcrumbSchema([
      { name: 'Halal Food', url: '/halal-food' },
    ]) as any
    expect(schema.itemListElement[0].item).toMatch(/^https?:\/\//)
    expect(schema.itemListElement[0].item).toContain('/halal-food')
  })
})

describe('generateFAQSchema', () => {
  it('generates correct FAQPage structure', () => {
    const schema = generateFAQSchema([
      { question: 'What is MUIS certification?', answer: 'MUIS is the Islamic authority in Singapore.' },
      { question: 'How do I find halal restaurants?', answer: 'Use our search.' },
    ]) as any

    expect(schema['@type']).toBe('FAQPage')
    expect(schema.mainEntity).toHaveLength(2)
    expect(schema.mainEntity[0]['@type']).toBe('Question')
    expect(schema.mainEntity[0].acceptedAnswer['@type']).toBe('Answer')
    expect(schema.mainEntity[0].name).toBe('What is MUIS certification?')
    expect(schema.mainEntity[0].acceptedAnswer.text).toBe('MUIS is the Islamic authority in Singapore.')
  })

  it('handles empty FAQ array', () => {
    const schema = generateFAQSchema([]) as any
    expect(schema.mainEntity).toHaveLength(0)
  })
})

describe('generateProductSchema', () => {
  it('has @type Product', () => {
    const schema = generateProductSchema({ name: 'Halal Collagen', url: 'https://humblehalal.sg/products/halal-collagen' }) as any
    expect(schema['@type']).toBe('Product')
  })

  it('includes offer with SGD default when price provided', () => {
    const schema = generateProductSchema({
      name: 'Test',
      url: 'https://test.com',
      price: 29.90,
    }) as any
    expect(schema.offers.price).toBe(29.90)
    expect(schema.offers.priceCurrency).toBe('SGD')
  })

  it('omits offers when no price provided', () => {
    const schema = generateProductSchema({ name: 'Test', url: 'https://test.com' }) as any
    expect(schema.offers).toBeUndefined()
  })
})

describe('generateWebSiteSchema', () => {
  it('includes SearchAction with correct urlTemplate', () => {
    const schema = generateWebSiteSchema() as any
    expect(schema['@type']).toBe('WebSite')
    expect(schema.potentialAction['@type']).toBe('SearchAction')
    expect(schema.potentialAction.target.urlTemplate).toContain('/search?q=')
  })
})

describe('schemaToScriptTag', () => {
  it('wraps single schema in application/ld+json script tag', () => {
    const tag = schemaToScriptTag({ '@type': 'WebSite' })
    expect(tag).toContain('<script type="application/ld+json">')
    expect(tag).toContain('"@type":"WebSite"')
    expect(tag).toContain('</script>')
  })

  it('wraps array of schemas in separate script tags', () => {
    const tag = schemaToScriptTag([{ '@type': 'WebSite' }, { '@type': 'Event' }])
    const matches = tag.match(/<script type="application\/ld\+json">/g)
    expect(matches).toHaveLength(2)
  })

  it('produces valid JSON inside the tag', () => {
    const tag = schemaToScriptTag({ '@type': 'WebSite', name: 'HumbleHalal' })
    const jsonStr = tag.replace('<script type="application/ld+json">', '').replace('</script>', '').trim()
    expect(() => JSON.parse(jsonStr)).not.toThrow()
  })
})
