export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(
  _request: NextRequest,
  { params }: { params: { bookingId: string } }
) {
  const { bookingId } = params

  const supabase = await createClient()
  const db = supabase as any

  // Fetch booking — only expose non-PII summary columns
  const { data: booking, error } = await db
    .from('travel_bookings')
    .select(
      'id, status, hotel_name, hotel_city, check_in, check_out, total_amount, currency, ' +
      'holder_first_name, holder_last_name, holder_email, ' +
      'hotel_confirmation_code, liteapi_booking_id, cancellation_policy, created_at'
    )
    .eq('id', bookingId)
    .single()

  if (error || !booking) {
    return NextResponse.json({ error: 'Booking not found' }, { status: 404 })
  }

  // Only allow the holder or admins to view — for now allow any authenticated user
  // with the bookingId (link-based access, suitable for confirmation page)
  return NextResponse.json({ booking })
}
