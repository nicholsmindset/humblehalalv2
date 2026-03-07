import { generateFast } from './generate'
import { SYSTEM_PROMPTS } from './prompts'

export interface EnrichmentResult {
  description: string
  highlights: string[]
  tags: string[]
}

export async function enrichListing(
  listingData: Record<string, unknown>
): Promise<EnrichmentResult> {
  const prompt = `Listing data:\n${JSON.stringify(listingData, null, 2)}`

  const result = await generateFast(
    'listing-enrichment',
    prompt,
    SYSTEM_PROMPTS.LISTING_ENRICHMENT
  )

  try {
    return JSON.parse(result.text) as EnrichmentResult
  } catch {
    return {
      description: '',
      highlights: [],
      tags: [],
    }
  }
}
