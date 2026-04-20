export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { checkLimit, contentLimiter, getIdentifier } from '@/lib/security/rate-limit'
import { sanitisePlainText } from '@/lib/security/sanitise'
import { getResend, FROM_ADDRESS } from '@/lib/resend/index'
import { contactSchema, validationError } from '@/lib/validation/schemas'

export async function POST(request: NextRequest) {
  // Rate limit by IP (no auth required for contact form)
  const identifier = getIdentifier(request)
  const rl = await checkLimit(contentLimiter, identifier)
  if (rl.limited) return rl.response

  let raw: unknown
  try {
    raw = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
  }

  const parsed = contactSchema.safeParse(raw)
  if (!parsed.success) return validationError(parsed.error.issues)

  const name    = sanitisePlainText(parsed.data.name).trim()
  const email   = sanitisePlainText(parsed.data.email).trim()
  const message = sanitisePlainText(parsed.data.message).trim()

  if (!process.env.RESEND_API_KEY) {
    console.warn('[contact] RESEND_API_KEY not set — skipping email send')
    return NextResponse.json({ ok: true })
  }

  try {
    const resend = getResend()

    await resend.emails.send({
      from: FROM_ADDRESS,
      to: 'hello@humblehalal.sg',
      replyTo: email,
      subject: `Contact Form: ${name}`,
      html: `
        <h2>New Contact Form Submission</h2>
        <p><strong>Name:</strong> ${name}</p>
        <p><strong>Email:</strong> ${email}</p>
        <p><strong>Message:</strong></p>
        <p style="white-space:pre-wrap">${message}</p>
      `,
      text: `New contact from ${name} (${email}):\n\n${message}`,
    })

    // Send confirmation to the user
    await resend.emails.send({
      from: FROM_ADDRESS,
      to: email,
      subject: "We've received your message — HumbleHalal",
      html: `
        <p>Hi ${name},</p>
        <p>Thank you for contacting us! We&apos;ve received your message and will get back to you within 1-2 business days.</p>
        <p>Best regards,<br>The HumbleHalal Team</p>
      `,
      text: `Hi ${name},\n\nThank you for contacting us! We've received your message and will get back to you within 1-2 business days.\n\nBest regards,\nThe HumbleHalal Team`,
    })
  } catch (err) {
    // Log but don't fail — user submitted successfully, email is best-effort
    console.error('[contact] email send error:', err)
  }

  return NextResponse.json({ ok: true })
}
