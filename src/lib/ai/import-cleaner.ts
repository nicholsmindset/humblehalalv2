import Anthropic from '@anthropic-ai/sdk'
import { postalCodeToArea } from '@/lib/maps/postal-to-area'
import { SingaporeArea, CuisineType, HalalStatus } from '@/config'
import type { RawRow, CleanedListing } from '@/types/import'

const AREA_VALUES = Object.values(SingaporeArea)
const CUISINE_VALUES = Object.values(CuisineType)
const HALAL_VALUES = Object.values(HalalStatus)
const FOOD_TYPES = ['restaurant', 'hawker', 'cafe', 'bakery', 'buffet', 'fine_dining', 'cloud_kitchen']

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-+|-+$/g, '')
}

export function normalizePhone(phone: string | null | undefined): string | null {
  if (!phone) return null
  const digits = phone.replace(/\D/g, '')
  if (!digits) return null
  // Singapore number: 8 digits, optionally prefixed with 65
  if (digits.length === 8) return `+65${digits}`
  if (digits.length === 10 && digits.startsWith('65')) return `+${digits}`
  if (digits.length === 11 && digits.startsWith('65')) return `+${digits}`
  // Return with + prefix if it looks international
  if (digits.length >= 10) return `+${digits}`
  return phone.trim()
}

export function parseOperatingHours(
  raw: string | null | undefined
): Record<string, { open: string; close: string }> | null {
  if (!raw) return null

  const result: Record<string, { open: string; close: string }> = {}
  const days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday']

  // Try to parse Outscraper format: "Monday: 10:00 AM - 10:00 PM, Tuesday: ..."
  // or JSON-like format
  try {
    const parsed = JSON.parse(raw)
    if (typeof parsed === 'object' && parsed !== null) return parsed
  } catch {
    // Not JSON, try string parsing
  }

  for (const day of days) {
    const regex = new RegExp(
      `${day}[:\\s]+([\\d]{1,2}(?::[\\d]{2})?\\s*(?:AM|PM|am|pm)?)\\s*[-–]\\s*([\\d]{1,2}(?::[\\d]{2})?\\s*(?:AM|PM|am|pm)?)`,
      'i'
    )
    const match = raw.match(regex)
    if (match) {
      result[day] = {
        open: convertTo24h(match[1].trim()),
        close: convertTo24h(match[2].trim()),
      }
    }
  }

  return Object.keys(result).length > 0 ? result : null
}

function convertTo24h(time: string): string {
  const match = time.match(/^(\d{1,2})(?::(\d{2}))?\s*(AM|PM|am|pm)?$/i)
  if (!match) return time

  let hours = parseInt(match[1])
  const minutes = match[2] || '00'
  const period = match[3]?.toUpperCase()

  if (period === 'PM' && hours < 12) hours += 12
  if (period === 'AM' && hours === 12) hours = 0

  return `${hours.toString().padStart(2, '0')}:${minutes}`
}

interface MappedRow {
  name: string
  address: string | null
  postal_code: string | null
  latitude: string | null
  longitude: string | null
  phone: string | null
  website: string | null
  email: string | null
  categories: string | null
  operating_hours: string | null
  photos: string | null
  description: string | null
  price_range: string | null
}

function applyMapping(raw: RawRow, mapping: Record<string, string>): MappedRow {
  const result: Record<string, string | null> = {
    name: null,
    address: null,
    postal_code: null,
    latitude: null,
    longitude: null,
    phone: null,
    website: null,
    email: null,
    categories: null,
    operating_hours: null,
    photos: null,
    description: null,
    price_range: null,
  }

  for (const [sourceCol, targetField] of Object.entries(mapping)) {
    if (targetField && result[targetField] === null && raw[sourceCol]) {
      result[targetField] = raw[sourceCol]
    }
  }

  return result as unknown as MappedRow
}

/**
 * Clean a batch of raw rows using Claude Sonnet for AI-assisted normalization.
 * Handles area detection, cuisine mapping, halal status, food type, and descriptions.
 */
export async function cleanBatch(
  rows: RawRow[],
  mapping: Record<string, string>,
  vertical: string,
  batchIndex: number
): Promise<CleanedListing[]> {
  const mapped = rows.map((raw, i) => ({
    index: batchIndex * 25 + i,
    ...applyMapping(raw, mapping),
  }))

  // Pre-process: deterministic fields
  const preProcessed = mapped.map((row) => {
    const area = postalCodeToArea(row.postal_code)
    const lat = row.latitude ? parseFloat(row.latitude) : null
    const lng = row.longitude ? parseFloat(row.longitude) : null
    const phone = normalizePhone(row.phone)
    const hours = parseOperatingHours(row.operating_hours)
    const slug = row.name ? slugify(`${row.name}-${area || 'singapore'}`) : ''

    // Parse photos (comma-separated or JSON array)
    let photos: string[] | null = null
    if (row.photos) {
      try {
        const parsed = JSON.parse(row.photos)
        photos = Array.isArray(parsed) ? parsed : [row.photos]
      } catch {
        photos = row.photos.split(',').map((p) => p.trim()).filter(Boolean)
      }
    }

    // Parse price range
    let priceRange: number | null = null
    if (row.price_range) {
      const dollars = row.price_range.replace(/[^$]/g, '').length
      if (dollars >= 1 && dollars <= 4) priceRange = dollars
      else {
        const num = parseInt(row.price_range)
        if (num >= 1 && num <= 4) priceRange = num
      }
    }

    return {
      index: row.index,
      name: row.name || '',
      slug,
      address: row.address,
      postal_code: row.postal_code,
      area,
      latitude: lat && !isNaN(lat) ? lat : null,
      longitude: lng && !isNaN(lng) ? lng : null,
      phone,
      website: row.website,
      email: row.email,
      categories: row.categories,
      operating_hours: hours,
      photos,
      description: row.description,
      price_range: priceRange,
    }
  })

  // Rows needing AI assistance (missing area, cuisine mapping, descriptions)
  const needsAI = preProcessed.some(
    (r) => !r.area || r.categories || (!r.description && r.name) || vertical === 'food'
  )

  let aiResults: Record<number, {
    area?: string
    cuisine_types?: string[]
    halal_status?: string
    food_type?: string
    description?: string
  }> = {}

  if (needsAI) {
    try {
      aiResults = await callClaudeForCleaning(preProcessed, vertical)
    } catch (error) {
      console.error('AI cleaning failed, falling back to defaults:', error)
    }
  }

  // Merge AI results with pre-processed data
  return preProcessed.map((row) => {
    const ai = aiResults[row.index] || {}
    const errors: string[] = []
    const warnings: string[] = []

    if (!row.name) errors.push('Missing name')

    const area = row.area || ai.area || null
    if (!area) errors.push('Could not determine area')
    else if (!AREA_VALUES.includes(area as any)) {
      warnings.push(`Area "${area}" not in enum, defaulting to city`)
    }

    const finalArea = AREA_VALUES.includes(area as any) ? area! : 'city'
    const halalStatus = ai.halal_status && HALAL_VALUES.includes(ai.halal_status as any)
      ? ai.halal_status
      : 'self_declared'

    const cuisineTypes = ai.cuisine_types
      ? ai.cuisine_types.filter((c) => CUISINE_VALUES.includes(c as any))
      : null

    const foodType = ai.food_type && FOOD_TYPES.includes(ai.food_type)
      ? ai.food_type
      : null

    const finalSlug = row.name ? slugify(`${row.name}-${finalArea}`) : `import-${row.index}`

    return {
      name: row.name,
      slug: finalSlug,
      vertical,
      description: row.description || ai.description || null,
      address: row.address,
      area: finalArea,
      postal_code: row.postal_code,
      latitude: row.latitude,
      longitude: row.longitude,
      phone: row.phone,
      website: row.website,
      email: row.email,
      halal_status: halalStatus,
      categories: cuisineTypes?.length ? cuisineTypes : null,
      photos: row.photos,
      operating_hours: row.operating_hours,
      price_range: row.price_range,
      status: 'pending' as const,
      cuisine_types: cuisineTypes,
      food_type: foodType,
      _errors: errors,
      _warnings: warnings,
      _duplicate: false,
      _originalIndex: row.index,
      _skip: false,
    }
  })
}

async function callClaudeForCleaning(
  rows: Array<{
    index: number
    name: string
    address: string | null
    postal_code: string | null
    area: string | null
    categories: string | null
    description: string | null
  }>,
  vertical: string
): Promise<Record<number, {
  area?: string
  cuisine_types?: string[]
  halal_status?: string
  food_type?: string
  description?: string
}>> {
  const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! })

  const inputRows = rows.map((r) => ({
    index: r.index,
    name: r.name,
    address: r.address,
    postal_code: r.postal_code,
    existing_area: r.area,
    categories: r.categories,
    has_description: !!r.description,
  }))

  const prompt = `You are a data cleaning assistant for a Singapore halal food directory.

Given these raw records, analyze each one and return normalized data.

AREA VALUES (use exactly these): ${AREA_VALUES.join(', ')}
CUISINE TYPES (use exactly these): ${CUISINE_VALUES.join(', ')}
FOOD TYPES (use exactly these): ${FOOD_TYPES.join(', ')}
HALAL STATUS VALUES: muis_certified, muslim_owned, self_declared, not_applicable

For each record:
1. "area": If existing_area is provided, keep it. Otherwise, determine from address/postal_code. Must be one of the AREA VALUES.
2. "cuisine_types": Map the categories string to an array of CUISINE TYPES. Return [] if none match.
3. "halal_status": Default "self_declared". Use "muis_certified" only if the name/categories explicitly mention MUIS. Use "muslim_owned" if explicitly stated.
4. "food_type": For food vertical, determine the type from categories/name. Must be one of FOOD TYPES.
5. "description": Only if has_description is false, generate a concise 2-sentence description for a Singapore halal food directory. Otherwise omit.

Vertical: ${vertical}

Input records:
${JSON.stringify(inputRows, null, 2)}

Return ONLY a valid JSON object mapping index to results. Example:
{"0": {"area": "bugis", "cuisine_types": ["malay", "indonesian"], "halal_status": "self_declared", "food_type": "restaurant", "description": "..."}, "1": {...}}

No markdown, no explanation, ONLY the JSON object.`

  const response = await anthropic.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 4096,
    messages: [{ role: 'user', content: prompt }],
  })

  const text = response.content[0].type === 'text' ? response.content[0].text : ''

  // Parse JSON response, handling potential markdown wrapping
  const jsonStr = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim()
  const parsed = JSON.parse(jsonStr)

  // Convert string keys to number keys
  const result: Record<number, any> = {}
  for (const [key, value] of Object.entries(parsed)) {
    result[parseInt(key)] = value
  }

  return result
}
