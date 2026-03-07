import { SITE_URL, SITE_NAME } from '@/config'

export interface BookingConfirmationData {
  holderName: string
  holderEmail: string
  hotelName: string
  hotelCity: string
  checkIn: string          // pre-formatted, e.g. "Monday, 10 March 2026"
  checkOut: string         // pre-formatted, e.g. "Friday, 14 March 2026"
  totalAmount: number
  currency: string
  confirmationCode: string
  bookingUrl: string
}

export function bookingConfirmationHtml(data: BookingConfirmationData): string {
  const {
    holderName, holderEmail, hotelName, hotelCity,
    checkIn, checkOut, totalAmount, currency, confirmationCode, bookingUrl,
  } = data

  const formattedAmount = new Intl.NumberFormat('en-SG', {
    style: 'currency',
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(totalAmount)

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8"/>
  <meta name="viewport" content="width=device-width,initial-scale=1"/>
  <title>Booking Confirmed — ${hotelName}</title>
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
              Hotel booking confirmed ✓
            </p>
          </td>
        </tr>

        <!-- Body -->
        <tr>
          <td style="background:#fff;padding:28px 32px;">
            <p style="margin:0 0 20px;font-size:16px;color:#1C1917;">
              Hi ${holderName},
            </p>
            <p style="margin:0 0 24px;font-size:15px;color:#57534e;line-height:1.6;">
              Your hotel booking has been confirmed. Here are your booking details.
            </p>

            <!-- Booking details card -->
            <table width="100%" cellpadding="0" cellspacing="0"
                   style="background:#f0fdf4;border:1px solid #bbf7d0;border-radius:12px;margin-bottom:24px;">
              <tr>
                <td style="padding:20px 24px;">
                  <p style="margin:0;font-weight:700;font-size:16px;color:#1C1917;">${hotelName}</p>
                  <p style="margin:4px 0 16px;font-size:13px;color:#57534e;">📍 ${hotelCity}</p>
                  <table width="100%" cellpadding="0" cellspacing="0">
                    <tr>
                      <td style="padding:4px 0;font-size:13px;color:#57534e;width:100px;">📅 Check-in</td>
                      <td style="padding:4px 0;font-size:13px;color:#1C1917;font-weight:600;">${checkIn}</td>
                    </tr>
                    <tr>
                      <td style="padding:4px 0;font-size:13px;color:#57534e;">🏨 Check-out</td>
                      <td style="padding:4px 0;font-size:13px;color:#1C1917;font-weight:600;">${checkOut}</td>
                    </tr>
                    <tr>
                      <td style="padding:4px 0;font-size:13px;color:#57534e;">💳 Total paid</td>
                      <td style="padding:4px 0;font-size:15px;color:#047857;font-weight:700;">${formattedAmount}</td>
                    </tr>
                    <tr>
                      <td style="padding:4px 0;font-size:13px;color:#57534e;">🔖 Ref code</td>
                      <td style="padding:4px 0;font-size:13px;color:#1C1917;font-weight:700;letter-spacing:0.05em;">${confirmationCode}</td>
                    </tr>
                  </table>
                </td>
              </tr>
            </table>

            <p style="margin:0 0 8px;font-size:13px;color:#78716c;line-height:1.6;">
              Please save your confirmation code <strong>${confirmationCode}</strong> and show it at check-in.
              You can also access your booking details any time via the link below.
            </p>
          </td>
        </tr>

        <!-- CTA -->
        <tr>
          <td style="background:#fff;padding:0 32px 28px;">
            <a href="${bookingUrl}"
               style="display:inline-block;background:#047857;color:#fff;font-weight:700;
                      font-size:14px;padding:12px 24px;border-radius:10px;text-decoration:none;">
              View booking details →
            </a>
          </td>
        </tr>

        <!-- Footer -->
        <tr>
          <td style="background:#f9f9f7;border-radius:0 0 16px 16px;padding:20px 32px;
                     border-top:1px solid #e5e7eb;">
            <p style="margin:0;font-size:12px;color:#a8a29e;line-height:1.6;">
              Booking ref: ${confirmationCode} · Sent to ${holderEmail}<br/>
              ${SITE_NAME} · Singapore&apos;s halal travel<br/>
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

export function bookingConfirmationText(data: BookingConfirmationData): string {
  const { holderName, holderEmail, hotelName, hotelCity, checkIn, checkOut, totalAmount, currency, confirmationCode, bookingUrl } = data
  const formattedAmount = `${currency} ${totalAmount.toLocaleString()}`
  return [
    `Hi ${holderName},`,
    '',
    'Your hotel booking is confirmed!',
    '',
    `Hotel: ${hotelName}`,
    `City: ${hotelCity}`,
    `Check-in: ${checkIn}`,
    `Check-out: ${checkOut}`,
    `Total: ${formattedAmount}`,
    `Confirmation code: ${confirmationCode}`,
    '',
    `View booking: ${bookingUrl}`,
    '',
    `${SITE_NAME} · ${SITE_URL}`,
    `Sent to ${holderEmail}`,
  ].join('\n')
}
