import type { Metadata } from 'next'
import SignupCompleteClient from './SignupCompleteClient'

export const metadata: Metadata = {
  title: 'Setting Up Your Account | HumbleHalal',
  robots: { index: false, follow: false },
}

export default function SignupCompletePage() {
  return <SignupCompleteClient />
}
