import type { Metadata } from 'next'
import AttendeesClient from './AttendeesClient'

export const metadata: Metadata = {
  title: 'Attendees & Check-in | HumbleHalal',
  robots: { index: false, follow: false },
}

export default function AttendeesPage() {
  return <AttendeesClient />
}
