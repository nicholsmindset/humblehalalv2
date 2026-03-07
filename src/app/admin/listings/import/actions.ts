'use server'

import * as XLSX from 'xlsx'
import { createClient, createAdminClient } from '@/lib/supabase/server'
import { cleanBatch } from '@/lib/ai/import-cleaner'
import type { RawRow, CleanedListing, ImportResult } from '@/types/import'

const BATCH_SIZE_AI = 25
const BATCH_SIZE_DB = 50

async function requireAdmin() {
  const supabase = await createClient()
  const { data: isAdmin } = await supabase.rpc('is_admin')
  if (!isAdmin) throw new Error('Unauthorized')
}

/**
 * Parse an uploaded XLSX/XLS file and return headers + rows.
 */
export async function parseXlsxFile(
  formData: FormData
): Promise<{ headers: string[]; rows: RawRow[] }> {
  await requireAdmin()

  const file = formData.get('file') as File
  if (!file) throw new Error('No file provided')

  const buffer = Buffer.from(await file.arrayBuffer())
  const workbook = XLSX.read(buffer, { type: 'buffer' })
  const sheetName = workbook.SheetNames[0]
  const sheet = workbook.Sheets[sheetName]
  const jsonData = XLSX.utils.sheet_to_json<Record<string, any>>(sheet, { defval: '' })

  if (jsonData.length === 0) {
    return { headers: [], rows: [] }
  }

  const headers = Object.keys(jsonData[0])
  const rows: RawRow[] = jsonData.map((row) => {
    const cleaned: RawRow = {}
    for (const key of headers) {
      cleaned[key] = String(row[key] ?? '')
    }
    return cleaned
  })

  return { headers, rows }
}

/**
 * Clean raw rows using AI-assisted normalization.
 * Processes in batches of 25 rows.
 */
export async function cleanWithAI(
  rows: RawRow[],
  mapping: Record<string, string>,
  vertical: string
): Promise<CleanedListing[]> {
  await requireAdmin()

  const results: CleanedListing[] = []
  const totalBatches = Math.ceil(rows.length / BATCH_SIZE_AI)

  for (let i = 0; i < totalBatches; i++) {
    const batch = rows.slice(i * BATCH_SIZE_AI, (i + 1) * BATCH_SIZE_AI)

    try {
      const cleaned = await cleanBatch(batch, mapping, vertical, i)
      results.push(...cleaned)
    } catch (error) {
      // On AI failure, create rows with errors flagged
      batch.forEach((raw, j) => {
        const idx = i * BATCH_SIZE_AI + j
        results.push({
          name: raw[Object.keys(mapping).find((k) => mapping[k] === 'name') || ''] || `Row ${idx + 1}`,
          slug: `import-error-${idx}`,
          vertical,
          description: null,
          address: null,
          area: 'city',
          postal_code: null,
          latitude: null,
          longitude: null,
          phone: null,
          website: null,
          email: null,
          halal_status: 'self_declared',
          categories: null,
          photos: null,
          operating_hours: null,
          price_range: null,
          status: 'pending',
          cuisine_types: null,
          food_type: null,
          _errors: [`AI cleaning failed: ${error instanceof Error ? error.message : 'Unknown error'}`],
          _warnings: [],
          _duplicate: false,
          _originalIndex: idx,
          _skip: false,
        })
      })
    }
  }

  return results
}

/**
 * Check for duplicate listings and mark them on the cleaned rows.
 */
export async function checkDuplicates(
  listings: CleanedListing[]
): Promise<CleanedListing[]> {
  await requireAdmin()

  const supabase = await createAdminClient()
  const slugs = listings.map((l) => l.slug)
  const names = listings.map((l) => l.name.toLowerCase())
  const areas = Array.from(new Set(listings.map((l) => l.area)))

  // Check by slug (exact match)
  const { data: existingBySlug } = await (supabase as any)
    .from('listings')
    .select('slug, name, area')
    .in('slug', slugs)

  const existingSlugs = new Set((existingBySlug ?? []).map((r: any) => r.slug))

  // Check by name+area (fuzzy match)
  const { data: existingByName } = await (supabase as any)
    .from('listings')
    .select('slug, name, area')
    .in('area', areas)
    .filter('name', 'ilike', names.length > 0 ? `%${names[0]}%` : '%impossible%')

  const existingNameArea = new Set(
    (existingByName ?? []).map((r: any) => `${r.name.toLowerCase()}|${r.area}`)
  )

  return listings.map((listing) => ({
    ...listing,
    _duplicate:
      existingSlugs.has(listing.slug) ||
      existingNameArea.has(`${listing.name.toLowerCase()}|${listing.area}`),
  }))
}

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-+|-+$/g, '')
}

/**
 * Bulk insert validated listings into Supabase.
 * Uses the bulk_insert_listing RPC function for PostGIS support.
 */
export async function bulkInsertListings(
  listings: CleanedListing[]
): Promise<ImportResult> {
  await requireAdmin()

  const supabase = await createAdminClient()

  // Filter out rows with errors, duplicates, or skipped
  const toInsert = listings.filter(
    (l) => l._errors.length === 0 && !l._duplicate && !l._skip
  )

  const result: ImportResult = {
    total: listings.length,
    inserted: 0,
    skipped: listings.length - toInsert.length,
    errors: [],
  }

  // Resolve slug collisions within the batch
  const usedSlugs = new Set<string>()
  const { data: existingSlugs } = await (supabase as any)
    .from('listings')
    .select('slug')
    .in('slug', toInsert.map((l) => l.slug))

  for (const row of existingSlugs ?? []) {
    usedSlugs.add(row.slug)
  }

  for (const listing of toInsert) {
    let slug = listing.slug
    let suffix = 2
    while (usedSlugs.has(slug)) {
      slug = `${listing.slug}-${suffix}`
      suffix++
    }
    listing.slug = slug
    usedSlugs.add(slug)
  }

  // Insert in batches
  const totalBatches = Math.ceil(toInsert.length / BATCH_SIZE_DB)

  for (let i = 0; i < totalBatches; i++) {
    const batch = toInsert.slice(i * BATCH_SIZE_DB, (i + 1) * BATCH_SIZE_DB)

    for (const listing of batch) {
      try {
        const { data: listingId, error } = await (supabase as any).rpc(
          'bulk_insert_listing',
          {
            data: {
              name: listing.name,
              slug: listing.slug,
              vertical: listing.vertical,
              description: listing.description,
              address: listing.address,
              area: listing.area,
              postal_code: listing.postal_code,
              latitude: listing.latitude,
              longitude: listing.longitude,
              phone: listing.phone,
              website: listing.website,
              email: listing.email,
              halal_status: listing.halal_status,
              categories: listing.categories,
              photos: listing.photos,
              operating_hours: listing.operating_hours,
              price_range: listing.price_range,
              status: listing.status,
            },
          }
        )

        if (error) {
          result.errors.push({
            row: listing._originalIndex + 1,
            name: listing.name,
            error: error.message,
          })
          continue
        }

        // Insert food extension if food vertical
        if (listing.vertical === 'food' && listingId) {
          const { error: foodError } = await (supabase as any).rpc(
            'bulk_insert_food_extension',
            {
              data: {
                listing_id: listingId,
                cuisine_types: listing.cuisine_types,
                food_type: listing.food_type,
              },
            }
          )

          if (foodError) {
            console.error(`Food extension insert failed for ${listing.name}:`, foodError.message)
          }
        }

        result.inserted++
      } catch (err) {
        result.errors.push({
          row: listing._originalIndex + 1,
          name: listing.name,
          error: err instanceof Error ? err.message : 'Unknown error',
        })
      }
    }
  }

  return result
}
