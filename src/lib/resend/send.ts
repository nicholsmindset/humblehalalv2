import { getResend, FROM_ADDRESS } from './index'
import {
  ticketConfirmationHtml,
  ticketConfirmationText,
  type TicketConfirmationData,
} from './emails/ticket-confirmation'
import {
  eventReminderHtml,
  eventReminderText,
  type EventReminderData,
} from './emails/event-reminder'

export async function sendTicketConfirmation(data: TicketConfirmationData): Promise<void> {
  if (!process.env.RESEND_API_KEY) {
    console.warn('[email] RESEND_API_KEY not set — skipping ticket confirmation')
    return
  }
  try {
    const resend = getResend()
    const { error } = await resend.emails.send({
      from: FROM_ADDRESS,
      to: data.attendeeEmail,
      subject: `Your tickets for ${data.eventTitle} · Order #${data.orderNumber}`,
      html: ticketConfirmationHtml(data),
      text: ticketConfirmationText(data),
    })
    if (error) {
      console.error('[email] sendTicketConfirmation failed:', error)
    }
  } catch (err) {
    console.error('[email] sendTicketConfirmation threw:', err)
  }
}

export async function sendEventReminder(data: EventReminderData): Promise<void> {
  if (!process.env.RESEND_API_KEY) {
    console.warn('[email] RESEND_API_KEY not set — skipping reminder')
    return
  }
  try {
    const resend = getResend()
    const label = data.hoursUntil === 1 ? '1 hour' : '24 hours'
    const { error } = await resend.emails.send({
      from: FROM_ADDRESS,
      to: data.attendeeEmail,
      subject: `Reminder: ${data.eventTitle} starts in ${label}`,
      html: eventReminderHtml(data),
      text: eventReminderText(data),
    })
    if (error) {
      console.error('[email] sendEventReminder failed:', error)
    }
  } catch (err) {
    console.error('[email] sendEventReminder threw:', err)
  }
}
