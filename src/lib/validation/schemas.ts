import { z } from 'zod'
import { NextResponse } from 'next/server'

// ── Review submission ─────────────────────────────────────────────────────────
export const reviewSchema = z.object({
  listing_id:   z.string().uuid(),
  rating:       z.number().int().min(1).max(5),
  title:        z.string().max(120).optional().nullable(),
  body:         z.string().min(1).max(2000),
  captchaToken: z.string().optional(),
})

// ── Contact form ──────────────────────────────────────────────────────────────
export const contactSchema = z.object({
  name:         z.string().min(1).max(100),
  email:        z.string().email(),
  subject:      z.string().max(200).optional(),
  message:      z.string().min(1).max(5000),
  captchaToken: z.string().optional(),
})

// ── Listing creation / update ─────────────────────────────────────────────────
// The POST handler uses: name, area, vertical, description, address, phone,
// website, halal_status.  The PATCH handler uses: id, name, description,
// address, phone, website, halal_status.  We validate these explicitly and
// accept any extra fields with .passthrough() so future fields don't break.
export const listingCreateSchema = z.object({
  name:         z.string().min(1).max(200),
  area:         z.string().min(1).max(100),
  vertical:     z.enum(['food', 'business', 'catering', 'services', 'events', 'mosque', 'prayer_room', 'product', 'travel', 'products']),
  description:  z.string().max(2000).optional().nullable(),
  address:      z.string().max(300).optional().nullable(),
  phone:        z.string().max(40).optional().nullable(),
  website:      z.string().url().optional().nullable(),
  halal_status: z.enum(['muis_certified', 'muslim_owned', 'self_declared', 'not_applicable']).optional(),
}).passthrough()

export const listingUpdateSchema = z.object({
  id:           z.string().uuid(),
  name:         z.string().min(1).max(200).optional(),
  description:  z.string().max(2000).optional().nullable(),
  address:      z.string().max(300).optional().nullable(),
  phone:        z.string().max(40).optional().nullable(),
  website:      z.string().url().optional().nullable(),
  halal_status: z.enum(['muis_certified', 'muslim_owned', 'self_declared', 'not_applicable']).optional(),
}).passthrough()

// ── AI content generation ─────────────────────────────────────────────────────
// The route receives { type, params } where params varies by type.
// We validate the envelope; individual handlers validate their own params.
export const aiGenerateSchema = z.object({
  type:   z.enum(['blog', 'travel', 'newsletter', 'meta', 'description']),
  params: z.record(z.unknown()),
})

// ── Travel hotel search ───────────────────────────────────────────────────────
// The POST body includes destination, checkin, checkout, guests, currency.
// destination is the primary user-controlled string we sanitise here.
// TODO: add an ISO city-code allowlist in a follow-up once the destination
//       taxonomy is finalised.
export const travelSearchSchema = z.object({
  destination: z.string().min(1).max(100),
  checkin:     z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'checkin must be YYYY-MM-DD').optional(),
  checkout:    z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'checkout must be YYYY-MM-DD').optional(),
  guests:      z.unknown().optional(),
  currency:    z.string().max(10).optional(),
}).passthrough()

// ── Validation error helper ───────────────────────────────────────────────────
export function validationError(issues: z.ZodIssue[]) {
  return NextResponse.json(
    {
      error: 'Invalid request body',
      issues: issues.map(i => ({ path: i.path.join('.'), message: i.message })),
    },
    { status: 400 },
  )
}
