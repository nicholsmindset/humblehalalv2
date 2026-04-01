import type { Metadata } from 'next'
import BookingConfirmationClient from './BookingConfirmationClient'

export const metadata: Metadata = {
  title: 'Booking Confirmation | HumbleHalal',
  robots: { index: false, follow: false },
}

export default function BookingConfirmationPage() {
  return <BookingConfirmationClient />
}
