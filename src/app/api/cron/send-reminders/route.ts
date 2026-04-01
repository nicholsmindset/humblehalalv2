export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { sendEventReminder } from '@/lib/resend/send'
import { verifyCronSecret } from '@/lib/utils/cron-auth'

// Run every 30 minutes via Vercel Cron
// vercel.json: { "path": "/api/cron/send-reminders", "schedule": "*/30 * * * *" }

function getServiceClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } }
  )
}

export async function GET(request: NextRequest) {
  const deny = verifyCronSecret(request)
  if (deny) return deny

  const db = getServiceClient() as any
  const now = new Date()

  // Fetch pending reminders that are due (scheduled_for <= now)
  const { data: reminders, error } = await db
    .from('event_reminders')
    .select(`
      id, scheduled_for, channel,
      event_order_items!inner(
        id, qr_code, attendee_name, attendee_email,
        event_tickets(name),
        event_orders!inner(
          order_number, event_id,
          events(slug, title, starts_at, venue, area, is_online, online_platform, online_link)
        )
      )
    `)
    .eq('status', 'pending')
    .lte('scheduled_for', now.toISOString())
    .limit(50)

  if (error) {
    console.error('[send-reminders] fetch error:', error.message)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  let sent = 0
  let failed = 0

  for (const reminder of (reminders ?? [])) {
    const item = reminder.event_order_items
    const order = item?.event_orders
    const evt = order?.events

    if (!item || !order || !evt) {
      await db.from('event_reminders').update({ status: 'failed' }).eq('id', reminder.id)
      failed++
      continue
    }

    const startDate = new Date(evt.starts_at)
    const scheduledFor = new Date(reminder.scheduled_for)
    const hoursUntil = Math.round((startDate.getTime() - scheduledFor.getTime()) / 3600_000)

    try {
      await sendEventReminder({
        attendeeName: item.attendee_name,
        attendeeEmail: item.attendee_email,
        eventTitle: evt.title,
        eventSlug: evt.slug,
        eventDate: startDate.toLocaleDateString('en-SG', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }),
        eventTime: startDate.toLocaleTimeString('en-SG', { hour: '2-digit', minute: '2-digit' }),
        venue: evt.venue ?? null,
        isOnline: !!evt.is_online,
        onlinePlatform: evt.online_platform ?? null,
        onlineLink: evt.online_link ?? null,
        qrCode: item.qr_code,
        ticketName: item.event_tickets?.name ?? 'Ticket',
        hoursUntil: hoursUntil <= 2 ? 1 : 24,
      })

      await db
        .from('event_reminders')
        .update({ status: 'sent', sent_at: new Date().toISOString() })
        .eq('id', reminder.id)

      sent++
    } catch (err: any) {
      console.error('[send-reminders] failed for reminder', reminder.id, err.message)
      await db
        .from('event_reminders')
        .update({ status: 'failed', error_message: err.message })
        .eq('id', reminder.id)
      failed++
    }
  }

  console.log(`[send-reminders] sent=${sent} failed=${failed}`)
  return NextResponse.json({ ok: true, sent, failed })
}
