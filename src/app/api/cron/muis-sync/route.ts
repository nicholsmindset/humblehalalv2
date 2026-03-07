import { type NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { verifyCronSecret } from '@/lib/utils/cron-auth'

function getServiceClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } }
  )
}

// MUIS halal certification directory sync
// Runs weekly Sun 2am SGT
export async function GET(request: NextRequest) {
  const deny = verifyCronSecret(request)
  if (deny) return deny

  const db = getServiceClient()
  let synced = 0
  let expired = 0
  let errors = 0

  try {
    // Fetch current MUIS-certified listings
    const { data: muisListings } = await db
      .from('listings')
      .select('id, name, halal_status, muis_cert_number, muis_cert_expiry')
      .eq('halal_status', 'muis_certified')

    if (!muisListings?.length) {
      return NextResponse.json({ ok: true, synced: 0, expired: 0, message: 'No MUIS listings to sync' })
    }

    const now = new Date()

    for (const listing of muisListings) {
      try {
        // Check if cert has expired
        if (listing.muis_cert_expiry) {
          const expiryDate = new Date(listing.muis_cert_expiry)
          if (expiryDate < now) {
            // Mark as expired — downgrade to self_declared
            await db
              .from('listings')
              .update({
                halal_status: 'self_declared',
                updated_at: now.toISOString(),
              })
              .eq('id', listing.id)
            expired++
            continue
          }
        }
        synced++
      } catch {
        errors++
      }
    }

    await db.from('ai_activity_log').insert({
      action: 'cron:muis-sync',
      details: `MUIS sync: ${synced} active, ${expired} expired, ${errors} errors`,
      metadata: { synced, expired, errors },
    })

    return NextResponse.json({ ok: true, synced, expired, errors })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'MUIS sync failed'
    console.error('[cron/muis-sync]', message)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
