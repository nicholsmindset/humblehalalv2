export const dynamic = 'force-dynamic'

import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const db = supabase as any

  const { data: bookings, error } = await db
    .from('travel_bookings')
    .select(
      'id, status, hotel_name, hotel_city, hotel_country, check_in, check_out, ' +
      'total_amount, currency, hotel_confirmation_code, liteapi_booking_id, created_at'
    )
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('[api/travel/bookings] DB error:', error)
    return NextResponse.json({ error: 'Failed to load bookings' }, { status: 500 })
  }

  return NextResponse.json({ bookings: bookings ?? [] })
}
