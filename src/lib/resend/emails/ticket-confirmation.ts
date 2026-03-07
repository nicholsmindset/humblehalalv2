import { SITE_URL, SITE_NAME } from '@/config'

export interface TicketConfirmationData {
  orderNumber: string
  attendeeName: string
  attendeeEmail: string
  eventTitle: string
  eventSlug: string
  eventDate: string        // pre-formatted, e.g. "Saturday, 15 March 2026"
  eventTime: string        // e.g. "07:00 PM"
  venue: string | null
  area: string | null
  isOnline: boolean
  onlinePlatform: string | null
  tickets: Array<{
    id: string
    qrCode: string
    ticketName: string
    attendeeName: string
    price: number
  }>
}

export function ticketConfirmationHtml(data: TicketConfirmationData): string {
  const {
    orderNumber, attendeeName, eventTitle, eventSlug,
    eventDate, eventTime, venue, isOnline, onlinePlatform,
    tickets,
  } = data

  const eventUrl = `${SITE_URL}/events/${eventSlug}`
  const locationLine = venue
    ? venue
    : isOnline
    ? `Online${onlinePlatform ? ` · ${onlinePlatform}` : ''}`
    : 'Location TBC'

  const ticketRows = tickets.map((t) => {
    const ticketUrl = `${SITE_URL}/tickets/${t.qrCode}`
    return `
      <tr>
        <td style="padding:12px 16px;border-bottom:1px solid #f0f0f0;">
          <table width="100%" cellpadding="0" cellspacing="0">
            <tr>
              <td>
                <p style="margin:0;font-weight:700;font-size:14px;color:#1C1917;">${t.ticketName}</p>
                <p style="margin:4px 0 0;font-size:13px;color:#78716c;">${t.attendeeName}</p>
              </td>
              <td align="right" valign="top">
                <a href="${ticketUrl}"
                   style="display:inline-block;background:#047857;color:#fff;font-size:12px;font-weight:700;
                          padding:6px 14px;border-radius:8px;text-decoration:none;">
                  View ticket
                </a>
              </td>
            </tr>
          </table>
        </td>
      </tr>`
  }).join('')

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8"/>
  <meta name="viewport" content="width=device-width,initial-scale=1"/>
  <title>Your tickets — ${eventTitle}</title>
</head>
<body style="margin:0;padding:0;background:#f9f9f7;font-family:'Helvetica Neue',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f9f9f7;padding:32px 0;">
    <tr><td align="center">
      <table width="560" cellpadding="0" cellspacing="0" style="max-width:560px;width:100%;">

        <!-- Header -->
        <tr>
          <td style="background:#047857;border-radius:16px 16px 0 0;padding:28px 32px;">
            <p style="margin:0;font-size:22px;font-weight:800;color:#fff;">
              ${SITE_NAME}
            </p>
            <p style="margin:6px 0 0;font-size:14px;color:rgba(255,255,255,0.7);">
              Your booking is confirmed ✓
            </p>
          </td>
        </tr>

        <!-- Body -->
        <tr>
          <td style="background:#fff;padding:28px 32px;">
            <p style="margin:0 0 20px;font-size:16px;color:#1C1917;">
              Hi ${attendeeName},
            </p>
            <p style="margin:0 0 24px;font-size:15px;color:#57534e;line-height:1.6;">
              You&apos;re all set for <strong>${eventTitle}</strong>. Your tickets are attached below.
            </p>

            <!-- Event details card -->
            <table width="100%" cellpadding="0" cellspacing="0"
                   style="background:#f0fdf4;border:1px solid #bbf7d0;border-radius:12px;margin-bottom:24px;">
              <tr>
                <td style="padding:20px 24px;">
                  <p style="margin:0;font-weight:700;font-size:15px;color:#1C1917;">${eventTitle}</p>
                  <table width="100%" cellpadding="0" cellspacing="0" style="margin-top:12px;">
                    <tr>
                      <td style="padding:3px 0;font-size:13px;color:#57534e;width:80px;">📅 Date</td>
                      <td style="padding:3px 0;font-size:13px;color:#1C1917;font-weight:600;">${eventDate}</td>
                    </tr>
                    <tr>
                      <td style="padding:3px 0;font-size:13px;color:#57534e;">🕐 Time</td>
                      <td style="padding:3px 0;font-size:13px;color:#1C1917;font-weight:600;">${eventTime}</td>
                    </tr>
                    <tr>
                      <td style="padding:3px 0;font-size:13px;color:#57534e;">📍 Location</td>
                      <td style="padding:3px 0;font-size:13px;color:#1C1917;font-weight:600;">${locationLine}</td>
                    </tr>
                  </table>
                </td>
              </tr>
            </table>

            <!-- Tickets -->
            <p style="margin:0 0 12px;font-weight:700;font-size:14px;color:#1C1917;">
              Your tickets (${tickets.length})
            </p>
            <table width="100%" cellpadding="0" cellspacing="0"
                   style="border:1px solid #e5e7eb;border-radius:12px;overflow:hidden;margin-bottom:24px;">
              ${ticketRows}
            </table>

            <p style="margin:0 0 8px;font-size:13px;color:#78716c;line-height:1.6;">
              Each ticket has a unique QR code. Show it at the entrance for entry.
              Screenshot each ticket page as a backup in case you lose internet access.
            </p>
          </td>
        </tr>

        <!-- CTA -->
        <tr>
          <td style="background:#fff;padding:0 32px 28px;">
            <a href="${eventUrl}"
               style="display:inline-block;background:#047857;color:#fff;font-weight:700;
                      font-size:14px;padding:12px 24px;border-radius:10px;text-decoration:none;">
              View event details →
            </a>
          </td>
        </tr>

        <!-- Footer -->
        <tr>
          <td style="background:#f9f9f7;border-radius:0 0 16px 16px;padding:20px 32px;
                     border-top:1px solid #e5e7eb;">
            <p style="margin:0;font-size:12px;color:#a8a29e;line-height:1.6;">
              Order #${orderNumber} · Sent to ${data.attendeeEmail}<br/>
              ${SITE_NAME} · Singapore&apos;s halal ecosystem<br/>
              <a href="${SITE_URL}" style="color:#047857;text-decoration:none;">${SITE_URL}</a>
            </p>
          </td>
        </tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`
}

export function ticketConfirmationText(data: TicketConfirmationData): string {
  const { orderNumber, attendeeName, eventTitle, eventSlug, eventDate, eventTime, venue, tickets } = data
  const eventUrl = `${SITE_URL}/events/${eventSlug}`
  const lines = [
    `Hi ${attendeeName},`,
    '',
    `You're booked for: ${eventTitle}`,
    `Date: ${eventDate} at ${eventTime}`,
    venue ? `Location: ${venue}` : '',
    '',
    'YOUR TICKETS',
    '------------',
    ...tickets.map((t) => `• ${t.ticketName} — ${t.attendeeName}\n  ${SITE_URL}/tickets/${t.qrCode}`),
    '',
    `Event page: ${eventUrl}`,
    '',
    `Order #${orderNumber}`,
    `${SITE_NAME} · ${SITE_URL}`,
  ]
  return lines.filter((l) => l !== null).join('\n')
}
