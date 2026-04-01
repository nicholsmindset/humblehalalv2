import { SITE_URL, SITE_NAME } from '@/config'

export interface EventReminderData {
  attendeeName: string
  attendeeEmail: string
  eventTitle: string
  eventSlug: string
  eventDate: string
  eventTime: string
  venue: string | null
  isOnline: boolean
  onlinePlatform: string | null
  onlineLink: string | null
  qrCode: string
  ticketName: string
  hoursUntil: number   // 24 or 1
}

export function eventReminderHtml(data: EventReminderData): string {
  const {
    attendeeName, eventTitle, eventSlug,
    eventDate, eventTime, venue, isOnline, onlinePlatform, onlineLink,
    qrCode, ticketName, hoursUntil,
  } = data

  const ticketUrl = `${SITE_URL}/tickets/${qrCode}`
  const eventUrl = `${SITE_URL}/events/${eventSlug}`
  const locationLine = venue
    ? venue
    : isOnline
    ? `Online${onlinePlatform ? ` · ${onlinePlatform}` : ''}`
    : 'Check event page for location'

  const headline = hoursUntil === 1
    ? `Your event starts in 1 hour!`
    : `Your event is tomorrow`

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8"/>
  <meta name="viewport" content="width=device-width,initial-scale=1"/>
  <title>${headline} — ${eventTitle}</title>
</head>
<body style="margin:0;padding:0;background:#f9f9f7;font-family:'Helvetica Neue',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f9f9f7;padding:32px 0;">
    <tr><td align="center">
      <table width="560" cellpadding="0" cellspacing="0" style="max-width:560px;width:100%;">

        <tr>
          <td style="background:#047857;border-radius:16px 16px 0 0;padding:28px 32px;">
            <p style="margin:0;font-size:22px;font-weight:800;color:#fff;">${SITE_NAME}</p>
            <p style="margin:6px 0 0;font-size:15px;color:rgba(255,255,255,0.85);font-weight:600;">
              ⏰ ${headline}
            </p>
          </td>
        </tr>

        <tr>
          <td style="background:#fff;padding:28px 32px;">
            <p style="margin:0 0 20px;font-size:16px;color:#1C1917;">Hi ${attendeeName},</p>
            <p style="margin:0 0 24px;font-size:15px;color:#57534e;line-height:1.6;">
              Don&apos;t forget — <strong>${eventTitle}</strong> is coming up soon.
              Make sure your ticket is ready!
            </p>

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
                      <td style="padding:3px 0;font-size:13px;color:#57534e;">📍 Where</td>
                      <td style="padding:3px 0;font-size:13px;color:#1C1917;font-weight:600;">${locationLine}</td>
                    </tr>
                    ${onlineLink ? `<tr>
                      <td style="padding:3px 0;font-size:13px;color:#57534e;">🔗 Link</td>
                      <td style="padding:3px 0;font-size:13px;">
                        <a href="${onlineLink}" style="color:#047857;">${onlineLink}</a>
                      </td>
                    </tr>` : ''}
                  </table>
                </td>
              </tr>
            </table>

            <p style="margin:0 0 16px;font-weight:700;font-size:14px;color:#1C1917;">Your ticket</p>
            <table width="100%" cellpadding="0" cellspacing="0"
                   style="border:1px solid #e5e7eb;border-radius:12px;margin-bottom:24px;">
              <tr>
                <td style="padding:16px;">
                  <table width="100%">
                    <tr>
                      <td>
                        <p style="margin:0;font-weight:700;font-size:14px;color:#1C1917;">${ticketName}</p>
                        <p style="margin:4px 0 0;font-size:12px;color:#78716c;font-family:monospace;">${qrCode}</p>
                      </td>
                      <td align="right">
                        <a href="${ticketUrl}"
                           style="display:inline-block;background:#047857;color:#fff;font-size:12px;
                                  font-weight:700;padding:8px 16px;border-radius:8px;text-decoration:none;">
                          Open ticket
                        </a>
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>
            </table>

            <p style="margin:0;font-size:13px;color:#78716c;line-height:1.6;">
              Screenshot your ticket page as a backup in case of poor internet at the venue.
            </p>
          </td>
        </tr>

        <tr>
          <td style="background:#fff;padding:0 32px 28px;">
            <a href="${eventUrl}"
               style="display:inline-block;background:#047857;color:#fff;font-weight:700;
                      font-size:14px;padding:12px 24px;border-radius:10px;text-decoration:none;">
              View event details →
            </a>
          </td>
        </tr>

        <tr>
          <td style="background:#f9f9f7;border-radius:0 0 16px 16px;padding:20px 32px;
                     border-top:1px solid #e5e7eb;">
            <p style="margin:0;font-size:12px;color:#a8a29e;line-height:1.6;">
              Sent to ${data.attendeeEmail} · ${SITE_NAME}<br/>
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

export function eventReminderText(data: EventReminderData): string {
  const { attendeeName, eventTitle, eventDate, eventTime, venue, qrCode, hoursUntil } = data
  const headline = hoursUntil === 1 ? 'Your event starts in 1 hour!' : 'Your event is tomorrow!'
  return [
    `Hi ${attendeeName},`,
    '',
    headline,
    '',
    eventTitle,
    `Date: ${eventDate} at ${eventTime}`,
    venue ? `Location: ${venue}` : '',
    '',
    `Your ticket: ${SITE_URL}/tickets/${qrCode}`,
    '',
    `${SITE_NAME} · ${SITE_URL}`,
  ].filter((l) => l !== null).join('\n')
}
